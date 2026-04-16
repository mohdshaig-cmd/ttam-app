import { Bell, Settings, Menu, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { useNavigate, Link } from 'react-router-dom'
import { Avatar } from '../UI'

export default function TopNav({ onMenuClick }) {
  const { profile, initials } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 64,
      background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)',
      display: 'flex', alignItems: 'center', padding: '0 1.5rem',
      gap: '1rem', zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        style={{ display: 'none', background: 'none', border: 'none', padding: 8, cursor: 'pointer', color: '#1a1a1a' }}
        className="mobile-menu-btn"
      >
        <Menu size={22} />
      </button>

      {/* Logo */}
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{
          width: 36, height: 36, background: '#0f4a0f',
          borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <svg viewBox="0 0 40 40" width="24" height="24" fill="none">
            <circle cx="20" cy="8" r="5" fill="#fff" />
            <rect x="17" y="13" width="6" height="4" fill="#fff" />
            <rect x="6" y="17" width="28" height="5" rx="1" fill="#fff" />
            <rect x="17" y="22" width="6" height="12" fill="#fff" />
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1rem', color: '#0f4a0f', letterSpacing: '-0.3px' }}>TTAM</div>
          <div style={{ fontSize: '0.6rem', color: '#6b6b6b', fontWeight: 400 }}>Table Tennis Association of Maldives</div>
        </div>
      </Link>

      <div style={{ flex: 1 }} />

      {/* Notifications */}
      <button
        onClick={() => navigate('/notifications')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: '#6b6b6b', position: 'relative', display: 'flex' }}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 5, right: 5,
            width: 8, height: 8, background: '#e53935',
            borderRadius: '50%', border: '2px solid #fff',
          }} />
        )}
      </button>

      {/* Settings */}
      <button
        onClick={() => navigate('/settings')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: '#6b6b6b', display: 'flex' }}
        title="Settings"
      >
        <Settings size={20} />
      </button>

      {/* Profile */}
      <button
        onClick={() => navigate('/profile')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        title={profile?.full_name || 'Profile'}
      >
        <Avatar initials={initials} size={34} />
      </button>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}
