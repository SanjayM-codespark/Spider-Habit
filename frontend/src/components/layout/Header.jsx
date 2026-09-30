import Button from '../ui/Button'
import './Header.css'

function Header({ title, onToggleSidebar, onLogout, admin }) {
  const name = admin?.name || 'Admin'
  const initial = (name || 'A').charAt(0).toUpperCase()
  return (
    <header className="header">
      <div className="header__left">
        <button
          type="button"
          className="header__icon-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="header__title">{title}</h1>
      </div>

      <div className="header__right">
        {/* <label className="header__search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="search" placeholder="Search..." aria-label="Search" />
        </label> */}

        <div className="header__profile">
          <span className="header__avatar">{initial}</span>
          <span className="header__name">{name}</span>
        </div>
        {onLogout && (
          <Button variant="outline" size="sm" onClick={onLogout}>
            Logout
          </Button>
        )}
      </div>
    </header>
  )
}

export default Header