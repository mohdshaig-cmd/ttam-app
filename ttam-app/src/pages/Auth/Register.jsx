import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Input, Select, Button, Alert } from '../../components/UI'
import toast from 'react-hot-toast'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm: '',
    phone: '', national_id: '', date_of_birth: '',
    membership_type: 'senior', role: 'member',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setError(''); setLoading(true)
    try {
      await signUp(form.email, form.password, {
        full_name: form.full_name, phone: form.phone,
        national_id: form.national_id, date_of_birth: form.date_of_birth,
        membership_type: form.membership_type, role: form.role,
      })
      toast.success('Account created! Please check your email to verify.')
      navigate('/login')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f4a0f, #2d8a2d)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', maxWidth: 540, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#0f4a0f' }}>Join TTAM</h1>
          <p style={{ color: '#6b6b6b', fontSize: 13 }}>Create your member account</p>
        </div>

        {error && <Alert variant="error" style={{ marginBottom: '1rem' }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Input label="Full Name" placeholder="Ahmed Hassan" value={form.full_name} onChange={set('full_name')} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            <Input label="Phone" placeholder="+960 777 xxxx" value={form.phone} onChange={set('phone')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="National ID" placeholder="A123456" value={form.national_id} onChange={set('national_id')} />
            <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select label="Membership Type" value={form.membership_type} onChange={set('membership_type')}>
              <option value="junior">Junior (Under 18)</option>
              <option value="senior">Senior</option>
              <option value="elite">Elite</option>
            </Select>
            <Select label="Account Type" value={form.role} onChange={set('role')}>
              <option value="member">Member</option>
              <option value="guest">Guest</option>
            </Select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Password" type="password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} required />
            <Input label="Confirm Password" type="password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} required />
          </div>
          <Button type="submit" fullWidth disabled={loading} style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#6b6b6b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#1a6b1a', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
