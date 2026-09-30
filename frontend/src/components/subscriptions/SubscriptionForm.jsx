import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Alert from '../ui/Alert'
import CountryAmountField from '../ui/CountryAmountField'
import { formatAmount, getCountryByCode } from '../../lib/countries'
import './SubscriptionForm.css'

const DURATIONS = ['1 Month', '3 Months', '6 Months', '1 Year']
const PLATFORMS = ['Android', 'iOS']

function platformToLabel(platform) {
  return platform === 'ios' ? 'iOS' : 'Android'
}

function platformToValue(label) {
  return label === 'iOS' ? 'ios' : 'android'
}

function SubscriptionForm({
  initialData,
  submitLabel = 'Save',
  successMessage = 'Saved successfully.',
  onSubmit,
  onSaved,
  onCancel,
}) {
  function buildInitial() {
    const pricing = initialData?.pricing
    return {
      name: initialData?.name ?? '',
      duration: initialData?.duration ?? '',
      description: initialData?.description ?? '',
      platform: initialData?.platform ? platformToLabel(initialData.platform) : '',
      amounts:
        pricing && pricing.length > 0
          ? pricing.map((price) => ({ country: price.country, amount: String(price.amount) }))
          : [{ country: 'IN', amount: '' }],
    }
  }

  const [form, setForm] = useState(buildInitial)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  function setField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  function handleAmounts(amounts) {
    setForm((prev) => ({ ...prev, amounts }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const { name, duration, description, platform, amounts } = form

    if (!name || !duration || !description || !platform) {
      setError('Please fill in all the fields.')
      return
    }
    if (amounts.length === 0 || amounts.some((row) => !row.amount)) {
      setError('Please enter an amount for each country.')
      return
    }

    const payload = {
      name: name.trim(),
      duration,
      description: description.trim(),
      platform: platformToValue(platform),
      pricing: amounts.map((row) => ({
        country: row.country,
        currency: getCountryByCode(row.country).currency,
        amount: Number(row.amount),
      })),
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

  const hasAmounts = form.amounts.some((row) => row.amount)

  return (
    <form className="subform" onSubmit={handleSubmit}>
      {error && (
        <Alert className="subform__alert" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert type="success" className="subform__alert" onDismiss={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <div className="subform__grid">
        <Input
          label="Name"
          value={form.name}
          onChange={setField('name')}
          placeholder="e.g. Monthly"
          disabled={saving}
        />
        <Select
          label="Duration"
          options={DURATIONS}
          placeholder="Select duration"
          value={form.duration}
          onChange={setField('duration')}
          disabled={saving}
        />
        <Select
          label="Platform"
          options={PLATFORMS}
          placeholder="Select platform"
          value={form.platform}
          onChange={setField('platform')}
          disabled={saving}
        />
        <div className="subform__desc">
          <Input
            label="Description"
            multiline
            rows={3}
            value={form.description}
            onChange={setField('description')}
            placeholder="Plan details, limits, perks..."
            disabled={saving}
          />
        </div>
      </div>

      <CountryAmountField
        label="Amount (per country)"
        hint="Set the subscription price for each country. Add a country to enter another amount."
        value={form.amounts}
        onChange={handleAmounts}
        disabled={saving}
      />

      {hasAmounts && (
        <div className="subform__summary">
          {form.amounts
            .filter((row) => row.amount)
            .map((row) => {
              const country = getCountryByCode(row.country)
              return (
                <span key={row.country} className="subform__summary-item">
                  {country.name}: <strong>{formatAmount(country, row.amount)}</strong>
                </span>
              )
            })}
        </div>
      )}

      <div className="subform__actions">
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

export default SubscriptionForm