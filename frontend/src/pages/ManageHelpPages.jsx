import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Modal from '../components/ui/Modal'
import HelpPageForm from '../components/help/HelpPageForm'
import { getHelpPages, getHelpPage, saveHelpPage, deleteHelpPage } from '../services/helpPage'
import { VIEW_ICON, EDIT_ICON, DELETE_ICON, SEARCH_ICON } from './Users'
import './Users.css'
import './HelpPage.css'
import './HelpPageView.css'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function ManageHelpPages() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const [viewing, setViewing] = useState(null)
  const [viewDetail, setViewDetail] = useState(null)
  const [viewError, setViewError] = useState('')

  const [editing, setEditing] = useState(null)
  const [editDetail, setEditDetail] = useState(null)
  const [editError, setEditError] = useState('')

  const [deleting, setDeleting] = useState(null)
  const [deletingBusy, setDeletingBusy] = useState(false)

  const load = useCallback(() => {
    return getHelpPages()
      .then((data) => setPages(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Failed to load help pages.'))
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
    if (!term) return pages
    return pages.filter((page) => `${page.title} ${page.slug}`.toLowerCase().includes(term))
  }, [pages, query])

  function openView(page) {
    setViewing(page)
    setViewDetail(null)
    setViewError('')
    getHelpPage(page.slug)
      .then(setViewDetail)
      .catch((err) => setViewError(err.message || 'Failed to load page.'))
  }

  function openEdit(page) {
    setEditing(page)
    setEditDetail(null)
    setEditError('')
    getHelpPage(page.slug)
      .then(setEditDetail)
      .catch((err) => setEditError(err.message || 'Failed to load page.'))
  }

  function closeEdit() {
    setEditing(null)
    setEditDetail(null)
  }

  function handleEditSaved() {
    closeEdit()
    load()
  }

  async function handleDelete() {
    if (!deleting) return
    setDeletingBusy(true)
    try {
      await deleteHelpPage(deleting.slug)
      setDeleting(null)
      await load()
    } catch (err) {
      setError(err.message || 'Failed to delete page.')
      setDeleting(null)
    } finally {
      setDeletingBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h2 className="page__title">Manage Help Pages</h2>
          <p className="page__subtitle">{pages.length} help page(s) shown in the mobile app.</p>
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

      {!loading && pages.length > 0 && (
        <div className="us__toolbar">
          <label className="us__search">
            {SEARCH_ICON}
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title..."
              aria-label="Search help pages"
            />
          </label>
        </div>
      )}

      <div className="card us__card">
        {loading && <p className="us__state">Loading help pages...</p>}

        {!loading && !error && pages.length === 0 && (
          <p className="us__state">No help pages added yet. Use Add Help Page to create one.</p>
        )}

        {!loading && pages.length > 0 && filtered.length === 0 && (
          <p className="us__state">No help pages match your search.</p>
        )}

        {!loading && filtered.length > 0 && (
          <div className="us__table-wrap">
            <table className="table us__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Last Updated</th>
                  <th className="table__num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((page, index) => (
                  <tr key={page.slug}>
                    <td className="table__strong">{index + 1}</td>
                    <td className="us__name">{page.title}</td>
                    <td>{page.slug}</td>
                    <td>{formatDate(page.updated_at)}</td>
                    <td>
                      <div className="us__actions">
                        <button
                          type="button"
                          className="us__icon-btn"
                          onClick={() => openView(page)}
                          title="View"
                          aria-label={`View ${page.title}`}
                        >
                          {VIEW_ICON}
                        </button>
                        <button
                          type="button"
                          className="us__icon-btn"
                          onClick={() => openEdit(page)}
                          title="Edit"
                          aria-label={`Edit ${page.title}`}
                        >
                          {EDIT_ICON}
                        </button>
                        <button
                          type="button"
                          className="us__icon-btn us__icon-btn--danger"
                          onClick={() => setDeleting(page)}
                          title="Delete"
                          aria-label={`Delete ${page.title}`}
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
        title={viewing ? viewing.title : 'Help page'}
        size="lg"
        onClose={() => setViewing(null)}
      >
        {viewError ? (
          <Alert onDismiss={() => setViewError('')}>{viewError}</Alert>
        ) : !viewDetail ? (
          <p className="us__state us__state--compact">Loading page...</p>
        ) : viewDetail.content ? (
          <div
            className="help-view__content"
            dangerouslySetInnerHTML={{ __html: viewDetail.content }}
          />
        ) : (
          <p className="us__state us__state--compact">This page has no content yet.</p>
        )}
      </Modal>

      <Modal
        open={Boolean(editing)}
        title={editing ? `Edit ${editing.title}` : 'Edit Help Page'}
        size="lg"
        onClose={closeEdit}
      >
        {editError ? (
          <Alert onDismiss={() => setEditError('')}>{editError}</Alert>
        ) : !editDetail ? (
          <p className="us__state us__state--compact">Loading page...</p>
        ) : (
          <HelpPageForm
            key={editDetail.slug}
            initialData={editDetail}
            submitLabel="Update Page"
            onSubmit={(payload) => saveHelpPage(editing.slug, payload)}
            onSaved={handleEditSaved}
            onCancel={closeEdit}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        title="Delete Help Page"
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
          Are you sure you want to delete <strong>{deleting ? deleting.title : ''}</strong>? It will
          no longer appear in the mobile app. This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

export default ManageHelpPages
