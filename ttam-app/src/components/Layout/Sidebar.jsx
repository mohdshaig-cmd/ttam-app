import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, CalendarDays, ClipboardList, Users, UserCheck,
  Trophy, BarChart2, CreditCard, FileText, Bell,
  Info, UserCog, Medal, Phone, ShieldCheck, User, LogOut, X, Megaphone,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const navSections = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: Home, label: 'Dashboard' },
      { to: '/booking', icon: CalendarDays, label: 'Book a Table' },
      { to: '/my-bookings', icon: ClipboardList, label: 'My Bookings' },
    ],
  },
  {
    label: 'Community',
    items: [
      { to: '/members', icon: Users, label: 'Members' },
      { to: '/guests', icon: UserCheck, label: 'Guests' },
      { to: '/tournaments', icon: Trophy, label: 'Tournaments' },
      { to: '/rankings', icon: BarChart2, label: 'Rankings' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/payments', icon: CreditCard, label: 'Payments' },
      { to: '/invoices', icon: FileText, label: 'Invoices' },
    ],
  },
  {
    label: 'Info',
    items: [
      { to: '/announcements', icon: Megaphone, label: 'Announcements' },
      { to: '/about', icon: Info, label: 'About TTAM' },
      { to: '/exco', icon: UserCog, label: 'Exco Members' },
      { to: '/champions', icon: Medal, label: 'Champions' },
      { to: '/notifications', icon: Bell, label: 'Notifications' },
      { to: '/contact', icon: Phone, label: 'Contact Us' },
    ],
  },
]

const adminNav = {
  label: 'Admin',
  items: [
    { to: '/admin', icon: ShieldCheck, label: 'Admin Panel' },
  ],
}

const accountNav = {
  label: 'Account',
  items: [
    { to: '/profile', icon: User, label: 'My Profile' },
  ],
}

export default function Sidebar({ open, onClose }) {
  const { isAdmin, signOut, profile } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
      toast.success('Signed out successfully')
    } catch {
      toast.error('Sign out failed')
    }
  }

  const linkStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: 8,
    cursor: 'pointer', fontSize: 14, fontWeight: isActive ? 600 : 500,
    textDecoration: 'none', border: 'none', background: 'none',
    width: '100%', textAlign: 'left', transition: 'all 0.15s',
    color: isActive ? '#0f4a0f' : '#5a5a5a',
    backgroundColor: isActive ? '#e8f5e8' : 'transparent',
  })

  const allSections = [...navSections, ...(isAdmin ? [adminNav] : []), accountNav]

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 98, display: 'none' }}
          className="sidebar-overlay"
        />
      )}

      <nav style={{
        width: 240, flexShrink: 0, background: '#fff',
        borderRight: '1px solid rgba(0,0,0,0.08)',
        height: 'calc(100vh - 64px)',
        position: 'sticky', top: 64, overflowY: 'auto',
        padding: '1.25rem 0.75rem',
        display: 'flex', flexDirection: 'column', gap: '0.25rem',
      }} className={`sidebar ${open ? 'sidebar-open' : ''}`}>

        {/* Mobile close */}
        <div style={{ display: 'none', justifyContent: 'flex-end', marginBottom: '0.5rem' }} className="sidebar-close-row">
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Member info mini */}
        {profile && (
          <div style={{ padding: '0.75rem', background: '#e8f5e8', borderRadius: 10, marginBottom: '0.75rem' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f4a0f' }}>{profile.full_name}</div>
            <div style={{ fontSize: 11, color: '#5a5a5a', marginTop: 2 }}>
              {profile.member_id} · {profile.membership_type}
            </div>
          </div>
        )}

        {allSections.map(section => (
          <div key={section.label}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#9a9a9a', padding: '0.75rem 0.75rem 0.25rem' }}>
              {section.label}
            </div>
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                style={({ isActive }) => linkStyle(isActive)}
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}

        <div style={{ flex: 1 }} />

        {/* Sign out */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
          <button
            onClick={handleSignOut}
            style={{ ...linkStyle(false), width: '100%', color: '#c62828' }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            position: fixed !important;
            top: 64px !important;
            left: 0 !important;
            bottom: 0 !important;
            z-index: 99 !important;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            box-shadow: 4px 0 20px rgba(0,0,0,0.1);
          }
          .sidebar.sidebar-open {
            transform: translateX(0) !important;
          }
          .sidebar-overlay { display: block !important; }
          .sidebar-close-row { display: flex !important; }
        }
      `}</style>
    </>
  )
}
