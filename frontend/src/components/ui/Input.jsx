import { useId } from 'react'
import './Input.css'

function Input({
  label,
  hint,
  error,
  className = '',
  id,
  multiline = false,
  rows = 4,
  suffix,
  ...props
}) {
  const autoId = useId()
  const inputId = id ?? autoId
  const Field = multiline ? 'textarea' : 'input'
  const classes = [
    'field',
    error ? 'field--error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      {suffix ? (
        <div className="field__append">
          <Field
            id={inputId}
            className="field__input"
            rows={multiline ? rows : undefined}
            {...props}
          />
          {suffix}
        </div>
      ) : (
        <Field
          id={inputId}
          className="field__input"
          rows={multiline ? rows : undefined}
          {...props}
        />
      )}
      {error && <p className="field__error">{error}</p>}
      {!error && hint && <p className="field__hint">{hint}</p>}
    </div>
  )
}

export default Input