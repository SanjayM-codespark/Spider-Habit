import './Alert.css'

const ALERT_TYPES = {
  error: 'alert--error',
  warning: 'alert--warning',
  success: 'alert--success',
  info: 'alert--info',
}

const ALERT_ICONS = {
  error: (
    <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
  ),
  warning: (
    <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
  ),
  success: (
    <i className="fa-solid fa-circle-check" aria-hidden="true" />
  ),
  info: (
    <i className="fa-solid fa-circle-info" aria-hidden="true" />
  ),
}

function Alert({
  type = 'error',
  title,
  onDismiss,
  className = '',
  children,
  ...props
}) {
  const classes = ['alert', ALERT_TYPES[type], className].filter(Boolean).join(' ')

  return (
    <div
      className={classes}
      role={type === 'error' ? 'alert' : 'status'}
      {...props}
    >
      <span className="alert__icon">{ALERT_ICONS[type]}</span>
      <div className="alert__body">
        {title && <p className="alert__title">{title}</p>}
        {children && <p className="alert__message">{children}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="alert__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export default Alert