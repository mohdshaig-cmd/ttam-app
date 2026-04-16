import { NavLink } from 'react-router-dom'
import { Home, CalendarDays, ClipboardList, Bell, User } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'

const tabs = [
  { to: '/dashboard',    icon: Home,          label: 'Home' },
  { to: '/booking',      icon: CalendarDays,  label: 'Book' },
  { to: '/my-bookings',  icon: ClipboardList, label: 'Bookings' },
  { to: '/notifications',icon: Bell,          label: 'Alerts' },
  { to: '/profile',      icon: User,          label: 'Profile' },
]

export default function MobileNav() {
  const { unreadCount } = useNotifications()

  return (
    <>
      {/* Bottom nav — mobile only */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 64,
        background: '#fff',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        display: 'none',
        alignItems: 'stretch',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }} className="mobile-bottom-nav">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              textDecoration: 'none',
              color: isActive ? '#1a6b1a' : '#9a9a9a',
              fontSize: 10,
              fontWeight: isActive ? 600 : 400,
              fontFamily: "'DM Sans', sans-serif",
              position: 'relative',
              paddingTop: 8,
              transition: 'color 0.15s',
              borderTop: isActive ? '2px solid #1a6b1a' : '2px solid transparent',
            })}
          >
            <div style={{ position: 'relative' }}>
              <tab.icon size={20} />
              {tab.to === '/notifications' && unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -6,
                  width: 14, height: 14, background: '#e53935',
                  borderRadius: '50%', fontSize: 8, fontWeight: 700,
                  color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: '1.5px solid #fff',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .mobile-bottom-nav { display: flex !important; }
          .main-content-area { padding-bottom: 72px !important; }
        }
      `}</style>
    </>
  )
}
