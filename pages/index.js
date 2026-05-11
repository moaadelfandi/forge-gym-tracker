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
  { id: 'chest',     name: 'Chest',     icon: '🫁', exercises: ['Bench Press', 'Incline Bench', 'Dumbbell Fly', 'Cable Fly', 'Push-up'] },
  { id: 'back',      name: 'Back',      icon: '🔱', exercises: ['Deadlift', 'Barbell Row', 'Pull-ups', 'Lat Pulldown', 'Seated Row'] },
  { id: 'legs',      name: 'Legs',      icon: '⚡', exercises: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Hack Squat', 'Lunges'] },
  { id: 'shoulders', name: 'Shoulders', icon: '△',  exercises: ['Overhead Press', 'Arnold Press', 'Lateral Raise', 'Face Pull', 'Front Raise'] },
  { id: 'arms',      name: 'Arms',      icon: '◎',  exercises: ['Barbell Curl', 'Tricep Dip', 'Hammer Curl', 'Skull Crusher', 'Cable Curl'] },
  { id: 'core',      name: 'Core',      icon: '◇',  exercises: ['Plank', 'Ab Wheel', 'Hanging Leg Raise', 'Cable Crunch', 'Dragon Flag'] },
]

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

export default function Home() {
  const [tab, setTab] = useState('dashboard')
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [logForm, setLogForm] = useState({ muscle: 'chest', exercise: '', weight: '', reps: '', sets: '' })
  const [logMsg, setLogMsg] = useState('')
  const [logLoading, setLogLoading] = useState(false)
  const [historyFilter, setHistoryFilter] = useState('all')

  const fetchWorkouts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setWorkouts(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchWorkouts() }, [fetchWorkouts])

  async function handleLog() {
    const { muscle, exercise, weight, reps, sets } = logForm
    if (!exercise || !weight || !reps || !sets) {
      setLogMsg('⚠ Fill in all fields.')
      return
    }
    setLogLoading(true)
    const { error } = await supabase.from('workouts').insert([{
      muscle,
      exercise,
      weight: parseFloat(weight),
      reps: parseInt(reps),
      sets: parseInt(sets),
    }])
    if (error) {
      setLogMsg('✗ Error saving. Try again.')
    } else {
      setLogMsg(`✓ Logged ${exercise} — ${weight}kg × ${reps} reps × ${sets} sets`)
      setLogForm(f => ({ ...f, exercise: '', weight: '', reps: '', sets: '' }))
      fetchWorkouts()
    }
    setLogLoading(false)
    setTimeout(() => setLogMsg(''), 4000)
  }

  // Group workouts by muscle
  const byMuscle = MUSCLE_GROUPS.reduce((acc, mg) => {
    acc[mg.id] = workouts.filter(w => w.muscle === mg.id)
    return acc
  }, {})

  const scores = MUSCLE_GROUPS.reduce((acc, mg) => {
    acc[mg.id] = calcScore(byMuscle[mg.id])
    return acc
  }, {})

  const totalScore = MUSCLE_GROUPS.reduce((sum, mg) => sum + scores[mg.id], 0) / MUSCLE_GROUPS.length
  const overallRank = getRank(totalScore)

  const filtered = historyFilter === 'all'
    ? workouts
    : workouts.filter(w => w.muscle === historyFilter)

  return (
    <div style={{ minHeight: '100vh', background: '#080C10', color: '#E2E8F0', paddingBottom: 80 }}>
      <style>{`
        .tab-btn { transition: all 0.2s; }
        .tab-btn:hover { opacity: 0.8; }
        .rank-card { transition: transform 0.2s, box-shadow 0.2s; cursor: default; }
        .rank-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.5); }
        .log-btn { transition: all 0.2s; }
        .log-btn:hover:not(:disabled) { filter: brightness(1.15); transform: scale(1.02); }
        .log-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @keyframes slideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .slide-in { animation: slideIn 0.3s ease forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; display: inline-block; }
      `}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, #0F1520 0%, #080C10 100%)', borderBottom: '1px solid #1A2332', padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 4, color: '#EF4444', fontWeight: 700, textTransform: 'uppercase' }}>PHYSIQUE TRACKER</div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1, lineHeight: 1.1 }}>FORGE</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#64748B', letterSpacing: 2, textTransform: 'uppercase' }}>Overall</div>
            {loading
              ? <div style={{ fontSize: 14, color: '#475569' }}>Loading...</div>
              : <div style={{ fontSize: 22, fontWeight: 800, color: overallRank.color }}>{overallRank.icon} {overallRank.name}</div>
            }
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex' }}>
          {[['dashboard', 'RANKS'], ['log', 'LOG SET'], ['history', 'HISTORY'], ['stats', 'STATS']].map(([id, label]) => (
            <button key={id} className="tab-btn" onClick={() => setTab(id)} style={{
              flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: 'inherit',
              background: 'transparent',
              color: tab === id ? '#EF4444' : '#475569',
              borderBottom: tab === id ? '2px solid #EF4444' : '2px solid transparent',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div className="slide-in">
            {/* Overall score bar */}
            <div style={{ background: '#0F1520', border: '1px solid #1A2332', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: '#64748B', letterSpacing: 2, textTransform: 'uppercase' }}>Overall Score</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: overallRank.color }}>{Math.round(totalScore)}</div>
              </div>
              <div style={{ background: '#1A2332', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${totalScore}%`, background: overallRank.color, borderRadius: 4, transition: 'width 1s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#475569' }}>
                <span>0</span><span>100</span>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
                <div className="spinner" style={{ fontSize: 24, marginBottom: 8 }}>◈</div>
                <div>Loading your data...</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {MUSCLE_GROUPS.map(mg => {
                  const score = scores[mg.id]
                  const rank = getRank(score)
                  const next = getNextRank(score)
                  const pct = next ? ((score - rank.min) / (next.min - rank.min)) * 100 : 100
                  return (
                    <div key={mg.id} className="rank-card" style={{
                      background: rank.bg, border: `1px solid ${rank.color}33`,
                      borderRadius: 12, padding: 14, position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 50, opacity: 0.06 }}>{mg.icon}</div>
                      <div style={{ fontSize: 10, color: '#64748B', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>{mg.name}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: rank.color, marginBottom: 2 }}>{rank.icon} {rank.name}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>Score: {Math.round(score)}</div>
                      <div style={{ background: '#00000033', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: rank.color, borderRadius: 3, transition: 'width 1s ease' }} />
                      </div>
                      {next
                        ? <div style={{ fontSize: 9, color: '#64748B', marginTop: 4 }}>→ {next.name}</div>
                        : <div style={{ fontSize: 9, color: rank.color, marginTop: 4 }}>MAX RANK</div>
                      }
                    </div>
                  )
                })}
              </div>
            )}

            {/* Rank legend */}
            <div style={{ marginTop: 20, background: '#0F1520', border: '1px solid #1A2332', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#64748B', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>Rank Tiers</div>
              {RANKS.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #1A233215' }}>
                  <span style={{ color: r.color, fontSize: 14 }}>{r.icon}</span>
                  <span style={{ color: r.color, fontWeight: 700, fontSize: 13, flex: 1 }}>{r.name}</span>
                  <span style={{ color: '#475569', fontSize: 11 }}>Score ≥ {r.min}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOG */}
        {tab === 'log' && (
          <div className="slide-in">
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>LOG A SET</div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20, fontFamily: 'Barlow, sans-serif' }}>Record your lifts and rank up.</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 3, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>Muscle Group</div>
                <select value={logForm.muscle}
                  onChange={e => setLogForm(f => ({ ...f, muscle: e.target.value, exercise: '' }))}
                  style={{ width: '100%', background: '#0F1520', border: '1px solid #1A2332', borderRadius: 8, color: '#E2E8F0', padding: '12px 14px', fontSize: 14 }}>
                  {MUSCLE_GROUPS.map(mg => <option key={mg.id} value={mg.id}>{mg.icon} {mg.name}</option>)}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 10, letterSpacing: 3, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>Exercise</div>
                <select value={logForm.exercise}
                  onChange={e => setLogForm(f => ({ ...f, exercise: e.target.value }))}
                  style={{ width: '100%', background: '#0F1520', border: '1px solid #1A2332', borderRadius: 8, color: '#E2E8F0', padding: '12px 14px', fontSize: 14 }}>
                  <option value="">Select exercise...</option>
                  {MUSCLE_GROUPS.find(m => m.id === logForm.muscle)?.exercises.map(ex => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[['weight', 'WEIGHT (kg)'], ['reps', 'REPS'], ['sets', 'SETS']].map(([field, label]) => (
                  <div key={field}>
                    <div style={{ fontSize: 10, letterSpacing: 3, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                    <input type="number" min="0" value={logForm[field]}
                      onChange={e => setLogForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder="0"
                      style={{ width: '100%', background: '#0F1520', border: '1px solid #1A2332', borderRadius: 8, color: '#E2E8F0', padding: '12px 10px', fontSize: 18, fontWeight: 700, textAlign: 'center' }} />
                  </div>
                ))}
              </div>

              {logForm.weight && logForm.reps && (
                <div style={{ background: '#0F1520', border: '1px solid #1A2332', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748B', letterSpacing: 2 }}>ESTIMATED 1RM</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#EF4444' }}>
                    {Math.round(calc1RM(parseFloat(logForm.weight), parseInt(logForm.reps)))} kg
                  </div>
                </div>
              )}

              <button className="log-btn" onClick={handleLog} disabled={logLoading} style={{
                background: 'linear-gradient(135deg, #EF4444, #DC2626)', border: 'none',
                borderRadius: 10, color: '#fff', padding: '16px', fontSize: 16,
                fontWeight: 800, letterSpacing: 3, cursor: 'pointer', textTransform: 'uppercase',
              }}>
                {logLoading ? <span className="spinner">◈</span> : 'LOG SET'}
              </button>

              {logMsg && (
                <div style={{
                  background: logMsg.startsWith('✓') ? '#064E3B' : '#450A0A',
                  border: `1px solid ${logMsg.startsWith('✓') ? '#10B981' : '#EF4444'}`,
                  borderRadius: 8, padding: 12,
                  color: logMsg.startsWith('✓') ? '#10B981' : '#EF4444',
                  fontSize: 13, textAlign: 'center'
                }}>{logMsg}</div>
              )}
            </div>
          </div>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <div className="slide-in">
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>HISTORY</div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16, fontFamily: 'Barlow, sans-serif' }}>{workouts.length} sessions logged.</div>

            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
              {[['all', 'All'], ...MUSCLE_GROUPS.map(mg => [mg.id, mg.name])].map(([id, label]) => (
                <button key={id} onClick={() => setHistoryFilter(id)} style={{
                  background: historyFilter === id ? '#EF4444' : '#0F1520',
                  border: '1px solid ' + (historyFilter === id ? '#EF4444' : '#1A2332'),
                  borderRadius: 20, color: historyFilter === id ? '#fff' : '#64748B',
                  padding: '6px 14px', fontSize: 11, fontWeight: 700, letterSpacing: 1,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{label}</button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>◈</div>
                <div style={{ fontSize: 14 }}>No sessions yet. Go log some sets.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(s => {
                  const mg = MUSCLE_GROUPS.find(m => m.id === s.muscle)
                  const rm = Math.round(calc1RM(s.weight, s.reps))
                  const dateStr = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  return (
                    <div key={s.id} style={{ background: '#0F1520', border: '1px solid #1A2332', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>{s.exercise}</div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{mg?.icon} {mg?.name} · {dateStr}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{s.weight}kg × {s.reps} × {s.sets}</div>
                          <div style={{ fontSize: 11, color: '#EF4444' }}>1RM ~{rm}kg</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* STATS */}
        {tab === 'stats' && (
          <div className="slide-in">
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>STATS</div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20, fontFamily: 'Barlow, sans-serif' }}>Your strength breakdown.</div>

            {MUSCLE_GROUPS.map(mg => {
              const sessions = byMuscle[mg.id] || []
              const score = scores[mg.id]
              const rank = getRank(score)
              if (sessions.length === 0) return (
                <div key={mg.id} style={{ background: '#0F1520', border: '1px solid #1A2332', borderRadius: 10, padding: 14, marginBottom: 10, opacity: 0.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700 }}>{mg.icon} {mg.name}</span>
                    <span style={{ fontSize: 12, color: '#475569' }}>No data yet</span>
                  </div>
                </div>
              )
              const best1RM = Math.max(...sessions.map(s => calc1RM(s.weight, s.reps)))
              const totalVol = sessions.reduce((sum, s) => sum + s.weight * s.reps * s.sets, 0)
              const topEx = sessions.reduce((acc, s) => { acc[s.exercise] = (acc[s.exercise] || 0) + 1; return acc }, {})
              const favEx = Object.entries(topEx).sort((a, b) => b[1] - a[1])[0]?.[0]
              return (
                <div key={mg.id} style={{ background: rank.bg, border: `1px solid ${rank.color}33`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{mg.icon} {mg.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: rank.color }}>{rank.icon} {rank.name}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      ['Best 1RM', `${Math.round(best1RM)}kg`],
                      ['Total Vol.', `${Math.round(totalVol / 1000)}k kg`],
                      ['Sessions', sessions.length],
                    ].map(([label, val]) => (
                      <div key={label} style={{ background: '#00000033', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#64748B', letterSpacing: 1 }}>{label}</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: rank.color }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  {favEx && <div style={{ marginTop: 8, fontSize: 11, color: '#64748B' }}>Top exercise: <span style={{ color: '#94A3B8' }}>{favEx}</span></div>}
                </div>
              )
            })}

            <div style={{ background: '#0F1520', border: '1px solid #1A2332', borderRadius: 12, padding: 16, marginTop: 8 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: '#64748B', textTransform: 'uppercase', marginBottom: 10 }}>Totals</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Sessions', workouts.length],
                  ['Total Sets', workouts.reduce((s, w) => s + w.sets, 0)],
                  ['Volume', `${Math.round(workouts.reduce((s, w) => s + w.weight * w.reps * w.sets, 0) / 1000)}k kg`],
                  ['Overall Score', Math.round(totalScore)],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: '#080C10', borderRadius: 8, padding: '12px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#64748B', letterSpacing: 1 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #EF4444, transparent)' }} />
    </div>
  )
}
