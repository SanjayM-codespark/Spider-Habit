import { useCallback, useEffect, useState } from 'react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import TextEditor from '../components/ui/TextEditor'
import Alert from '../components/ui/Alert'
import { getHelpPage, saveHelpPage } from '../services/helpPage'
import './HelpPage.css'

function HelpPageEditor({ slug, label }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [disabled, setDisabled] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const load = useCallback(() => {
    return getHelpPage(slug)
      .then((page) => {
        setTitle(page?.title ?? '')
        setContent(page?.content ?? '')
      })
      .catch((err) => setError(err.message || 'Failed to load page.'))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    load()
  }, [load])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!title.trim()) {
      setError('Page title is required.')
      return
    }

    setSaving(true)
    setDisabled(true)
    try {
      await saveHelpPage(slug, { title: title.trim(), content })
      setSuccess(`${label} page saved successfully.`)
      window.setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save page.')
    } finally {
      setSaving(false)
      setDisabled(false)
    }
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h2 className="page__title">{label}</h2>
          <p className="page__subtitle">
            Write the content shown to users for this page. Use the editor toolbar to format it.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <p className="help__state">Loading page...</p>
        </div>
      ) : (
        <div className="card help__card">
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

          <form className="help__form" onSubmit={handleSubmit}>
            <Input
              label="Page Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={`e.g. ${label}`}
              disabled={disabled}
            />

            <div className="help__editor">
              <span className="help__editor-label">Content</span>
              <TextEditor
                value={content}
                onChange={setContent}
                placeholder="Start writing the page content..."
                disabled={disabled}
                minHeight={320}
              />
            </div>

            <div className="help__actions">
              <Button type="submit" loading={saving}>
                {saving ? 'Saving...' : 'Save Page'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default HelpPageEditor