import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ─── Theme ────────────────────────────────────────────────────────────────────
const DARK = {
  bg:        '#07090F',
  bg2:       '#0D1117',
  bg3:       '#131920',
  border:    '#1C2333',
  border2:   '#242D3D',
  text:      '#F0F4FF',
  text2:     '#8B9EC7',
  text3:     '#4A5578',
  accent:    '#FF3B3B',
  accentDim: '#FF3B3B22',
  card:      '#0D1117',
  input:     '#07090F',
  noise:     'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
}
const LIGHT = {
  bg:        '#F4F6FB',
  bg2:       '#FFFFFF',
  bg3:       '#EEF1F8',
  border:    '#DDE2EF',
  border2:   '#C8CFDF',
  text:      '#0D1117',
  text2:     '#4A5578',
  text3:     '#8B9EC7',
  accent:    '#E02020',
  accentDim: '#E0202015',
  card:      '#FFFFFF',
  input:     '#F4F6FB',
  noise:     'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.025\'/%3E%3C/svg%3E")',
}

// ─── Constants ────────────────────────────────────────────────────────────────
const RANKS = [
  { name:'Beginner',     color:'#6B7280', darkBg:'#1A1E2A', lightBg:'#F1F2F5', min:0,  icon:'◈', gradient:'linear-gradient(135deg,#374151,#4B5563)' },
  { name:'Novice',       color:'#10B981', darkBg:'#052218', lightBg:'#ECFDF5', min:20, icon:'◆', gradient:'linear-gradient(135deg,#064E3B,#10B981)' },
  { name:'Intermediate', color:'#3B82F6', darkBg:'#0C1E3D', lightBg:'#EFF6FF', min:40, icon:'◉', gradient:'linear-gradient(135deg,#1E3A5F,#3B82F6)' },
  { name:'Advanced',     color:'#8B5CF6', darkBg:'#1A0A3D', lightBg:'#F5F3FF', min:60, icon:'✦', gradient:'linear-gradient(135deg,#2E1065,#8B5CF6)' },
  { name:'Elite',        color:'#F59E0B', darkBg:'#2A1400', lightBg:'#FFFBEB', min:80, icon:'★', gradient:'linear-gradient(135deg,#78350F,#F59E0B)' },
  { name:'Legend',       color:'#FF3B3B', darkBg:'#2A0505', lightBg:'#FFF5F5', min:95, icon:'⬡', gradient:'linear-gradient(135deg,#7F1D1D,#FF3B3B)' },
]

const GOALS = [
  { id:'david_laid',   label:'David Laid Aesthetic',    icon:'⚔️',  desc:'Lean, proportional, V-taper physique' },
  { id:'strength',     label:'General Strength',        icon:'💪',  desc:'Build overall strength across all lifts' },
  { id:'powerlifting', label:'Powerlifting',             icon:'🏋️', desc:'Maximize squat, bench, and deadlift' },
  { id:'fat_loss',     label:'Fat Loss / Conditioning', icon:'🔥',  desc:'Burn fat, build endurance and tone' },
  { id:'athlete',      label:'Athlete / Sports',        icon:'🏅',  desc:'Explosive power and athletic performance' },
  { id:'general',      label:'No Specific Goal',        icon:'📊',  desc:'Just track workouts and see progress' },
]

const MUSCLE_GROUPS = [
  { id:'chest',     name:'Chest',     icon:'🫁', exercises:['Bench Press','Incline Bench Press','Decline Bench Press','Dumbbell Fly','Incline Dumbbell Fly','Cable Fly','Cable Crossover','Chest Dip','Push-up','Pec Deck Machine','Smith Machine Bench','Landmine Press'] },
  { id:'back',      name:'Back',      icon:'🔱', exercises:['Deadlift','Barbell Row','Pull-ups','Chin-ups','Lat Pulldown','Seated Cable Row','Single Arm Dumbbell Row','T-Bar Row','Face Pull','Straight Arm Pulldown','Rack Pull','Meadows Row','Cable Pull-over'] },
  { id:'legs',      name:'Legs',      icon:'⚡', exercises:['Squat','Front Squat','Leg Press','Romanian Deadlift','Hack Squat','Lunges','Bulgarian Split Squat','Leg Extension','Leg Curl','Calf Raise','Goblet Squat','Hip Thrust','Sumo Deadlift','Step-ups'] },
  { id:'shoulders', name:'Shoulders', icon:'△',  exercises:['Overhead Press','Arnold Press','Lateral Raise','Face Pull','Front Raise','Rear Delt Fly','Cable Lateral Raise','Dumbbell Shoulder Press','Machine Shoulder Press','Upright Row','Shrugs','Cable Face Pull','Reverse Pec Deck'] },
  { id:'arms',      name:'Arms',      icon:'◎',  exercises:['Barbell Curl','Dumbbell Curl','Hammer Curl','Incline Dumbbell Curl','Cable Curl','Preacher Curl','Tricep Dip','Skull Crusher','Tricep Pushdown','Overhead Tricep Extension','Close Grip Bench Press','Cable Overhead Tricep Extension','Diamond Push-up','Concentration Curl'] },
  { id:'core',      name:'Core',      icon:'◇',  exercises:['Plank','Ab Wheel','Hanging Leg Raise','Cable Crunch','Dragon Flag','Decline Sit-up','Russian Twist','Hollow Body Hold','L-sit','Weighted Crunch','Landmine Twist','Pallof Press','Dead Bug','Bicycle Crunch'] },
]

const PLANS = {
  david_laid: {
    title:'David Laid Aesthetic', subtitle:'Push · Pull · Legs · Upper',
    days:[
      { day:'Day 1',label:'PUSH',focus:'Chest · Shoulders · Triceps',tip:'David Laid prioritizes heavy incline work for upper chest thickness and strict lateral raises for 3D shoulder caps.',exercises:[
        {name:'Incline Bench Press',muscle:'chest',sets:4,reps:'6-8',note:'Primary mass builder — go heavy, full range of motion'},
        {name:'Bench Press',muscle:'chest',sets:3,reps:'8-10',note:'Full chest activation, slight arch, retract scapula'},
        {name:'Cable Fly',muscle:'chest',sets:3,reps:'12-15',note:'Stretch hard at the bottom, squeeze at the top'},
        {name:'Overhead Press',muscle:'shoulders',sets:4,reps:'6-8',note:'Builds shoulder width and mass — press straight up'},
        {name:'Lateral Raise',muscle:'shoulders',sets:4,reps:'15-20',note:'Strict form, lead with elbows, no swinging'},
        {name:'Tricep Pushdown',muscle:'arms',sets:3,reps:'12-15',note:'Full extension at bottom, elbows locked at sides'},
        {name:'Skull Crusher',muscle:'arms',sets:3,reps:'10-12',note:'Keep elbows tucked, lower to forehead slowly'},
      ]},
      { day:'Day 2',label:'PULL',focus:'Back · Biceps · Rear Delts',tip:'David Laid is known for his V-taper. Heavy deadlifts and wide-grip pull-ups are the foundation.',exercises:[
        {name:'Deadlift',muscle:'back',sets:4,reps:'4-6',note:'King of all lifts — brace your core hard'},
        {name:'Pull-ups',muscle:'back',sets:4,reps:'6-10',note:'Wide grip for lat width, full hang at bottom'},
        {name:'Barbell Row',muscle:'back',sets:3,reps:'8-10',note:'Chest to bar, control the eccentric'},
        {name:'Lat Pulldown',muscle:'back',sets:3,reps:'10-12',note:'Full stretch at top, pull to upper chest'},
        {name:'Seated Cable Row',muscle:'back',sets:3,reps:'12-15',note:'Squeeze shoulder blades together'},
        {name:'Barbell Curl',muscle:'arms',sets:3,reps:'8-10',note:'Slow eccentric for bicep peak'},
        {name:'Hammer Curl',muscle:'arms',sets:3,reps:'10-12',note:'Builds brachialis for arm thickness'},
        {name:'Face Pull',muscle:'back',sets:3,reps:'15-20',note:'Rear delt health and width'},
      ]},
      { day:'Day 3',label:'LEGS',focus:'Quads · Hamstrings · Glutes · Calves',tip:'David Laid squats deep with full range of motion. Balanced legs = better overall proportions.',exercises:[
        {name:'Squat',muscle:'legs',sets:4,reps:'6-8',note:'Full depth, chest up, knees track over toes'},
        {name:'Romanian Deadlift',muscle:'legs',sets:4,reps:'8-10',note:'Feel the hamstring stretch at the bottom'},
        {name:'Leg Press',muscle:'legs',sets:3,reps:'10-12',note:'High foot placement for glute activation'},
        {name:'Bulgarian Split Squat',muscle:'legs',sets:3,reps:'10-12',note:'Each leg separately — brutal but effective'},
        {name:'Leg Extension',muscle:'legs',sets:3,reps:'15-20',note:'Squeeze and hold at the top'},
        {name:'Leg Curl',muscle:'legs',sets:3,reps:'12-15',note:'Slow and controlled'},
        {name:'Calf Raise',muscle:'legs',sets:4,reps:'15-20',note:'Full range, pause at bottom'},
      ]},
      { day:'Day 4',label:'UPPER',focus:'Full Upper · Weak Points · Core',tip:'Use this day to bring up weak points. David Laid stays proportional by targeting what needs the most work.',exercises:[
        {name:'Decline Bench Press',muscle:'chest',sets:3,reps:'8-10',note:'Lower chest detail and fullness'},
        {name:'Single Arm Dumbbell Row',muscle:'back',sets:3,reps:'10-12',note:'Full stretch, full contraction'},
        {name:'Arnold Press',muscle:'shoulders',sets:3,reps:'10-12',note:'Great for shoulder roundness'},
        {name:'Cable Lateral Raise',muscle:'shoulders',sets:3,reps:'15-20',note:'Constant tension on medial delt'},
        {name:'Incline Dumbbell Curl',muscle:'arms',sets:3,reps:'10-12',note:'Long head bicep stretch'},
        {name:'Overhead Tricep Extension',muscle:'arms',sets:3,reps:'12-15',note:'Long head stretch — adds mass'},
        {name:'Ab Wheel',muscle:'core',sets:3,reps:'10-15',note:'Control the rollout'},
        {name:'Hanging Leg Raise',muscle:'core',sets:3,reps:'12-15',note:'No swinging, curl hips up'},
      ]},
    ]
  },
  strength:{title:'General Strength',subtitle:'Upper · Lower split',days:[
    {day:'Day 1',label:'UPPER A',focus:'Chest · Back · Shoulders heavy',tip:'Focus on progressive overload. Add weight every session.',exercises:[
      {name:'Bench Press',muscle:'chest',sets:4,reps:'5',note:'Work up to a heavy top set'},
      {name:'Barbell Row',muscle:'back',sets:4,reps:'5',note:'Match your bench weight over time'},
      {name:'Overhead Press',muscle:'shoulders',sets:3,reps:'5',note:'Strict press, no leg drive'},
      {name:'Pull-ups',muscle:'back',sets:3,reps:'6-8',note:'Add weight when you can do 10+'},
      {name:'Dumbbell Curl',muscle:'arms',sets:3,reps:'10-12',note:'Controlled reps'},
      {name:'Tricep Pushdown',muscle:'arms',sets:3,reps:'10-12',note:'Full extension each rep'},
    ]},
    {day:'Day 2',label:'LOWER A',focus:'Squat · Hamstrings heavy',tip:'Squat is the king of lower body strength.',exercises:[
      {name:'Squat',muscle:'legs',sets:4,reps:'5',note:'Top set heavy, back off sets'},
      {name:'Romanian Deadlift',muscle:'legs',sets:3,reps:'8',note:'Hamstring focus'},
      {name:'Leg Press',muscle:'legs',sets:3,reps:'10',note:'Volume work after squats'},
      {name:'Leg Curl',muscle:'legs',sets:3,reps:'10-12',note:'Controlled eccentric'},
      {name:'Calf Raise',muscle:'legs',sets:4,reps:'15',note:'Full range'},
      {name:'Plank',muscle:'core',sets:3,reps:'60s',note:'Brace hard'},
    ]},
    {day:'Day 3',label:'UPPER B',focus:'Chest · Back · Arms volume',tip:'Today is volume day — more reps, build muscle.',exercises:[
      {name:'Incline Bench Press',muscle:'chest',sets:4,reps:'8-10',note:'Upper chest development'},
      {name:'Lat Pulldown',muscle:'back',sets:4,reps:'8-10',note:'Lat width'},
      {name:'Cable Fly',muscle:'chest',sets:3,reps:'12-15',note:'Chest pump'},
      {name:'Seated Cable Row',muscle:'back',sets:3,reps:'10-12',note:'Mid back thickness'},
      {name:'Barbell Curl',muscle:'arms',sets:3,reps:'10',note:'Heavy curl'},
      {name:'Skull Crusher',muscle:'arms',sets:3,reps:'10',note:'Tricep mass'},
    ]},
    {day:'Day 4',label:'LOWER B',focus:'Deadlift · Quads volume',tip:'Deadlift is the most complete strength movement.',exercises:[
      {name:'Deadlift',muscle:'back',sets:4,reps:'5',note:'Heaviest lift of the week'},
      {name:'Front Squat',muscle:'legs',sets:3,reps:'6-8',note:'Quad dominant, builds core too'},
      {name:'Leg Extension',muscle:'legs',sets:3,reps:'12-15',note:'Quad isolation'},
      {name:'Hip Thrust',muscle:'legs',sets:3,reps:'10-12',note:'Glute strength'},
      {name:'Calf Raise',muscle:'legs',sets:3,reps:'15',note:'Full range'},
      {name:'Ab Wheel',muscle:'core',sets:3,reps:'10',note:'Core stability'},
    ]},
  ]},
  powerlifting:{title:'Powerlifting',subtitle:'Squat · Bench · Deadlift focus',days:[
    {day:'Day 1',label:'SQUAT',focus:'Squat heavy · Accessory work',tip:'Every accessory exists to serve the big three.',exercises:[
      {name:'Squat',muscle:'legs',sets:5,reps:'3-5',note:'Working up to max effort sets'},
      {name:'Leg Press',muscle:'legs',sets:3,reps:'10',note:'Volume for quad strength'},
      {name:'Romanian Deadlift',muscle:'legs',sets:3,reps:'8',note:'Posterior chain accessory'},
      {name:'Leg Curl',muscle:'legs',sets:3,reps:'10-12',note:'Hamstring health'},
      {name:'Ab Wheel',muscle:'core',sets:4,reps:'10',note:'Core stability is everything in squat'},
    ]},
    {day:'Day 2',label:'BENCH',focus:'Bench heavy · Tricep accessories',tip:'Triceps are 60% of your bench.',exercises:[
      {name:'Bench Press',muscle:'chest',sets:5,reps:'3-5',note:'Competition grip, leg drive, arch'},
      {name:'Close Grip Bench Press',muscle:'arms',sets:3,reps:'6-8',note:'Tricep strength for lockout'},
      {name:'Tricep Pushdown',muscle:'arms',sets:4,reps:'10-12',note:'High volume tricep work'},
      {name:'Skull Crusher',muscle:'arms',sets:3,reps:'8-10',note:'Long head tricep'},
      {name:'Overhead Press',muscle:'shoulders',sets:3,reps:'8',note:'Shoulder health'},
      {name:'Face Pull',muscle:'back',sets:3,reps:'15',note:'Rotator cuff health'},
    ]},
    {day:'Day 3',label:'DEADLIFT',focus:'Deadlift heavy · Back accessories',tip:'The deadlift is the ultimate test of total body strength.',exercises:[
      {name:'Deadlift',muscle:'back',sets:5,reps:'2-4',note:'Max effort — brace and drive'},
      {name:'Rack Pull',muscle:'back',sets:3,reps:'5',note:'Overload the lockout'},
      {name:'Barbell Row',muscle:'back',sets:4,reps:'6-8',note:'Back thickness'},
      {name:'Lat Pulldown',muscle:'back',sets:3,reps:'10',note:'Lats stay tight in deadlift'},
      {name:'Hanging Leg Raise',muscle:'core',sets:3,reps:'12',note:'Core bracing practice'},
    ]},
    {day:'Day 4',label:'ACCESSORY',focus:'Weak points · Volume',tip:'Address what is limiting your big three lifts.',exercises:[
      {name:'Front Squat',muscle:'legs',sets:3,reps:'5',note:'Quad and core strength'},
      {name:'Incline Bench Press',muscle:'chest',sets:3,reps:'8',note:'Upper chest for bench'},
      {name:'Sumo Deadlift',muscle:'legs',sets:3,reps:'5',note:'Hip and glute strength'},
      {name:'Overhead Tricep Extension',muscle:'arms',sets:3,reps:'12',note:'Tricep lockout strength'},
      {name:'Barbell Curl',muscle:'arms',sets:3,reps:'10',note:'Bicep tendon health'},
      {name:'Pallof Press',muscle:'core',sets:3,reps:'12',note:'Anti-rotation core stability'},
    ]},
  ]},
  fat_loss:{title:'Fat Loss / Conditioning',subtitle:'Full body circuit style',days:[
    {day:'Day 1',label:'FULL A',focus:'Compound lifts · High volume',tip:'Keep rest short (60-90 sec). Keep heart rate elevated.',exercises:[
      {name:'Squat',muscle:'legs',sets:4,reps:'12-15',note:'Moderate weight, keep moving'},
      {name:'Bench Press',muscle:'chest',sets:3,reps:'12',note:'Controlled reps, short rest'},
      {name:'Barbell Row',muscle:'back',sets:3,reps:'12',note:'Full range, squeeze at top'},
      {name:'Overhead Press',muscle:'shoulders',sets:3,reps:'12',note:'Strict form'},
      {name:'Plank',muscle:'core',sets:3,reps:'45s',note:'Brace throughout'},
      {name:'Bicycle Crunch',muscle:'core',sets:3,reps:'20',note:'Core burn'},
    ]},
    {day:'Day 2',label:'UPPER',focus:'Upper body · Arms · Shoulders',tip:'Higher reps burn more calories.',exercises:[
      {name:'Incline Bench Press',muscle:'chest',sets:3,reps:'12-15',note:'Chest pump'},
      {name:'Lat Pulldown',muscle:'back',sets:3,reps:'12-15',note:'Back width'},
      {name:'Lateral Raise',muscle:'shoulders',sets:4,reps:'15-20',note:'Medial delt burn'},
      {name:'Cable Fly',muscle:'chest',sets:3,reps:'15',note:'Stretch and squeeze'},
      {name:'Dumbbell Curl',muscle:'arms',sets:3,reps:'15',note:'High rep pump'},
      {name:'Tricep Pushdown',muscle:'arms',sets:3,reps:'15',note:'Keep moving'},
    ]},
    {day:'Day 3',label:'LOWER',focus:'Legs · Glutes · Calves',tip:'Legs burn the most calories of any muscle group.',exercises:[
      {name:'Romanian Deadlift',muscle:'legs',sets:4,reps:'12',note:'Hamstring focus'},
      {name:'Leg Press',muscle:'legs',sets:3,reps:'15',note:'High rep, short rest'},
      {name:'Bulgarian Split Squat',muscle:'legs',sets:3,reps:'12',note:'Each leg'},
      {name:'Leg Extension',muscle:'legs',sets:3,reps:'15-20',note:'Quad burn'},
      {name:'Leg Curl',muscle:'legs',sets:3,reps:'15',note:'Hamstring burn'},
      {name:'Calf Raise',muscle:'legs',sets:4,reps:'20',note:'High rep calves'},
    ]},
    {day:'Day 4',label:'FULL B',focus:'Full body · Circuit · Core',tip:'Finish the week strong. Push the pace today.',exercises:[
      {name:'Deadlift',muscle:'back',sets:3,reps:'10',note:'Moderate weight, full body activation'},
      {name:'Push-up',muscle:'chest',sets:3,reps:'15-20',note:'Bodyweight burn'},
      {name:'Pull-ups',muscle:'back',sets:3,reps:'8-10',note:'As many as possible'},
      {name:'Goblet Squat',muscle:'legs',sets:3,reps:'15',note:'Light and fast'},
      {name:'Ab Wheel',muscle:'core',sets:3,reps:'12',note:'Full rollout'},
      {name:'Hanging Leg Raise',muscle:'core',sets:3,reps:'15',note:'Core finisher'},
    ]},
  ]},
  athlete:{title:'Athlete / Sports',subtitle:'Power · Strength · Conditioning',days:[
    {day:'Day 1',label:'POWER',focus:'Explosive strength · Lower body',tip:'Athletic performance is built on power.',exercises:[
      {name:'Squat',muscle:'legs',sets:5,reps:'4-6',note:'Explode up, controlled down'},
      {name:'Romanian Deadlift',muscle:'legs',sets:3,reps:'6-8',note:'Hip hinge power'},
      {name:'Hip Thrust',muscle:'legs',sets:4,reps:'8-10',note:'Glute power for sprinting'},
      {name:'Leg Extension',muscle:'legs',sets:3,reps:'12',note:'Quad isolation'},
      {name:'Calf Raise',muscle:'legs',sets:4,reps:'15',note:'Ankle power'},
      {name:'Pallof Press',muscle:'core',sets:3,reps:'12',note:'Anti-rotation stability'},
    ]},
    {day:'Day 2',label:'UPPER PWR',focus:'Pressing · Pulling · Rotational',tip:'Upper body power translates directly to sports.',exercises:[
      {name:'Bench Press',muscle:'chest',sets:4,reps:'5',note:'Explosive press'},
      {name:'Barbell Row',muscle:'back',sets:4,reps:'5',note:'Explosive pull'},
      {name:'Overhead Press',muscle:'shoulders',sets:3,reps:'6-8',note:'Overhead power'},
      {name:'Pull-ups',muscle:'back',sets:3,reps:'6-8',note:'Relative strength'},
      {name:'Face Pull',muscle:'back',sets:3,reps:'15',note:'Shoulder health'},
      {name:'Ab Wheel',muscle:'core',sets:3,reps:'10',note:'Core transfer of power'},
    ]},
    {day:'Day 3',label:'STRENGTH',focus:'Deadlift · Heavy compounds',tip:'Strength is the foundation of all athletic qualities.',exercises:[
      {name:'Deadlift',muscle:'back',sets:4,reps:'4-5',note:'Max strength focus'},
      {name:'Front Squat',muscle:'legs',sets:3,reps:'5',note:'Quad and core strength'},
      {name:'Barbell Row',muscle:'back',sets:3,reps:'6',note:'Back thickness'},
      {name:'Overhead Press',muscle:'shoulders',sets:3,reps:'6',note:'Shoulder pressing strength'},
      {name:'Barbell Curl',muscle:'arms',sets:3,reps:'8',note:'Elbow flexor strength'},
      {name:'Hanging Leg Raise',muscle:'core',sets:3,reps:'12',note:'Hip flexor strength'},
    ]},
    {day:'Day 4',label:'CONDITION',focus:'Volume · Weak points · Core',tip:'Improve ability to repeat high-quality efforts.',exercises:[
      {name:'Bulgarian Split Squat',muscle:'legs',sets:3,reps:'10',note:'Single leg power'},
      {name:'Incline Bench Press',muscle:'chest',sets:3,reps:'10',note:'Upper chest pressing'},
      {name:'Lat Pulldown',muscle:'back',sets:3,reps:'10',note:'Lat strength'},
      {name:'Lateral Raise',muscle:'shoulders',sets:3,reps:'15',note:'Shoulder stability'},
      {name:'Hammer Curl',muscle:'arms',sets:3,reps:'12',note:'Grip and arm strength'},
      {name:'Dragon Flag',muscle:'core',sets:3,reps:'6-8',note:'Full core strength'},
    ]},
  ]},
  general:{title:'No Specific Goal',subtitle:'Balanced 4-day program',days:[
    {day:'Day 1',label:'PUSH',focus:'Chest · Shoulders · Triceps',tip:'Just show up, work hard, log your sets.',exercises:[
      {name:'Bench Press',muscle:'chest',sets:3,reps:'8-10',note:'Standard chest press'},
      {name:'Incline Bench Press',muscle:'chest',sets:3,reps:'10',note:'Upper chest'},
      {name:'Overhead Press',muscle:'shoulders',sets:3,reps:'8-10',note:'Shoulder press'},
      {name:'Lateral Raise',muscle:'shoulders',sets:3,reps:'15',note:'Side delts'},
      {name:'Tricep Pushdown',muscle:'arms',sets:3,reps:'12',note:'Tricep isolation'},
      {name:'Cable Fly',muscle:'chest',sets:3,reps:'12',note:'Chest finisher'},
    ]},
    {day:'Day 2',label:'PULL',focus:'Back · Biceps',tip:'Focus on feeling the muscles work.',exercises:[
      {name:'Deadlift',muscle:'back',sets:3,reps:'6-8',note:'Hinge movement'},
      {name:'Barbell Row',muscle:'back',sets:3,reps:'8-10',note:'Horizontal pull'},
      {name:'Lat Pulldown',muscle:'back',sets:3,reps:'10-12',note:'Vertical pull'},
      {name:'Seated Cable Row',muscle:'back',sets:3,reps:'12',note:'Mid back'},
      {name:'Barbell Curl',muscle:'arms',sets:3,reps:'10',note:'Bicep curl'},
      {name:'Hammer Curl',muscle:'arms',sets:3,reps:'12',note:'Brachialis'},
    ]},
    {day:'Day 3',label:'LEGS',focus:'Quads · Hamstrings · Glutes',tip:'Leg day is non-negotiable.',exercises:[
      {name:'Squat',muscle:'legs',sets:4,reps:'8-10',note:'Full depth squat'},
      {name:'Romanian Deadlift',muscle:'legs',sets:3,reps:'10',note:'Hamstrings'},
      {name:'Leg Press',muscle:'legs',sets:3,reps:'12',note:'Quad volume'},
      {name:'Leg Extension',muscle:'legs',sets:3,reps:'15',note:'Quad isolation'},
      {name:'Leg Curl',muscle:'legs',sets:3,reps:'12',note:'Hamstring isolation'},
      {name:'Calf Raise',muscle:'legs',sets:3,reps:'15',note:'Calves'},
    ]},
    {day:'Day 4',label:'UPPER',focus:'Full Upper · Core',tip:'Use this day for anything that needs more work.',exercises:[
      {name:'Pull-ups',muscle:'back',sets:3,reps:'6-10',note:'Bodyweight pull'},
      {name:'Dumbbell Shoulder Press',muscle:'shoulders',sets:3,reps:'10',note:'Shoulder press'},
      {name:'Dumbbell Curl',muscle:'arms',sets:3,reps:'12',note:'Bicep'},
      {name:'Skull Crusher',muscle:'arms',sets:3,reps:'12',note:'Tricep'},
      {name:'Cable Fly',muscle:'chest',sets:3,reps:'12',note:'Chest detail'},
      {name:'Ab Wheel',muscle:'core',sets:3,reps:'10',note:'Core'},
      {name:'Hanging Leg Raise',muscle:'core',sets:3,reps:'12',note:'Core finisher'},
    ]},
  ]},
}

const DAYS_OF_WEEK = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const AVATAR_COLORS = ['#EF4444','#F59E0B','#10B981','#3B82F6','#8B5CF6','#EC4899','#06B6D4','#84CC16']

// ─── Adaptive plan helper ─────────────────────────────────────────────────────
function getActiveDays(planDays, n) {
  if (n<=0) return []
  const t = planDays.length
  if (n >= t) { return Array.from({length:n},(_,i)=>({...planDays[i%t],day:`Day ${i+1}`})) }
  const idx = {1:[0],2:[0,1],3:[0,1,2],4:[0,1,2,3],5:[0,1,2,3,1],6:[0,1,2,0,1,2],7:[0,1,2,3,0,1,2]}
  return (idx[n]||Array.from({length:n},(_,i)=>i%t)).map((k,i)=>({...planDays[k],day:`Day ${i+1}`}))
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calc1RM(w,r){ return r===1?w:w*(36/(37-r)) }
function calcScore(sessions){
  if(!sessions||sessions.length===0) return 0
  const b1=Math.max(...sessions.map(s=>calc1RM(s.weight,s.reps)))
  const bv=Math.max(...sessions.map(s=>s.weight*s.reps*s.sets))
  return Math.min((b1/200)*100,100)*0.6+Math.min((bv/10000)*100,100)*0.4
}
function getRank(score){ for(let i=RANKS.length-1;i>=0;i--) if(score>=RANKS[i].min) return RANKS[i]; return RANKS[0] }
function getNextRank(score){ for(let i=0;i<RANKS.length;i++) if(score<RANKS[i].min) return RANKS[i]; return null }
function cvt(kg,unit){ return unit==='lbs'?Math.round(kg*2.205*10)/10:Math.round(kg*10)/10 }
function avatarColor(name){ let h=0;for(let i=0;i<name.length;i++)h=name.charCodeAt(i)+((h<<5)-h);return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length] }

const SETTINGS_KEY='arise_settings_v1'
const SESSION_KEY='arise_session_v1'
function loadSettings(){
  try{
    const s=JSON.parse(localStorage.getItem(SETTINGS_KEY))
    return s?{unit:'kg',trainingDays:['Mon','Tue','Thu','Fri'],ownSplit:false,darkMode:true,...s}:{unit:'kg',trainingDays:['Mon','Tue','Thu','Fri'],ownSplit:false,darkMode:true}
  }catch{return{unit:'kg',trainingDays:['Mon','Tue','Thu','Fri'],ownSplit:false,darkMode:true}}
}
function loadSession(){
  try{return JSON.parse(localStorage.getItem(SESSION_KEY))||null}catch{return null}
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}
  input,select,button{font-family:'Rajdhani',sans-serif;outline:none;}
  input:focus,select:focus{border-color:var(--accent)!important;box-shadow:0 0 0 2px var(--accent-dim);}

  .arise-bg {
    background: var(--bg);
    background-image: var(--noise);
    min-height: 100vh;
    color: var(--text);
    font-family: 'Rajdhani', sans-serif;
    transition: background 0.3s, color 0.3s;
  }

  /* Rank badge glow */
  @keyframes rankGlow {
    0%,100% { box-shadow: 0 0 8px var(--rc), 0 0 20px var(--rc-dim); }
    50%      { box-shadow: 0 0 14px var(--rc), 0 0 35px var(--rc-dim); }
  }
  .rank-glow { animation: rankGlow 2.5s ease-in-out infinite; }

  /* Bar fill */
  @keyframes barFill { from{width:0} to{width:var(--pct)} }
  .bar-fill { animation: barFill 1.2s cubic-bezier(0.4,0,0.2,1) forwards; }

  /* Streak on bar */
  @keyframes streak {
    0%   { left: -40%; opacity: 0; }
    20%  { opacity: 0.6; }
    80%  { opacity: 0.3; }
    100% { left: 120%; opacity: 0; }
  }
  .bar-streak { animation: streak 1.8s ease-in-out forwards; animation-delay: 0.8s; }

  /* Slide in */
  @keyframes slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  .slide-up { animation: slideUp 0.35s ease forwards; }

  /* Stagger children */
  .stagger > * { opacity: 0; animation: slideUp 0.3s ease forwards; }
  .stagger > *:nth-child(1){animation-delay:0.05s}
  .stagger > *:nth-child(2){animation-delay:0.10s}
  .stagger > *:nth-child(3){animation-delay:0.15s}
  .stagger > *:nth-child(4){animation-delay:0.20s}
  .stagger > *:nth-child(5){animation-delay:0.25s}
  .stagger > *:nth-child(6){animation-delay:0.30s}

  /* Logged flash */
  @keyframes logFlash {
    0%   { opacity:0; transform:scale(0.85); }
    20%  { opacity:1; transform:scale(1.04); }
    80%  { opacity:1; transform:scale(1); }
    100% { opacity:0; transform:scale(0.97); }
  }
  .log-flash { animation: logFlash 2s ease forwards; }

  /* Spin */
  @keyframes spin { to{transform:rotate(360deg)} }
  .spin { animation: spin 1s linear infinite; display:inline-block; }

  /* Card hover */
  .hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
  .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.35); }

  /* Button */
  .btn-press { transition: all 0.15s; cursor:pointer; }
  .btn-press:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px); }
  .btn-press:active:not(:disabled) { transform: scale(0.97); }
  .btn-press:disabled { opacity:.5; cursor:not-allowed; }

  /* Tab */
  .tab-item { transition: all 0.2s; cursor:pointer; }
  .tab-item:hover { opacity: 0.8; }

  /* Noise overlay */
  .noise-overlay {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image: var(--noise);
    opacity: 1;
  }

  /* Pulse dot */
  @keyframes pulseDot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0.6} }
  .pulse-dot { animation: pulseDot 2s ease-in-out infinite; }

  /* Hero grid lines */
  .hero-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 40px 40px;
    opacity: 0.3;
    mask-image: radial-gradient(ellipse at center top, black 0%, transparent 70%);
  }
`

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser,setCurrentUser] = useState(loadSession)
  const [screen,setScreen]           = useState('login')
  const [users,setUsers]             = useState([])
  const [authForm,setAuthForm]       = useState({name:'',pin:'',confirmPin:'',goal:'david_laid'})
  const [authMsg,setAuthMsg]         = useState('')
  const [authLoading,setAuthLoading] = useState(false)
  const [selectedUser,setSelectedUser] = useState(null)
  const [pendingUser,setPendingUser]   = useState(null)
  const [settings,setSettings]        = useState(loadSettings)

  const T = settings.darkMode ? DARK : LIGHT

  const fetchUsers = useCallback(async()=>{
    const{data}=await supabase.from('users').select('id,name,goal').order('name')
    if(data) setUsers(data)
  },[])

  useEffect(()=>{fetchUsers()},[fetchUsers])
  useEffect(()=>{
    if(currentUser){localStorage.setItem(SESSION_KEY,JSON.stringify(currentUser));setScreen('app')}
    else{localStorage.removeItem(SESSION_KEY);setScreen('login')}
  },[currentUser])
  useEffect(()=>{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings))},[settings])

  async function handleRegister(){
    const{name,pin,confirmPin,goal}=authForm
    if(!name.trim()||!pin){setAuthMsg('Enter a name and PIN.');return}
    if(pin.length<4){setAuthMsg('PIN must be at least 4 digits.');return}
    if(pin!==confirmPin){setAuthMsg('PINs do not match.');return}
    setAuthLoading(true)
    const id=name.trim().toLowerCase().replace(/\s+/g,'-')+'-'+Date.now()
    const{error}=await supabase.from('users').insert([{id,name:name.trim(),pin,goal}])
    if(error){setAuthMsg('Error creating account. Try again.');setAuthLoading(false);return}
    setPendingUser({id,name:name.trim(),goal})
    setScreen('calibrate')
    setAuthLoading(false)
  }

  async function handleLogin(userId){
    const{pin}=authForm
    if(!pin){setAuthMsg('Enter your PIN.');return}
    setAuthLoading(true)
    const{data,error}=await supabase.from('users').select('*').eq('id',userId).eq('pin',pin).single()
    if(error||!data){setAuthMsg('Wrong PIN. Try again.');setAuthLoading(false);return}
    setCurrentUser({id:data.id,name:data.name,goal:data.goal||'general'})
    setAuthMsg('');setAuthLoading(false)
  }

  function handleLogout(){
    setCurrentUser(null)
    setAuthForm({name:'',pin:'',confirmPin:'',goal:'david_laid'})
    setAuthMsg('');setSelectedUser(null)
  }

  // CSS variables for theme
  const cssVars = {
    '--bg':T.bg,'--bg2':T.bg2,'--bg3':T.bg3,
    '--border':T.border,'--border2':T.border2,
    '--text':T.text,'--text2':T.text2,'--text3':T.text3,
    '--accent':T.accent,'--accent-dim':T.accentDim,
    '--card':T.card,'--input':T.input,'--noise':T.noise,
  }

  if(screen==='app'&&currentUser) return (
    <MainApp currentUser={currentUser} onLogout={handleLogout} allUsers={users}
      settings={settings} setSettings={setSettings} T={T} cssVars={cssVars}
      onRecalibrate={()=>{setPendingUser(currentUser);setScreen('calibrate')}} />
  )
  if(screen==='calibrate'&&pendingUser) return (
    <CalibrationScreen user={pendingUser} T={T} cssVars={cssVars}
      onDone={u=>{setCurrentUser(u);setPendingUser(null)}}
      onSkip={u=>{setCurrentUser(u);setPendingUser(null)}} />
  )

  return (
    <div className="arise-bg" style={{...cssVars,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:24,position:'relative',overflow:'hidden'}}>
      <style>{GLOBAL_CSS}</style>
      <div className="hero-grid" />

      <div style={{width:'100%',maxWidth:420,position:'relative',zIndex:1}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:72,letterSpacing:8,color:T.text,lineHeight:0.9,textShadow:T.darkMode?'0 0 40px rgba(255,59,59,0.3)':'none'}}>
            ARISE
          </div>
          <div style={{fontSize:11,letterSpacing:6,color:T.accent,fontWeight:700,textTransform:'uppercase',marginTop:6}}>Physique Tracker</div>
          <div style={{width:40,height:2,background:T.accent,margin:'10px auto 0',borderRadius:1}} />
        </div>

        {/* Theme toggle on auth screen */}
        <div style={{position:'absolute',top:0,right:0}}>
          <button onClick={()=>setSettings(s=>({...s,darkMode:!s.darkMode}))} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:20,padding:'6px 12px',cursor:'pointer',fontSize:14,color:T.text2}}>
            {settings.darkMode?'☀️':'🌙'}
          </button>
        </div>

        {!selectedUser ? (
          <div>
            <div style={{fontSize:11,color:T.text3,letterSpacing:3,textTransform:'uppercase',marginBottom:12}}>Select Profile</div>
            {users.length===0
              ?<div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:16,padding:24,textAlign:'center',color:T.text3,marginBottom:16,fontSize:14}}>No accounts yet. Create the first one below.</div>
              :<div className="stagger" style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
                {users.map(u=>{
                  const goal=GOALS.find(g=>g.id===(u.goal||'general'))
                  return(
                    <button key={u.id} className="btn-press hover-lift" onClick={()=>{setSelectedUser(u);setAuthForm(f=>({...f,pin:''}));setAuthMsg('')}}
                      style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:'14px 16px',display:'flex',alignItems:'center',gap:12,textAlign:'left',width:'100%',cursor:'pointer'}}>
                      <div style={{width:44,height:44,borderRadius:22,background:avatarColor(u.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'#fff',flexShrink:0,fontFamily:'Bebas Neue',letterSpacing:1}}>{u.name[0].toUpperCase()}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:17,fontWeight:700,color:T.text,fontFamily:'Rajdhani'}}>{u.name}</div>
                        <div style={{fontSize:12,color:T.text3}}>{goal?.icon} {goal?.label}</div>
                      </div>
                      <div style={{color:T.text3,fontSize:22}}>›</div>
                    </button>
                  )
                })}
              </div>
            }
            {screen==='register'?(
              <RegisterForm authForm={authForm} setAuthForm={setAuthForm} authMsg={authMsg} authLoading={authLoading} onRegister={handleRegister} onBack={()=>{setScreen('login');setAuthMsg('')}} T={T} />
            ):(
              <button className="btn-press" onClick={()=>{setScreen('register');setAuthMsg('');setSelectedUser(null)}}
                style={{width:'100%',background:'transparent',border:`1px solid ${T.border}`,borderRadius:10,color:T.text3,padding:13,fontSize:13,fontWeight:700,letterSpacing:2}}>
                CREATE NEW ACCOUNT
              </button>
            )}
          </div>
        ):(
          <div>
            <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:16,padding:20,marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
                <div style={{width:48,height:48,borderRadius:24,background:avatarColor(selectedUser.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:700,color:'#fff',fontFamily:'Bebas Neue',letterSpacing:1}}>{selectedUser.name[0].toUpperCase()}</div>
                <div>
                  <div style={{fontSize:20,fontWeight:700,color:T.text}}>{selectedUser.name}</div>
                  <button onClick={()=>{setSelectedUser(null);setAuthMsg('')}} style={{background:'none',border:'none',color:T.text3,fontSize:12,cursor:'pointer',padding:0,fontFamily:'Rajdhani',letterSpacing:1}}>← Back</button>
                </div>
              </div>
              <div style={{fontSize:11,letterSpacing:3,color:T.text3,textTransform:'uppercase',marginBottom:8}}>PIN</div>
              <input type="password" inputMode="numeric" maxLength={8} placeholder="••••"
                value={authForm.pin} onChange={e=>setAuthForm(f=>({...f,pin:e.target.value}))}
                onKeyDown={e=>e.key==='Enter'&&handleLogin(selectedUser.id)}
                style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'14px',fontSize:28,letterSpacing:10,textAlign:'center',marginBottom:14}} />
              {authMsg&&<div style={{color:T.accent,fontSize:13,marginBottom:12,textAlign:'center'}}>{authMsg}</div>}
              <button className="btn-press" onClick={()=>handleLogin(selectedUser.id)} disabled={authLoading}
                style={{width:'100%',background:T.accent,border:'none',borderRadius:10,color:'#fff',padding:14,fontSize:16,fontWeight:700,letterSpacing:3}}>
                {authLoading?<span className="spin">◈</span>:'SIGN IN'}
              </button>
            </div>
            <button className="btn-press" onClick={()=>{setScreen('register');setSelectedUser(null);setAuthMsg('')}}
              style={{width:'100%',background:'transparent',border:`1px solid ${T.border}`,borderRadius:10,color:T.text3,padding:12,fontSize:13,fontWeight:700,letterSpacing:2}}>
              CREATE NEW ACCOUNT
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function RegisterForm({authForm,setAuthForm,authMsg,authLoading,onRegister,onBack,T}){
  return(
    <div className="slide-up" style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:16,padding:20,marginTop:12}}>
      <div style={{fontSize:20,fontWeight:700,color:T.text,marginBottom:4}}>Create Account</div>
      <div style={{fontSize:13,color:T.text3,marginBottom:20,fontFamily:'Inter'}}>Set up your profile and choose your goal.</div>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div>
          <div style={{fontSize:11,letterSpacing:3,color:T.text3,textTransform:'uppercase',marginBottom:6}}>Name</div>
          <input placeholder="Your name" value={authForm.name} onChange={e=>setAuthForm(f=>({...f,name:e.target.value}))}
            style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'12px 14px',fontSize:16}} />
        </div>
        <div>
          <div style={{fontSize:11,letterSpacing:3,color:T.text3,textTransform:'uppercase',marginBottom:8}}>Goal</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {GOALS.map(g=>(
              <button key={g.id} onClick={()=>setAuthForm(f=>({...f,goal:g.id}))}
                style={{background:authForm.goal===g.id?T.accentDim:T.input,border:`1px solid ${authForm.goal===g.id?T.accent:T.border}`,borderRadius:10,padding:'10px 12px',display:'flex',alignItems:'center',gap:10,textAlign:'left',width:'100%',cursor:'pointer',transition:'all 0.15s'}}>
                <span style={{fontSize:18}}>{g.icon}</span>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:authForm.goal===g.id?T.accent:T.text}}>{g.label}</div>
                  <div style={{fontSize:11,color:T.text3,fontFamily:'Inter'}}>{g.desc}</div>
                </div>
                {authForm.goal===g.id&&<span style={{marginLeft:'auto',color:T.accent,fontSize:16}}>✓</span>}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontSize:11,letterSpacing:3,color:T.text3,textTransform:'uppercase',marginBottom:6}}>PIN (4-8 digits)</div>
          <input type="password" inputMode="numeric" maxLength={8} placeholder="••••" value={authForm.pin} onChange={e=>setAuthForm(f=>({...f,pin:e.target.value}))}
            style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'12px 14px',fontSize:24,letterSpacing:8,textAlign:'center'}} />
        </div>
        <div>
          <div style={{fontSize:11,letterSpacing:3,color:T.text3,textTransform:'uppercase',marginBottom:6}}>Confirm PIN</div>
          <input type="password" inputMode="numeric" maxLength={8} placeholder="••••" value={authForm.confirmPin} onChange={e=>setAuthForm(f=>({...f,confirmPin:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&onRegister()}
            style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'12px 14px',fontSize:24,letterSpacing:8,textAlign:'center'}} />
        </div>
        {authMsg&&<div style={{color:T.accent,fontSize:13,textAlign:'center'}}>{authMsg}</div>}
        <button className="btn-press" onClick={onRegister} disabled={authLoading}
          style={{background:T.accent,border:'none',borderRadius:10,color:'#fff',padding:14,fontSize:16,fontWeight:700,letterSpacing:3}}>
          {authLoading?'...':'CREATE ACCOUNT'}
        </button>
        <button className="btn-press" onClick={onBack}
          style={{background:'transparent',border:'none',color:T.text3,fontSize:12,fontWeight:700,letterSpacing:1,padding:4,cursor:'pointer'}}>
          ← Back to login
        </button>
      </div>
    </div>
  )
}

// ─── Calibration Screen ───────────────────────────────────────────────────────
function CalibrationScreen({user,T,cssVars,onDone,onSkip}){
  const [lifts,setLifts]   = useState({})
  const [saving,setSaving] = useState(false)
  const [step,setStep]     = useState(0)

  const CALIB=[
    {muscle:'chest',     name:'Bench Press',      placeholder:'e.g. 80'},
    {muscle:'back',      name:'Deadlift',          placeholder:'e.g. 100'},
    {muscle:'legs',      name:'Squat',             placeholder:'e.g. 90'},
    {muscle:'shoulders', name:'Overhead Press',    placeholder:'e.g. 60'},
    {muscle:'arms',      name:'Barbell Curl',      placeholder:'e.g. 40'},
    {muscle:'core',      name:'Hanging Leg Raise', placeholder:'reps only'},
  ]

  async function handleSave(){
    setSaving(true)
    const rows=Object.entries(lifts).filter(([,v])=>v&&parseFloat(v)>0).map(([muscle,weight])=>{
      const ex=CALIB.find(e=>e.muscle===muscle)
      return{user_id:user.id,muscle,exercise:ex?.name||muscle,weight:parseFloat(weight),reps:1,sets:1}
    })
    if(rows.length>0) await supabase.from('workouts').insert(rows)
    setSaving(false)
    onDone(user)
  }

  if(step===0) return(
    <div className="arise-bg" style={{...cssVars,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:24,position:'relative',overflow:'hidden'}}>
      <style>{GLOBAL_CSS}</style>
      <div className="hero-grid" />
      <div style={{width:'100%',maxWidth:400,textAlign:'center',position:'relative',zIndex:1}}>
        <div style={{fontSize:64,marginBottom:16}}>🏋️</div>
        <div style={{fontFamily:'Bebas Neue',fontSize:36,letterSpacing:4,color:T.text,marginBottom:8}}>Welcome, {user.name}</div>
        <div style={{fontSize:15,color:T.text2,fontFamily:'Inter',lineHeight:1.7,marginBottom:32}}>
          Have you been training before?<br/>We can set your starting rank based on where you actually are — not start everyone at Beginner.
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <button className="btn-press" onClick={()=>setStep(1)}
            style={{background:T.accent,border:'none',borderRadius:12,color:'#fff',padding:16,fontSize:16,fontWeight:700,letterSpacing:3}}>
            YES, SET MY STARTING RANK
          </button>
          <button className="btn-press" onClick={()=>onSkip(user)}
            style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:12,color:T.text3,padding:14,fontSize:14,fontWeight:600,letterSpacing:2}}>
            I'M NEW — START FROM SCRATCH
          </button>
        </div>
      </div>
    </div>
  )

  return(
    <div className="arise-bg" style={{...cssVars,minHeight:'100vh',paddingBottom:40}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{background:T.bg2,borderBottom:`1px solid ${T.border}`,padding:'20px 20px 16px'}}>
        <div style={{fontSize:11,letterSpacing:4,color:T.accent,fontWeight:700,marginBottom:4}}>CALIBRATION</div>
        <div style={{fontFamily:'Bebas Neue',fontSize:30,letterSpacing:2,color:T.text}}>Set Your Starting Rank</div>
        <div style={{fontSize:13,color:T.text2,marginTop:4,fontFamily:'Inter'}}>Enter your current best working weight. Skip any you don't know.</div>
      </div>
      <div style={{padding:'20px 16px'}}>
        <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:14,marginBottom:20}}>
          <div style={{fontSize:11,color:T.accent,letterSpacing:2,textTransform:'uppercase',marginBottom:6}}>How this works</div>
          <div style={{fontSize:13,color:T.text2,fontFamily:'Inter',lineHeight:1.6}}>Enter the weight you normally train with for a solid working set. We'll estimate your 1RM and assign your starting rank. Leave blank to start from scratch on that muscle.</div>
        </div>
        <div className="stagger" style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
          {CALIB.map(ex=>{
            const mg=MUSCLE_GROUPS.find(m=>m.id===ex.muscle)
            const val=lifts[ex.muscle]||''
            const est1RM=val?calc1RM(parseFloat(val),5):0
            const ps=est1RM>0?Math.min((est1RM/200)*100*0.6+Math.min((parseFloat(val)*5*3/10000)*100,100)*0.4,100):0
            const pr=getRank(ps)
            return(
              <div key={ex.muscle} style={{background:T.card,border:`1px solid ${val?pr.color+'55':T.border}`,borderRadius:12,padding:14,transition:'border-color 0.3s'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:700,color:T.text}}>{mg?.icon} {mg?.name}</div>
                    <div style={{fontSize:12,color:T.text3}}>{ex.name}</div>
                  </div>
                  {val?(
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:14,fontWeight:700,color:pr.color}}>{pr.icon} {pr.name}</div>
                      <div style={{fontSize:10,color:T.text3}}>starting rank</div>
                    </div>
                  ):<div style={{fontSize:12,color:T.text3}}>◈ Beginner</div>}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8,alignItems:'center'}}>
                  <input type="number" min="0" inputMode="decimal" placeholder={ex.placeholder} value={val}
                    onChange={e=>setLifts(l=>({...l,[ex.muscle]:e.target.value}))}
                    style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:'10px 12px',fontSize:20,fontWeight:700,textAlign:'center'}} />
                  <div style={{fontSize:13,color:T.text3,fontWeight:700}}>kg</div>
                </div>
                {val&&<div style={{marginTop:6,fontSize:11,color:T.text3}}>Est. 1RM: <span style={{color:pr.color,fontWeight:700}}>{Math.round(est1RM)}kg</span></div>}
              </div>
            )
          })}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <button className="btn-press" onClick={handleSave} disabled={saving}
            style={{background:T.accent,border:'none',borderRadius:12,color:'#fff',padding:16,fontSize:16,fontWeight:700,letterSpacing:3}}>
            {saving?'...':'SAVE & START'}
          </button>
          <button className="btn-press" onClick={()=>onSkip(user)}
            style={{background:'transparent',border:'none',color:T.text3,padding:10,fontSize:13,fontWeight:600,letterSpacing:1,cursor:'pointer'}}>
            Skip — I'll log naturally
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function MainApp({currentUser,onLogout,allUsers,settings,setSettings,T,cssVars,onRecalibrate}){
  const [tab,setTab]                 = useState('dashboard')
  const [workouts,setWorkouts]       = useState([])
  const [allWorkouts,setAllWorkouts] = useState([])
  const [loading,setLoading]         = useState(true)
  const [lbLoading,setLbLoading]     = useState(true)
  const [logForm,setLogForm]         = useState({muscle:'chest',exercise:'',weight:'',reps:'',sets:''})
  const [logMsg,setLogMsg]           = useState('')
  const [logLoading,setLogLoading]   = useState(false)
  const [logSuccess,setLogSuccess]       = useState(false)
  const [templates,setTemplates]         = useState([])
  const [savingTemplate,setSavingTemplate] = useState(false)
  const [templateName,setTemplateName]   = useState('')
  const [showSaveTemplate,setShowSaveTemplate] = useState(false)
  const [currentSession,setCurrentSession] = useState([]) // exercises logged this session
  const [chartExercise,setChartExercise] = useState('')
  const [chartMuscle,setChartMuscle]    = useState('chest')
  const [bodyWeights,setBodyWeights] = useState([])
  const [bwInput,setBwInput]         = useState('')
  const [bwUnit,setBwUnit]           = useState('kg')
  const [bwMsg,setBwMsg]             = useState('')
  const [bwLoading,setBwLoading]     = useState(false)
  const [histFilter,setHistFilter]   = useState('all')
  const [planDay,setPlanDay]         = useState(0)
  const [expandedEx,setExpandedEx]   = useState(null)
  const [deletePin,setDeletePin]     = useState('')
  const [deleteMsg,setDeleteMsg]     = useState('')
  const [deleteLoading,setDeleteLoading] = useState(false)
  const [showDeleteConfirm,setShowDeleteConfirm] = useState(false)

  const unit = settings.unit
  const plan = PLANS[currentUser.goal||'general']
  const numDays = settings.trainingDays.length||4
  const activePlanDays = getActiveDays(plan.days,numDays)
  const splitLabel = {1:'1-day Full Body',2:'2-day Upper/Lower',3:'3-day Push/Pull/Legs',4:'4-day split',5:'5-day split',6:'6-day split',7:'7-day split'}[numDays]||`${numDays}-day split`
  useEffect(()=>{if(planDay>=activePlanDays.length)setPlanDay(0)},[numDays])

  const fetchWorkouts=useCallback(async()=>{
    setLoading(true)
    const{data,error}=await supabase.from('workouts').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false})
    if(!error&&data)setWorkouts(data)
    setLoading(false)
  },[currentUser.id])

  const fetchAllWorkouts=useCallback(async()=>{
    setLbLoading(true)
    const{data,error}=await supabase.from('workouts').select('user_id,muscle,weight,reps,sets')
    if(!error&&data)setAllWorkouts(data)
    setLbLoading(false)
  },[])

  useEffect(()=>{fetchWorkouts()},[fetchWorkouts])
  useEffect(()=>{if(tab==='leaderboard')fetchAllWorkouts()},[tab,fetchAllWorkouts])

  const fetchBodyWeights=useCallback(async()=>{
    const{data}=await supabase.from('bodyweight').select('*').eq('user_id',currentUser.id).order('logged_at',{ascending:true})
    if(data) setBodyWeights(data)
  },[currentUser.id])

  useEffect(()=>{fetchBodyWeights()},[fetchBodyWeights])

  // Templates stored in localStorage per user
  useEffect(()=>{
    try{
      const saved=JSON.parse(localStorage.getItem(`arise_templates_${currentUser.id}`)||'[]')
      setTemplates(saved)
    }catch{}
  },[currentUser.id])

  function saveTemplates(tmpl){
    setTemplates(tmpl)
    localStorage.setItem(`arise_templates_${currentUser.id}`,JSON.stringify(tmpl))
  }

  function handleSaveTemplate(){
    if(!templateName.trim()||currentSession.length===0) return
    const newTmpl={id:Date.now(),name:templateName.trim(),exercises:currentSession,created:new Date().toISOString()}
    saveTemplates([newTmpl,...templates])
    setTemplateName('');setShowSaveTemplate(false)
  }

  function handleDeleteTemplate(id){
    saveTemplates(templates.filter(t=>t.id!==id))
  }

  function handleLoadTemplate(tmpl){
    setLogForm({muscle:tmpl.exercises[0]?.muscle||'chest',exercise:tmpl.exercises[0]?.exercise||'',weight:'',reps:'',sets:''})
    setCurrentSession(tmpl.exercises)
    setTab('log')
  }

  async function handleLogBodyWeight(){
    if(!bwInput||parseFloat(bwInput)<=0){setBwMsg('Enter a valid weight.');return}
    setBwLoading(true)
    const wKg = bwUnit==='lbs' ? parseFloat(bwInput)/2.205 : parseFloat(bwInput)
    const{error}=await supabase.from('bodyweight').insert([{user_id:currentUser.id,weight:Math.round(wKg*10)/10,unit:'kg'}])
    if(error){setBwMsg('Error saving. Try again.')}
    else{setBwMsg('✓ Weight logged!');setBwInput('');fetchBodyWeights()}
    setBwLoading(false)
    setTimeout(()=>setBwMsg(''),3000)
  }

  async function handleLog(){
    const{muscle,exercise,weight,reps,sets}=logForm
    if(!exercise||!weight||!reps||!sets){setLogMsg('⚠ Fill in all fields.');return}
    setLogLoading(true)
    const wKg=unit==='lbs'?parseFloat(weight)/2.205:parseFloat(weight)
    const{error}=await supabase.from('workouts').insert([{user_id:currentUser.id,muscle,exercise,weight:Math.round(wKg*10)/10,reps:parseInt(reps),sets:parseInt(sets)}])
    if(error){console.error(error);setLogMsg(`✗ Error: ${error.message}`)}
    else{
      setLogSuccess(true)
      setTimeout(()=>setLogSuccess(false),2200)
      setLogMsg(`✓ ${exercise} — ${weight}${unit} × ${reps} × ${sets}`)
      setCurrentSession(s=>[...s,{muscle,exercise,weight:parseFloat(weight),reps:parseInt(reps),sets:parseInt(sets)}])
      setLogForm(f=>({...f,exercise:'',weight:'',reps:'',sets:''}))
      fetchWorkouts()
    }
    setLogLoading(false)
    setTimeout(()=>setLogMsg(''),4000)
  }

  async function handleDeleteAccount(){
    if(!deletePin){setDeleteMsg('Enter your PIN to confirm.');return}
    setDeleteLoading(true)
    const{data,error}=await supabase.from('users').select('id').eq('id',currentUser.id).eq('pin',deletePin).single()
    if(error||!data){setDeleteMsg('Wrong PIN. Try again.');setDeleteLoading(false);return}
    await supabase.from('workouts').delete().eq('user_id',currentUser.id)
    await supabase.from('users').delete().eq('id',currentUser.id)
    setDeleteLoading(false)
    onLogout()
  }

  // ── Personal Records: best 1RM per exercise ──
  const personalRecords = workouts.reduce((acc,w)=>{
    const rm=calc1RM(w.weight,w.reps)
    if(!acc[w.exercise]||rm>acc[w.exercise].rm)
      acc[w.exercise]={rm,weight:w.weight,reps:w.reps,date:w.created_at,id:w.id}
    return acc
  },{})

  // ── Streak: consecutive weeks with at least 1 workout ──
  const trainingStreak=(()=>{
    if(workouts.length===0) return 0
    const getWeek=d=>{const dt=new Date(d);const day=dt.getDay();const diff=dt.getDate()-day+(day===0?-6:1);return new Date(dt.setDate(diff)).toDateString()}
    const weeks=[...new Set(workouts.map(w=>getWeek(w.created_at)))].sort((a,b)=>new Date(b)-new Date(a))
    let streak=0,cur=new Date()
    cur.setDate(cur.getDate()-cur.getDay()+(cur.getDay()===0?-6:1))
    for(let i=0;i<weeks.length;i++){
      const wk=new Date(weeks[i])
      const diff=Math.round((cur-wk)/(7*24*60*60*1000))
      if(diff===i) streak++
      else break
    }
    return streak
  })()

  // ── Weekly Summary: last week's stats ──
  const weeklySummary=(()=>{
    const now=new Date()
    const dayOfWeek=now.getDay()
    const startOfThisWeek=new Date(now);startOfThisWeek.setDate(now.getDate()-dayOfWeek+(dayOfWeek===0?-6:1));startOfThisWeek.setHours(0,0,0,0)
    const startOfLastWeek=new Date(startOfThisWeek);startOfLastWeek.setDate(startOfThisWeek.getDate()-7)
    const lastWeek=workouts.filter(w=>{const d=new Date(w.created_at);return d>=startOfLastWeek&&d<startOfThisWeek})
    const vol=lastWeek.reduce((s,w)=>s+w.weight*w.reps*w.sets,0)
    const prs=lastWeek.filter(w=>{const rm=calc1RM(w.weight,w.reps);const prev=workouts.filter(x=>x.exercise===w.exercise&&new Date(x.created_at)<startOfLastWeek);return prev.length>0&&rm>Math.max(...prev.map(x=>calc1RM(x.weight,x.reps)))})
    const muscles=[...new Set(lastWeek.map(w=>w.muscle))]
    return{sessions:lastWeek.length,volume:vol,prs:prs.length,muscles,days:[...new Set(lastWeek.map(w=>new Date(w.created_at).toLocaleDateString('en-US',{weekday:'short'})))]}
  })()

  const byMuscle=MUSCLE_GROUPS.reduce((a,mg)=>({...a,[mg.id]:workouts.filter(w=>w.muscle===mg.id)}),{})
  const scores=MUSCLE_GROUPS.reduce((a,mg)=>({...a,[mg.id]:calcScore(byMuscle[mg.id])}),{})
  const totalScore=MUSCLE_GROUPS.reduce((s,mg)=>s+scores[mg.id],0)/MUSCLE_GROUPS.length
  const overallRank=getRank(totalScore)
  const filtered=histFilter==='all'?workouts:workouts.filter(w=>w.muscle===histFilter)
  const sortedDays=[...settings.trainingDays].sort((a,b)=>({Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6}[a]-{Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6}[b]))

  const leaderboard=allUsers.map(u=>{
    const uw=allWorkouts.filter(w=>w.user_id===u.id)
    const ms=MUSCLE_GROUPS.reduce((a,mg)=>({...a,[mg.id]:calcScore(uw.filter(w=>w.muscle===mg.id))}),{})
    const ov=MUSCLE_GROUPS.reduce((s,mg)=>s+ms[mg.id],0)/MUSCLE_GROUPS.length
    const top=MUSCLE_GROUPS.reduce((b,mg)=>ms[mg.id]>ms[b.id]?mg:b,MUSCLE_GROUPS[0])
    return{...u,overall:ov,muscleScores:ms,topMuscle:top,rank:getRank(ov),goal:GOALS.find(g=>g.id===(u.goal||'general'))}
  }).sort((a,b)=>b.overall-a.overall)

  // ── Render ──
  return(
    <div className="arise-bg" style={{...cssVars,paddingBottom:80,position:'relative'}}>
      <style>{GLOBAL_CSS}</style>

      {/* Log success overlay */}
      {logSuccess&&(
        <div className="log-flash" style={{position:'fixed',inset:0,zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',background:T.darkMode?'rgba(255,59,59,0.08)':'rgba(224,32,32,0.05)'}}>
          <div style={{background:T.accent,borderRadius:20,padding:'20px 40px',textAlign:'center',boxShadow:`0 0 60px ${T.accent}55`}}>
            <div style={{fontSize:36,marginBottom:4}}>💪</div>
            <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:3,color:'#fff'}}>SET LOGGED</div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{background:T.bg2,borderBottom:`1px solid ${T.border}`,position:'sticky',top:0,zIndex:100}}>
        {/* Hero strip */}
        <div style={{position:'relative',overflow:'hidden',padding:'12px 16px 0'}}>
          <div className="hero-grid" style={{opacity:0.15}} />
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative',zIndex:1}}>
            {/* Left: brand + rank */}
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div>
                <div style={{fontFamily:'Bebas Neue',fontSize:32,letterSpacing:4,color:T.text,lineHeight:1,textShadow:T.darkMode?`0 0 20px ${T.accent}44`:'none'}}>ARISE</div>
                <div style={{fontSize:9,letterSpacing:3,color:T.accent,fontWeight:700,textTransform:'uppercase',marginTop:-2}}>PHYSIQUE TRACKER</div>
              </div>
              {!loading&&(
                <div style={{background:overallRank.gradient,borderRadius:10,padding:'4px 10px',display:'flex',alignItems:'center',gap:6,boxShadow:`0 0 14px ${overallRank.color}44`}}>
                  <span style={{fontSize:14}}>{overallRank.icon}</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:'#fff',lineHeight:1}}>{overallRank.name}</div>
                    <div style={{fontSize:9,color:'rgba(255,255,255,0.7)',letterSpacing:1}}>{Math.round(totalScore)} pts</div>
                  </div>
                </div>
              )}
            </div>
            {/* Right: controls */}
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {/* Theme toggle */}
              <button onClick={()=>setSettings(s=>({...s,darkMode:!s.darkMode}))} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:20,width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:14}}>
                {settings.darkMode?'☀️':'🌙'}
              </button>
              {/* Unit toggle */}
              <div style={{display:'flex',background:T.bg3,border:`1px solid ${T.border}`,borderRadius:20,overflow:'hidden'}}>
                {['kg','lbs'].map(u=>(
                  <button key={u} onClick={()=>setSettings(s=>({...s,unit:u}))}
                    style={{padding:'4px 10px',border:'none',fontSize:10,fontWeight:700,letterSpacing:1,cursor:'pointer',background:unit===u?T.accent:'transparent',color:unit===u?'#fff':T.text3,transition:'all 0.2s'}}>
                    {u.toUpperCase()}
                  </button>
                ))}
              </div>
              {/* Avatar */}
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:28,height:28,borderRadius:14,background:avatarColor(currentUser.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',fontFamily:'Bebas Neue',letterSpacing:1}}>{currentUser.name[0].toUpperCase()}</div>
                <button onClick={onLogout} style={{background:'none',border:'none',color:T.text3,fontSize:10,cursor:'pointer',letterSpacing:1,fontFamily:'Rajdhani',fontWeight:600}}>OUT</button>
              </div>
            </div>
          </div>

          {/* Overall progress bar */}
          {!loading&&(
            <div style={{marginTop:10,marginBottom:6,position:'relative',zIndex:1}}>
              <div style={{background:T.bg3,borderRadius:4,height:4,overflow:'hidden',position:'relative'}}>
                <div className="bar-fill" style={{'--pct':`${totalScore}%`,height:'100%',background:overallRank.gradient,borderRadius:4}} />
                <div className="bar-streak" style={{position:'absolute',top:0,width:'40%',height:'100%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)'}} />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',overflowX:'auto',padding:'0 4px'}}>
          {[['dashboard','RANKS'],['body','BODY'],['plan','PLAN'],['log','LOG'],['templates','TMPL'],['history','HIST'],['stats','STATS'],['charts','📈'],['leaderboard','🏆'],['settings','⚙️']].map(([id,label])=>(
            <button key={id} className="tab-item" onClick={()=>setTab(id)} style={{
              flex:'0 0 auto',padding:'10px 14px',border:'none',cursor:'pointer',
              fontSize:11,fontWeight:700,letterSpacing:1.5,fontFamily:'Rajdhani',
              background:'transparent',
              color:tab===id?T.accent:T.text3,
              borderBottom:tab===id?`2px solid ${T.accent}`:'2px solid transparent',
              transition:'all 0.2s',whiteSpace:'nowrap',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{padding:'20px 16px',position:'relative',zIndex:1}}>

        {/* DASHBOARD */}
        {tab==='dashboard'&&(
          <div className="slide-up">
            {/* Hero rank card */}
            {!loading&&(
              <div style={{background:overallRank.gradient,borderRadius:20,padding:'20px 20px 16px',marginBottom:20,position:'relative',overflow:'hidden',boxShadow:`0 8px 32px ${overallRank.color}33`}}>
                <div style={{position:'absolute',top:-20,right:-20,fontSize:100,opacity:0.08,lineHeight:1}}>{overallRank.icon}</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{fontSize:11,letterSpacing:3,color:'rgba(255,255,255,0.7)',textTransform:'uppercase',marginBottom:4}}>Overall Rank</div>
                    <div style={{fontFamily:'Bebas Neue',fontSize:44,letterSpacing:3,color:'#fff',lineHeight:1}}>{overallRank.name}</div>
                    <div style={{fontSize:13,color:'rgba(255,255,255,0.7)',marginTop:2}}>Score: {Math.round(totalScore)} / 100</div>
                  </div>
                  <div className="rank-glow" style={{'--rc':overallRank.color,'--rc-dim':overallRank.color+'44',width:64,height:64,borderRadius:32,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,border:`2px solid rgba(255,255,255,0.3)`}}>
                    {overallRank.icon}
                  </div>
                </div>
                <div style={{marginTop:14,background:'rgba(0,0,0,0.2)',borderRadius:6,height:6,overflow:'hidden',position:'relative'}}>
                  <div className="bar-fill" style={{'--pct':`${totalScore}%`,height:'100%',background:'rgba(255,255,255,0.7)',borderRadius:6}} />
                  <div className="bar-streak" style={{position:'absolute',top:0,width:'40%',height:'100%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)'}} />
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:10,color:'rgba(255,255,255,0.5)'}}>
                  <span>0</span><span>100</span>
                </div>
              </div>
            )}

            {/* Streak + Weekly Summary row */}
            {!loading&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
                {/* Streak */}
                <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:14,position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:-10,right:-6,fontSize:52,opacity:0.07}}>🔥</div>
                  <div style={{fontSize:10,color:T.text3,letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>Training Streak</div>
                  <div style={{fontFamily:'Bebas Neue',fontSize:40,letterSpacing:2,color:trainingStreak>0?'#F59E0B':T.text3,lineHeight:1}}>{trainingStreak}</div>
                  <div style={{fontSize:11,color:T.text3,marginTop:2}}>{trainingStreak===1?'week in a row':trainingStreak>1?'weeks in a row':'Start your streak!'}</div>
                  {trainingStreak>=3&&<div style={{marginTop:6,fontSize:10,color:'#F59E0B',fontWeight:700}}>🔥 ON FIRE</div>}
                </div>
                {/* This week snapshot */}
                <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:14,position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:-10,right:-6,fontSize:52,opacity:0.07}}>📅</div>
                  <div style={{fontSize:10,color:T.text3,letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>Last Week</div>
                  {weeklySummary.sessions===0?(
                    <div style={{fontSize:13,color:T.text3,marginTop:8,fontFamily:'Inter',lineHeight:1.5}}>No sessions last week.</div>
                  ):(
                    <>
                      <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:1,color:T.accent,lineHeight:1}}>{weeklySummary.sessions}</div>
                      <div style={{fontSize:11,color:T.text3}}>{weeklySummary.sessions===1?'session':'sessions'}</div>
                      <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
                        {weeklySummary.prs>0&&<span style={{background:'#F59E0B22',border:'1px solid #F59E0B44',borderRadius:6,padding:'2px 6px',fontSize:10,color:'#F59E0B',fontWeight:700}}>⭐ {weeklySummary.prs} PR{weeklySummary.prs>1?'s':''}</span>}
                        <span style={{background:T.bg3,borderRadius:6,padding:'2px 6px',fontSize:10,color:T.text3}}>{Math.round(cvt(weeklySummary.volume,unit)/1000*10)/10}k {unit}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {loading?(
              <div style={{textAlign:'center',padding:60,color:T.text3}}>
                <div className="spin" style={{fontSize:28,marginBottom:10,display:'inline-block'}}>◈</div>
                <div style={{fontSize:14}}>Loading your data...</div>
              </div>
            ):(
              <>
                <div style={{fontSize:11,color:T.text3,letterSpacing:3,textTransform:'uppercase',marginBottom:12}}>Muscle Rankings</div>
                <div className="stagger" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
                  {MUSCLE_GROUPS.map(mg=>{
                    const score=scores[mg.id],rank=getRank(score),next=getNextRank(score)
                    const pct=next?((score-rank.min)/(next.min-rank.min))*100:100
                    const rankBg=settings.darkMode?rank.darkBg:rank.lightBg
                    return(
                      <div key={mg.id} className="hover-lift" style={{background:rankBg,border:`1px solid ${rank.color}33`,borderRadius:14,padding:14,position:'relative',overflow:'hidden',cursor:'default'}}>
                        <div style={{position:'absolute',top:-8,right:-8,fontSize:44,opacity:0.07,lineHeight:1}}>{mg.icon}</div>
                        {/* Rank color strip */}
                        <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:rank.gradient,borderRadius:'14px 14px 0 0'}} />
                        <div style={{fontSize:10,color:T.text3,letterSpacing:2,textTransform:'uppercase',marginBottom:4,marginTop:4}}>{mg.name}</div>
                        <div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:1,color:rank.color,marginBottom:2}}>{rank.icon} {rank.name}</div>
                        <div style={{fontSize:11,color:T.text3,marginBottom:8}}>Score: {Math.round(score)}</div>
                        <div style={{background:T.darkMode?'rgba(0,0,0,0.3)':'rgba(0,0,0,0.08)',borderRadius:3,height:4,overflow:'hidden',position:'relative'}}>
                          <div className="bar-fill" style={{'--pct':`${pct}%`,height:'100%',background:rank.gradient,borderRadius:3}} />
                        </div>
                        {next?<div style={{fontSize:9,color:T.text3,marginTop:4}}>→ {next.name}</div>
                             :<div style={{fontSize:9,color:rank.color,marginTop:4,fontWeight:700}}>MAX RANK ✦</div>}
                      </div>
                    )
                  })}
                </div>

                {/* Rank tier legend */}
                <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:16}}>
                  <div style={{fontSize:11,color:T.text3,letterSpacing:3,textTransform:'uppercase',marginBottom:12}}>Rank Tiers</div>
                  {RANKS.map((r,i)=>(
                    <div key={r.name} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<RANKS.length-1?`1px solid ${T.border}`:'none'}}>
                      <div style={{width:28,height:28,borderRadius:14,background:r.gradient,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,boxShadow:`0 0 8px ${r.color}44`,flexShrink:0}}>{r.icon}</div>
                      <span style={{fontFamily:'Bebas Neue',fontSize:16,letterSpacing:1,color:r.color,flex:1}}>{r.name}</span>
                      <span style={{fontSize:11,color:T.text3}}>Score ≥ {r.min}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}


        {/* BODY WEIGHT */}
        {tab==='body'&&(
          <div className="slide-up">
            <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:2,color:T.text,marginBottom:2}}>BODY WEIGHT</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:20,fontFamily:'Inter'}}>Track your weight over time.</div>

            {/* Log input */}
            <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:16,marginBottom:16}}>
              <div style={{fontSize:11,color:T.text3,letterSpacing:3,textTransform:'uppercase',marginBottom:10}}>Log Today's Weight</div>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:10}}>
                <input type="number" min="0" inputMode="decimal" placeholder="0.0"
                  value={bwInput} onChange={e=>setBwInput(e.target.value)}
                  style={{flex:1,background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'12px 14px',fontSize:28,fontWeight:700,textAlign:'center',fontFamily:'Bebas Neue',letterSpacing:2}} />
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  {['kg','lbs'].map(u=>(
                    <button key={u} onClick={()=>setBwUnit(u)}
                      style={{background:bwUnit===u?T.accent:'transparent',border:`1px solid ${bwUnit===u?T.accent:T.border}`,borderRadius:8,color:bwUnit===u?'#fff':T.text3,padding:'6px 10px',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Rajdhani',letterSpacing:1}}>
                      {u.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              {bwMsg&&<div style={{color:bwMsg.startsWith('✓')?'#10B981':T.accent,fontSize:13,textAlign:'center',marginBottom:10}}>{bwMsg}</div>}
              <button className="btn-press" onClick={handleLogBodyWeight} disabled={bwLoading}
                style={{width:'100%',background:T.accent,border:'none',borderRadius:10,color:'#fff',padding:12,fontSize:15,fontWeight:700,letterSpacing:3,cursor:'pointer',fontFamily:'Bebas Neue'}}>
                {bwLoading?'...':'LOG WEIGHT'}
              </button>
            </div>

            {/* Chart */}
            {bodyWeights.length>1&&(()=>{
              const dispWeights=bodyWeights.map(w=>({...w,display:Math.round(cvt(w.weight,unit)*10)/10}))
              const vals=dispWeights.map(w=>w.display)
              const minV=Math.min(...vals),maxV=Math.max(...vals)
              const range=maxV-minV||1
              const W=340,H=120,PAD=12
              const pts=dispWeights.slice(-30).map((w,i,arr)=>{
                const x=PAD+(i/(arr.length-1||1))*(W-PAD*2)
                const y=H-PAD-(((w.display-minV)/range)*(H-PAD*2))
                return{x,y,w}
              })
              const pathD=pts.map((p,i)=>i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`).join(' ')
              const areaD=`${pathD} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`
              const latest=dispWeights[dispWeights.length-1]
              const first=dispWeights[0]
              const diff=Math.round((latest.display-first.display)*10)/10
              return(
                <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:16,marginBottom:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                    <div>
                      <div style={{fontSize:11,color:T.text3,letterSpacing:2,textTransform:'uppercase',marginBottom:2}}>Current Weight</div>
                      <div style={{fontFamily:'Bebas Neue',fontSize:36,letterSpacing:2,color:T.text,lineHeight:1}}>{latest.display} <span style={{fontSize:18,color:T.text3}}>{unit}</span></div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:11,color:T.text3,marginBottom:2}}>Total change</div>
                      <div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:1,color:diff<0?'#10B981':diff>0?T.accent:T.text3}}>{diff>0?'+':''}{diff} {unit}</div>
                    </div>
                  </div>
                  <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',display:'block'}}>
                    <defs>
                      <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={T.accent} stopOpacity="0.3"/>
                        <stop offset="100%" stopColor={T.accent} stopOpacity="0.02"/>
                      </linearGradient>
                    </defs>
                    <path d={areaD} fill="url(#bwGrad)" />
                    <path d={pathD} fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    {pts.map((p,i)=>i===pts.length-1&&(
                      <circle key={i} cx={p.x} cy={p.y} r="5" fill={T.accent} stroke={T.bg2} strokeWidth="2"/>
                    ))}
                  </svg>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.text3,marginTop:4}}>
                    <span>{new Date(bodyWeights[Math.max(0,bodyWeights.length-30)].logged_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                    <span>Today</span>
                  </div>
                </div>
              )
            })()}

            {/* History list */}
            {bodyWeights.length===0?(
              <div style={{textAlign:'center',padding:40,color:T.text3}}>
                <div style={{fontSize:32,marginBottom:8}}>⚖️</div>
                <div>Log your first weight above.</div>
              </div>
            ):(
              <div>
                <div style={{fontSize:11,color:T.text3,letterSpacing:3,textTransform:'uppercase',marginBottom:10}}>History</div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {[...bodyWeights].reverse().slice(0,20).map((w,i)=>{
                    const prev=[...bodyWeights].reverse()[i+1]
                    const diff=prev?Math.round((cvt(w.weight,unit)-cvt(prev.weight,unit))*10)/10:null
                    return(
                      <div key={w.id} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:10,padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div style={{fontSize:13,color:T.text2}}>{new Date(w.logged_at).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</div>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          {diff!==null&&<div style={{fontSize:11,color:diff<0?'#10B981':diff>0?T.accent:T.text3,fontWeight:700}}>{diff>0?'+':''}{diff}</div>}
                          <div style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:1,color:T.text}}>{Math.round(cvt(w.weight,unit)*10)/10} {unit}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PLAN */}
        {tab==='plan'&&(
          <div className="slide-up">
            <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:2,color:T.text,marginBottom:2}}>{plan.title}</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:16,fontFamily:'Inter'}}>{settings.ownSplit?'Your own split · rank targets below':`${splitLabel} · ${numDays} days selected`}</div>

            {/* Own split toggle */}
            <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:14,marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.text}}>I have my own split</div>
                  <div style={{fontSize:12,color:T.text3,fontFamily:'Inter',marginTop:2}}>Just show me rank targets, not a program</div>
                </div>
                <button onClick={()=>setSettings(s=>({...s,ownSplit:!s.ownSplit}))}
                  style={{width:50,height:28,borderRadius:14,border:'none',cursor:'pointer',position:'relative',background:settings.ownSplit?T.accent:T.bg3,transition:'background 0.2s',flexShrink:0}}>
                  <div style={{position:'absolute',top:4,left:settings.ownSplit?26:4,width:20,height:20,borderRadius:10,background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.3)'}} />
                </button>
              </div>
            </div>

            {settings.ownSplit?(
              <div className="stagger" style={{display:'flex',flexDirection:'column',gap:10}}>
                <div style={{fontSize:11,color:T.text3,letterSpacing:3,textTransform:'uppercase',marginBottom:4}}>Rank Targets — What to hit next</div>
                {MUSCLE_GROUPS.map(mg=>{
                  const ms=scores[mg.id],rank=getRank(ms),next=getNextRank(ms)
                  const sessions=byMuscle[mg.id]||[]
                  const best1RM=sessions.length>0?Math.max(...sessions.map(s=>calc1RM(s.weight,s.reps))):0
                  const tw=next?Math.round(cvt((next.min/100)*200*0.75,unit)):null
                  const pct=next?((ms-rank.min)/(next.min-rank.min))*100:100
                  const rankBg=settings.darkMode?rank.darkBg:rank.lightBg
                  return(
                    <div key={mg.id} style={{background:rankBg,border:`1px solid ${rank.color}33`,borderRadius:14,padding:14,position:'relative',overflow:'hidden'}}>
                      <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:rank.gradient}} />
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,marginTop:4}}>
                        <div style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:1,color:T.text}}>{mg.icon} {mg.name}</div>
                        <div style={{fontSize:13,fontWeight:700,color:rank.color}}>{rank.icon} {rank.name}</div>
                      </div>
                      <div style={{background:'rgba(0,0,0,0.15)',borderRadius:3,height:4,overflow:'hidden',marginBottom:10,position:'relative'}}>
                        <div className="bar-fill" style={{'--pct':`${pct}%`,height:'100%',background:rank.gradient,borderRadius:3}} />
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:next?10:0}}>
                        <div style={{background:'rgba(0,0,0,0.15)',borderRadius:10,padding:'8px',textAlign:'center'}}>
                          <div style={{fontSize:10,color:T.text3,marginBottom:2}}>YOUR BEST 1RM</div>
                          <div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:1,color:rank.color}}>{best1RM>0?`${Math.round(cvt(best1RM,unit))}${unit}`:'—'}</div>
                        </div>
                        <div style={{background:'rgba(0,0,0,0.15)',borderRadius:10,padding:'8px',textAlign:'center'}}>
                          <div style={{fontSize:10,color:T.text3,marginBottom:2}}>TARGET TO RANK UP</div>
                          <div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:1,color:next?T.accent:'#F59E0B'}}>{next&&tw?`${tw}${unit}`:'🏆 MAX'}</div>
                        </div>
                      </div>
                      {next&&tw&&(
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(0,0,0,0.1)',borderRadius:8,padding:'8px 10px'}}>
                          <div style={{fontSize:12,color:T.text2}}>Next: {next.icon} {next.name}</div>
                          <button onClick={()=>{setLogForm(f=>({...f,muscle:mg.id,exercise:''}));setTab('log')}}
                            style={{background:T.accent,border:'none',borderRadius:6,color:'#fff',padding:'4px 10px',fontSize:11,fontWeight:700,letterSpacing:1,cursor:'pointer',fontFamily:'Rajdhani'}}>LOG →</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ):(
              <div>
                {/* Training days */}
                <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:14,marginBottom:16}}>
                  <div style={{fontSize:11,color:T.text3,letterSpacing:3,textTransform:'uppercase',marginBottom:10}}>Training Days</div>
                  <div style={{display:'flex',gap:5}}>
                    {DAYS_OF_WEEK.map(day=>{
                      const active=settings.trainingDays.includes(day)
                      return(
                        <button key={day} onClick={()=>setSettings(s=>{const d=s.trainingDays.includes(day)?s.trainingDays.filter(x=>x!==day):[...s.trainingDays,day];return{...s,trainingDays:d}})}
                          style={{flex:1,padding:'8px 2px',border:`1px solid ${active?T.accent:T.border}`,borderRadius:8,background:active?T.accentDim:'transparent',color:active?T.accent:T.text3,fontSize:10,fontWeight:700,cursor:'pointer',transition:'all 0.15s'}}>
                          {day}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{fontSize:11,color:T.text3,marginTop:8}}>{settings.trainingDays.length} days · tap to toggle</div>
                </div>

                {/* Day tabs */}
                <div style={{display:'flex',gap:8,marginBottom:16,overflowX:'auto',paddingBottom:4}}>
                  {activePlanDays.map((d,i)=>(
                    <button key={i} onClick={()=>{setPlanDay(i);setExpandedEx(null)}}
                      style={{padding:'8px 14px',border:`1px solid ${planDay===i?T.accent:T.border}`,borderRadius:20,background:planDay===i?T.accent:'transparent',color:planDay===i?'#fff':T.text3,fontSize:11,fontWeight:700,letterSpacing:1,cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.15s'}}>
                      {d.day}: {d.label}
                    </button>
                  ))}
                </div>

                {(()=>{
                  const d=activePlanDays[planDay]||activePlanDays[0],aDay=sortedDays[planDay]
                  return(
                    <div>
                      {/* Day header */}
                      <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:16,padding:16,marginBottom:12,position:'relative',overflow:'hidden'}}>
                        <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${T.accent},transparent)`}} />
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                          <div>
                            <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:2,color:T.text,marginTop:4}}>{d.label}</div>
                            <div style={{fontSize:12,color:T.text3}}>{d.focus}</div>
                          </div>
                          {aDay&&<div style={{background:T.accentDim,border:`1px solid ${T.accent}44`,borderRadius:8,padding:'4px 12px',fontSize:12,color:T.accent,fontWeight:700}}>{aDay}</div>}
                        </div>
                        <div style={{background:T.bg3,borderRadius:10,padding:12,borderLeft:`3px solid ${T.accent}`}}>
                          <div style={{fontSize:10,color:T.accent,letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>Tip</div>
                          <div style={{fontSize:13,color:T.text2,fontFamily:'Inter',lineHeight:1.6}}>{d.tip}</div>
                        </div>
                      </div>

                      <div style={{fontSize:11,color:T.text3,letterSpacing:3,textTransform:'uppercase',marginBottom:10}}>Exercises — tap to expand</div>
                      <div className="stagger" style={{display:'flex',flexDirection:'column',gap:8}}>
                        {d.exercises.map((ex,i)=>{
                          const mg=MUSCLE_GROUPS.find(m=>m.id===ex.muscle)
                          const ms=scores[ex.muscle],rank=getRank(ms),next=getNextRank(ms)
                          const sess=byMuscle[ex.muscle]||[]
                          const b1=sess.length>0?Math.max(...sess.map(s=>calc1RM(s.weight,s.reps))):0
                          const tw=next?Math.round(cvt((next.min/100)*200*0.75,unit)):null
                          const isExp=expandedEx===`${planDay}-${i}`
                          return(
                            <div key={i} onClick={()=>setExpandedEx(isExp?null:`${planDay}-${i}`)}
                              style={{background:T.bg2,border:`1px solid ${isExp?rank.color+'44':T.border}`,borderRadius:12,overflow:'hidden',cursor:'pointer',transition:'border-color 0.2s'}}>
                              <div style={{padding:'12px 14px'}}>
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                  <div style={{flex:1}}>
                                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                                      <span style={{fontSize:11,color:T.text3,fontWeight:700,width:18}}>{i+1}</span>
                                      <span style={{fontSize:16,fontWeight:700,color:T.text}}>{ex.name}</span>
                                    </div>
                                    <div style={{fontSize:12,color:T.text3,marginLeft:26}}>{mg?.icon} {ex.sets}×{ex.reps}</div>
                                  </div>
                                  <div style={{textAlign:'right',marginLeft:8}}>
                                    <div style={{fontSize:12,color:rank.color,fontWeight:700}}>{rank.icon} {rank.name}</div>
                                    <div style={{fontSize:11,color:T.text3,marginTop:1}}>{isExp?'▲':'▼'}</div>
                                  </div>
                                </div>
                              </div>
                              {isExp&&(
                                <div style={{borderTop:`1px solid ${T.border}`,padding:14,background:T.bg3}}>
                                  <div style={{fontSize:13,color:T.text2,fontFamily:'Inter',marginBottom:12,lineHeight:1.6}}>💡 {ex.note}</div>
                                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                                    <div style={{background:T.bg2,borderRadius:10,padding:10,textAlign:'center',border:`1px solid ${T.border}`}}>
                                      <div style={{fontSize:10,color:T.text3,marginBottom:4}}>YOUR BEST 1RM</div>
                                      <div style={{fontFamily:'Bebas Neue',fontSize:24,letterSpacing:1,color:rank.color}}>{b1>0?`${Math.round(cvt(b1,unit))}${unit}`:'—'}</div>
                                    </div>
                                    <div style={{background:T.bg2,borderRadius:10,padding:10,textAlign:'center',border:`1px solid ${T.border}`}}>
                                      <div style={{fontSize:10,color:T.text3,marginBottom:4}}>TARGET TO RANK UP</div>
                                      <div style={{fontFamily:'Bebas Neue',fontSize:24,letterSpacing:1,color:next?T.accent:'#F59E0B'}}>{next&&tw?`${tw}${unit}`:'🏆 MAX'}</div>
                                    </div>
                                  </div>
                                  {next&&tw&&(
                                    <div style={{background:T.bg2,borderRadius:10,padding:12,borderLeft:`3px solid ${next.color}`,marginBottom:10,border:`1px solid ${T.border}`}}>
                                      <div style={{fontSize:12,color:next.color,fontWeight:700,marginBottom:4}}>To reach {next.icon} {next.name}:</div>
                                      <div style={{fontSize:13,color:T.text2,fontFamily:'Inter',lineHeight:1.5}}>Work up to ~{tw}{unit}. Log every session to track progress.</div>
                                    </div>
                                  )}
                                  <button onClick={e=>{e.stopPropagation();setLogForm({muscle:ex.muscle,exercise:ex.name,weight:'',reps:'',sets:''});setTab('log')}}
                                    style={{width:'100%',background:T.accent,border:'none',borderRadius:10,color:'#fff',padding:11,fontSize:13,fontWeight:700,letterSpacing:2,cursor:'pointer',fontFamily:'Rajdhani'}}>
                                    LOG THIS EXERCISE →
                                  </button>
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
          </div>
        )}

        {/* LOG */}
        {tab==='log'&&(
          <div className="slide-up">
            <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:2,color:T.text,marginBottom:2}}>LOG A SET</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:20,fontFamily:'Inter'}}>Weight in <span style={{color:T.accent,fontWeight:700}}>{unit.toUpperCase()}</span> · toggle top-right to switch</div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <div style={{fontSize:11,letterSpacing:3,color:T.text3,textTransform:'uppercase',marginBottom:6}}>Muscle Group</div>
                <select value={logForm.muscle} onChange={e=>setLogForm(f=>({...f,muscle:e.target.value,exercise:''}))}
                  style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'12px 14px',fontSize:15,fontFamily:'Rajdhani'}}>
                  {MUSCLE_GROUPS.map(mg=><option key={mg.id} value={mg.id}>{mg.icon} {mg.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,letterSpacing:3,color:T.text3,textTransform:'uppercase',marginBottom:6}}>Exercise</div>
                <select value={logForm.exercise} onChange={e=>setLogForm(f=>({...f,exercise:e.target.value}))}
                  style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'12px 14px',fontSize:15,fontFamily:'Rajdhani'}}>
                  <option value="">Select exercise...</option>
                  {MUSCLE_GROUPS.find(m=>m.id===logForm.muscle)?.exercises.map(ex=><option key={ex} value={ex}>{ex}</option>)}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                {[['weight',`WT (${unit})`],['reps','REPS'],['sets','SETS']].map(([field,label])=>(
                  <div key={field}>
                    <div style={{fontSize:10,letterSpacing:2,color:T.text3,textTransform:'uppercase',marginBottom:6}}>{label}</div>
                    <input type="number" min="0" value={logForm[field]} onChange={e=>setLogForm(f=>({...f,[field]:e.target.value}))} placeholder="0"
                      style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'12px 6px',fontSize:24,fontWeight:700,textAlign:'center',fontFamily:'Bebas Neue',letterSpacing:1}} />
                  </div>
                ))}
              </div>
              {logForm.weight&&logForm.reps&&(
                <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:14,textAlign:'center',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${T.accent},transparent)`}} />
                  <div style={{fontSize:11,color:T.text3,letterSpacing:2,marginBottom:4}}>ESTIMATED 1RM</div>
                  <div style={{fontFamily:'Bebas Neue',fontSize:40,letterSpacing:2,color:T.accent,textShadow:T.darkMode?`0 0 20px ${T.accent}44`:'none'}}>
                    {Math.round(calc1RM(parseFloat(logForm.weight),parseInt(logForm.reps)))} {unit}
                  </div>
                  <div style={{fontSize:11,color:T.text3,marginTop:2}}>
                    {getRank(Math.min((calc1RM(parseFloat(logForm.weight),parseInt(logForm.reps))/200)*100*0.6+Math.min((parseFloat(logForm.weight)*parseInt(logForm.reps)*(parseInt(logForm.sets)||1)/10000)*100,100)*0.4,100)).icon} {getRank(Math.min((calc1RM(parseFloat(logForm.weight),parseInt(logForm.reps))/200)*100*0.6+Math.min((parseFloat(logForm.weight)*parseInt(logForm.reps)*(parseInt(logForm.sets)||1)/10000)*100,100)*0.4,100)).name} level
                  </div>
                </div>
              )}
              <button className="btn-press" onClick={handleLog} disabled={logLoading}
                style={{background:T.accent,border:'none',borderRadius:12,color:'#fff',padding:16,fontSize:18,fontWeight:700,letterSpacing:4,cursor:'pointer',textTransform:'uppercase',fontFamily:'Bebas Neue',boxShadow:T.darkMode?`0 4px 20px ${T.accent}44`:'none'}}>
                {logLoading?<span className="spin">◈</span>:'LOG SET'}
              </button>
              {logMsg&&(
                <div style={{background:logMsg.startsWith('✓')?T.darkMode?'#052218':'#ECFDF5':T.darkMode?'#2A0505':'#FFF5F5',border:`1px solid ${logMsg.startsWith('✓')?'#10B981':T.accent}`,borderRadius:10,padding:12,color:logMsg.startsWith('✓')?'#10B981':T.accent,fontSize:14,textAlign:'center'}}>
                  {logMsg}
                </div>
              )}

              {/* Current session summary */}
              {currentSession.length>0&&(
                <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <div style={{fontSize:11,color:T.text3,letterSpacing:2,textTransform:'uppercase'}}>This Session ({currentSession.length} sets)</div>
                    <button onClick={()=>setCurrentSession([])} style={{background:'none',border:'none',color:T.text3,fontSize:11,cursor:'pointer',fontFamily:'Rajdhani',letterSpacing:1}}>CLEAR</button>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
                    {currentSession.map((s,i)=>{
                      const mg=MUSCLE_GROUPS.find(m=>m.id===s.muscle)
                      return(
                        <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
                          <div>
                            <div style={{fontSize:13,fontWeight:700,color:T.text}}>{s.exercise}</div>
                            <div style={{fontSize:11,color:T.text3}}>{mg?.icon} {mg?.name}</div>
                          </div>
                          <div style={{fontFamily:'Bebas Neue',fontSize:15,letterSpacing:1,color:T.text2}}>{cvt(s.weight,unit)}{unit} × {s.reps} × {s.sets}</div>
                        </div>
                      )
                    })}
                  </div>
                  {!showSaveTemplate?(
                    <button className="btn-press" onClick={()=>setShowSaveTemplate(true)}
                      style={{width:'100%',background:'transparent',border:`1px solid ${T.border}`,borderRadius:10,color:T.text2,padding:10,fontSize:13,fontWeight:700,letterSpacing:2,cursor:'pointer',fontFamily:'Rajdhani'}}>
                      💾 SAVE AS TEMPLATE
                    </button>
                  ):(
                    <div style={{display:'flex',gap:8}}>
                      <input placeholder="Template name..." value={templateName} onChange={e=>setTemplateName(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&handleSaveTemplate()}
                        style={{flex:1,background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'10px 12px',fontSize:14,fontFamily:'Rajdhani'}} />
                      <button className="btn-press" onClick={handleSaveTemplate}
                        style={{background:T.accent,border:'none',borderRadius:10,color:'#fff',padding:'10px 16px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Rajdhani',whiteSpace:'nowrap'}}>
                        SAVE
                      </button>
                      <button onClick={()=>{setShowSaveTemplate(false);setTemplateName('')}}
                        style={{background:'none',border:`1px solid ${T.border}`,borderRadius:10,color:T.text3,padding:'10px 12px',fontSize:13,cursor:'pointer',fontFamily:'Rajdhani'}}>
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}


        {/* TEMPLATES */}
        {tab==='templates'&&(
          <div className="slide-up">
            <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:2,color:T.text,marginBottom:2}}>TEMPLATES</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:20,fontFamily:'Inter'}}>Save and load your favourite sessions.</div>

            {templates.length===0?(
              <div style={{textAlign:'center',padding:50,color:T.text3}}>
                <div style={{fontSize:48,marginBottom:12}}>💾</div>
                <div style={{fontSize:16,fontWeight:700,color:T.text2,marginBottom:8}}>No templates yet</div>
                <div style={{fontSize:13,fontFamily:'Inter',lineHeight:1.6}}>Log a workout, then tap<br/>"Save as Template" at the bottom of the LOG tab.</div>
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {templates.map(tmpl=>(
                  <div key={tmpl.id} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:16,position:'relative',overflow:'hidden'}}>
                    <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${T.accent},transparent)`}} />
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontFamily:'Bebas Neue',fontSize:20,letterSpacing:1,color:T.text}}>{tmpl.name}</div>
                        <div style={{fontSize:11,color:T.text3}}>{tmpl.exercises.length} exercises · {new Date(tmpl.created).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                      </div>
                      <button onClick={()=>handleDeleteTemplate(tmpl.id)}
                        style={{background:'none',border:'none',color:T.text3,fontSize:16,cursor:'pointer',padding:'0 4px'}}>✕</button>
                    </div>
                    {/* Exercise list preview */}
                    <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:12}}>
                      {tmpl.exercises.map((ex,i)=>{
                        const mg=MUSCLE_GROUPS.find(m=>m.id===ex.muscle)
                        return(
                          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:`1px solid ${T.border}`}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <span style={{fontSize:13}}>{mg?.icon}</span>
                              <span style={{fontSize:13,color:T.text}}>{ex.exercise}</span>
                            </div>
                            <span style={{fontSize:12,color:T.text3,fontFamily:'Bebas Neue',letterSpacing:1}}>{cvt(ex.weight,unit)}{unit} × {ex.reps} × {ex.sets}</span>
                          </div>
                        )
                      })}
                    </div>
                    {/* Muscle group chips */}
                    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                      {[...new Set(tmpl.exercises.map(e=>e.muscle))].map(mid=>{
                        const mg=MUSCLE_GROUPS.find(m=>m.id===mid)
                        return <span key={mid} style={{background:T.bg3,borderRadius:20,padding:'3px 10px',fontSize:11,color:T.text3}}>{mg?.icon} {mg?.name}</span>
                      })}
                    </div>
                    <button className="btn-press" onClick={()=>handleLoadTemplate(tmpl)}
                      style={{width:'100%',background:T.accent,border:'none',borderRadius:10,color:'#fff',padding:11,fontSize:14,fontWeight:700,letterSpacing:2,cursor:'pointer',fontFamily:'Bebas Neue'}}>
                      LOAD TEMPLATE →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {tab==='history'&&(
          <div className="slide-up">
            <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:2,color:T.text,marginBottom:2}}>HISTORY</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:16,fontFamily:'Inter'}}>{workouts.length} sessions logged.</div>
            <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4,marginBottom:16}}>
              {[['all','All'],...MUSCLE_GROUPS.map(mg=>[mg.id,mg.name])].map(([id,label])=>(
                <button key={id} onClick={()=>setHistFilter(id)}
                  style={{background:histFilter===id?T.accent:T.bg2,border:`1px solid ${histFilter===id?T.accent:T.border}`,borderRadius:20,color:histFilter===id?'#fff':T.text3,padding:'6px 14px',fontSize:11,fontWeight:700,letterSpacing:1,cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.15s'}}>
                  {label}
                </button>
              ))}
            </div>
            {loading?<div style={{textAlign:'center',padding:40,color:T.text3}}>Loading...</div>
            :filtered.length===0?(
              <div style={{textAlign:'center',padding:50,color:T.text3}}>
                <div style={{fontSize:36,marginBottom:8}}>◈</div>
                <div style={{fontSize:15}}>No sessions yet. Start logging.</div>
              </div>
            ):(
              <div className="stagger" style={{display:'flex',flexDirection:'column',gap:8}}>
                {filtered.map(s=>{
                  const mg=MUSCLE_GROUPS.find(m=>m.id===s.muscle)
                  const dW=cvt(s.weight,unit)
                  const rm=Math.round(cvt(calc1RM(s.weight,s.reps),unit))
                  const dt=new Date(s.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
                  const rank=getRank(calcScore([s]))
                  const isPR=personalRecords[s.exercise]&&s.id===personalRecords[s.exercise].id
                  return(
                    <div key={s.id} style={{background:T.bg2,border:`1px solid ${isPR?'#F59E0B44':T.border}`,borderRadius:12,padding:'12px 14px',position:'relative',overflow:'hidden'}}>
                      <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:isPR?'linear-gradient(180deg,#F59E0B,#D97706)':rank.gradient}} />
                      {isPR&&<div style={{position:'absolute',top:8,right:10,background:'#F59E0B22',border:'1px solid #F59E0B55',borderRadius:6,padding:'2px 8px',fontSize:10,color:'#F59E0B',fontWeight:700,letterSpacing:1}}>⭐ PR</div>}
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginLeft:8}}>
                        <div style={{flex:1,paddingRight:isPR?50:0}}>
                          <div style={{fontSize:15,fontWeight:700,color:T.text}}>{s.exercise}</div>
                          <div style={{fontSize:11,color:T.text3,marginTop:2}}>{mg?.icon} {mg?.name} · {dt}</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontFamily:'Bebas Neue',fontSize:16,letterSpacing:1,color:T.text}}>{dW}{unit} × {s.reps} × {s.sets}</div>
                          <div style={{fontSize:11,color:T.accent}}>1RM ~{rm}{unit}</div>
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
        {tab==='stats'&&(
          <div className="slide-up">
            <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:2,color:T.text,marginBottom:2}}>STATS</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:20,fontFamily:'Inter'}}>Your strength breakdown.</div>
            <div className="stagger" style={{display:'flex',flexDirection:'column',gap:10}}>
              {MUSCLE_GROUPS.map(mg=>{
                const sessions=byMuscle[mg.id]||[],score=scores[mg.id],rank=getRank(score),next=getNextRank(score)
                const rankBg=settings.darkMode?rank.darkBg:rank.lightBg
                if(sessions.length===0) return(
                  <div key={mg.id} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:12,padding:14,opacity:.5}}>
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <span style={{fontWeight:700,color:T.text}}>{mg.icon} {mg.name}</span>
                      <span style={{fontSize:12,color:T.text3}}>No data yet</span>
                    </div>
                  </div>
                )
                const b1=Math.max(...sessions.map(s=>calc1RM(s.weight,s.reps)))
                const tv=sessions.reduce((s,w)=>s+w.weight*w.reps*w.sets,0)
                const topEx=sessions.reduce((a,s)=>{a[s.exercise]=(a[s.exercise]||0)+1;return a},{})
                const fav=Object.entries(topEx).sort((a,b)=>b[1]-a[1])[0]?.[0]
                const tw=next?Math.round(cvt((next.min/100)*200,unit)):null
                return(
                  <div key={mg.id} style={{background:rankBg,border:`1px solid ${rank.color}33`,borderRadius:14,padding:14,position:'relative',overflow:'hidden'}}>
                    <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:rank.gradient}} />
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,marginTop:4}}>
                      <div style={{fontFamily:'Bebas Neue',fontSize:20,letterSpacing:1,color:T.text}}>{mg.icon} {mg.name}</div>
                      <div style={{background:rank.gradient,borderRadius:8,padding:'3px 10px',fontSize:12,fontWeight:700,color:'#fff',boxShadow:`0 0 10px ${rank.color}44`}}>{rank.icon} {rank.name}</div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:8}}>
                      {[['Best 1RM',`${Math.round(cvt(b1,unit))}${unit}`],['Total Vol.',`${Math.round(cvt(tv,unit)/1000)}k`],['Sessions',sessions.length]].map(([label,val])=>(
                        <div key={label} style={{background:'rgba(0,0,0,0.15)',borderRadius:10,padding:'8px 6px',textAlign:'center'}}>
                          <div style={{fontSize:10,color:T.text3,letterSpacing:1}}>{label}</div>
                          <div style={{fontFamily:'Bebas Neue',fontSize:20,letterSpacing:1,color:rank.color}}>{val}</div>
                        </div>
                      ))}
                    </div>
                    {next&&tw&&(
                      <div style={{background:'rgba(0,0,0,0.12)',borderRadius:8,padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                        <div style={{fontSize:12,color:T.text2}}>Target for {next.icon} {next.name}</div>
                        <div style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:1,color:next.color}}>{tw}{unit}</div>
                      </div>
                    )}
                    {fav&&<div style={{fontSize:12,color:T.text3}}>Top exercise: <span style={{color:T.text2}}>{fav}</span></div>}
                  </div>
                )
              })}
            </div>
            {/* Personal Records Summary */}
            {Object.keys(personalRecords).length>0&&(
              <div style={{background:T.bg2,border:'1px solid #F59E0B33',borderRadius:14,padding:16,marginTop:12,marginBottom:12}}>
                <div style={{fontSize:11,letterSpacing:3,color:'#F59E0B',textTransform:'uppercase',marginBottom:12}}>⭐ Personal Records</div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {Object.entries(personalRecords).sort((a,b)=>b[1].rm-a[1].rm).slice(0,8).map(([ex,pr])=>{
                    const mg=MUSCLE_GROUPS.find(m=>m.exercises&&m.exercises.includes(ex))
                    return(
                      <div key={ex} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
                        <div>
                          <div style={{fontSize:14,fontWeight:700,color:T.text}}>{ex}</div>
                          <div style={{fontSize:11,color:T.text3}}>{mg?.icon} {mg?.name} · {new Date(pr.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:1,color:'#F59E0B'}}>{Math.round(cvt(pr.rm,unit))}{unit}</div>
                          <div style={{fontSize:10,color:T.text3}}>1RM</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:16,marginTop:12}}>
              <div style={{fontSize:11,letterSpacing:3,color:T.text3,textTransform:'uppercase',marginBottom:12}}>Overall Totals</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[['Sessions',workouts.length],['Total Sets',workouts.reduce((s,w)=>s+w.sets,0)],['Volume',`${Math.round(cvt(workouts.reduce((s,w)=>s+w.weight*w.reps*w.sets,0),unit)/1000)}k ${unit}`],['Score',Math.round(totalScore)]].map(([label,val])=>(
                  <div key={label} style={{background:T.bg3,borderRadius:10,padding:'14px 10px',textAlign:'center'}}>
                    <div style={{fontSize:10,color:T.text3,letterSpacing:1,marginBottom:4}}>{label}</div>
                    <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:1,color:T.text}}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* CHARTS */}
        {tab==='charts'&&(
          <div className="slide-up">
            <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:2,color:T.text,marginBottom:2}}>PROGRESS CHARTS</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:16,fontFamily:'Inter'}}>Your 1RM over time per exercise.</div>

            {/* Muscle filter */}
            <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4,marginBottom:12}}>
              {MUSCLE_GROUPS.map(mg=>(
                <button key={mg.id} onClick={()=>{setChartMuscle(mg.id);setChartExercise('')}}
                  style={{background:chartMuscle===mg.id?T.accent:T.bg2,border:`1px solid ${chartMuscle===mg.id?T.accent:T.border}`,borderRadius:20,color:chartMuscle===mg.id?'#fff':T.text3,padding:'6px 14px',fontSize:11,fontWeight:700,letterSpacing:1,cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.15s',fontFamily:'Rajdhani'}}>
                  {mg.icon} {mg.name}
                </button>
              ))}
            </div>

            {/* Exercise picker */}
            {(()=>{
              const mg=MUSCLE_GROUPS.find(m=>m.id===chartMuscle)
              const exercisesLogged=[...new Set(workouts.filter(w=>w.muscle===chartMuscle).map(w=>w.exercise))]
              const activeEx=chartExercise||exercisesLogged[0]||''
              const exData=workouts.filter(w=>w.exercise===activeEx).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at))
              const rmData=exData.map(w=>({date:w.created_at,rm:calc1RM(w.weight,w.reps),weight:w.weight,reps:w.reps}))

              return(
                <div>
                  {exercisesLogged.length===0?(
                    <div style={{textAlign:'center',padding:50,color:T.text3}}>
                      <div style={{fontSize:36,marginBottom:8}}>📈</div>
                      <div>No {mg?.name} data yet. Log some sets first.</div>
                    </div>
                  ):(
                    <>
                      {/* Exercise selector */}
                      <div style={{marginBottom:16}}>
                        <select value={activeEx} onChange={e=>setChartExercise(e.target.value)}
                          style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'12px 14px',fontSize:15,fontFamily:'Rajdhani'}}>
                          {exercisesLogged.map(ex=><option key={ex} value={ex}>{ex}</option>)}
                        </select>
                      </div>

                      {rmData.length>1&&(()=>{
                        const vals=rmData.map(d=>cvt(d.rm,unit))
                        const minV=Math.min(...vals),maxV=Math.max(...vals)
                        const range=maxV-minV||1
                        const W=340,H=140,PAD=14
                        const pts=rmData.map((d,i,arr)=>{
                          const x=PAD+(i/(arr.length-1||1))*(W-PAD*2)
                          const y=H-PAD-(((cvt(d.rm,unit)-minV)/range)*(H-PAD*2))
                          return{x,y,d}
                        })
                        const pathD=pts.map((p,i)=>i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`).join(' ')
                        const areaD=`${pathD} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`
                        const best=Math.max(...vals)
                        const latest=vals[vals.length-1]
                        const first=vals[0]
                        const gain=Math.round((latest-first)*10)/10
                        const rank=getRank(calcScore(exData))
                        return(
                          <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:16,marginBottom:16}}>
                            {/* Stats row */}
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>
                              {[
                                ['Best 1RM',`${Math.round(best)}${unit}`],
                                ['Latest',`${Math.round(latest)}${unit}`],
                                ['Total Gain',`${gain>0?'+':''}${gain}${unit}`],
                              ].map(([label,val])=>(
                                <div key={label} style={{background:T.bg3,borderRadius:10,padding:'8px 6px',textAlign:'center'}}>
                                  <div style={{fontSize:10,color:T.text3,letterSpacing:1,marginBottom:2}}>{label}</div>
                                  <div style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:1,color:label==='Best 1RM'?rank.color:label==='Total Gain'?gain>=0?'#10B981':T.accent:T.text}}>{val}</div>
                                </div>
                              ))}
                            </div>
                            {/* SVG Chart */}
                            <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',display:'block'}}>
                              <defs>
                                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={rank.color} stopOpacity="0.35"/>
                                  <stop offset="100%" stopColor={rank.color} stopOpacity="0.02"/>
                                </linearGradient>
                              </defs>
                              {/* Grid lines */}
                              {[0.25,0.5,0.75].map((f,i)=>(
                                <line key={i} x1={PAD} y1={PAD+(f*(H-PAD*2))} x2={W-PAD} y2={PAD+(f*(H-PAD*2))}
                                  stroke={T.border} strokeWidth="1" strokeDasharray="4,4"/>
                              ))}
                              {/* Y labels */}
                              {[[0,maxV],[0.5,Math.round((minV+maxV)/2)],[1,minV]].map(([f,v])=>(
                                <text key={f} x={PAD-2} y={PAD+(f*(H-PAD*2))+4} fill={T.text3} fontSize="9" textAnchor="end">{Math.round(cvt(v,unit))}</text>
                              ))}
                              <path d={areaD} fill="url(#chartGrad)" />
                              <path d={pathD} fill="none" stroke={rank.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                              {/* Dots */}
                              {pts.map((p,i)=>(
                                <circle key={i} cx={p.x} cy={p.y} r={i===pts.length-1?5:3}
                                  fill={i===pts.length-1?rank.color:T.bg2} stroke={rank.color} strokeWidth="2"/>
                              ))}
                            </svg>
                            {/* X axis labels */}
                            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.text3,marginTop:4}}>
                              <span>{new Date(rmData[0].date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                              <span>{rmData.length} sessions</span>
                              <span>{new Date(rmData[rmData.length-1].date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                            </div>
                          </div>
                        )
                      })()}

                      {/* Session log for this exercise */}
                      <div style={{fontSize:11,color:T.text3,letterSpacing:3,textTransform:'uppercase',marginBottom:10}}>All Sessions</div>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        {[...exData].reverse().map((s,i)=>{
                          const rm=Math.round(cvt(calc1RM(s.weight,s.reps),unit))
                          const isPR=personalRecords[s.exercise]&&s.id===personalRecords[s.exercise].id
                          return(
                            <div key={s.id} style={{background:T.bg2,border:`1px solid ${isPR?'#F59E0B44':T.border}`,borderRadius:10,padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                              <div>
                                <div style={{fontSize:13,color:T.text}}>{new Date(s.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                                <div style={{fontSize:11,color:T.text3}}>{s.sets} sets × {s.reps} reps</div>
                              </div>
                              <div style={{textAlign:'right',display:'flex',alignItems:'center',gap:8}}>
                                {isPR&&<span style={{background:'#F59E0B22',border:'1px solid #F59E0B44',borderRadius:6,padding:'2px 6px',fontSize:10,color:'#F59E0B',fontWeight:700}}>⭐ PR</span>}
                                <div>
                                  <div style={{fontFamily:'Bebas Neue',fontSize:16,letterSpacing:1,color:T.text}}>{cvt(s.weight,unit)}{unit}</div>
                                  <div style={{fontSize:11,color:T.accent}}>1RM ~{rm}{unit}</div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* LEADERBOARD */}
        {tab==='leaderboard'&&(
          <div className="slide-up">
            <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:2,color:T.text,marginBottom:2}}>LEADERBOARD</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:20,fontFamily:'Inter'}}>Who's dominating the gym.</div>
            {lbLoading?(
              <div style={{textAlign:'center',padding:40,color:T.text3}}><div className="spin" style={{fontSize:24,marginBottom:8,display:'inline-block'}}>◈</div><div>Loading...</div></div>
            ):(
              <>
                {/* Podium */}
                {leaderboard.length>=2&&(
                  <div style={{marginBottom:24}}>
                    <div style={{display:'flex',alignItems:'flex-end',gap:8,justifyContent:'center'}}>
                      {[leaderboard[1],leaderboard[0],leaderboard[2]].filter(Boolean).map((u,i)=>{
                        const pos=i===0?2:i===1?1:3
                        const heights=[105,140,88]
                        const medals=['🥈','🥇','🥉']
                        const mColors=['#C0C0C0','#FFD700','#CD7F32']
                        const isMe=u.id===currentUser.id
                        return(
                          <div key={u.id} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                            <div style={{fontSize:24}}>{medals[i]}</div>
                            <div style={{width:52,height:52,borderRadius:26,background:avatarColor(u.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:700,color:'#fff',border:`3px solid ${mColors[i]}`,boxShadow:`0 0 14px ${mColors[i]}55`,fontFamily:'Bebas Neue',letterSpacing:1}}>{u.name[0].toUpperCase()}</div>
                            <div style={{fontSize:13,fontWeight:700,textAlign:'center',color:T.text}}>{u.name}</div>
                            <div style={{fontSize:11,color:u.rank.color}}>{u.rank.icon} {u.rank.name}</div>
                            <div style={{width:'100%',height:heights[i],background:isMe?T.accentDim:T.bg2,border:`2px solid ${mColors[i]}55`,borderRadius:'10px 10px 0 0',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}>
                              <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${mColors[i]},transparent)`}} />
                              <div style={{fontFamily:'Bebas Neue',fontSize:24,letterSpacing:2,color:mColors[i],textShadow:`0 0 10px ${mColors[i]}88`}}>{Math.round(u.overall)}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* Podium base */}
                    <div style={{height:8,background:T.bg2,border:`1px solid ${T.border}`,borderRadius:'0 0 8px 8px',marginTop:-1}} />
                  </div>
                )}

                {/* Full list */}
                <div style={{fontSize:11,color:T.text3,letterSpacing:3,textTransform:'uppercase',marginBottom:10}}>Overall Rankings</div>
                <div className="stagger" style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
                  {leaderboard.map((u,i)=>{
                    const isMe=u.id===currentUser.id
                    return(
                      <div key={u.id} style={{background:isMe?T.accentDim:T.bg2,border:`1px solid ${isMe?T.accent+'44':T.border}`,borderRadius:14,padding:'12px 14px',position:'relative',overflow:'hidden'}}>
                        {isMe&&<div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${T.accent},transparent)`}} />}
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          <div style={{fontFamily:'Bebas Neue',fontSize:20,letterSpacing:1,color:T.text3,width:26,textAlign:'center'}}>#{i+1}</div>
                          <div style={{width:40,height:40,borderRadius:20,background:avatarColor(u.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'#fff',flexShrink:0,fontFamily:'Bebas Neue',letterSpacing:1}}>{u.name[0].toUpperCase()}</div>
                          <div style={{flex:1}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <span style={{fontSize:16,fontWeight:700,color:T.text}}>{u.name}</span>
                              {isMe&&<span style={{fontSize:9,background:T.accent,color:'#fff',padding:'2px 6px',borderRadius:10,fontWeight:700,letterSpacing:1}}>YOU</span>}
                            </div>
                            <div style={{fontSize:11,color:T.text3}}>{u.goal?.icon} {u.goal?.label}</div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div style={{background:u.rank.gradient,borderRadius:8,padding:'4px 10px',boxShadow:`0 0 10px ${u.rank.color}44`}}>
                              <div style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:1,color:'#fff'}}>{Math.round(u.overall)}</div>
                            </div>
                            <div style={{fontSize:10,color:u.rank.color,marginTop:2}}>{u.rank.icon} {u.rank.name}</div>
                          </div>
                        </div>
                        {/* Muscle icons row */}
                        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:4,marginTop:10}}>
                          {MUSCLE_GROUPS.map(mg=>{
                            const s=u.muscleScores[mg.id],r=getRank(s)
                            return(
                              <div key={mg.id} style={{background:T.bg3,borderRadius:6,padding:'4px 2px',textAlign:'center',border:`1px solid ${r.color}22`}}>
                                <div style={{fontSize:12}}>{mg.icon}</div>
                                <div style={{fontSize:9,color:r.color,fontWeight:700}}>{r.icon}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Per muscle leaderboards */}
                <div style={{fontSize:11,color:T.text3,letterSpacing:3,textTransform:'uppercase',marginBottom:10}}>By Muscle Group</div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {MUSCLE_GROUPS.map(mg=>{
                    const sorted=[...leaderboard].sort((a,b)=>b.muscleScores[mg.id]-a.muscleScores[mg.id])
                    if(!sorted[0]||sorted[0].muscleScores[mg.id]===0) return null
                    return(
                      <div key={mg.id} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:12,padding:'12px 14px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                          <div style={{fontSize:15,fontWeight:700,color:T.text}}>{mg.icon} {mg.name}</div>
                          <div style={{fontSize:11,color:T.text3}}>Top 3</div>
                        </div>
                        {sorted.slice(0,3).filter(u=>u.muscleScores[mg.id]>0).map((u,i)=>{
                          const isMe=u.id===currentUser.id,rank=getRank(u.muscleScores[mg.id])
                          return(
                            <div key={u.id} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0',borderBottom:i<2?`1px solid ${T.border}`:'none'}}>
                              <span style={{color:T.text3,fontSize:12,width:18}}>#{i+1}</span>
                              <div style={{width:28,height:28,borderRadius:14,background:avatarColor(u.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',fontFamily:'Bebas Neue'}}>{u.name[0].toUpperCase()}</div>
                              <span style={{flex:1,fontSize:14,fontWeight:isMe?700:400,color:isMe?T.accent:T.text}}>{u.name}{isMe?' (you)':''}</span>
                              <span style={{fontSize:13,color:rank.color,fontWeight:700}}>{rank.icon} {Math.round(u.muscleScores[mg.id])}</span>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* SETTINGS */}
        {tab==='settings'&&(
          <div className="slide-up">
            <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:2,color:T.text,marginBottom:2}}>SETTINGS</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:20,fontFamily:'Inter'}}>Manage your account.</div>

            {/* Account card */}
            <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:16,marginBottom:12,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${avatarColor(currentUser.name)},transparent)`}} />
              <div style={{fontSize:11,color:T.text3,letterSpacing:3,textTransform:'uppercase',marginBottom:12}}>Account</div>
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
                <div style={{width:56,height:56,borderRadius:28,background:avatarColor(currentUser.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:700,color:'#fff',fontFamily:'Bebas Neue',letterSpacing:1,boxShadow:`0 0 20px ${avatarColor(currentUser.name)}55`}}>{currentUser.name[0].toUpperCase()}</div>
                <div>
                  <div style={{fontFamily:'Bebas Neue',fontSize:24,letterSpacing:1,color:T.text}}>{currentUser.name}</div>
                  <div style={{fontSize:13,color:T.text3}}>{GOALS.find(g=>g.id===(currentUser.goal||'general'))?.icon} {GOALS.find(g=>g.id===(currentUser.goal||'general'))?.label}</div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[['Workouts',workouts.length],['Overall Score',Math.round(totalScore)]].map(([l,v])=>(
                  <div key={l} style={{background:T.bg3,borderRadius:10,padding:'10px',textAlign:'center'}}>
                    <div style={{fontSize:10,color:T.text3,letterSpacing:1}}>{l}</div>
                    <div style={{fontFamily:'Bebas Neue',fontSize:24,letterSpacing:1,color:T.text}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recalibrate */}
            <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:16,marginBottom:12}}>
              <div style={{fontSize:11,color:T.text3,letterSpacing:3,textTransform:'uppercase',marginBottom:8}}>Starting Rank</div>
              <div style={{fontSize:13,color:T.text2,fontFamily:'Inter',marginBottom:14,lineHeight:1.5}}>Already been training? Set your starting rank based on your current lifts.</div>
              <button className="btn-press" onClick={onRecalibrate}
                style={{width:'100%',background:'transparent',border:`1px solid #3B82F6`,borderRadius:10,color:'#3B82F6',padding:12,fontSize:14,fontWeight:700,letterSpacing:2,cursor:'pointer',fontFamily:'Rajdhani'}}>
                ◉ RECALIBRATE MY RANK
              </button>
            </div>

            {/* Danger zone */}
            <div style={{background:T.bg2,border:`1px solid ${T.accent}44`,borderRadius:14,padding:16}}>
              <div style={{fontSize:11,color:T.accent,letterSpacing:3,textTransform:'uppercase',marginBottom:8}}>Danger Zone</div>
              <div style={{fontSize:13,color:T.text2,fontFamily:'Inter',marginBottom:16,lineHeight:1.5}}>
                Deleting your account will permanently remove your profile and <strong style={{color:T.text}}>all {workouts.length} workout sessions</strong>. This cannot be undone.
              </div>
              {!showDeleteConfirm?(
                <button className="btn-press" onClick={()=>setShowDeleteConfirm(true)}
                  style={{width:'100%',background:'transparent',border:`1px solid ${T.accent}`,borderRadius:10,color:T.accent,padding:12,fontSize:14,fontWeight:700,letterSpacing:2,cursor:'pointer',fontFamily:'Rajdhani'}}>
                  DELETE MY ACCOUNT
                </button>
              ):(
                <div>
                  <div style={{background:T.darkMode?'#2A0505':'#FFF5F5',borderRadius:10,padding:12,marginBottom:12,fontSize:13,color:T.darkMode?'#FCA5A5':'#991B1B',fontFamily:'Inter',lineHeight:1.5}}>
                    ⚠️ This will permanently delete your account and all workout data.
                  </div>
                  <div style={{fontSize:11,letterSpacing:3,color:T.text3,textTransform:'uppercase',marginBottom:6}}>Confirm with your PIN</div>
                  <input type="password" inputMode="numeric" maxLength={8} placeholder="••••"
                    value={deletePin} onChange={e=>setDeletePin(e.target.value)}
                    style={{width:'100%',background:T.input,border:`1px solid ${T.accent}55`,borderRadius:10,color:T.text,padding:'12px 14px',fontSize:24,letterSpacing:8,textAlign:'center',marginBottom:10,fontFamily:'Bebas Neue'}} />
                  {deleteMsg&&<div style={{color:T.accent,fontSize:13,textAlign:'center',marginBottom:10}}>{deleteMsg}</div>}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <button className="btn-press" onClick={()=>{setShowDeleteConfirm(false);setDeletePin('');setDeleteMsg('')}}
                      style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:10,color:T.text3,padding:12,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Rajdhani'}}>
                      CANCEL
                    </button>
                    <button className="btn-press" onClick={handleDeleteAccount} disabled={deleteLoading}
                      style={{background:T.accent,border:'none',borderRadius:10,color:'#fff',padding:12,fontSize:13,fontWeight:700,letterSpacing:1,cursor:'pointer',fontFamily:'Rajdhani'}}>
                      {deleteLoading?'...':'CONFIRM DELETE'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${T.accent},transparent)`,zIndex:100}} />
    </div>
  )
}
