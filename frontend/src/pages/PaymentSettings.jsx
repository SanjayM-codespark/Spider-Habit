import { useCallback, useEffect, useState } from 'react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Alert from '../components/ui/Alert'
import { getSettings, updatePaymentSettings } from '../services/settings'
import './Settings.css'

const EYE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EYE_OFF_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

function PaymentSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [disabled, setDisabled] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [form, setForm] = useState({
    razorpay_key: '',
    razorpay_secret: '',
  })

  const load = useCallback(() => {
    return getSettings()
      .then((data) => {
        setForm({
          razorpay_key: data?.razorpay_key ?? '',
          razorpay_secret: data?.razorpay_secret ?? '',
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

    if (!form.razorpay_key.trim() || !form.razorpay_secret.trim()) {
      setError('Razorpay key and secret key are required.')
      return
    }

    setSaving(true)
    setDisabled(true)
    try {
      const payload = {
        razorpay_key: form.razorpay_key.trim(),
        razorpay_secret: form.razorpay_secret.trim(),
      }
      await updatePaymentSettings(payload)
      setSuccess('Payment settings saved successfully.')
      window.setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save payment settings.')
    } finally {
      setSaving(false)
      setDisabled(false)
    }
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h2 className="page__title">Payment Settings</h2>
          <p className="page__subtitle">Razorpay credentials used for subscriptions.</p>
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

          <Alert type="info" className="settings__alert">
            These are production credentials. Keep them secret and never share them.
          </Alert>

          <form className="settings__form" onSubmit={handleSubmit}>
            <h3 className="card__title">Razorpay</h3>

            <Input
              label="Razorpay Key"
              value={form.razorpay_key}
              onChange={setField('razorpay_key')}
              placeholder="rzp_live_..."
              hint="API key ID from the Razorpay Dashboard."
              disabled={disabled}
            />

            <Input
              label="Razorpay Secret Key"
              type={showSecret ? 'text' : 'password'}
              value={form.razorpay_secret}
              onChange={setField('razorpay_secret')}
              placeholder="Enter the API secret"
              hint="Stored in the backend and never exposed in plain text in the UI."
              disabled={disabled}
              suffix={
                <button
                  type="button"
                  className="settings__toggle"
                  onClick={() => setShowSecret((value) => !value)}
                  disabled={disabled}
                  title={showSecret ? 'Hide secret' : 'Show secret'}
                  aria-label={showSecret ? 'Hide secret' : 'Show secret'}
                >
                  {showSecret ? EYE_OFF_ICON : EYE_ICON}
                </button>
              }
            />

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

export default PaymentSettings