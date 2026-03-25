import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const S = {
  page: {
    minHeight: '100vh',
    background: '#0f0f1a',
    direction: 'rtl',
    padding: '0 0 40px',
  },
  header: {
    background: 'rgba(26,26,46,0.95)',
    borderBottom: '1px solid rgba(124,131,253,0.2)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backdropFilter: 'blur(12px)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    background: 'rgba(124,131,253,0.15)',
    color: '#7c83fd',
    border: '1px solid rgba(124,131,253,0.3)',
    borderRadius: 9,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#e0e0ff',
  },
  logoutBtn: {
    background: 'rgba(248,113,113,0.12)',
    color: '#f87171',
    border: '1px solid rgba(248,113,113,0.25)',
    borderRadius: 9,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  content: {
    maxWidth: 700,
    margin: '0 auto',
    padding: '24px 16px',
  },
  statsRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
  },
  statCard: (color) => ({
    flex: 1,
    background: 'rgba(26,26,46,0.8)',
    border: `1px solid ${color}33`,
    borderRadius: 14,
    padding: '16px',
    textAlign: 'center',
  }),
  statNum: (color) => ({
    fontSize: 28,
    fontWeight: 800,
    color,
    display: 'block',
  }),
  statLabel: {
    fontSize: 12,
    color: '#a0a0c0',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#a0a0c0',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  userCard: (approved) => ({
    background: 'rgba(26,26,46,0.8)',
    border: `1px solid ${approved ? 'rgba(74,222,128,0.2)' : 'rgba(124,131,253,0.2)'}`,
    borderRadius: 14,
    padding: '14px 16px',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  }),
  userLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  avatar: (approved) => ({
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: approved ? 'rgba(74,222,128,0.15)' : 'rgba(124,131,253,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    flexShrink: 0,
    border: `1px solid ${approved ? 'rgba(74,222,128,0.3)' : 'rgba(124,131,253,0.3)'}`,
  }),
  userEmail: {
    fontSize: 14,
    color: '#e0e0ff',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userDate: {
    fontSize: 11,
    color: '#a0a0c0',
    marginTop: 2,
  },
  badge: (approved) => ({
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 6,
    background: approved ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)',
    color: approved ? '#4ade80' : '#fbbf24',
    border: `1px solid ${approved ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}`,
    whiteSpace: 'nowrap',
  }),
  approveBtn: {
    background: 'rgba(74,222,128,0.15)',
    color: '#4ade80',
    border: '1px solid rgba(74,222,128,0.3)',
    borderRadius: 8,
    padding: '7px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  revokeBtn: {
    background: 'rgba(248,113,113,0.12)',
    color: '#f87171',
    border: '1px solid rgba(248,113,113,0.25)',
    borderRadius: 8,
    padding: '7px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  adminToggleBtn: (isAdmin) => ({
    background: isAdmin ? 'rgba(167,139,250,0.15)' : 'transparent',
    color: isAdmin ? '#a78bfa' : '#a0a0c0',
    border: `1px solid ${isAdmin ? 'rgba(167,139,250,0.3)' : 'rgba(124,131,253,0.15)'}`,
    borderRadius: 8,
    padding: '7px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }),
  actionsRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  loading: {
    textAlign: 'center',
    color: '#a0a0c0',
    padding: '40px 0',
    fontSize: 15,
  },
  empty: {
    textAlign: 'center',
    color: '#a0a0c0',
    padding: '24px 0',
    fontSize: 14,
  },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function Admin({ profile, onBack, onLogout }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setUsers(data || [])
    setLoading(false)
  }

  async function toggleApproval(user) {
    setActionLoading(p => ({ ...p, [user.id + '_approve']: true }))
    const newVal = !user.is_approved
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: newVal })
      .eq('id', user.id)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_approved: newVal } : u))
    }
    setActionLoading(p => ({ ...p, [user.id + '_approve']: false }))
  }

  async function toggleAdmin(user) {
    // Don't allow revoking own admin
    if (user.id === profile.id) return
    setActionLoading(p => ({ ...p, [user.id + '_admin']: true }))
    const newVal = !user.is_admin
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: newVal })
      .eq('id', user.id)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_admin: newVal } : u))
    }
    setActionLoading(p => ({ ...p, [user.id + '_admin']: false }))
  }

  const total = users.length
  const approved = users.filter(u => u.is_approved).length
  const pending = users.filter(u => !u.is_approved).length

  const pendingUsers = users.filter(u => !u.is_approved)
  const approvedUsers = users.filter(u => u.is_approved)

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.headerRight}>
          <button style={S.backBtn} onClick={onBack}>← חזור</button>
          <span style={S.title}>ניהול משתמשים</span>
        </div>
        <button style={S.logoutBtn} onClick={onLogout}>התנתק</button>
      </div>

      <div style={S.content}>
        <div style={S.statsRow}>
          <div style={S.statCard('#7c83fd')}>
            <span style={S.statNum('#7c83fd')}>{total}</span>
            <div style={S.statLabel}>סה״כ משתמשים</div>
          </div>
          <div style={S.statCard('#4ade80')}>
            <span style={S.statNum('#4ade80')}>{approved}</span>
            <div style={S.statLabel}>מאושרים</div>
          </div>
          <div style={S.statCard('#fbbf24')}>
            <span style={S.statNum('#fbbf24')}>{pending}</span>
            <div style={S.statLabel}>ממתינים</div>
          </div>
        </div>

        {loading ? (
          <div style={S.loading}>טוען משתמשים...</div>
        ) : (
          <>
            {pendingUsers.length > 0 && (
              <>
                <div style={S.sectionTitle}>
                  <span>⏳</span>
                  <span>ממתינים לאישור ({pendingUsers.length})</span>
                </div>
                {pendingUsers.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    currentUser={profile}
                    onApprove={() => toggleApproval(user)}
                    onToggleAdmin={() => toggleAdmin(user)}
                    actionLoading={actionLoading}
                  />
                ))}
              </>
            )}

            {approvedUsers.length > 0 && (
              <>
                <div style={{ ...S.sectionTitle, marginTop: pendingUsers.length > 0 ? 24 : 0 }}>
                  <span>✅</span>
                  <span>משתמשים מאושרים ({approvedUsers.length})</span>
                </div>
                {approvedUsers.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    currentUser={profile}
                    onApprove={() => toggleApproval(user)}
                    onToggleAdmin={() => toggleAdmin(user)}
                    actionLoading={actionLoading}
                  />
                ))}
              </>
            )}

            {users.length === 0 && (
              <div style={S.empty}>אין משתמשים עדיין</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function UserRow({ user, currentUser, onApprove, onToggleAdmin, actionLoading }) {
  const isCurrentUser = user.id === currentUser.id
  const approvingKey = user.id + '_approve'
  const adminKey = user.id + '_admin'

  return (
    <div style={S.userCard(user.is_approved)}>
      <div style={S.userLeft}>
        <div style={S.avatar(user.is_approved)}>
          {user.is_admin ? '👑' : user.is_approved ? '✅' : '⏳'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={S.userEmail}>
            {user.email}
            {isCurrentUser && <span style={{ fontSize: 11, color: '#7c83fd', marginRight: 6 }}>(אתה)</span>}
          </div>
          <div style={S.userDate}>{formatDate(user.created_at)}</div>
        </div>
      </div>

      <div style={S.actionsRow}>
        <span style={S.badge(user.is_approved)}>
          {user.is_approved ? 'מאושר' : 'ממתין'}
        </span>

        <button
          style={S.adminToggleBtn(user.is_admin)}
          onClick={onToggleAdmin}
          disabled={actionLoading[adminKey] || isCurrentUser}
          title={isCurrentUser ? 'לא ניתן לשנות את עצמך' : ''}
        >
          {actionLoading[adminKey] ? '...' : user.is_admin ? '👑 מנהל' : 'מנהל'}
        </button>

        <button
          style={user.is_approved ? S.revokeBtn : S.approveBtn}
          onClick={onApprove}
          disabled={actionLoading[approvingKey] || isCurrentUser}
        >
          {actionLoading[approvingKey] ? '...' : user.is_approved ? 'בטל אישור' : 'אשר'}
        </button>
      </div>
    </div>
  )
}
