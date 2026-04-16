import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopNav onMenuClick={() => setSidebarOpen(o => !o)} />
      <div style={{ display: 'flex', paddingTop: 64 }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main
          className="main-content-area"
          style={{ flex: 1, padding: '2rem', maxWidth: 1200, minWidth: 0 }}
        >
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <style>{`
        @media (max-width: 768px) {
          .main-content-area { padding: 1rem !important; }
        }
      `}</style>
    </div>
  )
}
