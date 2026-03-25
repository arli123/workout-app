import { useState, useEffect } from 'react'
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
  inviteBadge: {
    background: 'rgba(124,131,253,0.12)',
    border: '1px solid rgba(124,131,253,0.3)',
    color: '#7c83fd',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '20px',
    textAlign: 'center',
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
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [inviteToken, setInviteToken] = useState(null)
  const [inviteValid, setInviteValid] = useState(null) // null=checking, true, false

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('invite')
    if (token) {
      setInviteToken(token)
      setMode('register')
      validateInvite(token)
    }
  }, [])

  async function validateInvite(token) {
    const { data } = await supabase.from('invites').select('token, used_by').eq('token', token).single()
    if (data && !data.used_by) {
      setInviteValid(true)
    } else {
      setInviteValid(false)
    }
  }

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
    if (!inviteToken || !inviteValid) { setError('נדרש קישור הזמנה תקף להרשמה'); return }
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

    if (data?.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        is_approved: false,
        is_admin: false,
      })
      await supabase.from('invites').update({ used_by: data.user.id }).eq('token', inviteToken)
    }

    setLoading(false)
    setSuccess('החשבון נוצר! ממתין לאישור המנהל.')
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

        {inviteToken && mode === 'register' && (
          <div style={S.inviteBadge}>
            {inviteValid === null ? '🔄 בודק קישור הזמנה...' :
             inviteValid ? '✅ קישור הזמנה תקף' :
             '❌ קישור הזמנה לא תקף או כבר נוצל'}
          </div>
        )}

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

        {mode === 'register' && !inviteToken && (
          <p style={S.registerNote}>
            הרשמה אפשרית רק עם קישור הזמנה מהמנהל
          </p>
        )}
        {mode === 'register' && inviteToken && inviteValid && (
          <p style={S.registerNote}>
            לאחר ההרשמה תצטרך לחכות לאישור המנהל
          </p>
        )}
      </div>
    </div>
  )
}
