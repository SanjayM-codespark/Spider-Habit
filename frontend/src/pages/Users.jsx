import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Modal from '../components/ui/Modal'
import UserForm from '../components/users/UserForm'
import { getUsers, getUser, updateUser, deleteUser } from '../services/user'
import { getSubscriptions } from '../services/subscription'
import { buildPublicUrl } from '../lib/api'
import './Users.css'

const VIEW_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EDIT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
  </svg>
)

const DELETE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

const SEARCH_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'subscribed', label: 'Subscribed' },
  { key: 'not-subscribed', label: 'Not subscribed' },
]

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

const HABIT_EMOJIS = {
  runner: '🏃',
  book: '📖',
  water: '🥛',
  meditation: '🧘',
  workout: '💪',
  coffee: '☕',
  food: '🍎',
  sleep: '😴',
  drop: '💧',
}

function habitEmoji(icon) {
  return HABIT_EMOJIS[icon] || '🎯'
}

/**
 * Renders a habit's icon: the user-uploaded image when the habit has one,
 * otherwise the built-in emoji. Mirrors HabitIconBadge in the mobile app.
 */
function HabitIcon({ icon, iconImageUrl }) {
  const src = buildPublicUrl(iconImageUrl)
  if (src) {
    return <img className="us-habit__icon" src={src} alt="" loading="lazy" />
  }
  return <span className="us-habit__emoji">{habitEmoji(icon)}</span>
}

function formatDid(dayId) {
  const match = String(dayId).match(/^[A-Za-z]{3}/)
  return match ? match[0] : String(dayId)
}

function UserHabits({ habits }) {
  return (
    <section className="us-habits">
      <div className="us-habits__head">
        <h3 className="us-habits__title">Habits</h3>
        <span className="us-habits__count">
          {habits.length} habit{habits.length === 1 ? '' : 's'}
        </span>
      </div>
      {habits.length === 0 ? (
        <p className="us-habits__empty">
          No habits found for this user. Habits appear once the user has
          subscribed and synced their data.
        </p>
      ) : (
        <div className="us-habits__list">
          {habits.map((habit) => {
            const completed = Array.isArray(habit.completed_dates)
              ? habit.completed_dates
              : []
            const targetDays = Array.isArray(habit.target_days)
              ? habit.target_days.map(formatDid)
              : []
            const rows = [
              { label: 'Frequency', value: habit.frequency || '—' },
              {
                label: 'Target Days',
                value: targetDays.length ? targetDays.join(', ') : 'Every day',
              },
              { label: 'Reminder Time', value: habit.reminder_time || '—' },
              { label: 'Goal', value: habit.goal_details || '—' },
              { label: 'Current Streak', value: `${habit.streak ?? 0} day(s)` },
              { label: 'Total Completed', value: `${completed.length} day(s)` },
              {
                label: 'Last Completed',
                value: completed.length ? formatDate(completed[completed.length - 1]) : '—',
              },
              { label: 'Created At', value: formatDate(habit.created_at) },
              { label: 'Updated At', value: formatDate(habit.updated_at) },
            ]

            return (
              <details key={habit.id} className="us-habit">
                <summary>
                  <HabitIcon icon={habit.icon} iconImageUrl={habit.icon_image_url} />
                  <span className="us-habit__info">
                    <span className="us-habit__title">{habit.title}</span>
                    <span className="us-habit__meta">
                      {habit.frequency || '—'} · {habit.streak ?? 0} day streak ·{' '}
                      {completed.length} completed
                    </span>
                  </span>
                  <span className="us-habit__chevron" aria-hidden="true">
                    ▾
                  </span>
                </summary>
                <div className="us-habit__body">
                  <dl className="us__detail">
                    {rows.map((row) => (
                      <div key={row.label} className="us__detail-row">
                        <dt>{row.label}</dt>
                        <dd>{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </details>
            )
          })}
        </div>
      )}
    </section>
  )
}

function UserDetail({ user }) {
  const rows = [
    { label: 'ID', value: `#${user.id}` },
    { label: 'Name', value: user.name || '—' },
    { label: 'Email', value: user.email || '—' },
    { label: 'Phone', value: user.phone || '—' },
    {
      label: 'Status',
      value: (
        <span className={user.is_subscribed ? 'badge badge--active' : 'badge badge--inactive'}>
          {user.is_subscribed ? 'Subscribed' : 'Not subscribed'}
        </span>
      ),
    },
    { label: 'Subscription', value: user.subscription_name || '—' },
    { label: 'Created At', value: formatDate(user.created_at) },
  ]

  return (
    <>
      <dl className="us__detail">
        {rows.map((row) => (
          <div key={row.label} className="us__detail-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <UserHabits habits={Array.isArray(user.habits) ? user.habits : []} />
    </>
  )
}

function Users() {
  const [users, setUsers] = useState([])
  const [subscriptionOptions, setSubscriptionOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [viewing, setViewing] = useState(null)
  const [viewDetail, setViewDetail] = useState(null)
  const [viewBusy, setViewBusy] = useState(false)
  const [viewError, setViewError] = useState('')

  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deletingBusy, setDeletingBusy] = useState(false)

  const fetchAll = useCallback(() => {
    return Promise.all([getUsers(), getSubscriptions()])
      .then(([userRes, subRes]) => {
        setUsers(userRes ?? [])
        setSubscriptionOptions(
          (subRes ?? []).map((sub) => ({ value: String(sub.id), label: sub.name })),
        )
      })
      .catch((err) => setError(err.message || 'Failed to load users.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  function refresh() {
    setLoading(true)
    setError('')
    fetchAll()
  }

  const subscribedCount = useMemo(
    () => users.filter((user) => user.is_subscribed).length,
    [users],
  )
  const notSubscribedCount = users.length - subscribedCount

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return users.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        `${user.name} ${user.email} ${user.phone} ${user.subscription_name ?? ''}`
          .toLowerCase()
          .includes(normalizedQuery)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'subscribed'
          ? Boolean(user.is_subscribed)
          : !user.is_subscribed)
      return matchesQuery && matchesStatus
    })
  }, [users, query, statusFilter])

  function openView(user) {
    setViewing(user)
    setViewDetail(null)
    setViewBusy(true)
    setViewError('')
    getUser(user.id)
      .then((res) => setViewDetail(res))
      .catch((err) => setViewError(err.message || 'Failed to load user.'))
      .finally(() => setViewBusy(false))
  }

  function handleCloseView() {
    setViewing(null)
    setViewDetail(null)
    setViewError('')
  }

  function handleEditSaved() {
    setEditing(null)
    refresh()
  }

  async function handleDelete() {
    setDeletingBusy(true)
    try {
      await deleteUser(deleting.id)
      setDeleting(null)
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to delete user.')
      setDeleting(null)
    } finally {
      setDeletingBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h2 className="page__title">Users</h2>
          <p className="page__subtitle">
            {users.length} user(s) registered on the app.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <Alert className="us__alert" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="us__toolbar">
          <label className="us__search">
            {SEARCH_ICON}
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, phone..."
              aria-label="Search users"
            />
          </label>

          <div className="us__tabs" role="tablist" aria-label="Filter by status">
            {STATUS_TABS.map((tab) => {
              const count =
                tab.key === 'all'
                  ? users.length
                  : tab.key === 'subscribed'
                    ? subscribedCount
                    : notSubscribedCount
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === tab.key}
                  className={statusFilter === tab.key ? 'us__tab us__tab--active' : 'us__tab'}
                  onClick={() => setStatusFilter(tab.key)}
                >
                  {tab.label}
                  <span className="us__tab-count">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="card us__card">
        {loading && <p className="us__state">Loading users...</p>}

        {!loading && !error && users.length === 0 && (
          <p className="us__state">No users found yet.</p>
        )}

        {!loading && users.length > 0 && (
          <>
            {filtered.length === 0 && (
              <p className="us__state">No users match your filters.</p>
            )}

            {filtered.length > 0 && (
              <div className="us__table-wrap">
                <table className="table us__table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Subscription</th>
                      <th>Status</th>
                      <th className="table__num">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user) => (
                      <tr key={user.id}>
                        <td className="table__strong">#{user.id}</td>
                        <td>
                          <div className="us__name">{user.name}</div>
                          <div className="us__meta">Joined {formatDate(user.created_at)}</div>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.phone}</td>
                        <td>{user.subscription_name || '—'}</td>
                        <td>
                          <span
                            className={
                              user.is_subscribed ? 'badge badge--active' : 'badge badge--inactive'
                            }
                          >
                            {user.is_subscribed ? 'Subscribed' : 'Not subscribed'}
                          </span>
                        </td>
                        <td>
                          <div className="us__actions">
                            <button
                              type="button"
                              className="us__icon-btn"
                              onClick={() => openView(user)}
                              title="View"
                              aria-label={`View ${user.name}`}
                            >
                              {VIEW_ICON}
                            </button>
                            <button
                              type="button"
                              className="us__icon-btn"
                              onClick={() => setEditing(user)}
                              title="Edit"
                              aria-label={`Edit ${user.name}`}
                            >
                              {EDIT_ICON}
                            </button>
                            <button
                              type="button"
                              className="us__icon-btn us__icon-btn--danger"
                              onClick={() => setDeleting(user)}
                              title="Delete"
                              aria-label={`Delete ${user.name}`}
                            >
                              {DELETE_ICON}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={Boolean(viewing)}
        title={viewing ? `User · ${viewing.name}` : 'User'}
        onClose={handleCloseView}
      >
        {viewError ? (
          <Alert className="us__alert" onDismiss={() => setViewError('')}>
            {viewError}
          </Alert>
        ) : viewBusy && !viewDetail ? (
          <p className="us__state us__state--compact">Loading user details...</p>
        ) : (
          <UserDetail user={viewDetail ?? viewing} />
        )}
      </Modal>

      <Modal
        open={Boolean(editing)}
        title={editing ? `Edit ${editing.name}` : 'Edit User'}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <UserForm
            initialData={editing}
            subscriptionOptions={subscriptionOptions}
            submitLabel="Update User"
            successMessage="User updated."
            onSubmit={async (payload) => updateUser(editing.id, payload)}
            onSaved={handleEditSaved}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        title="Delete User"
        onClose={() => setDeleting(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)} disabled={deletingBusy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deletingBusy}>
              {deletingBusy ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      >
        <p className="us__delete-text">
          Are you sure you want to delete <strong>{deleting ? deleting.name : ''}</strong> (
          {deleting ? deleting.email : ''})? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

export default Users