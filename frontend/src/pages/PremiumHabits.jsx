import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import { getPremiumHabits } from '../services/user'
import { updateHabit, deleteHabit } from '../services/habit'
import { HabitIcon, VIEW_ICON, EDIT_ICON, DELETE_ICON, SEARCH_ICON } from './Users'
import '../components/users/UserForm.css'
import './Users.css'
import './PremiumHabits.css'

const FREQUENCIES = ['Daily', 'Weekly', 'Specific days', 'Monthly', 'Custom']
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function dayShort(dayId) {
  const match = String(dayId).match(/^[A-Za-z]{3}/)
  return match ? match[0] : String(dayId)
}

function listOf(value) {
  return Array.isArray(value) ? value : []
}

function targetDaysText(habit) {
  const days = listOf(habit.target_days).map(dayShort)
  return days.length ? days.join(', ') : 'Every day'
}

function HabitDetail({ habit }) {
  const completed = listOf(habit.completed_dates)
  const rows = [
    { label: 'ID', value: `#${habit.id}` },
    { label: 'Habit', value: habit.title },
    { label: 'User', value: `${habit.user_name} (${habit.user_email})` },
    { label: 'Phone', value: habit.user_phone || '—' },
    { label: 'Plan', value: habit.subscription_name || '—' },
    { label: 'Frequency', value: habit.frequency || '—' },
    { label: 'Target Days', value: targetDaysText(habit) },
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
    <dl className="us__detail">
      {rows.map((row) => (
        <div key={row.label} className="us__detail-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function HabitEditForm({ habit, onSaved, onCancel }) {
  const [form, setForm] = useState({
    title: habit.title ?? '',
    frequency: habit.frequency ?? 'Daily',
    targetDays: listOf(habit.target_days).map(dayShort),
    reminderTime: habit.reminder_time ?? '',
    goalDetails: habit.goal_details ?? '',
    streak: String(habit.streak ?? 0),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function setField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  function toggleDay(day) {
    setForm((prev) => ({
      ...prev,
      targetDays: prev.targetDays.includes(day)
        ? prev.targetDays.filter((d) => d !== day)
        : [...prev.targetDays, day],
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.title.trim()) {
      setError('Habit title is required.')
      return
    }
    if (!/^[0-9]+$/.test(form.streak.trim())) {
      setError('Streak must be a whole number (0 or more).')
      return
    }

    setSaving(true)
    try {
      await updateHabit(habit.id, {
        title: form.title.trim(),
        frequency: form.frequency,
        targetDays: form.targetDays,
        reminderTime: form.reminderTime.trim(),
        goalDetails: form.goalDetails.trim(),
        streak: Number(form.streak),
      })
      onSaved()
    } catch (err) {
      setError(err.message || 'Failed to update habit.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="userform" onSubmit={handleSubmit}>
      {error && (
        <Alert className="userform__alert" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="userform__grid">
        <Input label="Title" value={form.title} onChange={setField('title')} disabled={saving} />
        <Select
          label="Frequency"
          options={FREQUENCIES}
          value={form.frequency}
          onChange={setField('frequency')}
          disabled={saving}
        />
        <Input
          label="Reminder Time"
          value={form.reminderTime}
          onChange={setField('reminderTime')}
          placeholder="e.g. 08:00 AM"
          disabled={saving}
        />
        <Input
          label="Current Streak"
          type="number"
          min="0"
          value={form.streak}
          onChange={setField('streak')}
          disabled={saving}
        />
      </div>

      <fieldset className="ph__days" disabled={saving}>
        <legend>Target Days</legend>
        {WEEK_DAYS.map((day) => (
          <label key={day} className="ph__day">
            <input
              type="checkbox"
              checked={form.targetDays.includes(day)}
              onChange={() => toggleDay(day)}
            />
            {day}
          </label>
        ))}
      </fieldset>

      <Input
        label="Goal"
        multiline
        rows={3}
        value={form.goalDetails}
        onChange={setField('goalDetails')}
        disabled={saving}
      />

      <div className="userform__actions">
        <Button type="submit" loading={saving}>
          {saving ? 'Saving...' : 'Update Habit'}
        </Button>
        <Button type="button" variant="ghost" disabled={saving} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function PremiumHabits() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [habits, setHabits] = useState([])
  const [query, setQuery] = useState('')

  const [viewing, setViewing] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deletingBusy, setDeletingBusy] = useState(false)

  const load = useCallback(() => {
    return getPremiumHabits()
      .then((data) => setHabits(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Failed to load premium users habits.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function refresh() {
    setLoading(true)
    setError('')
    load()
  }

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return habits
    return habits.filter((habit) =>
      `${habit.title} ${habit.user_name} ${habit.user_email} ${habit.user_phone} ${habit.frequency}`
        .toLowerCase()
        .includes(term),
    )
  }, [habits, query])

  function handleEditSaved() {
    setEditing(null)
    load()
  }

  async function handleDelete() {
    if (!deleting) return
    setDeletingBusy(true)
    try {
      await deleteHabit(deleting.id)
      setDeleting(null)
      await load()
    } catch (err) {
      setError(err.message || 'Failed to delete habit.')
      setDeleting(null)
    } finally {
      setDeletingBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h2 className="page__title">Premium Habits</h2>
          <p className="page__subtitle">{habits.length} habit(s) created by premium users.</p>
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

      {!loading && habits.length > 0 && (
        <div className="us__toolbar">
          <label className="us__search">
            {SEARCH_ICON}
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by habit, user, email..."
              aria-label="Search habits"
            />
          </label>
        </div>
      )}

      <div className="card us__card">
        {loading && <p className="us__state">Loading habits...</p>}

        {!loading && !error && habits.length === 0 && (
          <p className="us__state">No premium user habits found yet.</p>
        )}

        {!loading && habits.length > 0 && filtered.length === 0 && (
          <p className="us__state">No habits match your search.</p>
        )}

        {!loading && filtered.length > 0 && (
          <div className="us__table-wrap">
            <table className="table us__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Habit</th>
                  <th>User</th>
                  <th>Frequency</th>
                  <th>Target Days</th>
                  <th>Reminder</th>
                  <th>Streak</th>
                  <th>Completed</th>
                  <th>Created</th>
                  <th className="table__num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((habit) => (
                  <tr key={habit.id}>
                    <td className="table__strong">#{habit.id}</td>
                    <td>
                      <div className="ph__habit">
                        <HabitIcon icon={habit.icon} iconImageUrl={habit.icon_image_url} />
                        <div>
                          <div className="us__name">{habit.title}</div>
                          <div className="us__meta">{habit.goal_details || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="us__name">{habit.user_name}</div>
                      <div className="us__meta">{habit.user_email}</div>
                    </td>
                    <td>{habit.frequency || '—'}</td>
                    <td>{targetDaysText(habit)}</td>
                    <td>{habit.reminder_time || '—'}</td>
                    <td>{habit.streak ?? 0}</td>
                    <td>{listOf(habit.completed_dates).length}</td>
                    <td>{formatDate(habit.created_at)}</td>
                    <td>
                      <div className="us__actions">
                        <button
                          type="button"
                          className="us__icon-btn"
                          onClick={() => setViewing(habit)}
                          title="View"
                          aria-label={`View ${habit.title}`}
                        >
                          {VIEW_ICON}
                        </button>
                        <button
                          type="button"
                          className="us__icon-btn"
                          onClick={() => setEditing(habit)}
                          title="Edit"
                          aria-label={`Edit ${habit.title}`}
                        >
                          {EDIT_ICON}
                        </button>
                        <button
                          type="button"
                          className="us__icon-btn us__icon-btn--danger"
                          onClick={() => setDeleting(habit)}
                          title="Delete"
                          aria-label={`Delete ${habit.title}`}
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
      </div>

      <Modal
        open={Boolean(viewing)}
        title={viewing ? `Habit · ${viewing.title}` : 'Habit'}
        onClose={() => setViewing(null)}
      >
        {viewing && <HabitDetail habit={viewing} />}
      </Modal>

      <Modal
        open={Boolean(editing)}
        title={editing ? `Edit ${editing.title}` : 'Edit Habit'}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <HabitEditForm
            key={editing.id}
            habit={editing}
            onSaved={handleEditSaved}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        title="Delete Habit"
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
          Are you sure you want to delete <strong>{deleting ? deleting.title : ''}</strong> from{' '}
          {deleting ? deleting.user_name : ''}? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

export default PremiumHabits
