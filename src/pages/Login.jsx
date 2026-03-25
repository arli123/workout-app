import { useState } from 'react'
import { supabase } from '../supabase'

const S = {
  page: {
    minHeight: '100vh',
    background: '#0f0f1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    direction: 'rtl',
  },
  card: {
    background: 'rgba(26, 26, 46, 0.9)',
    border: '1px solid rgba(124, 131, 253, 0.25)',
    borderRadius: '20px',
    padding: '40px 32px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(12px)',
  },
  logo: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoIcon: {
    fontSize: '52px',
    display: 'block',
    marginBottom: '10px',
  },
  logoTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#7c83fd',
    letterSpacing: '-0.5px',
  },
  logoSub: {
    fontSize: '13px',
    color: '#a0a0c0',
    marginTop: '4px',
  },
  tabs: {
    display: 'flex',
    background: 'rgba(15,15,26,0.6)',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '28px',
    gap: '4px',
  },
  tab: (active) => ({
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    background: active ? '#7c83fd' : 'transparent',
    color: active ? '#fff' : '#a0a0c0',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#a0a0c0',
    marginBottom: '6px',
    fontWeight: 500,
  },
  input: {
    width: '100%',
    background: 'rgba(15,15,26,0.7)',
    border: '1px solid rgba(124,131,253,0.25)',
    borderRadius: '10px',
    padding: '12px 14px',
    color: '#e0e0ff',
    fontSize: '15px',
    transition: 'border-color 0.2s',
    direction: 'ltr',
    textAlign: 'right',
  },
  btn: {
    width: '100%',
    padding: '13px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #7c83fd, #a78bfa)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    marginTop: '8px',
    boxShadow: '0 4px 16px rgba(124,131,253,0.35)',
    transition: 'opacity 0.2s, transform 0.1s',
    letterSpacing: '0.3px',
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    background: 'rgba(248,113,113,0.12)',
    border: '1px solid rgba(248,113,113,0.3)',
    color: '#f87171',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '13px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  success: {
    background: 'rgba(74,222,128,0.12)',
    border: '1px solid rgba(74,222,128,0.3)',
    color: '#4ade80',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '13px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  divider: {
    textAlign: 'center',
    color: '#a0a0c0',
    fontSize: '12px',
    margin: '20px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(124,131,253,0.2)',
  },
  registerNote: {
    fontSize: '12px',
    color: '#a0a0c0',
    textAlign: 'center',
    marginTop: '14px',
    lineHeight: 1.6,
  },
}

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!email || !password) { setError('נא למלא אימייל וסיסמה'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      if (error.message.includes('Invalid login')) setError('אימייל או סיסמה שגויים')
      else setError(error.message)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!email || !password) { setError('נא למלא אימייל וסיסמה'); return }
    if (password.length < 6) { setError('הסיסמה חייבת להכיל לפחות 6 תווים'); return }
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setLoading(false)
      if (signUpError.message.includes('already registered')) setError('האימייל הזה כבר רשום במערכת')
      else setError(signUpError.message)
      return
    }

    // Create profile with is_approved=false
    if (data?.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        is_approved: false,
        is_admin: false,
      })
    }

    setLoading(false)
    setSuccess('החשבון נוצר! ממתין לאישור מנהל.')
    setMode('login')
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <span style={S.logoIcon}>🏋️</span>
          <div style={S.logoTitle}>יומן אימונים</div>
          <div style={S.logoSub}>עקוב אחר האימונים שלך</div>
        </div>

        <div style={S.tabs}>
          <button style={S.tab(mode === 'login')} onClick={() => { setMode('login'); setError(''); setSuccess('') }}>
            התחברות
          </button>
          <button style={S.tab(mode === 'register')} onClick={() => { setMode('register'); setError(''); setSuccess('') }}>
            הרשמה
          </button>
        </div>

        {error && <div style={S.error}>{error}</div>}
        {success && <div style={S.success}>{success}</div>}

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          <div style={S.field}>
            <label style={S.label}>אימייל</label>
            <input
              style={S.input}
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              dir="ltr"
            />
          </div>
          <div style={S.field}>
            <label style={S.label}>סיסמה</label>
            <input
              style={S.input}
              type="password"
              placeholder={mode === 'register' ? 'מינימום 6 תווים' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            style={{ ...S.btn, ...(loading ? S.btnDisabled : {}) }}
            disabled={loading}
          >
            {loading ? '...' : mode === 'login' ? 'התחבר' : 'צור חשבון'}
          </button>
        </form>

        {mode === 'register' && (
          <p style={S.registerNote}>
            לאחר ההרשמה תצטרך לחכות לאישור המנהל<br />
            לפני שתוכל להיכנס לאפליקציה
          </p>
        )}
      </div>
    </div>
  )
}
