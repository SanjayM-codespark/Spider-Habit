import { useState } from 'react'
import spiderHabitLogo from '../../assets/spiderhabit.png'
import './Sidebar.css'

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'users',
    label: 'Users',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    id: 'subscription',
    label: 'Subscription',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
    children: [
      { id: 'add-subscription', label: 'Add Subscription' },
      { id: 'manage-subscription', label: 'Manage Subscription' },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    children: [
      { id: 'privacy-policy', label: 'Privacy Policy' },
      { id: 'terms-conditions', label: 'Terms & Conditions' },
      { id: 'contact-us', label: 'Contact Us' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </svg>
    ),
    children: [
      { id: 'general-settings', label: 'General Settings' },
      { id: 'payment-settings', label: 'Payment Settings' },
    ],
  },
]

const CHEVRON = (
  <svg className="sidebar__chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

function Sidebar({
  items = NAV_ITEMS,
  activeKey,
  paths,
  appName,
  onSelect,
  collapsed = false,
  mobileOpen = false,
  onMobileClose,
  onExpand,
}) {
  const [openGroups, setOpenGroups] = useState({})

  const classes = [
    'sidebar',
    collapsed ? 'sidebar--collapsed' : '',
    mobileOpen ? 'sidebar--open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  function handleSelect(id) {
    if (mobileOpen && onMobileClose) onMobileClose()
    if (onSelect) onSelect(id)
  }

  function hrefFor(id) {
    return paths && paths[id] ? paths[id] : undefined
  }

  function toggleGroup(id) {
    if (collapsed && onExpand) onExpand()
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function renderItem(item) {
    const isGroup = Boolean(item.children)
    const groupOpen = Boolean(openGroups[item.id])

    if (isGroup) {
      const hasActiveChild = item.children.some((child) => child.id === activeKey)

      return (
        <li key={item.id} className="sidebar__group">
          <button
            type="button"
            className={[
              'sidebar__item',
              groupOpen ? 'sidebar__item--open' : '',
              hasActiveChild ? 'sidebar__item--parent-active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => toggleGroup(item.id)}
            aria-expanded={groupOpen}
          >
            <span className="sidebar__item-icon">{item.icon}</span>
            <span className="sidebar__item-label">{item.label}</span>
            <span className="sidebar__chevron">{CHEVRON}</span>
          </button>
          {groupOpen && (
            <ul className="sidebar__submenu">
              {item.children.map((child) => (
                <li key={child.id}>
                  <a
                    href={hrefFor(child.id)}
                    className={
                      child.id === activeKey
                        ? 'sidebar__subitem sidebar__subitem--active'
                        : 'sidebar__subitem'
                    }
                    onClick={(event) => {
                      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                      event.preventDefault()
                      handleSelect(child.id)
                    }}
                    aria-current={child.id === activeKey ? 'page' : undefined}
                  >
                    {child.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </li>
      )
    }

    return (
      <li key={item.id}>
        <a
          href={hrefFor(item.id)}
          className={
            item.id === activeKey
              ? 'sidebar__item sidebar__item--active'
              : 'sidebar__item'
          }
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
            event.preventDefault()
            handleSelect(item.id)
          }}
          aria-current={item.id === activeKey ? 'page' : undefined}
        >
          <span className="sidebar__item-icon">{item.icon}</span>
          <span className="sidebar__item-label">{item.label}</span>
        </a>
      </li>
    )
  }

  return (
    <>
      {mobileOpen && <div className="sidebar__backdrop" onClick={onMobileClose} aria-hidden="true" />}
      <aside className={classes}>
        <div className="sidebar__brand">
          <img
            className="sidebar__logo"
            src={spiderHabitLogo}
            alt={appName || 'Spider Habit'}
            width="110"
            height="34"
          />
          <span className="sidebar__brand-name">Admin</span>
        </div>
        <nav className="sidebar__nav" aria-label="Main navigation">
          <ul className="sidebar__list">{items.map(renderItem)}</ul>
        </nav>
        <div className="sidebar__foot">v1.0.0</div>
      </aside>
    </>
  )
}

export default Sidebar