import { useCallback, useEffect, useState } from 'react'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import { getDashboardOverview } from '../services/dashboard'
import { COUNTRIES } from '../lib/countries'
import './Dashboard.css'

const ICONS = {
  users: (
    <i className="fa-solid fa-users" aria-hidden="true" />
  ),
  habits: (
    <i className="fa-solid fa-chart-line" aria-hidden="true" />
  ),
  revenue: (
    <i className="fa-solid fa-coins" aria-hidden="true" />
  ),
  subscribers: (
    <i className="fa-solid fa-user-check" aria-hidden="true" />
  ),
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value ?? 0))
}

// Revenue arrives as [{ currency, amount }], one entry per currency paid in.
function formatRevenue(list) {
  if (!Array.isArray(list) || list.length === 0) return '—'
  return list
    .map(({ currency, amount }) => {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          maximumFractionDigits: 2,
        }).format(Number(amount))
      } catch {
        return `${currency} ${amount}`
      }
    })
    .join(' + ')
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
      hint: 'Payments received',
    },
    {
      key: 'subscribers',
      label: 'Current Subscribers',
      value: stats ? formatNumber(stats.currentSubscribers) : '—',
      icon: ICONS.subscribers,
      hint: 'Actively subscribed',
    },
  ]

  const userTotal = countryStats.reduce((sum, row) => sum + row.users, 0)

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
            <p className="dash__state">No users registered yet.</p>
          )}

          {!loading && countryStats.length > 0 && (
            <div className="table-wrap">
              <table className="table dash__table">
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Users</th>
                    <th>Subscribers</th>
                    <th>Revenue</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {countryStats.map((row) => {
                    const country = COUNTRIES.find((item) => item.code === row.country)
                    const name = country ? country.name : 'Unknown'
                    const share =
                      userTotal > 0 ? ((row.users / userTotal) * 100).toFixed(1) : 0

                    return (
                      <tr key={row.country}>
                        <td>
                          <div className="dash__country">
                            <span className="dash__country-code">
                              {row.country === 'UNKNOWN' ? '—' : row.country}
                            </span>
                            {name}
                          </div>
                        </td>
                        <td className="table__strong">{row.users}</td>
                        <td>{row.subscribers}</td>
                        <td>{formatRevenue(row.revenue)}</td>
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