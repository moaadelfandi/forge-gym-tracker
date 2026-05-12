import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const RANKS = [
  { name: 'Beginner',     color: '#6B7280', bg: '#1F2937', min: 0,  icon: '◈' },
  { name: 'Novice',       color: '#10B981', bg: '#064E3B', min: 20, icon: '◆' },
  { name: 'Intermediate', color: '#3B82F6', bg: '#1E3A5F', min: 40, icon: '◉' },
  { name: 'Advanced',     color: '#8B5CF6', bg: '#2E1065', min: 60, icon: '✦' },
  { name: 'Elite',        color: '#F59E0B', bg: '#451A03', min: 80, icon: '★' },
  { name: 'Legend',       color: '#EF4444', bg: '#450A0A', min: 95, icon: '⬡' },
]

const MUSCLE_GROUPS = [
  { id: 'chest', name: 'Chest', icon: '🫁', exercises: [
    'Bench Press','Incline Bench Press','Decline Bench Press',
    'Dumbbell Fly','Incline Dumbbell Fly','Cable Fly',
    'Cable Crossover','Chest Dip','Push-up','Pec Deck Machine',
    'Smith Machine Bench','Landmine Press'
  ]},
  { id: 'back', name: 'Back', icon: '🔱', exercises: [
    'Deadlift','Barbell Row','Pull-ups','Chin-ups',
    'Lat Pulldown','Seated Cable Row','Single Arm Dumbbell Row',
    'T-Bar Row','Face Pull','Straight Arm Pulldown',
    'Rack Pull','Meadows Row','Cable Pull-over'
  ]},
  { id: 'legs', name: 'Legs', icon: '⚡', exercises: [
    'Squat','Front Squat','Leg Press','Romanian Deadlift',
    'Hack Squat','Lunges','Bulgarian Split Squat',
    'Leg Extension','Leg Curl','Calf Raise',
    'Goblet Squat','Hip Thrust','Sumo Deadlift','Step-ups'
  ]},
  { id: 'shoulders', name: 'Shoulders', icon: '△', exercises: [
    'Overhead Press','Arnold Press','Lateral Raise',
    'Face Pull','Front Raise','Rear Delt Fly',
    'Cable Lateral Raise','Dumbbell Shoulder Press',
    'Machine Shoulder Press','Upright Row',
    'Shrugs','Cable Face Pull','Reverse Pec Deck'
  ]},
  { id: 'arms', name: 'Arms', icon: '◎', exercises: [
    'Barbell Curl','Dumbbell Curl','Hammer Curl',
    'Incline Dumbbell Curl','Cable Curl','Preacher Curl',
    'Tricep Dip','Skull Crusher','Tricep Pushdown',
    'Overhead Tricep Extension','Close Grip Bench Press',
    'Cable Overhead Tricep Extension','Diamond Push-up','Concentration Curl'
  ]},
  { id: 'core', name: 'Core', icon: '◇', exercises: [
    'Plank','Ab Wheel','Hanging Leg Raise','Cable Crunch',
    'Dragon Flag','Decline Sit-up','Russian Twist',
    'Hollow Body Hold','L-sit','Weighted Crunch',
    'Landmine Twist','Pallof Press','Dead Bug','Bicycle Crunch'
  ]},
]

const WEEKLY_PLAN = [
  {
    day: 'Day 1', label: 'PUSH',
    focus: 'Chest · Shoulders · Triceps',
    davidTip: 'David Laid prioritizes heavy incline work for upper chest thickness and strict lateral raises for 3D shoulder caps. Go heavy on compound, strict on isolation.',
    exercises: [
      { name: 'Incline Bench Press',   muscle: 'chest',     sets: 4, reps: '6-8',   note: 'Primary mass builder — go heavy, full range of motion' },
      { name: 'Bench Press',           muscle: 'chest',     sets: 3, reps: '8-10',  note: 'Full chest activation, slight arch, retract scapula' },
      { name: 'Cable Fly',             muscle: 'chest',     sets: 3, reps: '12-15', note: 'Stretch hard at the bottom, squeeze at the top' },
      { name: 'Overhead Press',        muscle: 'shoulders', sets: 4, reps: '6-8',   note: 'Builds shoulder width and mass — press straight up' },
      { name: 'Lateral Raise',         muscle: 'shoulders', sets: 4, reps: '15-20', note: 'Strict form, lead with elbows, no swinging' },
      { name: 'Tricep Pushdown',       muscle: 'arms',      sets: 3, reps: '12-15', note: 'Full extension at bottom, elbows locked at sides' },
      { name: 'Skull Crusher',         muscle: 'arms',      sets: 3, reps: '10-12', note: 'Keep elbows tucked, lower to forehead slowly' },
    ]
  },
  {
    day: 'Day 2', label: 'PULL',
    focus: 'Back · Biceps · Rear Delts',
    davidTip: 'David Laid is known for his V-taper. Heavy deadlifts and wide-grip pull-ups are the foundation. Focus on feeling the lat stretch on every rep.',
    exercises: [
      { name: 'Deadlift',          muscle: 'back', sets: 4, reps: '4-6',   note: 'King of all lifts — brace your core hard, drive through heels' },
      { name: 'Pull-ups',          muscle: 'back', sets: 4, reps: '6-10',  note: 'Wide grip for lat width, full hang at bottom' },
      { name: 'Barbell Row',       muscle: 'back', sets: 3, reps: '8-10',  note: 'Chest to bar, control the eccentric, retract scapula' },
      { name: 'Lat Pulldown',      muscle: 'back', sets: 3, reps: '10-12', note: 'Full stretch at top, pull to upper chest' },
      { name: 'Seated Cable Row',  muscle: 'back', sets: 3, reps: '12-15', note: 'Squeeze shoulder blades together at contraction' },
      { name: 'Barbell Curl',      muscle: 'arms', sets: 3, reps: '8-10',  note: 'Slow eccentric (3 sec down) for bicep peak' },
      { name: 'Hammer Curl',       muscle: 'arms', sets: 3, reps: '10-12', note: 'Builds brachialis for arm thickness' },
      { name: 'Face Pull',         muscle: 'back', sets: 3, reps: '15-20', note: 'Rear delt health and width — pull to forehead level' },
    ]
  },
  {
    day: 'Day 3', label: 'LEGS',
    focus: 'Quads · Hamstrings · Glutes · Calves',
    davidTip: 'David Laid squats deep with full range of motion. He trains legs hard and equally — no skipping. Balanced legs = better overall proportions.',
    exercises: [
      { name: 'Squat',                 muscle: 'legs', sets: 4, reps: '6-8',   note: 'Full depth, chest up, knees track over toes' },
      { name: 'Romanian Deadlift',     muscle: 'legs', sets: 4, reps: '8-10',  note: 'Feel the hamstring stretch at the bottom, hinge at hips' },
      { name: 'Leg Press',             muscle: 'legs', sets: 3, reps: '10-12', note: 'High foot placement for more glute activation' },
      { name: 'Bulgarian Split Squat', muscle: 'legs', sets: 3, reps: '10-12', note: 'Each leg separately — brutal but incredible for legs' },
      { name: 'Leg Extension',         muscle: 'legs', sets: 3, reps: '15-20', note: 'Squeeze and hold at the top for quad isolation' },
      { name: 'Leg Curl',              muscle: 'legs', sets: 3, reps: '12-15', note: 'Slow and controlled, full range of motion' },
      { name: 'Calf Raise',            muscle: 'legs', sets: 4, reps: '15-20', note: 'Full range, pause and stretch at bottom' },
    ]
  },
  {
    day: 'Day 4', label: 'UPPER',
    focus: 'Full Upper Body · Weak Points · Core',
    davidTip: 'Use this day to hit weak points and bring up lagging muscles. David Laid stays proportional by identifying and targeting what needs the most work.',
    exercises: [
      { name: 'Decline Bench Press',         muscle: 'chest',     sets: 3, reps: '8-10',  note: 'Lower chest detail and fullness' },
      { name: 'Single Arm Dumbbell Row',     muscle: 'back',      sets: 3, reps: '10-12', note: 'Full stretch, full contraction — feel the lat' },
      { name: 'Arnold Press',                muscle: 'shoulders', sets: 3, reps: '10-12', note: 'Great for shoulder roundness and fullness' },
      { name: 'Cable Lateral Raise',         muscle: 'shoulders', sets: 3, reps: '15-20', note: 'Constant tension — better than dumbbells for medial delt' },
      { name: 'Incline Dumbbell Curl',       muscle: 'arms',      sets: 3, reps: '10-12', note: 'Long head bicep stretch at bottom for peak' },
      { name: 'Overhead Tricep Extension',   muscle: 'arms',      sets: 3, reps: '12-15', note: 'Long head stretch — adds mass to back of arm' },
      { name: 'Ab Wheel',                    muscle: 'core',      sets: 3, reps: '10-15', note: 'Control the rollout, brace core throughout' },
      { name: 'Hanging Leg Raise',           muscle: 'core',      sets: 3, reps: '12-15', note: 'No swinging, curl hips up at the top' },
    ]
  },
]

const DAYS_OF_WEEK = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function calc1RM(weight, reps) {
  if (reps === 1) return weight
  return weight * (36 / (37 - reps))
}

function calcScore(sessions) {
  if (!sessions || sessions.length === 0) return 0
  const best1RM = Math.max(...sessions.map(s => calc1RM(s.weight, s.reps)))
  const bestVolume = Math.max(...sessions.map(s => s.weight * s.reps * s.sets))
  const rmScore = Math.min((best1RM / 200) * 100, 100)
  const volScore = Math.min((bestVolume / 10000) * 100, 100)
  return rmScore * 0.6 + volScore * 0.4
}

function getRank(score) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (score >= RANKS[i].min) return RANKS[i]
  }
  return RANKS[0]
}

function getNextRank(score) {
  for (let i = 0; i < RANKS.length; i++) {
    if (score < RANKS[i].min) return RANKS[i]
  }
  return null
}

function convertWeight(kg, unit) {
  return unit === 'lbs' ? Math.round(kg * 2.205 * 10) / 10 : Math.round(kg * 10) / 10
}

const SETTINGS_KEY = 'forge_settings_v2'
const SESSION_KEY  = 'forge_session_v1'

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { unit: 'kg', trainingDays: ['Mon','Tue','Thu','Fri'] } }
  catch { return { unit: 'kg', trainingDays: ['Mon','Tue','Thu','Fri'] } }
}
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null }
  catch { return null }
}

// ─── Avatar colours ───────────────────────────────────────────────
const AVATAR_COLORS = ['#EF4444','#F59E0B','#10B981','#3B82F6','#8B5CF6','#EC4899','#06B6D4','#84CC16']
function avatarColor(name) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

// ─── Shared styles ────────────────────────────────────────────────
const S = {
  input: { width:'100%', background:'#0F1520', border:'1px solid #1A2332', borderRadius:8, color:'#E2E8F0', padding:'12px 14px', fontSize:15, fontFamily:'Barlow Condensed, sans-serif' },
  label: { fontSize:10, letterSpacing:3, color:'#64748B', textTransform:'uppercase', marginBottom:6, display:'block' },
  card:  { background:'#0F1520', border:'1px solid #1A2332', borderRadius:12, padding:16 },
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(loadSession)
  const [screen, setScreen]           = useState('login') // login | register | app
  const [users, setUsers]             = useState([])
  const [authForm, setAuthForm]       = useState({ name:'', pin:'', confirmPin:'' })
  const [authMsg, setAuthMsg]         = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Load users list
  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from('users').select('id,name').order('name')
    if (data) setUsers(data)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser))
      setScreen('app')
    } else {
      localStorage.removeItem(SESSION_KEY)
      setScreen('login')
    }
  }, [currentUser])

  // ── Register ──
  async function handleRegister() {
    const { name, pin, confirmPin } = authForm
    if (!name.trim() || !pin) { setAuthMsg('Enter a name and PIN.'); return }
    if (pin.length < 4)       { setAuthMsg('PIN must be at least 4 digits.'); return }
    if (pin !== confirmPin)   { setAuthMsg('PINs do not match.'); return }
    setAuthLoading(true)
    const id = name.trim().toLowerCase().replace(/\s+/g,'-') + '-' + Date.now()
    const { error } = await supabase.from('users').insert([{ id, name: name.trim(), pin }])
    if (error) { setAuthMsg('Name already taken or error. Try again.'); setAuthLoading(false); return }
    setCurrentUser({ id, name: name.trim() })
    setAuthLoading(false)
  }

  // ── Login ──
  async function handleLogin(userId) {
    const { pin } = authForm
    if (!pin) { setAuthMsg('Enter your PIN.'); return }
    setAuthLoading(true)
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).eq('pin', pin).single()
    if (error || !data) { setAuthMsg('Wrong PIN. Try again.'); setAuthLoading(false); return }
    setCurrentUser({ id: data.id, name: data.name })
    setAuthMsg('')
    setAuthLoading(false)
  }

  function handleLogout() {
    setCurrentUser(null)
    setAuthForm({ name:'', pin:'', confirmPin:'' })
    setAuthMsg('')
  }

  if (screen === 'login' || screen === 'register') {
    return <AuthScreen
      screen={screen} setScreen={setScreen}
      users={users} authForm={authForm} setAuthForm={setAuthForm}
      authMsg={authMsg} setAuthMsg={setAuthMsg}
      authLoading={authLoading}
      onLogin={handleLogin} onRegister={handleRegister}
    />
  }

  return <MainApp currentUser={currentUser} onLogout={handleLogout} />
}

// ════════════════════════════════════════════════════════════════
//  AUTH SCREEN
// ════════════════════════════════════════════════════════════════
function AuthScreen({ screen, setScreen, users, authForm, setAuthForm, authMsg, setAuthMsg, authLoading, onLogin, onRegister }) {
  const [selectedUser, setSelectedUser] = useState(null)

  function selectUser(u) {
    setSelectedUser(u)
    setAuthForm(f => ({ ...f, pin:'' }))
    setAuthMsg('')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#080C10', color:'#E2E8F0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Barlow Condensed, sans-serif' }}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } input { outline:none; } input:focus { border-color:#EF4444 !important; } .btn { transition:all 0.2s; cursor:pointer; } .btn:hover:not(:disabled) { filter:brightness(1.1); } .btn:disabled { opacity:0.6; cursor:not-allowed; } .usr-btn { transition:all 0.2s; cursor:pointer; } .usr-btn:hover { border-color:#EF444466 !important; transform:translateY(-1px); }`}</style>

      <div style={{ width:'100%', maxWidth:380 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:11, letterSpacing:4, color:'#EF4444', fontWeight:700 }}>PHYSIQUE TRACKER</div>
          <div style={{ fontSize:42, fontWeight:900, letterSpacing:2, lineHeight:1 }}>FORGE</div>
          <div style={{ fontSize:12, color:'#475569', marginTop:4 }}>David Laid Aesthetic Program</div>
        </div>

        {screen === 'login' && (
          <div>
            {!selectedUser ? (
              <>
                <div style={{ fontSize:11, color:'#64748B', letterSpacing:3, textTransform:'uppercase', marginBottom:12 }}>Select Your Profile</div>
                {users.length === 0 ? (
                  <div style={{ ...S.card, textAlign:'center', color:'#475569', marginBottom:16 }}>
                    No users yet. Create the first account below.
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                    {users.map(u => (
                      <button key={u.id} className="usr-btn" onClick={() => selectUser(u)} style={{
                        background:'#0F1520', border:'1px solid #1A2332', borderRadius:12,
                        padding:'14px 16px', display:'flex', alignItems:'center', gap:12, textAlign:'left',
                      }}>
                        <div style={{ width:40, height:40, borderRadius:20, background:avatarColor(u.name), display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'#fff', flexShrink:0 }}>
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize:16, fontWeight:700, color:'#E2E8F0' }}>{u.name}</div>
                          <div style={{ fontSize:11, color:'#475569' }}>Tap to sign in</div>
                        </div>
                        <div style={{ marginLeft:'auto', color:'#475569', fontSize:18 }}>›</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ ...S.card, marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                  <div style={{ width:44, height:44, borderRadius:22, background:avatarColor(selectedUser.name), display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:900, color:'#fff' }}>
                    {selectedUser.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:18, fontWeight:800 }}>{selectedUser.name}</div>
                    <button onClick={() => { setSelectedUser(null); setAuthMsg('') }} style={{ background:'none', border:'none', color:'#475569', fontSize:11, cursor:'pointer', padding:0, fontFamily:'inherit' }}>← Back</button>
                  </div>
                </div>
                <label style={S.label}>Your PIN</label>
                <input type="password" inputMode="numeric" maxLength={8} placeholder="••••"
                  value={authForm.pin} onChange={e => setAuthForm(f => ({ ...f, pin: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && onLogin(selectedUser.id)}
                  style={{ ...S.input, fontSize:24, letterSpacing:8, textAlign:'center', marginBottom:14 }} />
                {authMsg && <div style={{ color:'#EF4444', fontSize:12, marginBottom:10, textAlign:'center' }}>{authMsg}</div>}
                <button className="btn" onClick={() => onLogin(selectedUser.id)} disabled={authLoading} style={{
                  width:'100%', background:'linear-gradient(135deg,#EF4444,#DC2626)', border:'none',
                  borderRadius:8, color:'#fff', padding:'14px', fontSize:15, fontWeight:800,
                  letterSpacing:2, fontFamily:'inherit',
                }}>{authLoading ? '...' : 'SIGN IN'}</button>
              </div>
            )}

            <button className="btn" onClick={() => { setScreen('register'); setAuthMsg(''); setSelectedUser(null) }} style={{
              width:'100%', background:'transparent', border:'1px solid #1A2332', borderRadius:8,
              color:'#64748B', padding:'12px', fontSize:13, fontWeight:700, letterSpacing:2, fontFamily:'inherit',
            }}>CREATE NEW ACCOUNT</button>
          </div>
        )}

        {screen === 'register' && (
          <div style={{ ...S.card }}>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:4 }}>Create Account</div>
            <div style={{ fontSize:12, color:'#64748B', marginBottom:20, fontFamily:'Barlow, sans-serif' }}>Set up your personal profile.</div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={S.label}>Your Name</label>
                <input placeholder="e.g. Moaad" value={authForm.name}
                  onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))}
                  style={S.input} />
              </div>
              <div>
                <label style={S.label}>PIN (4-8 digits)</label>
                <input type="password" inputMode="numeric" maxLength={8} placeholder="••••"
                  value={authForm.pin}
                  onChange={e => setAuthForm(f => ({ ...f, pin: e.target.value }))}
                  style={{ ...S.input, fontSize:22, letterSpacing:6, textAlign:'center' }} />
              </div>
              <div>
                <label style={S.label}>Confirm PIN</label>
                <input type="password" inputMode="numeric" maxLength={8} placeholder="••••"
                  value={authForm.confirmPin}
                  onChange={e => setAuthForm(f => ({ ...f, confirmPin: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && onRegister()}
                  style={{ ...S.input, fontSize:22, letterSpacing:6, textAlign:'center' }} />
              </div>

              {authMsg && <div style={{ color:'#EF4444', fontSize:12, textAlign:'center' }}>{authMsg}</div>}

              <button className="btn" onClick={onRegister} disabled={authLoading} style={{
                background:'linear-gradient(135deg,#EF4444,#DC2626)', border:'none',
                borderRadius:8, color:'#fff', padding:'14px', fontSize:15, fontWeight:800,
                letterSpacing:2, fontFamily:'inherit',
              }}>{authLoading ? '...' : 'CREATE ACCOUNT'}</button>

              <button className="btn" onClick={() => { setScreen('login'); setAuthMsg('') }} style={{
                background:'transparent', border:'none', color:'#475569', fontSize:12,
                fontWeight:700, letterSpacing:1, fontFamily:'inherit', padding:'4px',
              }}>← Back to login</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════════════════════
function MainApp({ currentUser, onLogout }) {
  const [tab, setTab]               = useState('dashboard')
  const [workouts, setWorkouts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [logForm, setLogForm]       = useState({ muscle:'chest', exercise:'', weight:'', reps:'', sets:'' })
  const [logMsg, setLogMsg]         = useState('')
  const [logLoading, setLogLoading] = useState(false)
  const [histFilter, setHistFilter] = useState('all')
  const [settings, setSettings]     = useState(loadSettings)
  const [planDay, setPlanDay]       = useState(0)
  const [expandedEx, setExpandedEx] = useState(null)

  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }, [settings])

  const fetchWorkouts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('workouts').select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
    if (!error && data) setWorkouts(data)
    setLoading(false)
  }, [currentUser.id])

  useEffect(() => { fetchWorkouts() }, [fetchWorkouts])

  async function handleLog() {
    const { muscle, exercise, weight, reps, sets } = logForm
    if (!exercise || !weight || !reps || !sets) { setLogMsg('⚠ Fill in all fields.'); return }
    setLogLoading(true)
    const weightKg = settings.unit === 'lbs' ? parseFloat(weight) / 2.205 : parseFloat(weight)
    const { error } = await supabase.from('workouts').insert([{
      user_id: currentUser.id,
      muscle, exercise,
      weight: Math.round(weightKg * 10) / 10,
      reps: parseInt(reps),
      sets: parseInt(sets),
    }])
    if (error) {
      console.error('Supabase error:', error)
      setLogMsg(`✗ Error: ${error.message}`)
    } else {
      setLogMsg(`✓ Logged ${exercise} — ${weight}${settings.unit} × ${reps} reps × ${sets} sets`)
      setLogForm(f => ({ ...f, exercise:'', weight:'', reps:'', sets:'' }))
      fetchWorkouts()
    }
    setLogLoading(false)
    setTimeout(() => setLogMsg(''), 4000)
  }

  const unit = settings.unit

  const byMuscle = MUSCLE_GROUPS.reduce((acc, mg) => {
    acc[mg.id] = workouts.filter(w => w.muscle === mg.id)
    return acc
  }, {})

  const scores = MUSCLE_GROUPS.reduce((acc, mg) => {
    acc[mg.id] = calcScore(byMuscle[mg.id])
    return acc
  }, {})

  const totalScore  = MUSCLE_GROUPS.reduce((s, mg) => s + scores[mg.id], 0) / MUSCLE_GROUPS.length
  const overallRank = getRank(totalScore)
  const filtered    = histFilter === 'all' ? workouts : workouts.filter(w => w.muscle === histFilter)

  const sortedTrainingDays = [...settings.trainingDays].sort((a,b) => {
    const o = { Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6 }
    return o[a]-o[b]
  })

  return (
    <div style={{ minHeight:'100vh', background:'#080C10', color:'#E2E8F0', paddingBottom:80, fontFamily:'Barlow Condensed, sans-serif' }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        input,select { outline:none; font-family:'Barlow Condensed',sans-serif; }
        input:focus,select:focus { border-color:#EF4444 !important; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#0F1520} ::-webkit-scrollbar-thumb{background:#2D3748;border-radius:2px}
        .tb { transition:all 0.2s; } .tb:hover { opacity:0.8; }
        .rc { transition:transform 0.2s,box-shadow 0.2s; }
        .rc:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(0,0,0,.5); }
        .lb { transition:all 0.2s; } .lb:hover:not(:disabled){ filter:brightness(1.15); transform:scale(1.02); } .lb:disabled{opacity:.6;cursor:not-allowed}
        .db { transition:all 0.2s; } .db:hover{filter:brightness(1.1);}
        .ec { transition:border-color 0.2s; cursor:pointer; } .ec:hover{border-color:#EF444455 !important;}
        .tog{transition:all 0.2s;cursor:pointer;}
        @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .si{animation:slideIn 0.3s ease forwards}
        @keyframes spin{to{transform:rotate(360deg)}}
        .sp{animation:spin 1s linear infinite;display:inline-block}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background:'linear-gradient(180deg,#0F1520 0%,#080C10 100%)', borderBottom:'1px solid #1A2332', padding:'14px 16px 0' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:4, color:'#EF4444', fontWeight:700, textTransform:'uppercase' }}>PHYSIQUE TRACKER</div>
            <div style={{ fontSize:26, fontWeight:900, letterSpacing:1, lineHeight:1.1 }}>FORGE</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
            {/* KG/LBS */}
            <div style={{ display:'flex', background:'#0F1520', border:'1px solid #1A2332', borderRadius:20, overflow:'hidden' }}>
              {['kg','lbs'].map(u => (
                <button key={u} className="tog" onClick={() => setSettings(s => ({ ...s, unit:u }))} style={{
                  padding:'4px 12px', border:'none', fontSize:10, fontWeight:700, fontFamily:'inherit',
                  letterSpacing:1, cursor:'pointer',
                  background: unit===u ? '#EF4444' : 'transparent',
                  color: unit===u ? '#fff' : '#475569',
                }}>{u.toUpperCase()}</button>
              ))}
            </div>
            {/* User badge */}
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:22, height:22, borderRadius:11, background:avatarColor(currentUser.name), display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#fff' }}>
                {currentUser.name[0].toUpperCase()}
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:'#94A3B8' }}>{currentUser.name}</span>
              <button onClick={onLogout} style={{ background:'none', border:'none', color:'#475569', fontSize:10, cursor:'pointer', fontFamily:'inherit', letterSpacing:1 }}>OUT</button>
            </div>
          </div>
        </div>

        {/* Overall rank bar */}
        {!loading && (
          <div style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <span style={{ fontSize:10, color:'#64748B', letterSpacing:2 }}>OVERALL</span>
              <span style={{ fontSize:14, fontWeight:800, color:overallRank.color }}>{overallRank.icon} {overallRank.name} · {Math.round(totalScore)}</span>
            </div>
            <div style={{ background:'#1A2332', borderRadius:3, height:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${totalScore}%`, background:overallRank.color, borderRadius:3, transition:'width 1s ease' }} />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex' }}>
          {[['dashboard','RANKS'],['plan','PLAN'],['log','LOG'],['history','HIST'],['stats','STATS']].map(([id,label]) => (
            <button key={id} className="tb" onClick={() => setTab(id)} style={{
              flex:1, padding:'10px 2px', border:'none', cursor:'pointer',
              fontSize:10, fontWeight:700, letterSpacing:1.5, fontFamily:'inherit',
              background:'transparent',
              color: tab===id ? '#EF4444' : '#475569',
              borderBottom: tab===id ? '2px solid #EF4444' : '2px solid transparent',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:'20px 16px' }}>

        {/* ── DASHBOARD ── */}
        {tab==='dashboard' && (
          <div className="si">
            {loading ? (
              <div style={{ textAlign:'center', padding:60, color:'#475569' }}>
                <div className="sp" style={{ fontSize:28, marginBottom:10 }}>◈</div>
                <div>Loading {currentUser.name}'s data...</div>
              </div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
                  {MUSCLE_GROUPS.map(mg => {
                    const score = scores[mg.id]
                    const rank  = getRank(score)
                    const next  = getNextRank(score)
                    const pct   = next ? ((score-rank.min)/(next.min-rank.min))*100 : 100
                    return (
                      <div key={mg.id} className="rc" style={{ background:rank.bg, border:`1px solid ${rank.color}33`, borderRadius:12, padding:14, position:'relative', overflow:'hidden' }}>
                        <div style={{ position:'absolute', top:-10, right:-10, fontSize:50, opacity:0.06 }}>{mg.icon}</div>
                        <div style={{ fontSize:10, color:'#64748B', letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>{mg.name}</div>
                        <div style={{ fontSize:20, fontWeight:800, color:rank.color, marginBottom:2 }}>{rank.icon} {rank.name}</div>
                        <div style={{ fontSize:11, color:'#94A3B8', marginBottom:8 }}>Score: {Math.round(score)}</div>
                        <div style={{ background:'#00000033', borderRadius:3, height:4, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:rank.color, borderRadius:3, transition:'width 1s ease' }} />
                        </div>
                        {next ? <div style={{ fontSize:9, color:'#64748B', marginTop:4 }}>→ {next.name}</div>
                               : <div style={{ fontSize:9, color:rank.color, marginTop:4 }}>MAX RANK</div>}
                      </div>
                    )
                  })}
                </div>

                <div style={{ background:'#0F1520', border:'1px solid #1A2332', borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:11, color:'#64748B', letterSpacing:3, textTransform:'uppercase', marginBottom:12 }}>Rank Tiers</div>
                  {RANKS.map(r => (
                    <div key={r.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid #1A233215' }}>
                      <span style={{ color:r.color, fontSize:14 }}>{r.icon}</span>
                      <span style={{ color:r.color, fontWeight:700, fontSize:13, flex:1 }}>{r.name}</span>
                      <span style={{ color:'#475569', fontSize:11 }}>Score ≥ {r.min}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── PLAN ── */}
        {tab==='plan' && (
          <div className="si">
            <div style={{ fontSize:22, fontWeight:900, letterSpacing:1, marginBottom:2 }}>YOUR PLAN</div>
            <div style={{ fontSize:13, color:'#64748B', marginBottom:16, fontFamily:'Barlow,sans-serif' }}>4-day split for the David Laid aesthetic.</div>

            {/* Training days picker */}
            <div style={{ background:'#0F1520', border:'1px solid #1A2332', borderRadius:12, padding:14, marginBottom:16 }}>
              <div style={{ fontSize:10, color:'#64748B', letterSpacing:3, textTransform:'uppercase', marginBottom:10 }}>Your Training Days</div>
              <div style={{ display:'flex', gap:5 }}>
                {DAYS_OF_WEEK.map(day => {
                  const active = settings.trainingDays.includes(day)
                  return (
                    <button key={day} className="db" onClick={() => setSettings(s => {
                      const days = s.trainingDays.includes(day) ? s.trainingDays.filter(d=>d!==day) : [...s.trainingDays,day]
                      return { ...s, trainingDays:days }
                    })} style={{
                      flex:1, padding:'8px 2px', border:`1px solid ${active?'#EF4444':'#1A2332'}`,
                      borderRadius:8, background:active?'#EF444422':'transparent',
                      color:active?'#EF4444':'#475569', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                    }}>{day}</button>
                  )
                })}
              </div>
              <div style={{ fontSize:11, color:'#475569', marginTop:8 }}>{settings.trainingDays.length} days · tap to toggle</div>
            </div>

            {/* Day selector */}
            <div style={{ display:'flex', gap:8, marginBottom:16, overflowX:'auto', paddingBottom:4 }}>
              {WEEKLY_PLAN.map((plan,i) => (
                <button key={i} className="db" onClick={() => { setPlanDay(i); setExpandedEx(null) }} style={{
                  padding:'8px 14px', border:`1px solid ${planDay===i?'#EF4444':'#1A2332'}`,
                  borderRadius:20, background:planDay===i?'#EF4444':'#0F1520',
                  color:planDay===i?'#fff':'#64748B', fontSize:11, fontWeight:700,
                  letterSpacing:1, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
                }}>{plan.day}: {plan.label}</button>
              ))}
            </div>

            {(() => {
              const plan = WEEKLY_PLAN[planDay]
              const assignedDay = sortedTrainingDays[planDay]
              return (
                <div>
                  <div style={{ background:'#0F1520', border:'1px solid #1A2332', borderRadius:12, padding:16, marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:24, fontWeight:900 }}>{plan.label}</div>
                        <div style={{ fontSize:12, color:'#64748B' }}>{plan.focus}</div>
                      </div>
                      {assignedDay && (
                        <div style={{ background:'#EF444422', border:'1px solid #EF444444', borderRadius:8, padding:'4px 12px', fontSize:12, color:'#EF4444', fontWeight:700 }}>{assignedDay}</div>
                      )}
                    </div>
                    <div style={{ background:'#080C10', borderRadius:8, padding:12, borderLeft:'3px solid #EF4444' }}>
                      <div style={{ fontSize:10, color:'#EF4444', letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>David Laid Tip</div>
                      <div style={{ fontSize:12, color:'#94A3B8', fontFamily:'Barlow,sans-serif', lineHeight:1.6 }}>{plan.davidTip}</div>
                    </div>
                  </div>

                  <div style={{ fontSize:10, color:'#64748B', letterSpacing:3, textTransform:'uppercase', marginBottom:10 }}>Exercises — tap to expand</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {plan.exercises.map((ex,i) => {
                      const mg          = MUSCLE_GROUPS.find(m => m.id===ex.muscle)
                      const muscleScore = scores[ex.muscle]
                      const rank        = getRank(muscleScore)
                      const next        = getNextRank(muscleScore)
                      const sessions    = byMuscle[ex.muscle] || []
                      const best1RM     = sessions.length>0 ? Math.max(...sessions.map(s=>calc1RM(s.weight,s.reps))) : 0
                      const targetKg    = next ? (next.min/100)*200*0.75 : null
                      const targetW     = targetKg ? Math.round(convertWeight(targetKg,unit)) : null
                      const isExp       = expandedEx===`${planDay}-${i}`
                      return (
                        <div key={i} className="ec" onClick={() => setExpandedEx(isExp ? null : `${planDay}-${i}`)}
                          style={{ background:'#0F1520', border:'1px solid #1A2332', borderRadius:10, overflow:'hidden' }}>
                          <div style={{ padding:'12px 14px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <div style={{ flex:1 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                                  <span style={{ fontSize:12, color:'#475569', fontWeight:700 }}>{i+1}</span>
                                  <span style={{ fontSize:15, fontWeight:700 }}>{ex.name}</span>
                                </div>
                                <div style={{ fontSize:11, color:'#64748B' }}>{mg?.icon} {mg?.name} · {ex.sets}×{ex.reps}</div>
                              </div>
                              <div style={{ textAlign:'right', marginLeft:8 }}>
                                <div style={{ fontSize:11, color:rank.color, fontWeight:700 }}>{rank.icon} {rank.name}</div>
                                <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>{isExp?'▲':'▼'}</div>
                              </div>
                            </div>
                          </div>
                          {isExp && (
                            <div style={{ borderTop:'1px solid #1A2332', padding:14, background:'#080C10' }}>
                              <div style={{ fontSize:12, color:'#94A3B8', fontFamily:'Barlow,sans-serif', marginBottom:12, lineHeight:1.6 }}>💡 {ex.note}</div>
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                                <div style={{ background:'#0F1520', borderRadius:8, padding:10, textAlign:'center' }}>
                                  <div style={{ fontSize:10, color:'#64748B', marginBottom:4 }}>YOUR BEST 1RM</div>
                                  <div style={{ fontSize:20, fontWeight:800, color:rank.color }}>
                                    {best1RM>0 ? `${Math.round(convertWeight(best1RM,unit))}${unit}` : '—'}
                                  </div>
                                </div>
                                <div style={{ background:'#0F1520', borderRadius:8, padding:10, textAlign:'center' }}>
                                  <div style={{ fontSize:10, color:'#64748B', marginBottom:4 }}>TARGET TO RANK UP</div>
                                  <div style={{ fontSize:20, fontWeight:800, color:next?'#EF4444':'#F59E0B' }}>
                                    {next&&targetW ? `${targetW}${unit}` : '🏆 MAX'}
                                  </div>
                                </div>
                              </div>
                              {next&&targetW && (
                                <div style={{ background:'#0F1520', borderRadius:8, padding:12, borderLeft:`3px solid ${next.color}`, marginBottom:10 }}>
                                  <div style={{ fontSize:11, color:next.color, fontWeight:700, marginBottom:4 }}>To reach {next.icon} {next.name}:</div>
                                  <div style={{ fontSize:12, color:'#94A3B8', fontFamily:'Barlow,sans-serif', lineHeight:1.5 }}>
                                    Work up to ~{targetW}{unit} for a working set. Add small weight each week and log every session.
                                  </div>
                                </div>
                              )}
                              <button onClick={e => { e.stopPropagation(); setLogForm({ muscle:ex.muscle, exercise:ex.name, weight:'', reps:'', sets:'' }); setTab('log') }} style={{
                                width:'100%', background:'#EF4444', border:'none', borderRadius:8,
                                color:'#fff', padding:11, fontSize:12, fontWeight:800,
                                letterSpacing:2, cursor:'pointer', fontFamily:'inherit',
                              }}>LOG THIS EXERCISE →</button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* ── LOG ── */}
        {tab==='log' && (
          <div className="si">
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:1, marginBottom:4 }}>LOG A SET</div>
            <div style={{ fontSize:13, color:'#64748B', marginBottom:20, fontFamily:'Barlow,sans-serif' }}>
              Weight in <span style={{ color:'#EF4444', fontWeight:700 }}>{unit.toUpperCase()}</span> · toggle top-right to switch
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={S.label}>Muscle Group</label>
                <select value={logForm.muscle} onChange={e => setLogForm(f=>({...f,muscle:e.target.value,exercise:''}))}
                  style={{ ...S.input }}>
                  {MUSCLE_GROUPS.map(mg=><option key={mg.id} value={mg.id}>{mg.icon} {mg.name}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Exercise</label>
                <select value={logForm.exercise} onChange={e=>setLogForm(f=>({...f,exercise:e.target.value}))}
                  style={{ ...S.input }}>
                  <option value="">Select exercise...</option>
                  {MUSCLE_GROUPS.find(m=>m.id===logForm.muscle)?.exercises.map(ex=>(
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                {[['weight',`WT (${unit})`],['reps','REPS'],['sets','SETS']].map(([field,label])=>(
                  <div key={field}>
                    <label style={S.label}>{label}</label>
                    <input type="number" min="0" value={logForm[field]}
                      onChange={e=>setLogForm(f=>({...f,[field]:e.target.value}))}
                      placeholder="0"
                      style={{ ...S.input, fontSize:20, fontWeight:700, textAlign:'center', padding:'12px 6px' }} />
                  </div>
                ))}
              </div>
              {logForm.weight && logForm.reps && (
                <div style={{ background:'#0F1520', border:'1px solid #1A2332', borderRadius:8, padding:12, textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'#64748B', letterSpacing:2 }}>ESTIMATED 1RM</div>
                  <div style={{ fontSize:28, fontWeight:900, color:'#EF4444' }}>
                    {Math.round(calc1RM(parseFloat(logForm.weight),parseInt(logForm.reps)))} {unit}
                  </div>
                </div>
              )}
              <button className="lb" onClick={handleLog} disabled={logLoading} style={{
                background:'linear-gradient(135deg,#EF4444,#DC2626)', border:'none',
                borderRadius:10, color:'#fff', padding:16, fontSize:16,
                fontWeight:800, letterSpacing:3, cursor:'pointer', textTransform:'uppercase', fontFamily:'inherit',
              }}>{logLoading ? <span className="sp">◈</span> : 'LOG SET'}</button>
              {logMsg && (
                <div style={{
                  background:logMsg.startsWith('✓')?'#064E3B':'#450A0A',
                  border:`1px solid ${logMsg.startsWith('✓')?'#10B981':'#EF4444'}`,
                  borderRadius:8, padding:12,
                  color:logMsg.startsWith('✓')?'#10B981':'#EF4444',
                  fontSize:13, textAlign:'center'
                }}>{logMsg}</div>
              )}
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab==='history' && (
          <div className="si">
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:1, marginBottom:4 }}>HISTORY</div>
            <div style={{ fontSize:13, color:'#64748B', marginBottom:16, fontFamily:'Barlow,sans-serif' }}>{workouts.length} sessions logged.</div>
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, marginBottom:16 }}>
              {[['all','All'],...MUSCLE_GROUPS.map(mg=>[mg.id,mg.name])].map(([id,label])=>(
                <button key={id} onClick={()=>setHistFilter(id)} style={{
                  background:histFilter===id?'#EF4444':'#0F1520',
                  border:'1px solid '+(histFilter===id?'#EF4444':'#1A2332'),
                  borderRadius:20, color:histFilter===id?'#fff':'#64748B',
                  padding:'6px 14px', fontSize:11, fontWeight:700, letterSpacing:1,
                  cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit',
                }}>{label}</button>
              ))}
            </div>
            {loading ? <div style={{ textAlign:'center', padding:40, color:'#475569' }}>Loading...</div>
            : filtered.length===0 ? (
              <div style={{ textAlign:'center', padding:40, color:'#475569' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>◈</div>
                <div>No sessions yet. Start logging.</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {filtered.map(s=>{
                  const mg = MUSCLE_GROUPS.find(m=>m.id===s.muscle)
                  const dW = convertWeight(s.weight,unit)
                  const rm = Math.round(convertWeight(calc1RM(s.weight,s.reps),unit))
                  const dt = new Date(s.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
                  return (
                    <div key={s.id} style={{ background:'#0F1520', border:'1px solid #1A2332', borderRadius:10, padding:'12px 14px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div>
                          <div style={{ fontSize:15, fontWeight:700 }}>{s.exercise}</div>
                          <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{mg?.icon} {mg?.name} · {dt}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:13, fontWeight:700 }}>{dW}{unit} × {s.reps} × {s.sets}</div>
                          <div style={{ fontSize:11, color:'#EF4444' }}>1RM ~{rm}{unit}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STATS ── */}
        {tab==='stats' && (
          <div className="si">
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:1, marginBottom:4 }}>STATS</div>
            <div style={{ fontSize:13, color:'#64748B', marginBottom:20, fontFamily:'Barlow,sans-serif' }}>Your strength breakdown.</div>
            {MUSCLE_GROUPS.map(mg=>{
              const sessions = byMuscle[mg.id]||[]
              const score    = scores[mg.id]
              const rank     = getRank(score)
              const next     = getNextRank(score)
              if (sessions.length===0) return (
                <div key={mg.id} style={{ background:'#0F1520', border:'1px solid #1A2332', borderRadius:10, padding:14, marginBottom:10, opacity:0.5 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontWeight:700 }}>{mg.icon} {mg.name}</span>
                    <span style={{ fontSize:12, color:'#475569' }}>No data yet</span>
                  </div>
                </div>
              )
              const best1RM  = Math.max(...sessions.map(s=>calc1RM(s.weight,s.reps)))
              const totalVol = sessions.reduce((s,w)=>s+w.weight*w.reps*w.sets,0)
              const topEx    = sessions.reduce((a,s)=>{a[s.exercise]=(a[s.exercise]||0)+1;return a},{})
              const favEx    = Object.entries(topEx).sort((a,b)=>b[1]-a[1])[0]?.[0]
              const targetW  = next ? Math.round(convertWeight((next.min/100)*200,unit)) : null
              return (
                <div key={mg.id} style={{ background:rank.bg, border:`1px solid ${rank.color}33`, borderRadius:12, padding:14, marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div style={{ fontSize:16, fontWeight:800 }}>{mg.icon} {mg.name}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:rank.color }}>{rank.icon} {rank.name}</div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8 }}>
                    {[
                      ['Best 1RM', `${Math.round(convertWeight(best1RM,unit))}${unit}`],
                      ['Total Vol.', `${Math.round(convertWeight(totalVol,unit)/1000)}k`],
                      ['Sessions', sessions.length],
                    ].map(([label,val])=>(
                      <div key={label} style={{ background:'#00000033', borderRadius:8, padding:'8px 6px', textAlign:'center' }}>
                        <div style={{ fontSize:10, color:'#64748B', letterSpacing:1 }}>{label}</div>
                        <div style={{ fontSize:17, fontWeight:800, color:rank.color }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  {next&&targetW && (
                    <div style={{ background:'#00000033', borderRadius:8, padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ fontSize:11, color:'#64748B' }}>Target for {next.icon} {next.name}</div>
                      <div style={{ fontSize:14, fontWeight:800, color:next.color }}>{targetW}{unit} 1RM</div>
                    </div>
                  )}
                  {favEx && <div style={{ marginTop:8, fontSize:11, color:'#64748B' }}>Top exercise: <span style={{ color:'#94A3B8' }}>{favEx}</span></div>}
                </div>
              )
            })}
            <div style={{ background:'#0F1520', border:'1px solid #1A2332', borderRadius:12, padding:16, marginTop:8 }}>
              <div style={{ fontSize:11, letterSpacing:3, color:'#64748B', textTransform:'uppercase', marginBottom:10 }}>Totals</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  ['Sessions', workouts.length],
                  ['Total Sets', workouts.reduce((s,w)=>s+w.sets,0)],
                  ['Volume', `${Math.round(convertWeight(workouts.reduce((s,w)=>s+w.weight*w.reps*w.sets,0),unit)/1000)}k ${unit}`],
                  ['Score', Math.round(totalScore)],
                ].map(([label,val])=>(
                  <div key={label} style={{ background:'#080C10', borderRadius:8, padding:'12px 10px', textAlign:'center' }}>
                    <div style={{ fontSize:10, color:'#64748B', letterSpacing:1 }}>{label}</div>
                    <div style={{ fontSize:22, fontWeight:900 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ position:'fixed', bottom:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#EF4444,transparent)' }} />
    </div>
  )
}
