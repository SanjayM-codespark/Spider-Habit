import './Button.css'

const BTN_VARIANTS = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  outline: 'btn--outline',
  ghost: 'btn--ghost',
  danger: 'btn--danger',
}

const BTN_SIZES = {
  sm: 'btn--sm',
  md: 'btn--md',
  lg: 'btn--lg',
}

function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled,
  children,
  ...props
}) {
  const classes = ['btn', BTN_VARIANTS[variant], BTN_SIZES[size], className]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}

export default Button