import { useCallback, useEffect, useState } from 'react'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import { getDashboardOverview } from '../services/dashboard'
import { COUNTRIES, formatAmount } from '../lib/countries'
import './Dashboard.css'

const ICONS = {
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  habits: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m22 8-6 6-4-4-8 8" />
      <path d="M22 4h-6v6" />
    </svg>
  ),
  revenue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  subscribers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  ),
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value ?? 0))
}

function formatRevenue(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function expiringClass(daysLeft) {
  if (daysLeft <= 0) return 'dash__days dash__days--danger'
  if (daysLeft <= 2) return 'dash__days dash__days--warning'
  return 'dash__days'
}

function expiringLabel(daysLeft) {
  if (daysLeft <= 0) return 'Ends today'
  if (daysLeft === 1) return '1 day left'
  return `${daysLeft} days left`
}

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState(null)

  const fetchOverview = useCallback(() => {
    return getDashboardOverview()
      .then(setOverview)
      .catch((err) => setError(err.message || 'Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  function refresh() {
    setLoading(true)
    setError('')
    fetchOverview()
  }

  const stats = overview?.stats ?? null
  const countryStats = overview?.countryStats ?? []
  const expiringSoon = overview?.expiringSoon ?? []

  const statItems = [
    {
      key: 'users',
      label: 'Total Users',
      value: stats ? formatNumber(stats.totalUsers) : '—',
      icon: ICONS.users,
      hint: 'Registered on the app',
    },
    {
      key: 'habits',
      label: 'Total Habits',
      value: stats ? formatNumber(stats.totalHabits) : '—',
      icon: ICONS.habits,
      hint: 'Created by users',
    },
    {
      key: 'revenue',
      label: 'Total Revenue',
      value: stats ? formatRevenue(stats.totalRevenue) : '—',
      icon: ICONS.revenue,
      hint: 'Configured plan pricing',
    },
    {
      key: 'subscribers',
      label: 'Current Subscribers',
      value: stats ? formatNumber(stats.currentSubscribers) : '—',
      icon: ICONS.subscribers,
      hint: 'Actively subscribed',
    },
  ]

  const countryTotal = countryStats.reduce((sum, row) => sum + row.totalAmount, 0)

  return (
    <div className="dashboard">
      <div className="dashboard__head">
        <div>
          <h2 className="dashboard__title">Overview</h2>
          <p className="dashboard__subtitle">
            Welcome back, here is how your app is performing today.
          </p>
        </div>
        <div className="dashboard__actions">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="dash__alert" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="dashboard__stats">
        {statItems.map((stat) => (
          <div key={stat.key} className="card stat">
            <span className="stat__icon">{stat.icon}</span>
            <span className="stat__label">{stat.label}</span>
            <span className="stat__value">{stat.value}</span>
            <span className="stat__hint">{stat.hint}</span>
          </div>
        ))}
      </div>

      <div className="dashboard__grid">
        <section className="card">
          <div className="dash-card__head">
            <h3 className="card__title">Country Statistics</h3>
            <span className="dash-card__meta">{countryStats.length} countries</span>
          </div>

          {loading && <p className="dash__state">Loading country statistics...</p>}

          {!loading && countryStats.length === 0 && (
            <p className="dash__state">No country pricing configured yet.</p>
          )}

          {!loading && countryStats.length > 0 && (
            <div className="table-wrap">
              <table className="table dash__table">
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Plans</th>
                    <th>Total</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {countryStats.map((row) => {
                    const country = COUNTRIES.find((item) => item.code === row.country)
                    const name = country ? country.name : row.country
                    const amount = country
                      ? formatAmount(country, row.totalAmount)
                      : `${row.currency} ${row.totalAmount}`
                    const share =
                      countryTotal > 0 ? ((row.totalAmount / countryTotal) * 100).toFixed(1) : 0

                    return (
                      <tr key={row.country}>
                        <td>
                          <div className="dash__country">
                            <span className="dash__country-code">{row.country}</span>
                            {name}
                          </div>
                        </td>
                        <td>{row.planCount}</td>
                        <td className="table__strong">{amount}</td>
                        <td>
                          <div className="dash__bar">
                            <div className="dash__bar-track">
                              <span
                                className="dash__bar-fill"
                                style={{ width: `${Math.min(share, 100)}%` }}
                              />
                            </div>
                            <span className="dash__bar-label">{share}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <div className="dash-card__head">
            <h3 className="card__title">Subscriptions Ending Soon</h3>
            <span className="dash-card__meta">Next 7 days</span>
          </div>

          {loading && <p className="dash__state">Loading expiring subscriptions...</p>}

          {!loading && expiringSoon.length === 0 && (
            <p className="dash__state">
              No subscriptions are about to end in the next 7 days.
            </p>
          )}

          {!loading && expiringSoon.length > 0 && (
            <div className="table-wrap">
              <table className="table dash__table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Ends On</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringSoon.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="dash__user">{user.name}</div>
                        <div className="dash__email">{user.email}</div>
                      </td>
                      <td className="dash__plan">{user.subscription_name || '—'}</td>
                      <td>{formatDate(user.end_date)}</td>
                      <td>
                        <span className={expiringClass(user.days_left)}>
                          {expiringLabel(user.days_left)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Dashboard