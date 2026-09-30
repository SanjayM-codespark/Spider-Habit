import { useEffect, useState } from 'react'
import AdminLayout from './components/layout/AdminLayout'
import AddSubscription from './pages/AddSubscription'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import ManageSubscription from './pages/ManageSubscription'
import Placeholder from './pages/Placeholder'
import Users from './pages/Users'
import GeneralSettings from './pages/GeneralSettings'
import PaymentSettings from './pages/PaymentSettings'
import HelpPageEditor from './pages/HelpPageEditor'
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

const PAGES = {
  dashboard: { title: 'Dashboard', element: <Dashboard /> },
  users: { title: 'Users', element: <Users /> },
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
  'privacy-policy': {
    title: 'Privacy Policy',
    element: <HelpPageEditor slug="privacy_policy" label="Privacy Policy" />,
  },
  'terms-conditions': {
    title: 'Terms & Conditions',
    element: <HelpPageEditor slug="terms_conditions" label="Terms & Conditions" />,
  },
  'contact-us': {
    title: 'Contact Us',
    element: <HelpPageEditor slug="contact_us" label="Contact Us" />,
  },
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
  dashboard: '/dashboard',
  users: '/users',
  'add-subscription': '/subscriptions/add',
  'manage-subscription': '/subscriptions/manage',
  transactions: '/transactions',
  'privacy-policy': '/help/privacy-policy',
  'terms-conditions': '/help/terms-conditions',
  'contact-us': '/help/contact-us',
  'general-settings': '/settings/general',
  'payment-settings': '/settings/payment',
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
      if (window.location.pathname !== '/') {
        window.history.replaceState(null, '', '/')
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
    navigate('/')
  }

  function handleNavigate(key) {
    setActiveKey(key)
    navigate(ROUTE_PATHS[key])
  }

  if (helpRoute) {
    return <HelpPageView key={helpRoute.slug} appName={appName} slug={helpRoute.slug} />
  }

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

export default App