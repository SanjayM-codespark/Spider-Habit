import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Modal from '../components/ui/Modal'
import SubscriptionForm from '../components/subscriptions/SubscriptionForm'
import { formatAmount, getCountryByCode } from '../lib/countries'
import {
  getSubscriptions,
  updateSubscription,
  deleteSubscription,
} from '../services/subscription'
import './ManageSubscription.css'

function platformLabel(platform) {
  if (!platform) return ''
  return platform === 'ios' ? 'iOS' : platform.charAt(0).toUpperCase() + platform.slice(1)
}

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
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
]

function ManageSubscription() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deletingBusy, setDeletingBusy] = useState(false)

  const fetchSubs = useCallback(() => {
    return getSubscriptions()
      .then(setSubscriptions)
      .catch((err) => setError(err.message || 'Failed to load subscriptions.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchSubs()
  }, [fetchSubs])

  function refresh() {
    setLoading(true)
    setError('')
    fetchSubs()
  }

  const activeCount = useMemo(
    () => subscriptions.filter((sub) => sub.is_active).length,
    [subscriptions],
  )
  const inactiveCount = subscriptions.length - activeCount

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return subscriptions.filter((sub) => {
      const matchesQuery =
        !normalizedQuery ||
        `${sub.name} ${platformLabel(sub.platform)}`.toLowerCase().includes(normalizedQuery)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? Boolean(sub.is_active) : !sub.is_active)
      return matchesQuery && matchesStatus
    })
  }, [subscriptions, query, statusFilter])

  function handleEditSaved() {
    setEditing(null)
    refresh()
  }

  async function handleDelete() {
    setDeletingBusy(true)
    try {
      await deleteSubscription(deleting.id)
      setDeleting(null)
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to delete subscription.')
      setDeleting(null)
    } finally {
      setDeletingBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h2 className="page__title">Manage Subscription</h2>
          <p className="page__subtitle">
            {subscriptions.length} subscription(s) with country-based pricing.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <Alert className="ms__alert" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {!loading && !error && subscriptions.length > 0 && (
        <div className="ms__toolbar">
          <label className="ms__search">
            {SEARCH_ICON}
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or platform..."
              aria-label="Search subscriptions"
            />
          </label>

          <div className="ms__tabs" role="tablist" aria-label="Filter by status">
            {STATUS_TABS.map((tab) => {
              const count =
                tab.key === 'all'
                  ? subscriptions.length
                  : tab.key === 'active'
                    ? activeCount
                    : inactiveCount
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === tab.key}
                  className={statusFilter === tab.key ? 'ms__tab ms__tab--active' : 'ms__tab'}
                  onClick={() => setStatusFilter(tab.key)}
                >
                  {tab.label}
                  <span className="ms__tab-count">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="card ms__card">
        {loading && <p className="ms__state">Loading subscriptions...</p>}

        {!loading && !error && subscriptions.length === 0 && (
          <p className="ms__state">No subscriptions found yet.</p>
        )}

        {!loading && subscriptions.length > 0 && (
          <>
            {filtered.length === 0 && (
              <p className="ms__state">No subscriptions match your filters.</p>
            )}

            {filtered.length > 0 && (
              <div className="ms__table-wrap">
                <table className="table ms__table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Subscription</th>
                      <th>Platform</th>
                      <th>Duration</th>
                      <th>Country Pricing</th>
                      <th>Status</th>
                      <th className="table__num">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((sub) => (
                      <tr key={sub.id}>
                        <td className="table__strong">#{sub.id}</td>
                        <td>
                          <div className="ms__name">{sub.name}</div>
                          <div className="ms__desc">{sub.description}</div>
                        </td>
                        <td>
                          <span className={`badge badge--platform-${sub.platform}`}>
                            {platformLabel(sub.platform)}
                          </span>
                        </td>
                        <td className="ms__duration">{sub.duration}</td>
                        <td>
                          <div className="ms__pricing">
                            {sub.pricing.map((price) => {
                              const country = getCountryByCode(price.country)
                              return (
                                <span
                                  key={price.country}
                                  className="ms__price"
                                  title={`${country.name} (${country.dialCode})`}
                                >
                                  {price.country} <strong>{formatAmount(country, price.amount)}</strong>
                                </span>
                              )
                            })}
                          </div>
                        </td>
                        <td>
                          <span
                            className={sub.is_active ? 'badge badge--active' : 'badge badge--inactive'}
                          >
                            {sub.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="ms__actions">
                            <button
                              type="button"
                              className="ms__icon-btn"
                              onClick={() => setEditing(sub)}
                              title="Edit"
                              aria-label={`Edit ${sub.name}`}
                            >
                              {EDIT_ICON}
                            </button>
                            <button
                              type="button"
                              className="ms__icon-btn ms__icon-btn--danger"
                              onClick={() => setDeleting(sub)}
                              title="Delete"
                              aria-label={`Delete ${sub.name}`}
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
        open={Boolean(editing)}
        title={editing ? `Edit ${editing.name}` : 'Edit Subscription'}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <SubscriptionForm
            initialData={editing}
            submitLabel="Update Subscription"
            successMessage="Subscription updated."
            onSubmit={async (payload) => updateSubscription(editing.id, payload)}
            onSaved={handleEditSaved}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        title="Delete Subscription"
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
        <p className="ms__delete-text">
          Are you sure you want to delete{' '}
          <strong>{deleting ? deleting.name : ''}</strong>? This will permanently remove it
          and all of its country pricing.
        </p>
      </Modal>
    </div>
  )
}

export default ManageSubscription