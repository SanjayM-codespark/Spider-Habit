import { useEffect, useRef } from 'react'
import './TextEditor.css'

const BOLD_ICON = (
  <i className="fa-solid fa-bold" aria-hidden="true" />
)

const ITALIC_ICON = (
  <i className="fa-solid fa-italic" aria-hidden="true" />
)

const UNDERLINE_ICON = (
  <i className="fa-solid fa-underline" aria-hidden="true" />
)

const STRIKE_ICON = (
  <i className="fa-solid fa-strikethrough" aria-hidden="true" />
)

const LIST_ICON = (
  <i className="fa-solid fa-list-ul" aria-hidden="true" />
)

const ORDERED_LIST_ICON = (
  <i className="fa-solid fa-list-ol" aria-hidden="true" />
)

const LINK_ICON = (
  <i className="fa-solid fa-link" aria-hidden="true" />
)

const HEADING_ICON = (
  <i className="fa-solid fa-heading" aria-hidden="true" />
)

const CLEAR_ICON = (
  <i className="fa-solid fa-eraser" aria-hidden="true" />
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