import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Input, Button, Alert } from '../../components/UI'
import toast from 'react-hot-toast'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(form.email, form.password)
      navigate('/dashboard')
      toast.success('Welcome back!')
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f4a0f 0%, #1a6b1a 60%, #2d8a2d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 64, height: 64, background: '#0f4a0f', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <svg viewBox="0 0 40 40" width="36" height="36" fill="none">
              <circle cx="20" cy="8" r="5" fill="#fff" />
              <rect x="17" y="13" width="6" height="4" fill="#fff" />
              <rect x="6" y="17" width="28" height="5" rx="1" fill="#fff" />
              <rect x="17" y="22" width="6" height="12" fill="#fff" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#0f4a0f', letterSpacing: '-0.5px' }}>TTAM</h1>
          <p style={{ color: '#6b6b6b', fontSize: 13, marginTop: 4 }}>Table Tennis Association of Maldives</p>
        </div>

        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem', textAlign: 'center' }}>Sign in to your account</h2>

        {error && <Alert variant="error" style={{ marginBottom: '1rem' }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
          />
          <div style={{ textAlign: 'right', marginTop: -16, marginBottom: '1.25rem' }}>
            <a href="#" style={{ fontSize: 13, color: '#1a6b1a', textDecoration: 'none' }}>Forgot password?</a>
          </div>
          <Button type="submit" fullWidth disabled={loading} style={{ marginBottom: '1rem' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#6b6b6b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#1a6b1a', fontWeight: 600, textDecoration: 'none' }}>Register</Link>
        </p>

        {/* Demo hint */}
        <div style={{ marginTop: '1.5rem', padding: '10px 14px', background: '#e8f5e8', borderRadius: 8, fontSize: 12, color: '#2e7d32' }}>
          <strong>Demo:</strong> admin@ttam.mv / password123
        </div>
      </div>
    </div>
  )
}
