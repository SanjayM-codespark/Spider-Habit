import { useEffect, useRef } from 'react'
import './TextEditor.css'

const BOLD_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 4h8a4 4 0 0 1 0 8H6Z" />
    <path d="M6 12h9a4 4 0 0 1 0 8H6Z" />
  </svg>
)

const ITALIC_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="4" x2="10" y2="4" />
    <line x1="14" y1="20" x2="5" y2="20" />
    <line x1="15" y1="4" x2="9" y2="20" />
  </svg>
)

const UNDERLINE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3v7a6 6 0 0 0 12 0V3" />
    <line x1="4" y1="21" x2="20" y2="21" />
  </svg>
)

const STRIKE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 4H9a3 3 0 0 0-2.83 4" />
    <path d="M14 12a4 4 0 0 1 0 8H6" />
    <line x1="4" y1="12" x2="20" y2="12" />
  </svg>
)

const LIST_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)

const ORDERED_LIST_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="10" y1="6" x2="21" y2="6" />
    <line x1="10" y1="12" x2="21" y2="12" />
    <line x1="10" y1="18" x2="21" y2="18" />
    <path d="M4 6h1v4" />
    <path d="M4 10h2" />
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
  </svg>
)

const LINK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

const HEADING_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 4v16" />
    <path d="M19 4v16" />
    <path d="M5 12h14" />
  </svg>
)

const CLEAR_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 4h18" />
    <path d="M8 6v2" />
    <path d="m3 4 5 16h8l5-16" />
    <path d="M16 6v2" />
  </svg>
)

function TextEditor({ value = '', onChange, placeholder = '', disabled = false, minHeight = 240 }) {
  const areaRef = useRef(null)

  useEffect(() => {
    if (areaRef.current && areaRef.current.innerHTML !== value) {
      areaRef.current.innerHTML = value || ''
    }
  }, [value])

  function sync() {
    onChange?.(areaRef.current?.innerHTML ?? '')
  }

  function exec(command, valueArg = null) {
    if (disabled) return
    areaRef.current?.focus()
    document.execCommand(command, false, valueArg)
    sync()
  }

  function handleCommand(command, valueArg) {
    return (event) => {
      event.preventDefault()
      exec(command, valueArg)
    }
  }

  function handleLink() {
    if (disabled) return
    const url = window.prompt('Enter link URL', 'https://')
    if (url) exec('createLink', url)
  }

  function handlePaste(event) {
    event.preventDefault()
    const text = event.clipboardData?.getData('text/plain') || ''
    document.execCommand('insertText', false, text)
  }

  return (
    <div className="teditor">
      <div className="teditor__toolbar" role="toolbar" aria-label="Formatting tools">
        <button type="button" onMouseDown={handleCommand('bold')} title="Bold" aria-label="Bold" disabled={disabled}>
          {BOLD_ICON}
        </button>
        <button type="button" onMouseDown={handleCommand('italic')} title="Italic" aria-label="Italic" disabled={disabled}>
          {ITALIC_ICON}
        </button>
        <button type="button" onMouseDown={handleCommand('underline')} title="Underline" aria-label="Underline" disabled={disabled}>
          {UNDERLINE_ICON}
        </button>
        <button type="button" onMouseDown={handleCommand('strikeThrough')} title="Strikethrough" aria-label="Strikethrough" disabled={disabled}>
          {STRIKE_ICON}
        </button>

        <span className="teditor__sep" aria-hidden="true" />

        <button type="button" onMouseDown={handleCommand('formatBlock', 'h2')} title="Heading" aria-label="Heading" disabled={disabled}>
          {HEADING_ICON}
        </button>
        <button type="button" onMouseDown={handleCommand('formatBlock', 'p')} title="Paragraph" aria-label="Paragraph" disabled={disabled}>
          P
        </button>

        <span className="teditor__sep" aria-hidden="true" />

        <button type="button" onMouseDown={handleCommand('insertUnorderedList')} title="Bullet list" aria-label="Bullet list" disabled={disabled}>
          {LIST_ICON}
        </button>
        <button type="button" onMouseDown={handleCommand('insertOrderedList')} title="Numbered list" aria-label="Numbered list" disabled={disabled}>
          {ORDERED_LIST_ICON}
        </button>
        <button type="button" onMouseDown={handleLink} title="Insert link" aria-label="Insert link" disabled={disabled}>
          {LINK_ICON}
        </button>

        <span className="teditor__sep" aria-hidden="true" />

        <button type="button" onMouseDown={handleCommand('removeFormat')} title="Clear formatting" aria-label="Clear formatting" disabled={disabled}>
          {CLEAR_ICON}
        </button>
      </div>

      <div
        ref={areaRef}
        className="teditor__area"
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        onPaste={handlePaste}
        style={{ minHeight }}
        data-placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  )
}

export default TextEditor