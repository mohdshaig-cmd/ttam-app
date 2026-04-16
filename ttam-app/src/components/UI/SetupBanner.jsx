/**
 * SetupBanner — shown when VITE_SUPABASE_URL is not configured.
 * Renders a clear guide inside the app instead of a crash/blank screen.
 */
export default function SetupBanner() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (url && key && url !== 'https://placeholder.supabase.co') return null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0f4a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', zIndex: 9999, fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '2.5rem',
        maxWidth: 540, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: 56, height: 56, background: '#0f4a0f', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
            <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
              <circle cx="20" cy="8" r="5" fill="#fff"/>
              <rect x="17" y="13" width="6" height="4" fill="#fff"/>
              <rect x="6" y="17" width="28" height="5" rx="1" fill="#fff"/>
              <rect x="17" y="22" width="6" height="12" fill="#fff"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.3rem', fontWeight: 700, color: '#0f4a0f' }}>
            TTAM Setup Required
          </h2>
          <p style={{ color: '#6b6b6b', fontSize: 13, marginTop: 4 }}>
            Add your Supabase keys to get started
          </p>
        </div>

        {/* Steps */}
        {[
          {
            n: '1',
            title: 'Create a Supabase project',
            body: <>Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: '#1a6b1a', fontWeight: 600 }}>supabase.com</a> → New Project → choose Singapore region</>,
          },
          {
            n: '2',
            title: 'Run the database migration',
            body: 'In Supabase → SQL Editor → paste the contents of supabase/migrations/001_initial.sql → Run',
          },
          {
            n: '3',
            title: 'Add your keys to .env',
            body: null,
            code: `# In your Codespaces terminal:\ncp .env.example .env\n\n# Then open .env and set:\nVITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJhbGci...`,
          },
          {
            n: '4',
            title: 'Restart the dev server',
            code: 'npm run dev',
          },
        ].map(step => (
          <div key={step.n} style={{ display: 'flex', gap: 14, marginBottom: '1.25rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a6b1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 1 }}>
              {step.n}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{step.title}</div>
              {step.body && <div style={{ fontSize: 13, color: '#5a5a5a', lineHeight: 1.6 }}>{step.body}</div>}
              {step.code && (
                <pre style={{ background: '#1a1a1a', color: '#a8ff78', borderRadius: 8, padding: '10px 14px', fontSize: 12, marginTop: 6, overflowX: 'auto', lineHeight: 1.7 }}>
                  {step.code}
                </pre>
              )}
            </div>
          </div>
        ))}

        <div style={{ background: '#e8f5e8', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#2e7d32', marginTop: '0.5rem' }}>
          📖 See <strong>INSTALLATION_GUIDE.md</strong> in your project folder for the full setup walkthrough.
        </div>
      </div>
    </div>
  )
}
