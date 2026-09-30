import { useId } from 'react'
import './Select.css'

function Select({ label, hint, error, options = [], placeholder, className = '', id, ...props }) {
  const autoId = useId()
  const selectId = id ?? autoId
  const classes = ['sfield', error ? 'sfield--error' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      {label && (
        <label className="sfield__label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <select id={selectId} className="select" {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) =>
          typeof option === 'string' ? (
            <option key={option} value={option}>
              {option}
            </option>
          ) : (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ),
        )}
      </select>
      {error && <p className="sfield__error">{error}</p>}
      {!error && hint && <p className="sfield__hint">{hint}</p>}
    </div>
  )
}

export default Select