import { useRef, useState } from 'react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Alert from '../components/ui/Alert'
import { loginAdmin } from '../services/admin'
import logo from '../assets/spiderhabit.png'
import './Login.css'

const MAX_USERNAME_LENGTH = 100
const MAX_PASSWORD_LENGTH = 128

function Login({ appName, onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const submitting = useRef(false)

  async function handleSubmit(event) {
    event.preventDefault()
    // Ignore repeated clicks / Enter presses while a request is in flight.
    if (submitting.current) return

    setError('')

    // Leading/trailing spaces in the username are ignored; the password is
    // sent exactly as typed.
    const trimmedUsername = username.trim()
    const errors = {}
    if (!trimmedUsername) errors.username = 'Username is required.'
    if (!password) errors.password = 'Password is required.'
    setFieldErrors(errors)
    if (errors.username || errors.password) return

    submitting.current = true
    setLoading(true)
    try {
      const session = await loginAdmin(trimmedUsername, password)
      onLogin(session)
    } catch (err) {
      setError(err.message || 'Sign in failed. Please try again.')
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <div className="login__panel">
        <div className="login__brand">
          <img src={logo} alt={`${appName} logo`} className="login__logo-img" />
        </div>

        <h1 className="login__title">Sign in</h1>
        <p className="login__subtitle">
          Enter your credentials to access the dashboard.
        </p>

        {error && (
          <Alert type="error" className="login__alert" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value)
              setFieldErrors((prev) => ({ ...prev, username: undefined }))
            }}
            error={fieldErrors.username}
            maxLength={MAX_USERNAME_LENGTH}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Enter your username"
            autoComplete="username"
          />
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setFieldErrors((prev) => ({ ...prev, password: undefined }))
            }}
            error={fieldErrors.password}
            maxLength={MAX_PASSWORD_LENGTH}
            placeholder="Enter your password"
            autoComplete="current-password"
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'}></i>
              </button>
            }
          />
          <Button type="submit" size="lg" className="login__submit" loading={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        {/* <div className="login__demo">
          Demo credentials: <strong>admin@spiderhabit.com</strong> /{' '}
          <strong>Admin@123</strong>
        </div> */}
      </div>
    </div>
  )
}

export default Login