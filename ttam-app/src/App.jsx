import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth.jsx'
import Layout from './components/Layout/Layout'
import { Spinner } from './components/UI'
import SetupBanner from './components/UI/SetupBanner'

// Auth pages
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'

// App pages
import Dashboard from './pages/Dashboard'
import Booking from './pages/Booking'
import Announcements from './pages/Announcements'
import { MyBookings, Members, Guests, Rankings } from './pages/MembersPages'
import { Payments, Invoices } from './pages/PaymentPages'
import { Tournaments, Notifications, About, Exco, Champions, Contact } from './pages/InfoPages'
import { AdminPanel, Profile, Settings } from './pages/AdminPages'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f7f9f7' }}>
      <Spinner size={40} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireGuest({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f4a0f' }}>
      <Spinner size={40} />
    </div>
  )
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <>
      {/* Shows setup guide if Supabase env vars are missing */}
      <SetupBanner />

      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: "'DM Sans', sans-serif", fontSize: 14, borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
          success: { iconTheme: { primary: '#1a6b1a', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#c62828', secondary: '#fff' } },
          duration: 4000,
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/login"    element={<RequireGuest><Login /></RequireGuest>} />
        <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />
        <Route path="/"         element={<Navigate to="/dashboard" replace />} />

        {/* Protected – inside Layout */}
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="dashboard"      element={<Dashboard />} />
          <Route path="booking"        element={<Booking />} />
          <Route path="my-bookings"    element={<MyBookings />} />
          <Route path="members"        element={<Members />} />
          <Route path="guests"         element={<Guests />} />
          <Route path="tournaments"    element={<Tournaments />} />
          <Route path="rankings"       element={<Rankings />} />
          <Route path="payments"       element={<Payments />} />
          <Route path="invoices"       element={<Invoices />} />
          <Route path="notifications"  element={<Notifications />} />
          <Route path="announcements"  element={<Announcements />} />
          <Route path="about"          element={<About />} />
          <Route path="exco"           element={<Exco />} />
          <Route path="champions"      element={<Champions />} />
          <Route path="contact"        element={<Contact />} />
          <Route path="admin"          element={<AdminPanel />} />
          <Route path="profile"        element={<Profile />} />
          <Route path="settings"       element={<Settings />} />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}
