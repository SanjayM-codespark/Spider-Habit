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
  const [newCode, setNewCode] = useState('')
  const [newAmount, setNewAmount] = useState('')

  function updateRow(index, patch) {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    if (onChange) onChange(next)
  }

  function resetAddForm() {
    setShowAddForm(false)
    setNewCode('')
    setNewAmount('')
  }

  function handleAddCountry() {
    const code = newCode.trim().toUpperCase()
    const amount = newAmount.trim()

    if (!code || !amount) return

    if (onChange) onChange([...rows, { country: code, amount }])
    resetAddForm()
  }

  function removeRow(index) {
    if (rows.length === 1) return
    if (onChange) onChange(rows.filter((_, i) => i !== index))
  }

  const usedCodes = new Set(rows.map((r) => r.country))
  const availableCountries = COUNTRIES.filter((c) => !usedCodes.has(c.code))

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
                    {countryOption.name} ({countryOption.code})
                  </option>
                ))}
              </select>

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
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
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
              <span>Country</span>
              <select
                className="caf__select"
                value={newCode}
                onChange={(event) => setNewCode(event.target.value)}
                autoFocus
              >
                <option value="">Select country</option>
                {availableCountries.map((countryOption) => (
                  <option key={countryOption.code} value={countryOption.code}>
                    {countryOption.name} ({countryOption.code})
                  </option>
                ))}
              </select>
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
              onClick={resetAddForm}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="caf__add" onClick={() => setShowAddForm(true)}>
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Add Country
        </button>
      )}

      {hint && <p className="caf__hint">{hint}</p>}
    </fieldset>
  )
}

export default CountryAmountField