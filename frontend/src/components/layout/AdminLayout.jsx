import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'
import './AdminLayout.css'

function AdminLayout({ title, activeKey, paths, appName, onNavigate, onLogout, admin, children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleToggle() {
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    if (isMobile) {
      setMobileOpen((open) => !open)
    } else {
      setCollapsed((open) => !open)
    }
  }

  return (
    <div className="admin">
      <Sidebar
        activeKey={activeKey}
        paths={paths}
        appName={appName}
        onSelect={onNavigate}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onExpand={() => setCollapsed(false)}
      />
      <div className="admin__main">
        <Header
          title={title}
          onToggleSidebar={handleToggle}
          onLogout={onLogout}
          admin={admin}
        />
        <main className="admin__content">{children}</main>
        <Footer appName={appName} />
      </div>
    </div>
  )
}

export default AdminLayout