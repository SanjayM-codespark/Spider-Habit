import { useEffect, useState } from 'react'
import AdminLayout from './components/layout/AdminLayout'
import AddSubscription from './pages/AddSubscription'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Login from './pages/Login'
import ManageSubscription from './pages/ManageSubscription'
import Placeholder from './pages/Placeholder'
import Users from './pages/Users'
import PremiumHabits from './pages/PremiumHabits'
import GeneralSettings from './pages/GeneralSettings'
import PaymentSettings from './pages/PaymentSettings'
import AddHelpPage from './pages/AddHelpPage'
import ManageHelpPages from './pages/ManageHelpPages'
import HelpPageView from './pages/HelpPageView'
import Transactions from './pages/Transactions'
import { setSession, getStoredAdmin, clearSession, getToken } from './lib/auth'
import { AUTH_EVENTS } from './lib/api'
import { DEFAULT_APP_NAME, getAppName, loadAppInfo, APP_EVENTS } from './lib/appInfo'

const HELP_ROUTES = {
  '/privacy': 'privacy_policy',
  '/privacy-policy': 'privacy_policy',
  '/terms': 'terms_conditions',
  '/terms-conditions': 'terms_conditions',
  '/support': 'contact_us',
  '/contact-us': 'contact_us',
}

function getHelpRoute() {
  const path = window.location.pathname
  const slug = HELP_ROUTES[path]
  return slug ? { slug } : null
}

function isAdminRoute() {
  const path = window.location.pathname
  return path === '/admin' || path.startsWith('/admin/') || path.startsWith('/dashboard') || path.startsWith('/users') || path.startsWith('/admin/users') || path.startsWith('/subscriptions') || path.startsWith('/transactions') || path.startsWith('/settings') || path.startsWith('/help')
}

const PAGES = {
  dashboard: { title: 'Dashboard', element: <Dashboard /> },
  users: { title: 'Users', element: <Users filter="all" /> },
  'all-users': { title: 'All Users', element: <Users filter="all" /> },
  'premium-users': { title: 'Premium Users', element: <Users filter="premium" /> },
  'premium-habits': { title: 'Premium Habits', element: <PremiumHabits /> },
  'deleted-users': { title: 'Deleted Users', element: <Users filter="deleted" /> },
  'add-subscription': {
    title: 'Add Subscription',
    element: <AddSubscription />,
  },
  'manage-subscription': {
    title: 'Manage Subscription',
    element: <ManageSubscription />,
  },
  transactions: {
    title: 'Transactions',
    element: <Transactions />,
  },
  subscription: { title: 'Subscription', element: <Placeholder title="Subscription" /> },
  'add-help-page': { title: 'Add Help Page', element: <AddHelpPage /> },
  'manage-help-pages': { title: 'Manage Help Pages', element: <ManageHelpPages /> },
  'general-settings': {
    title: 'General Settings',
    element: <GeneralSettings />,
  },
  'payment-settings': {
    title: 'Payment Settings',
    element: <PaymentSettings />,
  },
}

/**
 * URL paths for each admin page. They live under distinctive paths so they
 * never collide with the public help routes defined in HELP_ROUTES.
 */
const ROUTE_PATHS = {
  dashboard: '/admin/dashboard',
  users: '/admin/users',
  'all-users': '/admin/users/all',
  'premium-users': '/admin/users/premium',
  'premium-habits': '/admin/users/premium-habits',
  'deleted-users': '/admin/users/deleted',
  'add-subscription': '/admin/subscriptions/add',
  'manage-subscription': '/admin/subscriptions/manage',
  transactions: '/admin/transactions',
  'add-help-page': '/help/add',
  'manage-help-pages': '/help/manage',
  'general-settings': '/admin/settings/general',
  'payment-settings': '/admin/settings/payment',
}

const PATH_TO_KEY = Object.fromEntries(
  Object.entries(ROUTE_PATHS).map(([key, path]) => [path, key]),
)

function getKeyFromPath() {
  const path = window.location.pathname
  return PATH_TO_KEY[path] || 'dashboard'
}

function App() {
  const [user, setUser] = useState(getStoredAdmin)
  const [activeKey, setActiveKey] = useState(getKeyFromPath)
  const [helpRoute, setHelpRoute] = useState(getHelpRoute)
  const [appName, setAppName] = useState(DEFAULT_APP_NAME)

  function syncRouteFromUrl() {
    const help = getHelpRoute()
    setHelpRoute(help)
    if (!help) {
      setActiveKey(getKeyFromPath())
    }
  }

  function navigate(path) {
    if (path && window.location.pathname !== path) {
      window.history.pushState(null, '', path)
      syncRouteFromUrl()
    }
  }

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null)
      if (window.location.pathname !== '/' && window.location.pathname !== '/admin') {
        window.history.replaceState(null, '', '/admin')
      }
      setActiveKey('dashboard')
      setHelpRoute(null)
    }

    function handleAppInfoUpdated() {
      setAppName(getAppName())
    }

    window.addEventListener('popstate', syncRouteFromUrl)
    window.addEventListener(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized)
    window.addEventListener(APP_EVENTS.UPDATED, handleAppInfoUpdated)
    if (getToken()) {
      loadAppInfo().then((data) => {
        if (data) setAppName(getAppName())
      })
    }
    return () => {
      window.removeEventListener('popstate', syncRouteFromUrl)
      window.removeEventListener(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized)
      window.removeEventListener(APP_EVENTS.UPDATED, handleAppInfoUpdated)
    }
  }, [])

  function handleLogin(session) {
    setSession(session)
    setUser(session.admin)
    const key = getKeyFromPath()
    setActiveKey(key)
    setHelpRoute(null)
    navigate(ROUTE_PATHS[key])
    loadAppInfo().then((data) => {
      if (data) setAppName(getAppName())
    })
  }

  function handleLogout() {
    clearSession()
    setUser(null)
    setActiveKey('dashboard')
    setHelpRoute(null)
    navigate('/admin')
  }

  function handleNavigate(key) {
    setActiveKey(key)
    navigate(ROUTE_PATHS[key])
  }

  const pathname = window.location.pathname

  // Public help routes
  if (helpRoute) {
    return <HelpPageView key={helpRoute.slug} appName={appName} slug={helpRoute.slug} />
  }

  // Landing page at root
  if (pathname === '/') {
    return <Landing appName={appName} />
  }

  // Admin routes require authentication
  if (isAdminRoute()) {
    if (!user) {
      return <Login appName={appName} onLogin={handleLogin} />
    }

    const page = PAGES[activeKey] || PAGES.dashboard

    return (
      <AdminLayout
        title={page.title}
        activeKey={activeKey}
        paths={ROUTE_PATHS}
        appName={appName}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        admin={user}
      >
        {page.element}
      </AdminLayout>
    )
  }

  // Fallback to landing page for unknown routes
  return <Landing appName={appName} />
}

export default App