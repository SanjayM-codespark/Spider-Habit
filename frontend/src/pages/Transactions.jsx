import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import { getPayments } from '../services/payment'
import './Transactions.css'

const SEARCH_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAmount(row) {
  const amount = Number(row.amount ?? 0)
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: row.currency || 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${row.currency || 'INR'} ${amount.toFixed(2)}`
  }
}

function shortId(value) {
  if (!value) return '—'
  return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value
}

function Transactions() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const fetchPayments = useCallback(() => {
    return getPayments()
      .then(setPayments)
      .catch((err) => setError(err.message || 'Failed to load transactions.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  function refresh() {
    setLoading(true)
    setError('')
    fetchPayments()
  }

  const totalAmount = useMemo(
    () => payments.reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
    [payments],
  )

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return payments
    return payments.filter((row) =>
      [row.email, row.plan_name, row.razorpay_order_id, row.razorpay_payment_id, row.currency]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    )
  }, [payments, query])

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h2 className="page__title">Transactions</h2>
          <p className="page__subtitle">
            {payments.length} successful payment(s){' '}
            {payments.length > 0 && `· ${formatAmount({ amount: totalAmount, currency: 'INR' })} total`}
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <Alert className="tx__alert" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {!loading && !error && payments.length > 0 && (
        <div className="tx__toolbar">
          <label className="tx__search">
            {SEARCH_ICON}
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by email, plan, order or payment id..."
              aria-label="Search transactions"
            />
          </label>
        </div>
      )}

      <div className="card tx__card">
        {loading && <p className="tx__state">Loading transactions...</p>}

        {!loading && !error && payments.length === 0 && (
          <p className="tx__state">No transactions found yet.</p>
        )}

        {!loading && payments.length > 0 && (
          <>
            {filtered.length === 0 && (
              <p className="tx__state">No transactions match your search.</p>
            )}

            {filtered.length > 0 && (
              <div className="tx__table-wrap">
                <table className="table tx__table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Plan</th>
                      <th>Amount</th>
                      <th>Order ID</th>
                      <th>Payment ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => (
                      <tr key={row.id}>
                        <td className="tx__date">{formatDate(row.created_at)}</td>
                        <td>
                          <div className="tx__email">{row.email || '—'}</div>
                        </td>
                        <td>
                          <div className="tx__plan">{row.plan_name || '—'}</div>
                          {row.plan_duration && (
                            <div className="tx__plan-duration">{row.plan_duration}</div>
                          )}
                        </td>
                        <td className="tx__amount table__strong">{formatAmount(row)}</td>
                        <td className="tx__id" title={row.razorpay_order_id}>
                          {shortId(row.razorpay_order_id)}
                        </td>
                        <td className="tx__id" title={row.razorpay_payment_id}>
                          {shortId(row.razorpay_payment_id)}
                        </td>
                        <td>
                          <span className="badge badge--active">{row.status || 'captured'}</span>
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
    </div>
  )
}

export default Transactions