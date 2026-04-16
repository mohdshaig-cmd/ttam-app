import { MapPin, Users, Trophy, Calendar } from 'lucide-react'
import { ProgressBar, Badge, Button } from '../UI'

const typeColors = {
  national:      '#0f4a0f',
  'inter-island':'#1565c0',
  juniors:       '#6a1b9a',
  open:          '#e65100',
  international: '#b71c1c',
}

const statusBadge = {
  upcoming:     { variant: 'blue', label: 'Coming Soon' },
  registration: { variant: 'green', label: 'Open' },
  ongoing:      { variant: 'yellow', label: 'Live' },
  completed:    { variant: 'gray', label: 'Completed' },
}

export function TournamentCard({ tournament, onRegister, onDetails, registered }) {
  const color = typeColors[tournament.type] || '#0f4a0f'
  const status = statusBadge[tournament.status] || statusBadge.upcoming
  const regCount = tournament.registration_count || 0
  const maxReg = tournament.max_participants || 1
  const pct = Math.min(100, Math.round((regCount / maxReg) * 100))
  const canRegister = tournament.status === 'registration' && !registered

  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s' }}>
      {/* Header */}
      <div style={{ background: color, padding: '1.25rem', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1rem', fontWeight: 600 }}>{tournament.name}</h3>
            <p style={{ fontSize: 12, opacity: 0.8, marginTop: 4, textTransform: 'capitalize' }}>{tournament.type?.replace('-', ' ')} Championship</p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: 13, color: '#6b6b6b', marginBottom: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={14} />{tournament.start_date} – {tournament.end_date}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={14} />{tournament.venue}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: 13, color: '#6b6b6b', marginBottom: '1rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Users size={14} />{tournament.max_participants} players max</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Trophy size={14} />{tournament.category || 'Open singles'}</span>
        </div>
        {/* Registration progress */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b6b6b', marginBottom: 4 }}>
            <span>Registrations</span>
            <span>{regCount}/{maxReg}</span>
          </div>
          <ProgressBar value={regCount} max={maxReg} />
        </div>
        {/* Prize pool */}
        {tournament.prize_pool && (
          <div style={{ background: '#fffde7', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#f57f17', marginBottom: '1rem', fontWeight: 500 }}>
            🏆 Prize Pool: {tournament.prize_pool}
          </div>
        )}
        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          {registered ? (
            <div style={{ flex: 1, textAlign: 'center', padding: '9px', background: '#e8f5e9', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#2e7d32' }}>
              ✓ Registered
            </div>
          ) : canRegister ? (
            <Button style={{ flex: 1 }} onClick={() => onRegister?.(tournament)}>Register Now</Button>
          ) : (
            <Button style={{ flex: 1 }} variant="ghost" onClick={() => {}}>Notify Me</Button>
          )}
          <Button variant="outline" onClick={() => onDetails?.(tournament)}>Details</Button>
        </div>
      </div>
    </div>
  )
}

/* ── WinnerPodium ───────────────────────────────────────── */
export function WinnerPodium({ first, second, third }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, padding: '2rem 0' }}>
      {/* 2nd */}
      {second && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.2rem', marginBottom: 8 }}>{second.player_name}</div>
          <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 8 }}>{second.tournament_name}</div>
          <div style={{ height: 90, width: 90, borderRadius: '8px 8px 0 0', background: 'linear-gradient(135deg, #cfd8dc, #90a4ae)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 12, color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.8rem' }}>2</div>
        </div>
      )}
      {/* 1st */}
      {first && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 4 }}>👑</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.3rem', marginBottom: 6 }}>{first.player_name}</div>
          <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 8 }}>{first.tournament_name}</div>
          <div style={{ height: 120, width: 100, borderRadius: '8px 8px 0 0', background: 'linear-gradient(135deg, #ffd700, #ffab00)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 12, color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '2rem', boxShadow: '0 4px 20px rgba(255,193,7,0.4)' }}>1</div>
        </div>
      )}
      {/* 3rd */}
      {third && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.2rem', marginBottom: 8 }}>{third.player_name}</div>
          <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 8 }}>{third.tournament_name}</div>
          <div style={{ height: 70, width: 90, borderRadius: '8px 8px 0 0', background: 'linear-gradient(135deg, #cd7f32, #a05a2c)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 12, color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.5rem' }}>3</div>
        </div>
      )}
    </div>
  )
}
