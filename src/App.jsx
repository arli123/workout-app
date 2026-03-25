import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Admin from './pages/Admin'
import WorkoutApp from './pages/WorkoutApp'

const styles = {
  waiting: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f0f1a',
    color: '#e0e0ff',
    gap: 24,
    padding: 24,
    textAlign: 'center',
  },
  waitingIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#7c83fd',
    marginBottom: 8,
  },
  waitingText: {
    fontSize: 15,
    color: '#a0a0c0',
    maxWidth: 320,
    lineHeight: 1.7,
  },
  logoutBtn: {
    marginTop: 24,
    background: 'rgba(248,113,113,0.15)',
    color: '#f87171',
    border: '1px solid rgba(248,113,113,0.3)',
    borderRadius: 10,
    padding: '10px 28px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f0f1a',
    color: '#7c83fd',
    fontSize: 18,
    gap: 12,
  },
  spinner: {
    width: 28,
    height: 28,
    border: '3px solid rgba(124,131,253,0.2)',
    borderTop: '3px solid #7c83fd',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}

// Inject spinner keyframes
const styleTag = document.createElement('style')
styleTag.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`
document.head.appendChild(styleTag)

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('app') // 'app' | 'admin'

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
        setView('app')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Profile fetch error:', error)
      // Profile might not exist yet — create it
      if (error.code === 'PGRST116') {
        const { data: { user } } = await supabase.auth.getUser()
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({ id: userId, email: user.email, is_approved: false, is_admin: false })
          .select()
          .single()
        setProfile(newProfile)
      }
    } else {
      setProfile(data)
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  // Refresh profile from outside (passed to children)
  async function refreshProfile() {
    if (session) await fetchProfile(session.user.id)
  }

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner} />
        <span>טוען...</span>
      </div>
    )
  }

  // Not logged in
  if (!session) {
    return <Login />
  }

  // Logged in but no profile or not approved
  if (!profile || !profile.is_approved) {
    return (
      <div style={styles.waiting}>
        <div style={styles.waitingIcon}>⏳</div>
        <div style={styles.waitingTitle}>ממתין לאישור</div>
        <div style={styles.waitingText}>
          החשבון שלך נוצר בהצלחה ומחכה לאישור מנהל.<br />
          תקבל גישה לאפליקציה לאחר שהמנהל יאשר את חשבונך.
        </div>
        <div style={{ ...styles.waitingText, marginTop: 8, color: '#7c83fd' }}>
          {profile?.email}
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          התנתק
        </button>
      </div>
    )
  }

  // Admin view
  if (view === 'admin' && profile.is_admin) {
    return (
      <Admin
        profile={profile}
        onBack={() => setView('app')}
        onLogout={handleLogout}
      />
    )
  }

  // Main app
  return (
    <WorkoutApp
      session={session}
      profile={profile}
      onNavigateAdmin={() => setView('admin')}
      onLogout={handleLogout}
      refreshProfile={refreshProfile}
    />
  )
}
