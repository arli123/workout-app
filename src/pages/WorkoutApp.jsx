import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../supabase'

// ─── Constants ─────────────────────────────────────────────────────────────────
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const DAY_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const MOODS = ['😴', '😐', '💪', '🔥']
const MOOD_LABELS = ['עייף', 'רגיל', 'טוב', 'מעולה']
const WORKOUT_TYPES = ['כוח', 'קרדיו', 'גמישות', 'HIIT', 'פונקציונלי', 'יוגה', 'מנוחה']
const MUSCLE_GROUPS = {
  shoulders: { label: 'כתפיים', emoji: '🏋️' },
  legs:      { label: 'רגליים', emoji: '🦵' },
  back:      { label: 'גב',      emoji: '🔙' },
  biceps:    { label: 'יד קדמית', emoji: '💪' },
  triceps:   { label: 'יד אחורית', emoji: '🤸' },
  abs:       { label: 'בטן',     emoji: '⚡' },
  chest:     { label: 'חזה',     emoji: '🫁' },
  glutes:    { label: 'ישבן',    emoji: '🍑' },
}
const MUSCLE_KEYS = Object.keys(MUSCLE_GROUPS)

function getWeekKey(date) {
  const d = new Date(date)
  const day = d.getDay()
  const sunday = new Date(d)
  sunday.setDate(d.getDate() - day)
  return sunday.toISOString().slice(0, 10)
}

function getWeekDates(weekKey) {
  const sunday = new Date(weekKey + 'T00:00:00')
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

function formatDateHe(date) {
  return new Date(date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

function emptyDay() {
  return {
    types: [],
    muscles: [],
    timeStart: '',
    timeEnd: '',
    duration: '',
    mood: null,
    exercises: [],
    notes: '',
  }
}

// ─── Styles ─────────────────────────────────────────────────────────────────────
const C = {
  accent: '#7c83fd',
  accent2: '#a78bfa',
  bg: '#0f0f1a',
  bg2: '#1a1a2e',
  bg3: '#16213e',
  text: '#e0e0ff',
  text2: '#a0a0c0',
  success: '#4ade80',
  danger: '#f87171',
  warning: '#fbbf24',
  border: 'rgba(124,131,253,0.22)',
  card: 'rgba(26,26,46,0.85)',
}

const base = {
  page: {
    minHeight: '100vh',
    background: C.bg,
    direction: 'rtl',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    background: 'rgba(26,26,46,0.97)',
    borderBottom: `1px solid ${C.border}`,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(16px)',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: C.text,
    flex: 1,
    textAlign: 'center',
  },
  iconBtn: {
    background: 'rgba(124,131,253,0.12)',
    border: `1px solid rgba(124,131,253,0.2)`,
    borderRadius: 10,
    color: C.accent,
    width: 38,
    height: 38,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    cursor: 'pointer',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 0 80px',
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(26,26,46,0.97)',
    borderTop: `1px solid ${C.border}`,
    display: 'flex',
    zIndex: 100,
    backdropFilter: 'blur(16px)',
  },
  navBtn: (active) => ({
    flex: 1,
    padding: '10px 4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    background: 'none',
    border: 'none',
    color: active ? C.accent : C.text2,
    fontSize: 18,
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    borderTop: active ? `2px solid ${C.accent}` : '2px solid transparent',
    transition: 'color 0.2s',
  }),
  navIcon: {
    fontSize: 20,
  },
  // Drawer
  drawerOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 200,
    backdropFilter: 'blur(3px)',
  },
  drawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 280,
    background: C.bg2,
    borderLeft: `1px solid ${C.border}`,
    zIndex: 201,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
  },
  drawerHeader: {
    padding: '24px 20px 16px',
    borderBottom: `1px solid ${C.border}`,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: C.accent,
    marginBottom: 4,
  },
  drawerEmail: {
    fontSize: 17,
    color: C.text2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  drawerItem: (danger) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 20px',
    color: danger ? C.danger : C.text,
    fontSize: 17,
    fontWeight: 500,
    cursor: 'pointer',
    borderBottom: `1px solid rgba(124,131,253,0.08)`,
    background: 'none',
    border: 'none',
    width: '100%',
    textAlign: 'right',
    borderBottom: `1px solid rgba(124,131,253,0.08)`,
    transition: 'background 0.15s',
  }),
  drawerItemIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
}

// ─── Sub-components ──────────────────────────────────────────────────────────────

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 20,
        fontSize: 18,
        fontWeight: 600,
        border: `1px solid ${active ? C.accent : C.border}`,
        background: active ? `rgba(124,131,253,0.2)` : 'transparent',
        color: active ? C.accent : C.text2,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function MuscleTag({ muscleKey, active, daysSince, onClick, editMode }) {
  const mg = MUSCLE_GROUPS[muscleKey]
  return (
    <button
      onClick={editMode ? onClick : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '9px 14px',
        borderRadius: 20,
        fontSize: 18,
        fontWeight: 600,
        border: `1px solid ${active ? C.accent : C.border}`,
        background: active ? `rgba(124,131,253,0.18)` : 'rgba(26,26,46,0.5)',
        color: active ? C.text : C.text2,
        cursor: editMode ? 'pointer' : 'default',
        transition: 'all 0.15s',
        position: 'relative',
      }}
    >
      <span>{mg.emoji}</span>
      <span>{mg.label}</span>
      {daysSince !== null && daysSince !== undefined && (
        <span style={{
          background: daysSince <= 2 ? 'rgba(248,113,113,0.2)' : daysSince <= 4 ? 'rgba(251,191,36,0.2)' : 'rgba(74,222,128,0.2)',
          color: daysSince <= 2 ? C.danger : daysSince <= 4 ? C.warning : C.success,
          border: `1px solid ${daysSince <= 2 ? 'rgba(248,113,113,0.4)' : daysSince <= 4 ? 'rgba(251,191,36,0.4)' : 'rgba(74,222,128,0.4)'}`,
          borderRadius: 10,
          padding: '1px 6px',
          fontSize: 17,
          fontWeight: 700,
        }}>
          {daysSince === 0 ? 'היום' : `${daysSince}י`}
        </span>
      )}
    </button>
  )
}

function ExerciseRow({ ex, index, editMode, onChange, onDelete }) {
  if (!editMode) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: 'rgba(26,26,46,0.5)',
        borderRadius: 10,
        marginBottom: 6,
        border: `1px solid ${C.border}`,
      }}>
        <span style={{ color: C.accent, fontWeight: 700, fontSize: 19, minWidth: 22 }}>{index + 1}.</span>
        <span style={{ flex: 1, fontSize: 19, color: C.text }}>{ex.name || '—'}</span>
        {ex.sets && <span style={{ fontSize: 17, color: C.text2 }}>{ex.sets} סטים</span>}
        {ex.reps && <span style={{ fontSize: 17, color: C.text2 }}>{ex.reps} חז׳</span>}
        {ex.weight && <span style={{ fontSize: 17, color: C.accent2 }}>{ex.weight} ק״ג</span>}
      </div>
    )
  }
  return (
    <div style={{
      background: 'rgba(26,26,46,0.6)',
      borderRadius: 12,
      padding: '12px',
      marginBottom: 8,
      border: `1px solid ${C.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ color: C.accent, fontWeight: 700, fontSize: 19, minWidth: 22 }}>{index + 1}.</span>
        <input
          value={ex.name}
          onChange={e => onChange({ ...ex, name: e.target.value })}
          placeholder="שם התרגיל"
          style={inputStyle({ flex: 1 })}
        />
        <button onClick={onDelete} style={{
          background: 'rgba(248,113,113,0.12)',
          border: '1px solid rgba(248,113,113,0.25)',
          color: C.danger,
          borderRadius: 8,
          width: 32,
          height: 32,
          fontSize: 19,
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={ex.sets}
          onChange={e => onChange({ ...ex, sets: e.target.value })}
          placeholder="סטים"
          type="number"
          min="0"
          style={inputStyle({ flex: 1 })}
        />
        <input
          value={ex.reps}
          onChange={e => onChange({ ...ex, reps: e.target.value })}
          placeholder="חזרות"
          type="number"
          min="0"
          style={inputStyle({ flex: 1 })}
        />
        <input
          value={ex.weight}
          onChange={e => onChange({ ...ex, weight: e.target.value })}
          placeholder="משקל ק״ג"
          type="number"
          min="0"
          step="0.5"
          style={inputStyle({ flex: 1 })}
        />
      </div>
    </div>
  )
}

function inputStyle(extra = {}) {
  return {
    background: 'rgba(15,15,26,0.7)',
    border: `1px solid ${C.border}`,
    borderRadius: 9,
    padding: '9px 12px',
    color: C.text,
    fontSize: 19,
    width: '100%',
    ...extra,
  }
}

// ─── Calendar ────────────────────────────────────────────────────────────────────

function CalendarView({ allWorkouts, onSelectDay, currentWeekKey }) {
  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())

  const HE_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  const firstDay = new Date(calYear, calMonth, 1)
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const startDow = firstDay.getDay() // 0=sun

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function hasWorkout(day) {
    const date = new Date(calYear, calMonth, day)
    const wk = getWeekKey(date)
    const di = date.getDay()
    const wkData = allWorkouts[wk]
    if (!wkData) return false
    const dayData = wkData[di]
    if (!dayData) return false
    return (dayData.types?.length > 0) || (dayData.muscles?.length > 0) || (dayData.exercises?.length > 0)
  }

  function isToday(day) {
    return day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()
  }

  function isInCurrentWeek(day) {
    if (!day) return false
    const date = new Date(calYear, calMonth, day)
    return getWeekKey(date) === currentWeekKey
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={nextMonth} style={{ ...base.iconBtn, fontSize: 19 }}>›</button>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
          {HE_MONTHS[calMonth]} {calYear}
        </span>
        <button onClick={prevMonth} style={{ ...base.iconBtn, fontSize: 19 }}>‹</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
        {DAY_LETTERS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 17, fontWeight: 700, color: C.text2, padding: '4px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          const worked = day && hasWorkout(day)
          const tod = day && isToday(day)
          const inWeek = day && isInCurrentWeek(day)
          return (
            <div
              key={i}
              onClick={() => {
                if (!day) return
                const date = new Date(calYear, calMonth, day)
                onSelectDay(date)
              }}
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                fontSize: 17,
                fontWeight: tod ? 800 : 500,
                cursor: day ? 'pointer' : 'default',
                background: tod
                  ? `rgba(124,131,253,0.25)`
                  : inWeek
                    ? `rgba(124,131,253,0.08)`
                    : worked
                      ? `rgba(74,222,128,0.08)`
                      : 'transparent',
                border: tod
                  ? `2px solid ${C.accent}`
                  : worked
                    ? `1px solid rgba(74,222,128,0.3)`
                    : `1px solid transparent`,
                color: tod ? C.accent : day ? C.text : 'transparent',
                position: 'relative',
                transition: 'all 0.15s',
              }}
            >
              {day}
              {worked && !tod && (
                <div style={{
                  position: 'absolute',
                  bottom: 3,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: C.success,
                }} />
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16, fontSize: 17, color: C.text2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.success }} />
          אימון בוצע
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${C.accent}` }} />
          היום
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: `rgba(124,131,253,0.2)` }} />
          השבוע
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────────

export default function WorkoutApp({ session, profile, onNavigateAdmin, onLogout }) {
  const today = new Date()
  const [weekKey, setWeekKey] = useState(getWeekKey(today))
  const [dayIndex, setDayIndex] = useState(today.getDay())
  const [allWorkouts, setAllWorkouts] = useState({}) // weekKey -> dayIndex -> data
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [view, setView] = useState('week') // 'week' | 'day' | 'calendar'
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saveTimer, setSaveTimer] = useState(null)
  const saveTimerRef = useRef(null)
  const [shareModal, setShareModal] = useState(null) // { url } or null

  const weekDates = getWeekDates(weekKey)

  // Current day data
  const dayData = allWorkouts?.[weekKey]?.[dayIndex] || emptyDay()

  // ── Load workouts for current week + surrounding weeks
  useEffect(() => {
    loadWorkoutsForRange()
  }, [weekKey])

  async function loadWorkoutsForRange() {
    const sunday = new Date(weekKey + 'T00:00:00')
    const keys = []
    for (let i = -4; i <= 4; i++) {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i * 7)
      keys.push(getWeekKey(d))
    }
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', session.user.id)
      .in('week_key', keys)
    if (error) { console.error(error); return }
    const map = {}
    for (const row of data || []) {
      if (!map[row.week_key]) map[row.week_key] = {}
      map[row.week_key][row.day_index] = row.data
    }
    setAllWorkouts(prev => ({ ...prev, ...map }))
  }

  // ── Compute days-since-last-trained for each muscle group
  function getDaysSince(muscleKey) {
    const allDays = []
    for (const [wk, days] of Object.entries(allWorkouts)) {
      const wd = getWeekDates(wk)
      for (const [di, data] of Object.entries(days)) {
        if ((wk === weekKey && Number(di) === dayIndex)) continue
        if (data?.muscles?.includes(muscleKey)) {
          allDays.push(wd[Number(di)])
        }
      }
    }
    if (allDays.length === 0) return null
    const latest = allDays.reduce((a, b) => a > b ? a : b)
    const diffMs = today - latest
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // ── Update day data (triggers auto-save)
  function updateDay(newData) {
    setAllWorkouts(prev => ({
      ...prev,
      [weekKey]: {
        ...(prev[weekKey] || {}),
        [dayIndex]: newData,
      }
    }))
    scheduleSave(newData)
  }

  function scheduleSave(data) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveDay(data), 800)
  }

  async function saveDay(data) {
    setSaving(true)
    setSaveError(null)
    const { error } = await supabase
      .from('workouts')
      .upsert({
        user_id: session.user.id,
        week_key: weekKey,
        day_index: dayIndex,
        data: data,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,week_key,day_index' })
    if (error) {
      console.error('Save error:', error)
      setSaveError(error.message)
    }
    setSaving(false)
  }

  // ── Week navigation
  function prevWeek() {
    const d = new Date(weekKey + 'T00:00:00')
    d.setDate(d.getDate() - 7)
    setWeekKey(getWeekKey(d))
  }
  function nextWeek() {
    const d = new Date(weekKey + 'T00:00:00')
    d.setDate(d.getDate() + 7)
    setWeekKey(getWeekKey(d))
  }
  function goToToday() {
    setWeekKey(getWeekKey(today))
    setDayIndex(today.getDay())
    setView('day')
  }

  function isCurrentWeek() {
    return weekKey === getWeekKey(today)
  }

  // ── Share workout
  async function shareWorkout() {
    const d = dayData
    const dayName = DAYS[dayIndex]
    const dateStr = formatDateHe(weekDates[dayIndex])
    let text = `🏋️ אימון ${dayName} ${dateStr}\n`
    if (d.types?.length) text += `סוג: ${d.types.join(', ')}\n`
    if (d.muscles?.length) text += `קבוצות שריר: ${d.muscles.map(k => MUSCLE_GROUPS[k]?.label + MUSCLE_GROUPS[k]?.emoji).join(', ')}\n`
    if (d.timeStart) text += `שעת התחלה: ${d.timeStart}\n`
    if (d.duration) text += `משך: ${d.duration} דקות\n`
    if (d.mood !== null && d.mood !== undefined) text += `מצב רוח: ${MOODS[d.mood]} ${MOOD_LABELS[d.mood]}\n`
    if (d.exercises?.length) {
      text += `\nתרגילים:\n`
      d.exercises.forEach((ex, i) => {
        text += `${i + 1}. ${ex.name}`
        if (ex.sets) text += ` | ${ex.sets} סטים`
        if (ex.reps) text += ` × ${ex.reps} חזרות`
        if (ex.weight) text += ` @ ${ex.weight} ק״ג`
        text += '\n'
      })
    }
    if (d.notes) text += `\nהערות: ${d.notes}\n`

    try {
      if (navigator.share) {
        await navigator.share({ text })
      } else {
        await navigator.clipboard.writeText(text)
        alert('הטקסט הועתק ללוח!')
      }
    } catch {}
  }

  // ── Render: Week view
  function renderWeekView() {
    return (
      <div style={{ padding: '16px' }}>
        {/* Week nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={nextWeek} style={{ ...base.iconBtn, fontSize: 18 }}>›</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
              {formatDateHe(weekDates[0])} – {formatDateHe(weekDates[6])}
            </div>
            {isCurrentWeek() && (
              <div style={{ fontSize: 17, color: C.accent, marginTop: 2 }}>השבוע הנוכחי</div>
            )}
          </div>
          <button onClick={prevWeek} style={{ ...base.iconBtn, fontSize: 18 }}>‹</button>
        </div>

        {/* Day cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DAYS.map((dayName, di) => {
            const dd = allWorkouts?.[weekKey]?.[di] || emptyDay()
            const isToday_ = isCurrentWeek() && di === today.getDay()
            const isSelected = di === dayIndex
            const hasData = dd.types?.length > 0 || dd.muscles?.length > 0 || dd.exercises?.length > 0
            return (
              <button
                key={di}
                onClick={() => { setDayIndex(di); setView('day') }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  background: isSelected
                    ? 'rgba(124,131,253,0.15)'
                    : isToday_
                      ? 'rgba(124,131,253,0.08)'
                      : C.card,
                  border: `1px solid ${isSelected ? C.accent : isToday_ ? 'rgba(124,131,253,0.3)' : C.border}`,
                  borderRadius: 14,
                  cursor: 'pointer',
                  textAlign: 'right',
                  direction: 'rtl',
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: isToday_
                    ? `rgba(124,131,253,0.25)`
                    : hasData
                      ? 'rgba(74,222,128,0.15)'
                      : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${isToday_ ? C.accent : hasData ? C.success : C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 19,
                  fontWeight: 800,
                  color: isToday_ ? C.accent : hasData ? C.success : C.text2,
                  flexShrink: 0,
                }}>
                  {DAY_LETTERS[di]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 600, color: C.text }}>{dayName}</span>
                    <span style={{ fontSize: 17, color: C.text2 }}>{formatDateHe(weekDates[di])}</span>
                    {isToday_ && <span style={{ fontSize: 17, color: C.accent, fontWeight: 700, background: 'rgba(124,131,253,0.15)', padding: '2px 6px', borderRadius: 6 }}>היום</span>}
                  </div>
                  {hasData ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {dd.types?.slice(0, 3).map(t => (
                        <span key={t} style={{ fontSize: 18, color: C.accent, background: 'rgba(124,131,253,0.12)', padding: '2px 8px', borderRadius: 8 }}>{t}</span>
                      ))}
                      {dd.muscles?.slice(0, 3).map(m => (
                        <span key={m} style={{ fontSize: 18, color: C.text2 }}>{MUSCLE_GROUPS[m]?.emoji}</span>
                      ))}
                      {dd.mood !== null && dd.mood !== undefined && (
                        <span style={{ fontSize: 19 }}>{MOODS[dd.mood]}</span>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 17, color: C.text2, marginTop: 2 }}>אין אימון</div>
                  )}
                </div>
                <div style={{ color: C.text2, fontSize: 19 }}>›</div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Render: Day view
  function renderDayView() {
    const d = dayData
    const date = weekDates[dayIndex]
    const isToday_ = isCurrentWeek() && dayIndex === today.getDay()

    function set(patch) {
      updateDay({ ...d, ...patch })
    }

    function toggleType(type) {
      const cur = d.types || []
      const next = cur.includes(type) ? cur.filter(t => t !== type) : [...cur, type]
      set({ types: next })
    }

    function toggleMuscle(key) {
      const cur = d.muscles || []
      const next = cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key]
      set({ muscles: next })
    }

    function addExercise() {
      set({ exercises: [...(d.exercises || []), { name: '', sets: '', reps: '', weight: '' }] })
    }

    function updateExercise(i, ex) {
      const exs = [...(d.exercises || [])]
      exs[i] = ex
      set({ exercises: exs })
    }

    function deleteExercise(i) {
      set({ exercises: (d.exercises || []).filter((_, idx) => idx !== i) })
    }

    return (
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Day header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: C.card,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
        }}>
          <button onClick={nextDay} style={{ color: C.text2, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: '4px 8px' }}>›</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{DAYS[dayIndex]}</div>
            <div style={{ fontSize: 18, color: isToday_ ? C.accent : C.text2, marginTop: 2 }}>
              {formatDateHe(date)} {isToday_ ? '· היום' : ''}
            </div>
          </div>
          <button onClick={prevDay} style={{ color: C.text2, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: '4px 8px' }}>‹</button>
        </div>

        {/* Edit/Save bar */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => {
              if (editMode) {
                if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
                saveDay(allWorkouts?.[weekKey]?.[dayIndex] || emptyDay())
              }
              setEditMode(e => !e)
            }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 10,
              fontSize: 17,
              fontWeight: 700,
              background: editMode ? 'rgba(74,222,128,0.15)' : 'rgba(124,131,253,0.12)',
              border: `1px solid ${editMode ? 'rgba(74,222,128,0.3)' : C.border}`,
              color: editMode ? C.success : C.accent,
              cursor: 'pointer',
            }}
          >
            {editMode ? '✓ סיום עריכה' : '✎ ערוך'}
          </button>
          <button
            onClick={shareWorkout}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 17,
              fontWeight: 700,
              background: 'rgba(124,131,253,0.12)',
              border: `1px solid ${C.border}`,
              color: C.accent,
              cursor: 'pointer',
            }}
          >
            שתף
          </button>
          {saving && (
            <div style={{ display: 'flex', alignItems: 'center', color: C.text2, fontSize: 17, padding: '0 8px' }}>
              שומר...
            </div>
          )}
          {saveError && (
            <div style={{ color: '#f87171', fontSize: 12, padding: '0 8px', maxWidth: 200 }}>
              שגיאה: {saveError}
            </div>
          )}
        </div>

        {/* Workout Types */}
        <Section title="סוג אימון" icon="🏃">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {WORKOUT_TYPES.map(type => (
              <Chip
                key={type}
                label={type}
                active={d.types?.includes(type)}
                onClick={editMode ? () => toggleType(type) : undefined}
              />
            ))}
          </div>
          {!editMode && !d.types?.length && <EmptyHint />}
        </Section>

        {/* Muscle Groups */}
        <Section title="קבוצות שריר" icon="💪">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MUSCLE_KEYS.map(k => (
              <MuscleTag
                key={k}
                muscleKey={k}
                active={d.muscles?.includes(k)}
                daysSince={getDaysSince(k)}
                onClick={() => toggleMuscle(k)}
                editMode={editMode}
              />
            ))}
          </div>
          {!editMode && !d.muscles?.length && <EmptyHint />}
        </Section>

        {/* Time */}
        <Section title="זמן אימון" icon="⏱️">
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 17, color: C.text2, display: 'block', marginBottom: 6 }}>שעת התחלה</label>
              {editMode ? (
                <input
                  type="time"
                  value={d.timeStart || ''}
                  onChange={e => set({ timeStart: e.target.value })}
                  style={{ ...inputStyle(), direction: 'ltr' }}
                />
              ) : (
                <div style={{ fontSize: 19, color: d.timeStart ? C.text : C.text2, fontWeight: d.timeStart ? 600 : 400 }}>
                  {d.timeStart || '—'}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 17, color: C.text2, display: 'block', marginBottom: 6 }}>שעת סיום</label>
              {editMode ? (
                <input
                  type="time"
                  value={d.timeEnd || ''}
                  onChange={e => set({ timeEnd: e.target.value })}
                  style={{ ...inputStyle(), direction: 'ltr' }}
                />
              ) : (
                <div style={{ fontSize: 19, color: d.timeEnd ? C.text : C.text2, fontWeight: d.timeEnd ? 600 : 400 }}>
                  {d.timeEnd || '—'}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 17, color: C.text2, display: 'block', marginBottom: 6 }}>משך (דק׳)</label>
              {editMode ? (
                <input
                  type="number"
                  value={d.duration || ''}
                  onChange={e => set({ duration: e.target.value })}
                  placeholder="45"
                  min="0"
                  style={inputStyle()}
                />
              ) : (
                <div style={{ fontSize: 19, color: d.duration ? C.text : C.text2, fontWeight: d.duration ? 600 : 400 }}>
                  {d.duration ? `${d.duration}` : '—'}
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* Mood */}
        <Section title="מצב רוח" icon="🌡️">
          <div style={{ display: 'flex', gap: 10 }}>
            {MOODS.map((mood, i) => (
              <button
                key={i}
                onClick={editMode ? () => set({ mood: d.mood === i ? null : i }) : undefined}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  borderRadius: 12,
                  border: `1px solid ${d.mood === i ? C.accent : C.border}`,
                  background: d.mood === i ? 'rgba(124,131,253,0.18)' : 'transparent',
                  cursor: editMode ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 22 }}>{mood}</span>
                <span style={{ fontSize: 17, color: d.mood === i ? C.accent : C.text2, fontWeight: d.mood === i ? 700 : 400 }}>
                  {MOOD_LABELS[i]}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {/* Exercises */}
        <Section title="תרגילים" icon="📋">
          {(d.exercises || []).map((ex, i) => (
            <ExerciseRow
              key={i}
              ex={ex}
              index={i}
              editMode={editMode}
              onChange={ex => updateExercise(i, ex)}
              onDelete={() => deleteExercise(i)}
            />
          ))}
          {!d.exercises?.length && !editMode && <EmptyHint label="אין תרגילים" />}
          {editMode && (
            <button
              onClick={addExercise}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 10,
                border: `1px dashed ${C.accent}`,
                background: 'rgba(124,131,253,0.06)',
                color: C.accent,
                fontSize: 17,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 4,
              }}
            >
              + הוסף תרגיל
            </button>
          )}
        </Section>

        {/* Notes */}
        <Section title="הערות" icon="📝">
          {editMode ? (
            <textarea
              value={d.notes || ''}
              onChange={e => set({ notes: e.target.value })}
              placeholder="כתוב הערות על האימון..."
              rows={3}
              style={{
                ...inputStyle(),
                resize: 'vertical',
                minHeight: 80,
              }}
            />
          ) : (
            <div style={{ fontSize: 17, color: d.notes ? C.text : C.text2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {d.notes || <EmptyHintInline />}
            </div>
          )}
        </Section>
      </div>
    )
  }

  function prevDay() {
    if (dayIndex > 0) setDayIndex(di => di - 1)
    else {
      prevWeek()
      setDayIndex(6)
    }
  }
  function nextDay() {
    if (dayIndex < 6) setDayIndex(di => di + 1)
    else {
      nextWeek()
      setDayIndex(0)
    }
  }

  function handleCalendarSelectDay(date) {
    setWeekKey(getWeekKey(date))
    setDayIndex(date.getDay())
    setView('day')
  }

  const headerTitle = view === 'week'
    ? 'שבועי'
    : view === 'calendar'
      ? 'לוח שנה'
      : DAYS[dayIndex]

  return (
    <div style={base.page}>
      {/* Header */}
      <div style={base.header}>
        <button style={base.iconBtn} onClick={() => setDrawerOpen(true)}>☰</button>
        <div style={base.headerTitle}>{headerTitle}</div>
        <button
          style={{ ...base.iconBtn, fontSize: 18, fontWeight: 700, width: 'auto', padding: '0 12px' }}
          onClick={goToToday}
        >
          היום
        </button>
      </div>

      {/* Body */}
      <div style={base.body}>
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
        {view === 'calendar' && (
          <CalendarView
            allWorkouts={allWorkouts}
            onSelectDay={handleCalendarSelectDay}
            currentWeekKey={weekKey}
          />
        )}
      </div>

      {/* Bottom nav */}
      <div style={base.bottomNav}>
        <button style={base.navBtn(view === 'week')} onClick={() => setView('week')}>
          <span style={base.navIcon}>📅</span>
          שבועי
        </button>
        <button style={base.navBtn(view === 'day')} onClick={() => setView('day')}>
          <span style={base.navIcon}>💪</span>
          יומי
        </button>
        <button style={base.navBtn(view === 'calendar')} onClick={() => setView('calendar')}>
          <span style={base.navIcon}>🗓️</span>
          חודשי
        </button>
      </div>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div style={base.drawerOverlay} onClick={() => setDrawerOpen(false)} />
      )}

      {/* Side Drawer */}
      <div style={{
        ...base.drawer,
        transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={base.drawerHeader}>
          <div style={base.drawerTitle}>🏋️ יומן אימונים</div>
          <div style={base.drawerEmail}>{profile?.email}</div>
          {profile?.is_admin && (
            <div style={{ marginTop: 8, fontSize: 18, color: C.accent2, fontWeight: 700 }}>👑 מנהל</div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <DrawerItem icon="📅" label="תצוגה שבועית" onClick={() => { setView('week'); setDrawerOpen(false) }} />
          <DrawerItem icon="💪" label="תצוגה יומית" onClick={() => { setView('day'); setDrawerOpen(false) }} />
          <DrawerItem icon="🗓️" label="לוח שנה" onClick={() => { setView('calendar'); setDrawerOpen(false) }} />
          <DrawerItem icon="📍" label="עבור להיום" onClick={() => { goToToday(); setDrawerOpen(false) }} />

          <DrawerItem
            icon="📨"
            label="שתף לחבר"
            onClick={async () => {
              setDrawerOpen(false)
              const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
              await supabase.from('invites').insert({ token, created_by: session.user.id })
              const url = `${window.location.origin}?invite=${token}`
              setShareModal({ url })
            }}
          />

          {profile?.is_admin && (
            <DrawerItem
              icon="⚙️"
              label="ניהול משתמשים"
              onClick={() => { setDrawerOpen(false); onNavigateAdmin() }}
            />
          )}
        </div>

        <div style={{ padding: '12px', borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={() => { setDrawerOpen(false); onLogout() }}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 10,
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.25)',
              color: C.danger,
              fontSize: 18,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span>🚪</span> התנתק
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {shareModal && (
        <div
          onClick={() => setShareModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a2e', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: 480 }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: C.text, marginBottom: 6 }}>שלח הזמנה לחבר</div>
            <div style={{ fontSize: 15, color: C.text2, marginBottom: 20, wordBreak: 'break-all', direction: 'ltr', textAlign: 'left' }}>{shareModal.url}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(shareModal.url)}`, '_blank'); setShareModal(null) }}
                style={{ padding: '14px', borderRadius: 12, background: '#25D366', color: '#fff', border: 'none', fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <span>📱</span> שלח ב-WhatsApp
              </button>
              <button
                onClick={() => { window.open(`sms:?body=${encodeURIComponent(shareModal.url)}`, '_blank'); setShareModal(null) }}
                style={{ padding: '14px', borderRadius: 12, background: 'rgba(124,131,253,0.2)', color: C.accent, border: `1px solid ${C.accent}`, fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <span>💬</span> שלח ב-SMS
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(shareModal.url); setShareModal(null); alert('הקישור הועתק!') }}
                style={{ padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: C.text2, border: `1px solid ${C.border}`, fontSize: 18, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <span>📋</span> העתק קישור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Small helpers

function Section({ title, icon, children }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 19 }}>{icon}</span>
        <span style={{ fontSize: 19, fontWeight: 700, color: C.text2 }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function EmptyHint({ label = 'לא הוזן' }) {
  return (
    <div style={{ fontSize: 18, color: C.text2, fontStyle: 'italic', marginTop: 2 }}>{label}</div>
  )
}

function EmptyHintInline() {
  return <span style={{ fontStyle: 'italic', fontSize: 18 }}>לא הוזן</span>
}

function DrawerItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '15px 20px',
        color: danger ? C.danger : C.text,
        fontSize: 18,
        fontWeight: 500,
        cursor: 'pointer',
        borderBottom: `1px solid rgba(124,131,253,0.08)`,
        background: 'none',
        border: 'none',
        borderBottom: `1px solid rgba(124,131,253,0.08)`,
        width: '100%',
        textAlign: 'right',
        direction: 'rtl',
      }}
    >
      <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{icon}</span>
      {label}
    </button>
  )
}
