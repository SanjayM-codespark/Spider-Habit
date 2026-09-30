import { useState } from 'react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Alert from '../components/ui/Alert'
import { loginAdmin } from '../services/admin'
import './Login.css'

function Login({ appName, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)
    try {
      const session = await loginAdmin(email, password)
      onLogin(session)
    } catch (err) {
      setError(err.message || 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <div className="login__panel">
        <div className="login__brand">
          <span className="login__logo">S</span>
          <span className="login__brand-name">{appName} Admin</span>
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

        <form className="login__form" onSubmit={handleSubmit}>
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@spiderhabit.com"
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
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