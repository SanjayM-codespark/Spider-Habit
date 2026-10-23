import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import TextEditor from '../ui/TextEditor'
import Alert from '../ui/Alert'
import '../../pages/HelpPage.css'

function HelpPageForm({
  initialData,
  submitLabel = 'Save Page',
  successMessage = 'Help page saved successfully.',
  onSubmit,
  onSaved,
  onCancel,
}) {
  function buildInitial() {
    return { title: initialData?.title ?? '', content: initialData?.content ?? '' }
  }

  const [form, setForm] = useState(buildInitial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.title.trim()) {
      setError('Page title is required.')
      return
    }

    setSaving(true)
    try {
      await onSubmit({ title: form.title.trim(), content: form.content })

      if (onSaved) {
        onSaved()
      } else {
        setSuccess(successMessage)
        setForm(buildInitial())
      }
    } catch (err) {
      setError(err.message || 'Failed to save page.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="help__form" onSubmit={handleSubmit}>
      {error && (
        <Alert className="help__alert" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert type="success" className="help__alert" onDismiss={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Input
        label="Page Title"
        value={form.title}
        onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
        placeholder="e.g. Privacy Policy"
        disabled={saving}
      />

      <div className="help__editor">
        <span className="help__editor-label">Content</span>
        <TextEditor
          value={form.content}
          onChange={(content) => setForm((prev) => ({ ...prev, content }))}
          placeholder="Start writing the page content..."
          disabled={saving}
          minHeight={320}
        />
      </div>

      <div className="help__actions">
        <Button type="submit" loading={saving}>
          {saving ? 'Saving...' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

export default HelpPageForm
