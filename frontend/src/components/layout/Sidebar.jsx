import { useState } from 'react'
import spiderHabitLogo from '../../assets/spiderhabit.png'
import './Sidebar.css'

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <i className="fa-solid fa-table-cells-large" aria-hidden="true" />
    ),
  },
  {
    id: 'users',
    label: 'Users',
    icon: (
      <i className="fa-solid fa-users" aria-hidden="true" />
    ),
    children: [
      { id: 'all-users', label: 'All Users' },
      { id: 'premium-users', label: 'Premium Users' },
      { id: 'premium-habits', label: 'Premium Habits' },
      { id: 'deleted-users', label: 'Deleted Users' },
    ],
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: (
      <i className="fa-solid fa-money-bill-wave" aria-hidden="true" />
    ),
  },
  {
    id: 'subscription',
    label: 'Subscription',
    icon: (
      <i className="fa-solid fa-box" aria-hidden="true" />
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
      <i className="fa-solid fa-circle-question" aria-hidden="true" />
    ),
    children: [
      { id: 'add-help-page', label: 'Add Help Page' },
      { id: 'manage-help-pages', label: 'Manage Help Pages' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <i className="fa-solid fa-sliders" aria-hidden="true" />
    ),
    children: [
      { id: 'general-settings', label: 'General Settings' },
      { id: 'payment-settings', label: 'Payment Settings' },
    ],
  },
]

const CHEVRON = (
  <i className="fa-solid fa-chevron-down sidebar__chevron-icon" aria-hidden="true" />
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
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {}
    for (const item of items) {
      if (item.children && item.children.some((child) => child.id === activeKey)) {
        initial[item.id] = true
      }
    }
    return initial
  })

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