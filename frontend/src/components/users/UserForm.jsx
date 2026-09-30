import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Alert from '../ui/Alert'
import './UserForm.css'

const SUBSCRIBED_OPTIONS = [
  { value: 'true', label: 'Subscribed' },
  { value: 'false', label: 'Not subscribed' },
]

function UserForm({
  initialData,
  subscriptionOptions = [],
  submitLabel = 'Save',
  successMessage = 'Saved successfully.',
  onSubmit,
  onSaved,
  onCancel,
}) {
  function buildInitial() {
    return {
      name: initialData?.name ?? '',
      email: initialData?.email ?? '',
      phone: initialData?.phone ?? '',
      password: '',
      isSubscribed:
        initialData?.is_subscribed === undefined
          ? 'false'
          : String(Boolean(initialData.is_subscribed)),
      subscriptionId:
        initialData?.subscription_id === undefined || initialData?.subscription_id === null
          ? ''
          : String(initialData.subscription_id),
    }
  }

  const [form, setForm] = useState(buildInitial)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  function setField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const { name, email, phone } = form
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Name, email and phone are required.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      isSubscribed: form.isSubscribed === 'true',
      subscriptionId: form.subscriptionId ? Number(form.subscriptionId) : null,
    }
    if (form.password.trim()) {
      payload.password = form.password
    }

    setSaving(true)
    try {
      await onSubmit(payload)

      if (onSaved) {
        onSaved()
      } else {
        setSuccess(successMessage)
        setForm(buildInitial())
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="userform" onSubmit={handleSubmit}>
      {error && (
        <Alert className="userform__alert" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert type="success" className="userform__alert" onDismiss={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <div className="userform__grid">
        <Input
          label="Name"
          value={form.name}
          onChange={setField('name')}
          placeholder="e.g. John Doe"
          disabled={saving}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={setField('email')}
          placeholder="e.g. john@example.com"
          disabled={saving}
        />
        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={setField('phone')}
          placeholder="e.g. +91 9876543210"
          disabled={saving}
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={setField('password')}
          placeholder="Leave blank to keep current"
          hint="Only filled in when you want to change it."
          disabled={saving}
        />
        <Select
          label="Subscription"
          options={subscriptionOptions}
          placeholder="No subscription"
          value={form.subscriptionId}
          onChange={setField('subscriptionId')}
          disabled={saving}
        />
        {!form.subscriptionId && (
          <Select
            label="Status"
            options={SUBSCRIBED_OPTIONS}
            value={form.isSubscribed}
            onChange={setField('isSubscribed')}
            disabled={saving}
          />
        )}
      </div>

      <div className="userform__actions">
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

export default UserForm