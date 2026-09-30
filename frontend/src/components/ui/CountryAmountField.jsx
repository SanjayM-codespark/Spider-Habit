import { useState } from 'react'
import { COUNTRIES, DEFAULT_COUNTRY, getCountryByCode } from '../../lib/countries'
import './CountryAmountField.css'

function newRow() {
  return { country: DEFAULT_COUNTRY, amount: '' }
}

function CountryAmountField({
  label,
  hint,
  value = [],
  onChange,
  className = '',
  ...props
}) {
  const rows = value.length > 0 ? value : [newRow()]
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newAmount, setNewAmount] = useState('')

  function updateRow(index, patch) {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    if (onChange) onChange(next)
  }

  function handleAddCountry() {
    const name = newName.trim()
    const code = newCode.trim().toUpperCase()
    const amount = newAmount.trim()

    if (!name || !code || !amount) return

    const existing = COUNTRIES.find((c) => c.code === code)
    if (!existing) {
      if (getCountryByCode(code) === COUNTRIES[0] && code !== DEFAULT_COUNTRY) {
        return
      }
      COUNTRIES.push({
        code,
        name,
        dialCode: '',
        currency: code,
        symbol: code,
      })
    }

    if (onChange) onChange([...rows, { country: code, amount }])
    setShowAddForm(false)
    setNewName('')
    setNewCode('')
    setNewAmount('')
  }

  function cancelAddCountry() {
    setShowAddForm(false)
    setNewName('')
    setNewCode('')
    setNewAmount('')
  }

  function removeRow(index) {
    if (rows.length === 1) return
    if (onChange) onChange(rows.filter((_, i) => i !== index))
  }

  return (
    <fieldset className={`caf ${className}`.trim()} {...props}>
      {label && <legend className="caf__label">{label}</legend>}
      <div className="caf__rows">
        {rows.map((row, index) => {
          const country = getCountryByCode(row.country)
          const usedElsewhere = new Set(
            rows.filter((_, i) => i !== index).map((r) => r.country),
          )
          return (
            <div key={`${index}-${rows.length}`} className="caf__row">
              <select
                className="caf__select"
                value={row.country}
                onChange={(event) => updateRow(index, { country: event.target.value })}
                aria-label={`Amount country ${index + 1}`}
              >
                {COUNTRIES.filter(
                  (countryOption) =>
                    countryOption.code === row.country ||
                    !usedElsewhere.has(countryOption.code),
                ).map((countryOption) => (
                  <option key={countryOption.code} value={countryOption.code}>
                    {countryOption.name} ({countryOption.dialCode})
                  </option>
                ))}
              </select>

              <div className="caf__country">
                <span className="caf__country-name">
                  {country.name} <span className="caf__country-code">{country.dialCode}</span>
                </span>
              </div>

              <label className="caf__amount">
                <span className="caf__currency">{country.symbol}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.amount}
                  onChange={(event) => updateRow(index, { amount: event.target.value })}
                  placeholder="0.00"
                  aria-label={`${label ?? 'Amount'} in ${country.currency}`}
                />
              </label>

              {rows.length > 1 && (
                <button
                  type="button"
                  className="caf__remove"
                  onClick={() => removeRow(index)}
                  aria-label={`Remove ${country.name}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {showAddForm ? (
        <div className="caf__add-form">
          <div className="caf__add-fields">
            <label className="caf__add-field">
              <span>Country Name</span>
              <input
                type="text"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="e.g. Canada"
                autoFocus
              />
            </label>
            <label className="caf__add-field">
              <span>Country Code</span>
              <input
                type="text"
                value={newCode}
                onChange={(event) => setNewCode(event.target.value)}
                placeholder="e.g. CA"
                maxLength={2}
              />
            </label>
            <label className="caf__add-field">
              <span>Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newAmount}
                onChange={(event) => setNewAmount(event.target.value)}
                placeholder="0.00"
              />
            </label>
          </div>
          <div className="caf__add-actions">
            <button
              type="button"
              className="caf__add-confirm"
              onClick={handleAddCountry}
            >
              Add
            </button>
            <button
              type="button"
              className="caf__add-cancel"
              onClick={cancelAddCountry}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="caf__add" onClick={() => setShowAddForm(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Country
        </button>
      )}

      {hint && <p className="caf__hint">{hint}</p>}
    </fieldset>
  )
}

export default CountryAmountField