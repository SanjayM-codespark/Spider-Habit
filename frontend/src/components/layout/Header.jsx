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
          <i className="fa-solid fa-bars" aria-hidden="true" />
        </button>
        <h1 className="header__title">{title}</h1>
      </div>

      <div className="header__right">
        {/* <label className="header__search">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
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