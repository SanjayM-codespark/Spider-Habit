import React, { useMemo } from 'react';
import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Minimal, dependency-free renderer for the simple HTML that the admin's
 * TextEditor produces for help pages (<b>/<strong>, <i>/<em>, <u>,
 * <strike>/<s>, <h1>-<h6>, <p>, <ul>/<ol>/<li>, <br>). Anything unknown is
 * treated as plain text rather than crashing.
 */

interface InlineSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
}

interface Block {
  kind: 'paragraph' | 'heading' | 'list';
  level?: number;
  ordered?: boolean;
  nodes: InlineSegment[];
}

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

function decodeEntities(text: string): string {
  return text.replace(/&(nbsp|amp|lt|gt|quot|#39|apos);/g, (_, key: string) => ENTITIES[key] ?? '');
}

type InlineStyle = keyof Omit<InlineSegment, 'text'>;

const INLINE_TAGS: Record<string, InlineStyle> = {
  b: 'bold',
  strong: 'bold',
  i: 'italic',
  em: 'italic',
  u: 'underline',
  strike: 'strike',
  s: 'strike',
  del: 'strike',
};

const INLINE_TAG_RE = /<(\/?)(b|strong|i|em|u|strike|s|del|a|br)\b[^>]*>/g;

/** Parse inline tag sequences (<b> etc.) into styled text segments. */
function parseInline(html: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const styleStack: InlineStyle[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  const flush = (end: number) => {
    const raw = html.slice(last, end);
    const text = decodeEntities(raw);
    if (!text) return;
    const segment: InlineSegment = { text };
    for (const key of styleStack) {
      (segment as unknown as Record<string, boolean>)[key] = true;
    }
    segments.push(segment);
  };

  while ((match = INLINE_TAG_RE.exec(html)) !== null) {
    flush(match.index);
    const closing = match[1] === '/';
    const tag = match[2].toLowerCase();
    if (tag === 'br') {
      const segment: InlineSegment = { text: '\n' };
      for (const key of styleStack) {
        (segment as unknown as Record<string, boolean>)[key] = true;
      }
      segments.push(segment);
    } else if (tag !== 'a') {
      const styleKey = INLINE_TAGS[tag];
      if (closing) {
        const idx = styleStack.lastIndexOf(styleKey);
        if (idx >= 0) styleStack.splice(idx, 1);
      } else {
        styleStack.push(styleKey);
      }
    }
    last = INLINE_TAG_RE.lastIndex;
  }
  flush(html.length);
  return segments;
}

/** Split the HTML into block-level chunks (paragraphs, headings, list items). */
function parseBlocks(html: string): Block[] {
  const cleaned = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h[1-6]|li|ul|ol)>/gi, '\n');

  const blocks: Block[] = [];
  let ordered = false;

  for (const rawLine of cleaned.split('\n')) {
    let line = rawLine.trim();
    if (!line) continue;

    const ulMatch = line.match(/^<ul[^>]*>/i);
    const olMatch = line.match(/^<ol[^>]*>/i);
    if (ulMatch) {
      ordered = false;
      line = line.slice(ulMatch[0].length).trim();
    } else if (olMatch) {
      ordered = true;
      line = line.slice(olMatch[0].length).trim();
    }
    if (!line) continue;

    const headingMatch = line.match(/^<h([1-6])[^>]*>([\s\S]*)$/i);
    const liMatch = line.match(/^<li[^>]*>([\s\S]*)$/i);
    const pMatch = line.match(/^<p[^>]*>([\s\S]*)$/i);

    if (headingMatch) {
      const level = Math.min(6, Math.max(1, Number(headingMatch[1]) || 1));
      blocks.push({ kind: 'heading', level, nodes: parseInline(headingMatch[2]) });
    } else if (liMatch) {
      blocks.push({ kind: 'list', ordered, nodes: parseInline(liMatch[1]) });
    } else if (pMatch) {
      blocks.push({ kind: 'paragraph', nodes: parseInline(pMatch[1]) });
    } else {
      const nodes = parseInline(line);
      if (nodes.length) blocks.push({ kind: 'paragraph', nodes });
    }
  }
  return blocks;
}

const HEADING_STYLES: Record<number, TextStyle> = {
  1: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  2: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  3: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  4: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  5: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  6: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
};

const HelpContentRenderer: React.FC<{ html?: string }> = ({ html = '' }) => {
  const blocks = useMemo(() => parseBlocks(html), [html]);

  let orderedCounter = 0;

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        const nodes = block.nodes.map((node, nodeIndex) => (
          <Text
            key={nodeIndex}
            style={[
              node.bold ? styles.bold : null,
              node.italic ? styles.italic : null,
              node.underline ? styles.underline : null,
              node.strike ? styles.strike : null,
            ]}
          >
            {node.text}
          </Text>
        ));

        if (block.kind === 'heading') {
          return (
            <Text key={index} style={[styles.headingBase, HEADING_STYLES[block.level ?? 1]]}>
              {nodes}
            </Text>
          );
        }

        if (block.kind === 'list') {
          orderedCounter = block.ordered ? orderedCounter + 1 : 0;
          const marker = block.ordered ? `${orderedCounter}.` : '•';
          return (
            <View key={index} style={styles.listRow}>
              <Text style={styles.listMarker}>{marker}</Text>
              <Text style={styles.listText}>{nodes}</Text>
            </View>
          );
        }

        return (
          <Text key={index} style={styles.paragraph}>
            {nodes}
          </Text>
        );
      })}
    </View>
  );
};

export default HelpContentRenderer;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  } as ViewStyle,
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
    marginBottom: 10,
  },
  headingBase: {
    marginTop: 14,
  } as TextStyle,
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  underline: { textDecorationLine: 'underline' },
  strike: { textDecorationLine: 'line-through' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  listMarker: {
    width: 18,
    fontSize: 14,
    color: '#0D9488',
    fontWeight: '700',
    lineHeight: 22,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
});