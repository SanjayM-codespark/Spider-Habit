import { useCallback, useEffect, useState } from 'react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Alert from '../components/ui/Alert'
import { getSettings, updateGeneralSettings } from '../services/settings'
import { setAppInfo, notifyAppInfoUpdated } from '../lib/appInfo'
import './Settings.css'

function GeneralSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [disabled, setDisabled] = useState(false)
  const [form, setForm] = useState({
    app_name: '',
    android_version: '',
    ios_version: '',
    app_store_link: '',
    play_store_link: '',
  })

  const load = useCallback(() => {
    return getSettings()
      .then((data) => {
        setForm({
          app_name: data?.app_name ?? '',
          android_version: data?.android_version ?? '',
          ios_version: data?.ios_version ?? '',
          app_store_link: data?.app_store_link ?? '',
          play_store_link: data?.play_store_link ?? '',
        })
      })
      .catch((err) => setError(err.message || 'Failed to load settings.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function setField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const { app_name, app_store_link, play_store_link } = form

    if (!app_name.trim()) {
      setError('App name is required.')
      return
    }
    for (const link of [app_store_link, play_store_link]) {
      if (link.trim() && !/^https?:\/\/.+/.test(link.trim())) {
        setError('Store links must start with http:// or https://')
        return
      }
    }

    setSaving(true)
    setDisabled(true)
    try {
      const payload = {
        app_name: form.app_name.trim(),
        android_version: form.android_version.trim(),
        ios_version: form.ios_version.trim(),
        app_store_link: form.app_store_link.trim(),
        play_store_link: form.play_store_link.trim(),
      }
      const data = await updateGeneralSettings(payload)
      setAppInfo(data)
      notifyAppInfoUpdated()
      setSuccess('General settings saved successfully.')
      window.setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save general settings.')
    } finally {
      setSaving(false)
      setDisabled(false)
    }
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h2 className="page__title">General Settings</h2>
          <p className="page__subtitle">App details shown to users and the app stores.</p>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <p className="settings__state">Loading settings...</p>
        </div>
      ) : (
        <div className="card settings__card">
          {error && (
            <Alert className="settings__alert" onDismiss={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert type="success" className="settings__alert" onDismiss={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <form className="settings__form" onSubmit={handleSubmit}>
            <h3 className="card__title">App Details</h3>

            <Input
              label="App Name"
              value={form.app_name}
              onChange={setField('app_name')}
              placeholder="e.g. Spider Habit"
              disabled={disabled}
            />

            <div className="settings__grid">
              <Input
                label="Android Version"
                value={form.android_version}
                onChange={setField('android_version')}
                placeholder="e.g. 1.0.0"
                hint="Version shown on the Play Store."
                disabled={disabled}
              />
              <Input
                label="iOS Version"
                value={form.ios_version}
                onChange={setField('ios_version')}
                placeholder="e.g. 1.0.0"
                hint="Version shown on the App Store."
                disabled={disabled}
              />
            </div>

            <div className="settings__grid">
              <Input
                label="App Store Link"
                type="url"
                value={form.app_store_link}
                onChange={setField('app_store_link')}
                placeholder="https://apps.apple.com/app/..."
                disabled={disabled}
              />
              <Input
                label="Play Store Link"
                type="url"
                value={form.play_store_link}
                onChange={setField('play_store_link')}
                placeholder="https://play.google.com/store/apps/details?id=..."
                disabled={disabled}
              />
            </div>

            <div className="settings__actions">
              <Button type="submit" loading={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default GeneralSettings