import CustomText from '../components/CustomText';
import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { TopHeader } from '../components/TopHeader';
import { getHelpPage } from '../services/helpPageService';
import HelpContentRenderer from '../components/HelpContentRenderer';

interface Props {
  navigation: any;
  /** Slug + title of the page to display, set by HelpScreen. */
  page?: { slug?: string; title?: string } | null;
}

export const HelpDetailScreen: React.FC<Props> = ({ navigation, page }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadContent = useCallback(async () => {
    if (!page?.slug) return;
    setLoading(true);
    setError('');
    try {
      const result = await getHelpPage(page.slug);
      setContent(result?.content ?? '');
    } catch (err: any) {
      setError(err?.message || 'Failed to load help content.');
    } finally {
      setLoading(false);
    }
  }, [page?.slug]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  return (
    <ScreenContainer backgroundColor="#39C4B6" barStyle="light-content">
      <TopHeader title={page?.title || 'HELP'} onBack={() => navigation.goBack()} />

      <View style={styles.mainSheet}>
        {loading && (
          <View style={styles.stateRow}>
            <ActivityIndicator size="large" color="#0D9488" />
            <CustomText style={styles.stateText}>Loading content...</CustomText>
          </View>
        )}

        {!loading && error ? (
          <TouchableOpacity
            style={styles.stateRow}
            activeOpacity={0.7}
            onPress={loadContent}
          >
            <CustomText style={styles.errorText}>
              {error} · Tap to retry
            </CustomText>
          </TouchableOpacity>
        ) : null}

        {!loading && !error && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.contentCard}>
              {content ? (
                <HelpContentRenderer html={content} />
              ) : (
                <CustomText style={styles.stateText}>
                  This page has no content yet.
                </CustomText>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
};

export default HelpDetailScreen;

const styles = StyleSheet.create({
  mainSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  scrollContent: { paddingBottom: 40 },
  contentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stateRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  stateText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
  },
});