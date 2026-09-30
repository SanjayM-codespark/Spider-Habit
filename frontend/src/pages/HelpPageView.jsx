import { useEffect, useState } from 'react'
import { getHelpPage } from '../services/helpPage'
import './HelpPageView.css'

function HelpPageView({ slug, appName }) {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getHelpPage(slug)
      .then((res) => {
        if (!res) throw new Error('This page has not been published yet.')
        setPage(res)
      })
      .catch((err) => setError(err.message || 'Failed to load this page.'))
      .finally(() => setLoading(false))
  }, [slug])

  return (
    <div className="help-view">
      <nav className="help-view__bar">
        <a className="help-view__brand" href="/">
          {appName}
        </a>
      </nav>
      <main className="help-view__body">
        {loading && <p className="help-view__state">Loading&hellip;</p>}
        {!loading && error && (
          <p className="help-view__state help-view__state--error">{error}</p>
        )}
        {!loading && !error && page && (
          <article className="help-view__card">
            <h1 className="help-view__title">{page.title}</h1>
            <div
              className="help-view__content"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </article>
        )}
      </main>
    </div>
  )
}

export default HelpPageView