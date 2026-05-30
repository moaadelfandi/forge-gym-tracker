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
  { id:'chest',     name:'Chest',     icon:'🫁', color:'#FF6B6B', colorDim:'#FF6B6B20', exercises:['Bench Press','Incline Bench Press','Decline Bench Press','Dumbbell Fly','Incline Dumbbell Fly','Cable Fly','Cable Crossover','Chest Dip','Push-up','Pec Deck Machine','Smith Machine Bench','Landmine Press'] },
  { id:'back',      name:'Back',      icon:'🔱', color:'#4ECDC4', colorDim:'#4ECDC420', exercises:['Deadlift','Barbell Row','Pull-ups','Chin-ups','Lat Pulldown','Seated Cable Row','Single Arm Dumbbell Row','T-Bar Row','Face Pull','Straight Arm Pulldown','Rack Pull','Meadows Row','Cable Pull-over'] },
  { id:'legs',      name:'Legs',      icon:'⚡', color:'#FFE66D', colorDim:'#FFE66D20', exercises:['Squat','Front Squat','Leg Press','Romanian Deadlift','Hack Squat','Lunges','Bulgarian Split Squat','Leg Extension','Leg Curl','Calf Raise','Goblet Squat','Hip Thrust','Sumo Deadlift','Step-ups'] },
  { id:'shoulders', name:'Shoulders', icon:'🔥', color:'#A78BFA', colorDim:'#A78BFA20', exercises:['Overhead Press','Arnold Press','Lateral Raise','Face Pull','Front Raise','Rear Delt Fly','Cable Lateral Raise','Dumbbell Shoulder Press','Machine Shoulder Press','Upright Row','Shrugs','Cable Face Pull','Reverse Pec Deck'] },
  { id:'arms',      name:'Arms',      icon:'💪', color:'#F97316', colorDim:'#F9731620', exercises:['Barbell Curl','Dumbbell Curl','Hammer Curl','Incline Dumbbell Curl','Cable Curl','Preacher Curl','Tricep Dip','Skull Crusher','Tricep Pushdown','Overhead Tricep Extension','Close Grip Bench Press','Cable Overhead Tricep Extension','Diamond Push-up','Concentration Curl'] },
  { id:'core',      name:'Core',      icon:'🎯', color:'#34D399', colorDim:'#34D39920', exercises:['Plank','Ab Wheel','Hanging Leg Raise','Cable Crunch','Dragon Flag','Decline Sit-up','Russian Twist','Hollow Body Hold','L-sit','Weighted Crunch','Landmine Twist','Pallof Press','Dead Bug','Bicycle Crunch'] },
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


// ─── Default templates per goal ──────────────────────────────────────────────
const DEFAULT_TEMPLATES = {
  david_laid: [
    { name:'Push Day', exercises:[
      {muscle:'chest',    exercise:'Incline Bench Press', sets:4,reps:8, weight:60},
      {muscle:'chest',    exercise:'Bench Press',          sets:3,reps:10,weight:70},
      {muscle:'chest',    exercise:'Cable Fly',            sets:3,reps:15,weight:20},
      {muscle:'shoulders',exercise:'Overhead Press',       sets:4,reps:8, weight:40},
      {muscle:'shoulders',exercise:'Lateral Raise',        sets:4,reps:15,weight:10},
      {muscle:'arms',     exercise:'Tricep Pushdown',      sets:3,reps:12,weight:25},
      {muscle:'arms',     exercise:'Skull Crusher',        sets:3,reps:10,weight:20},
    ]},
    { name:'Pull Day', exercises:[
      {muscle:'back',exercise:'Deadlift',        sets:4,reps:5, weight:80},
      {muscle:'back',exercise:'Pull-ups',         sets:4,reps:8, weight:0},
      {muscle:'back',exercise:'Barbell Row',      sets:3,reps:10,weight:60},
      {muscle:'back',exercise:'Lat Pulldown',     sets:3,reps:12,weight:50},
      {muscle:'back',exercise:'Seated Cable Row', sets:3,reps:12,weight:45},
      {muscle:'arms',exercise:'Barbell Curl',     sets:3,reps:10,weight:30},
      {muscle:'arms',exercise:'Hammer Curl',      sets:3,reps:12,weight:15},
    ]},
    { name:'Legs Day', exercises:[
      {muscle:'legs',exercise:'Squat',                 sets:4,reps:8, weight:80},
      {muscle:'legs',exercise:'Romanian Deadlift',     sets:4,reps:10,weight:60},
      {muscle:'legs',exercise:'Leg Press',             sets:3,reps:12,weight:100},
      {muscle:'legs',exercise:'Bulgarian Split Squat', sets:3,reps:10,weight:20},
      {muscle:'legs',exercise:'Leg Extension',         sets:3,reps:15,weight:40},
      {muscle:'legs',exercise:'Leg Curl',              sets:3,reps:12,weight:35},
      {muscle:'legs',exercise:'Calf Raise',            sets:4,reps:20,weight:50},
    ]},
    { name:'Upper Day', exercises:[
      {muscle:'chest',    exercise:'Decline Bench Press',      sets:3,reps:10,weight:60},
      {muscle:'back',     exercise:'Single Arm Dumbbell Row',  sets:3,reps:12,weight:25},
      {muscle:'shoulders',exercise:'Arnold Press',             sets:3,reps:12,weight:15},
      {muscle:'shoulders',exercise:'Cable Lateral Raise',      sets:3,reps:15,weight:8},
      {muscle:'arms',     exercise:'Incline Dumbbell Curl',    sets:3,reps:12,weight:12},
      {muscle:'arms',     exercise:'Overhead Tricep Extension',sets:3,reps:15,weight:20},
      {muscle:'core',     exercise:'Ab Wheel',                 sets:3,reps:12,weight:0},
      {muscle:'core',     exercise:'Hanging Leg Raise',        sets:3,reps:12,weight:0},
    ]},
  ],
  strength: [
    { name:'Upper A — Heavy', exercises:[
      {muscle:'chest',    exercise:'Bench Press',    sets:4,reps:5, weight:80},
      {muscle:'back',     exercise:'Barbell Row',    sets:4,reps:5, weight:70},
      {muscle:'shoulders',exercise:'Overhead Press', sets:3,reps:5, weight:50},
      {muscle:'back',     exercise:'Pull-ups',        sets:3,reps:8, weight:0},
      {muscle:'arms',     exercise:'Barbell Curl',   sets:3,reps:10,weight:30},
      {muscle:'arms',     exercise:'Tricep Pushdown',sets:3,reps:10,weight:25},
    ]},
    { name:'Lower A — Squat', exercises:[
      {muscle:'legs',exercise:'Squat',             sets:4,reps:5, weight:100},
      {muscle:'legs',exercise:'Romanian Deadlift', sets:3,reps:8, weight:70},
      {muscle:'legs',exercise:'Leg Press',         sets:3,reps:10,weight:120},
      {muscle:'legs',exercise:'Leg Curl',          sets:3,reps:12,weight:40},
      {muscle:'legs',exercise:'Calf Raise',        sets:4,reps:15,weight:60},
      {muscle:'core', exercise:'Plank',            sets:3,reps:60,weight:0},
    ]},
    { name:'Upper B — Volume', exercises:[
      {muscle:'chest',exercise:'Incline Bench Press',sets:4,reps:10,weight:70},
      {muscle:'back', exercise:'Lat Pulldown',       sets:4,reps:10,weight:55},
      {muscle:'chest',exercise:'Cable Fly',          sets:3,reps:15,weight:18},
      {muscle:'back', exercise:'Seated Cable Row',   sets:3,reps:12,weight:50},
      {muscle:'arms', exercise:'Barbell Curl',       sets:3,reps:10,weight:28},
      {muscle:'arms', exercise:'Skull Crusher',      sets:3,reps:10,weight:22},
    ]},
    { name:'Lower B — Deadlift', exercises:[
      {muscle:'back',exercise:'Deadlift',      sets:4,reps:5, weight:120},
      {muscle:'legs',exercise:'Front Squat',   sets:3,reps:8, weight:70},
      {muscle:'legs',exercise:'Leg Extension', sets:3,reps:15,weight:45},
      {muscle:'legs',exercise:'Hip Thrust',    sets:3,reps:12,weight:80},
      {muscle:'legs',exercise:'Calf Raise',    sets:3,reps:15,weight:60},
      {muscle:'core', exercise:'Ab Wheel',     sets:3,reps:10,weight:0},
    ]},
  ],
  powerlifting: [
    { name:'Squat Day', exercises:[
      {muscle:'legs',exercise:'Squat',             sets:5,reps:5,weight:120},
      {muscle:'legs',exercise:'Leg Press',         sets:3,reps:10,weight:140},
      {muscle:'legs',exercise:'Romanian Deadlift', sets:3,reps:8, weight:80},
      {muscle:'legs',exercise:'Leg Curl',          sets:3,reps:10,weight:45},
      {muscle:'core', exercise:'Ab Wheel',         sets:4,reps:10,weight:0},
    ]},
    { name:'Bench Day', exercises:[
      {muscle:'chest',exercise:'Bench Press',           sets:5,reps:5, weight:90},
      {muscle:'arms', exercise:'Close Grip Bench Press',sets:3,reps:8, weight:70},
      {muscle:'arms', exercise:'Tricep Pushdown',       sets:4,reps:12,weight:28},
      {muscle:'arms', exercise:'Skull Crusher',         sets:3,reps:10,weight:24},
      {muscle:'back', exercise:'Face Pull',             sets:3,reps:15,weight:20},
    ]},
    { name:'Deadlift Day', exercises:[
      {muscle:'back',exercise:'Deadlift',    sets:5,reps:3,weight:140},
      {muscle:'back',exercise:'Rack Pull',   sets:3,reps:5,weight:160},
      {muscle:'back',exercise:'Barbell Row', sets:4,reps:8,weight:80},
      {muscle:'back',exercise:'Lat Pulldown',sets:3,reps:10,weight:60},
      {muscle:'core', exercise:'Ab Wheel',  sets:3,reps:12,weight:0},
    ]},
    { name:'Accessory Day', exercises:[
      {muscle:'legs',    exercise:'Front Squat',              sets:3,reps:5, weight:80},
      {muscle:'chest',   exercise:'Incline Bench Press',      sets:3,reps:8, weight:70},
      {muscle:'legs',    exercise:'Sumo Deadlift',            sets:3,reps:5, weight:100},
      {muscle:'arms',    exercise:'Overhead Tricep Extension',sets:3,reps:12,weight:22},
      {muscle:'arms',    exercise:'Barbell Curl',             sets:3,reps:10,weight:30},
      {muscle:'core',    exercise:'Pallof Press',             sets:3,reps:12,weight:15},
    ]},
  ],
  fat_loss: [
    { name:'Full Body A', exercises:[
      {muscle:'legs',    exercise:'Squat',         sets:4,reps:15,weight:60},
      {muscle:'chest',   exercise:'Bench Press',   sets:3,reps:12,weight:60},
      {muscle:'back',    exercise:'Barbell Row',   sets:3,reps:12,weight:55},
      {muscle:'shoulders',exercise:'Overhead Press',sets:3,reps:12,weight:35},
      {muscle:'core',    exercise:'Plank',         sets:3,reps:45,weight:0},
    ]},
    { name:'Upper Body', exercises:[
      {muscle:'chest',   exercise:'Incline Bench Press',sets:3,reps:15,weight:50},
      {muscle:'back',    exercise:'Lat Pulldown',      sets:3,reps:15,weight:45},
      {muscle:'shoulders',exercise:'Lateral Raise',    sets:4,reps:20,weight:8},
      {muscle:'arms',    exercise:'Dumbbell Curl',     sets:3,reps:15,weight:12},
      {muscle:'arms',    exercise:'Tricep Pushdown',   sets:3,reps:15,weight:18},
    ]},
    { name:'Lower Body', exercises:[
      {muscle:'legs',exercise:'Romanian Deadlift',     sets:4,reps:12,weight:60},
      {muscle:'legs',exercise:'Leg Press',             sets:3,reps:15,weight:90},
      {muscle:'legs',exercise:'Bulgarian Split Squat', sets:3,reps:12,weight:15},
      {muscle:'legs',exercise:'Leg Extension',         sets:3,reps:20,weight:35},
      {muscle:'legs',exercise:'Calf Raise',            sets:4,reps:20,weight:40},
    ]},
    { name:'Full Body B', exercises:[
      {muscle:'back',exercise:'Deadlift',        sets:3,reps:10,weight:70},
      {muscle:'chest',exercise:'Push-up',        sets:3,reps:20,weight:0},
      {muscle:'back', exercise:'Pull-ups',        sets:3,reps:10,weight:0},
      {muscle:'legs', exercise:'Goblet Squat',   sets:3,reps:15,weight:20},
      {muscle:'core', exercise:'Ab Wheel',       sets:3,reps:12,weight:0},
      {muscle:'core', exercise:'Hanging Leg Raise',sets:3,reps:15,weight:0},
    ]},
  ],
  athlete: [
    { name:'Power — Lower', exercises:[
      {muscle:'legs',exercise:'Squat',             sets:5,reps:5, weight:100},
      {muscle:'legs',exercise:'Romanian Deadlift', sets:3,reps:8, weight:80},
      {muscle:'legs',exercise:'Hip Thrust',        sets:4,reps:10,weight:90},
      {muscle:'legs',exercise:'Calf Raise',        sets:4,reps:15,weight:50},
      {muscle:'core', exercise:'Pallof Press',     sets:3,reps:12,weight:15},
    ]},
    { name:'Upper Power', exercises:[
      {muscle:'chest',   exercise:'Bench Press',   sets:4,reps:5,weight:80},
      {muscle:'back',    exercise:'Barbell Row',   sets:4,reps:5,weight:70},
      {muscle:'shoulders',exercise:'Overhead Press',sets:3,reps:8,weight:50},
      {muscle:'back',    exercise:'Pull-ups',       sets:3,reps:8,weight:0},
      {muscle:'core',    exercise:'Ab Wheel',      sets:3,reps:10,weight:0},
    ]},
    { name:'Strength Day', exercises:[
      {muscle:'back',exercise:'Deadlift',     sets:4,reps:5,weight:120},
      {muscle:'legs',exercise:'Front Squat',  sets:3,reps:5,weight:80},
      {muscle:'back',exercise:'Barbell Row',  sets:3,reps:6,weight:75},
      {muscle:'arms',exercise:'Barbell Curl', sets:3,reps:8,weight:35},
      {muscle:'core', exercise:'Hanging Leg Raise',sets:3,reps:12,weight:0},
    ]},
    { name:'Conditioning', exercises:[
      {muscle:'legs',    exercise:'Bulgarian Split Squat',sets:3,reps:10,weight:20},
      {muscle:'chest',   exercise:'Incline Bench Press', sets:3,reps:10,weight:65},
      {muscle:'back',    exercise:'Lat Pulldown',        sets:3,reps:10,weight:55},
      {muscle:'shoulders',exercise:'Lateral Raise',      sets:3,reps:15,weight:10},
      {muscle:'arms',    exercise:'Hammer Curl',         sets:3,reps:12,weight:14},
      {muscle:'core',    exercise:'Dragon Flag',         sets:3,reps:8, weight:0},
    ]},
  ],
  general: [
    { name:'Push Day', exercises:[
      {muscle:'chest',   exercise:'Bench Press',    sets:3,reps:10,weight:60},
      {muscle:'chest',   exercise:'Incline Bench Press',sets:3,reps:10,weight:50},
      {muscle:'shoulders',exercise:'Overhead Press', sets:3,reps:10,weight:35},
      {muscle:'shoulders',exercise:'Lateral Raise',  sets:3,reps:15,weight:8},
      {muscle:'arms',    exercise:'Tricep Pushdown', sets:3,reps:12,weight:20},
    ]},
    { name:'Pull Day', exercises:[
      {muscle:'back',exercise:'Deadlift',       sets:3,reps:8, weight:80},
      {muscle:'back',exercise:'Barbell Row',    sets:3,reps:10,weight:60},
      {muscle:'back',exercise:'Lat Pulldown',   sets:3,reps:12,weight:50},
      {muscle:'back',exercise:'Seated Cable Row',sets:3,reps:12,weight:45},
      {muscle:'arms',exercise:'Barbell Curl',   sets:3,reps:10,weight:28},
    ]},
    { name:'Legs Day', exercises:[
      {muscle:'legs',exercise:'Squat',             sets:4,reps:10,weight:70},
      {muscle:'legs',exercise:'Romanian Deadlift', sets:3,reps:10,weight:60},
      {muscle:'legs',exercise:'Leg Press',         sets:3,reps:12,weight:90},
      {muscle:'legs',exercise:'Leg Extension',     sets:3,reps:15,weight:40},
      {muscle:'legs',exercise:'Calf Raise',        sets:3,reps:15,weight:50},
    ]},
    { name:'Upper Day', exercises:[
      {muscle:'back',    exercise:'Pull-ups',              sets:3,reps:8, weight:0},
      {muscle:'shoulders',exercise:'Dumbbell Shoulder Press',sets:3,reps:10,weight:15},
      {muscle:'arms',    exercise:'Barbell Curl',          sets:3,reps:12,weight:28},
      {muscle:'arms',    exercise:'Skull Crusher',         sets:3,reps:12,weight:20},
      {muscle:'core',    exercise:'Ab Wheel',              sets:3,reps:10,weight:0},
      {muscle:'core',    exercise:'Hanging Leg Raise',     sets:3,reps:12,weight:0},
    ]},
  ],
}


// ─── Auto-Progression Engine ─────────────────────────────────────────────────
const PROG_KEY = (userId) => `arise_progression_${userId}`
const DELOAD_DAYS = 10
const DELOAD_CAP = 0.20   // max 20% reduction from absence
const DELOAD_WEEK = 0.80  // deload week = 80% of working weight
const FAIL_STREAK_TRIGGER = 2

// Muscle group type affects increment size
const MUSCLE_TYPE = {
  chest:'upper', back:'upper', shoulders:'upper', arms:'upper',
  legs:'lower', core:'core'
}

// Base increment scales with weight (heavier = smaller %)
function calcIncrement(weightKg, muscleId, performance) {
  const isLower = MUSCLE_TYPE[muscleId] === 'lower'
  const baseRate = isLower ? 0.04 : 0.025 // 4% lower, 2.5% upper
  // Adjust by performance
  let multiplier = 1
  if (performance === 'crushed')  multiplier = 1.5   // did more reps than prescribed
  if (performance === 'hit')      multiplier = 1.0   // hit exactly
  if (performance === 'close')    multiplier = 0     // missed 1-2 reps, hold
  if (performance === 'failed')   multiplier = -0.5  // missed 3+ reps, reduce
  const raw = weightKg * baseRate * multiplier
  // Round to nearest 1.25kg for dumbbells, 2.5kg for barbells
  const step = weightKg < 30 ? 1.25 : 2.5
  return Math.round(raw / step) * step
}

function getPerformance(targetReps, actualReps) {
  const diff = actualReps - targetReps
  if (diff >= 2)  return 'crushed'
  if (diff >= 0)  return 'hit'
  if (diff >= -2) return 'close'
  return 'failed'
}

function calcDeloadReduction(weightKg, daysMissed) {
  if (daysMissed < DELOAD_DAYS) return 0
  const weeksOver = Math.floor((daysMissed - DELOAD_DAYS) / 7)
  const reduction = Math.min(weeksOver * 0.05, DELOAD_CAP) // 5% per missed week
  return weightKg * reduction
}

function loadProgression(userId) {
  try { return JSON.parse(localStorage.getItem(PROG_KEY(userId)) || '{}') }
  catch { return {} }
}

function saveProgression(userId, data) {
  localStorage.setItem(PROG_KEY(userId), JSON.stringify(data))
}

// Get suggested weight for an exercise
function getSuggestedWeight(userId, exercise, baseWeightKg, muscleId, targetReps) {
  const prog = loadProgression(userId)
  const key = exercise.toLowerCase().trim()
  const record = prog[key]

  if (!record) {
    // No history — use template weight
    return { weight: baseWeightKg, reason: null, isDeload: false }
  }

  const daysMissed = Math.floor((Date.now() - record.lastDate) / (1000 * 60 * 60 * 24))
  let suggested = record.suggestedNext || record.lastWeight
  let reason = null
  let isDeload = false

  // Check for deload from absence
  const reduction = calcDeloadReduction(suggested, daysMissed)
  if (reduction > 0) {
    suggested = Math.max(suggested - reduction, baseWeightKg * 0.6)
    const weeks = Math.floor((daysMissed - DELOAD_DAYS) / 7) + 1
    reason = `${daysMissed} days since last session — reduced by ${Math.round(reduction * 10) / 10}kg`
    isDeload = true
  }

  // Check for deload week from consecutive failures
  if (record.failStreak >= FAIL_STREAK_TRIGGER) {
    suggested = Math.round(suggested * DELOAD_WEEK * 4) / 4
    reason = `Failed ${record.failStreak}x in a row — deload week at 80%`
    isDeload = true
  }

  // Round to nearest 1.25
  suggested = Math.round(suggested * 4) / 4

  return { weight: suggested, reason, isDeload }
}

// Update progression after a logged set
function recordProgression(userId, exercise, muscleId, weightKg, reps, targetReps) {
  const prog = loadProgression(userId)
  const key = exercise.toLowerCase().trim()
  const record = prog[key] || { lastWeight: weightKg, suggestedNext: weightKg, failStreak: 0, successStreak: 0 }

  const performance = getPerformance(targetReps, reps)
  const increment = calcIncrement(weightKg, muscleId, performance)
  const newSuggested = Math.max(weightKg + increment, 1)

  prog[key] = {
    lastWeight: weightKg,
    lastReps: reps,
    lastDate: Date.now(),
    suggestedNext: newSuggested,
    failStreak: performance === 'failed' ? (record.failStreak || 0) + 1 : 0,
    successStreak: (performance === 'hit' || performance === 'crushed') ? (record.successStreak || 0) + 1 : 0,
    performance,
  }

  saveProgression(userId, prog)
  return prog[key]
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
const ACTIVE_SESSION_KEY=(uid)=>`arise_active_session_${uid}`
function loadSettings(){
  try{
    const s=JSON.parse(localStorage.getItem(SETTINGS_KEY))
    return s?{unit:'kg',trainingDays:['Mon','Tue','Thu','Fri'],ownSplit:false,darkMode:true,onboardingDone:false,...s}:{unit:'kg',trainingDays:['Mon','Tue','Thu','Fri'],ownSplit:false,darkMode:true,onboardingDone:false}
  }catch{return{unit:'kg',trainingDays:['Mon','Tue','Thu','Fri'],ownSplit:false,darkMode:true,onboardingDone:false}}
}
function loadSession(){
  try{return JSON.parse(localStorage.getItem(SESSION_KEY))||null}catch{return null}
}

// ─── Global CSS ───────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  ::-webkit-scrollbar{width:3px;height:3px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
  html,body{font-family:'Nunito',sans-serif;-webkit-font-smoothing:antialiased;}
  input,select,button{font-family:'Nunito',sans-serif;outline:none;}
  input:focus,select:focus{border-color:var(--accent)!important;box-shadow:0 0 0 3px var(--accent-dim);}
  input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;}
  .arise-bg{background:var(--bg);min-height:100vh;color:var(--text);transition:background 0.25s,color 0.25s;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp 0.3s ease forwards;}
  .stagger>*{opacity:0;animation:fadeUp 0.3s ease forwards;}
  .stagger>*:nth-child(1){animation-delay:.04s}.stagger>*:nth-child(2){animation-delay:.08s}
  .stagger>*:nth-child(3){animation-delay:.12s}.stagger>*:nth-child(4){animation-delay:.16s}
  .stagger>*:nth-child(5){animation-delay:.20s}.stagger>*:nth-child(6){animation-delay:.24s}
  @keyframes barFill{from{width:0}to{width:var(--w)}}
  .bar{animation:barFill 0.9s cubic-bezier(.4,0,.2,1) forwards;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .spin{animation:spin 1s linear infinite;display:inline-block;}
  @keyframes logFlash{0%{opacity:0;transform:scale(.85)}15%{opacity:1;transform:scale(1.04)}85%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.97)}}
  .log-flash{animation:logFlash 2s ease forwards;}
  @keyframes rankGlow{0%,100%{box-shadow:0 0 10px var(--rc),0 0 24px var(--rc-dim)}50%{box-shadow:0 0 18px var(--rc),0 0 44px var(--rc-dim)}}
  .rank-glow{animation:rankGlow 2.5s ease-in-out infinite;}
  @keyframes streak{0%{left:-40%;opacity:0}20%{opacity:.7}80%{opacity:.3}100%{left:120%;opacity:0}}
  .streak{animation:streak 1.8s ease-in-out forwards;animation-delay:.7s;}
  .btn{transition:all .15s ease;cursor:pointer;border:none;}
  .btn:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px);}
  .btn:active:not(:disabled){transform:scale(.97);}
  .btn:disabled{opacity:.4;cursor:not-allowed;}
  .lift{transition:transform .18s,box-shadow .18s;}
  .lift:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(0,0,0,.18);}
  .press{transition:transform .12s;cursor:pointer;}
  .press:active{transform:scale(.96);}
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
  const [showOnboarding,setShowOnboarding] = useState(false)

  const T = settings.darkMode ? DARK : LIGHT
  const cssVars = {'--bg':T.bg,'--bg2':T.bg2,'--bg3':T.bg3,'--border':T.border,'--text':T.text,'--text2':T.text2,'--text3':T.text3,'--accent':T.accent,'--accent-dim':T.accentDim,'--card':T.card,'--input':T.input}

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
    if(error){setAuthMsg('Error. Try again.');setAuthLoading(false);return}
    setPendingUser({id,name:name.trim(),goal})
    setScreen('calibrate')
    setAuthLoading(false)
  }

  async function handleLogin(userId){
    const{pin}=authForm
    if(!pin){setAuthMsg('Enter your PIN.');return}
    setAuthLoading(true)
    const{data,error}=await supabase.from('users').select('*').eq('id',userId).eq('pin',pin).single()
    if(error||!data){setAuthMsg('Wrong PIN.');setAuthLoading(false);return}
    setCurrentUser({id:data.id,name:data.name,goal:data.goal||'general'})
    setAuthMsg('');setAuthLoading(false)
  }

  function handleLogout(){
    setCurrentUser(null)
    setAuthForm({name:'',pin:'',confirmPin:'',goal:'david_laid'})
    setAuthMsg('');setSelectedUser(null)
  }

  if(screen==='app'&&currentUser) return (
    <MainApp currentUser={currentUser} onLogout={handleLogout} allUsers={users}
      settings={settings} setSettings={setSettings} T={T} cssVars={cssVars}
      showOnboarding={showOnboarding} onOnboardingDone={()=>setShowOnboarding(false)}
      onRecalibrate={()=>{setPendingUser(currentUser);setScreen('calibrate')}} />
  )
  if(screen==='calibrate'&&pendingUser) return (
    <CalibrationScreen user={pendingUser} T={T} cssVars={cssVars}
      onDone={u=>{setCurrentUser(u);setPendingUser(null);setShowOnboarding(true)}}
      onSkip={u=>{setCurrentUser(u);setPendingUser(null);setShowOnboarding(true)}} />
  )

  // ── Login / Register screen ──
  return (
    <div className="arise-bg" style={{...cssVars,minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,position:'relative',overflow:'hidden'}}>
      <style>{GLOBAL_CSS}</style>
      {/* Soft radial bg */}
      <div style={{position:'absolute',top:'-20%',left:'50%',transform:'translateX(-50%)',width:500,height:500,borderRadius:'50%',background:`radial-gradient(circle,${T.accent}18 0%,transparent 70%)`,pointerEvents:'none'}} />

      <div style={{width:'100%',maxWidth:400,position:'relative',zIndex:1}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontFamily:'Bebas Neue',fontSize:72,letterSpacing:8,color:T.text,lineHeight:0.9,textShadow:T.darkMode?`0 0 40px ${T.accent}33`:''}}> ARISE</div>
          <div style={{fontSize:13,letterSpacing:4,color:T.accent,fontWeight:700,marginTop:8}}>PHYSIQUE TRACKER</div>
        </div>

        {/* Theme toggle */}
        <button onClick={()=>setSettings(s=>({...s,darkMode:!s.darkMode}))}
          style={{position:'absolute',top:0,right:0,background:T.bg2,border:`1px solid ${T.border}`,borderRadius:12,padding:'6px 10px',cursor:'pointer',fontSize:16,color:T.text2}}>
          {settings.darkMode?'☀️':'🌙'}
        </button>

        {screen==='register' ? (
          <RegisterForm authForm={authForm} setAuthForm={setAuthForm} authMsg={authMsg}
            authLoading={authLoading} onRegister={handleRegister}
            onBack={()=>{setScreen('login');setAuthMsg('')}} T={T} />
        ) : !selectedUser ? (
          <div>
            {users.length===0
              ? <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:16,padding:20,textAlign:'center',color:T.text3,marginBottom:16,fontSize:14}}>No accounts yet. Be the first!</div>
              : <div className="stagger" style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
                  {users.map(u=>{
                    const goal=GOALS.find(g=>g.id===(u.goal||'general'))
                    return(
                      <button key={u.id} className="lift btn" onClick={()=>{setSelectedUser(u);setAuthForm(f=>({...f,pin:''}));setAuthMsg('')}}
                        style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:16,padding:'14px 16px',display:'flex',alignItems:'center',gap:12,textAlign:'left',width:'100%'}}>
                        <div style={{width:44,height:44,borderRadius:22,background:avatarColor(u.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:900,color:'#fff',flexShrink:0,fontFamily:'Bebas Neue'}}>{u.name[0].toUpperCase()}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:17,fontWeight:700,color:T.text}}>{u.name}</div>
                          <div style={{fontSize:12,color:T.text3,marginTop:1}}>{goal?.icon} {goal?.label}</div>
                        </div>
                        <div style={{color:T.text3,fontSize:20}}>›</div>
                      </button>
                    )
                  })}
                </div>
            }
            <button className="btn" onClick={()=>{setScreen('register');setAuthMsg('')}}
              style={{width:'100%',background:'transparent',border:`1px solid ${T.border}`,borderRadius:12,color:T.text3,padding:13,fontSize:14,fontWeight:700,letterSpacing:1}}>
              + Create Account
            </button>
          </div>
        ) : (
          <div className="fade-up" style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:20,padding:20}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
              <div style={{width:48,height:48,borderRadius:24,background:avatarColor(selectedUser.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:900,color:'#fff',fontFamily:'Bebas Neue'}}>{selectedUser.name[0].toUpperCase()}</div>
              <div>
                <div style={{fontSize:20,fontWeight:800,color:T.text}}>{selectedUser.name}</div>
                <button onClick={()=>{setSelectedUser(null);setAuthMsg('')}} style={{background:'none',border:'none',color:T.text3,fontSize:12,cursor:'pointer',padding:0,fontFamily:'Nunito'}}>← Back</button>
              </div>
            </div>
            <div style={{fontSize:12,fontWeight:700,color:T.text3,letterSpacing:1,marginBottom:8}}>PIN</div>
            <input type="password" inputMode="numeric" maxLength={8} placeholder="••••"
              value={authForm.pin} onChange={e=>setAuthForm(f=>({...f,pin:e.target.value}))}
              onKeyDown={e=>e.key==='Enter'&&handleLogin(selectedUser.id)}
              style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:12,color:T.text,padding:14,fontSize:28,letterSpacing:10,textAlign:'center',marginBottom:14}} />
            {authMsg&&<div style={{color:T.accent,fontSize:13,marginBottom:12,textAlign:'center'}}>{authMsg}</div>}
            <button className="btn" onClick={()=>handleLogin(selectedUser.id)} disabled={authLoading}
              style={{width:'100%',background:T.accent,borderRadius:12,color:'#fff',padding:14,fontSize:16,fontWeight:800,letterSpacing:2,boxShadow:`0 4px 16px ${T.accent}44`}}>
              {authLoading?<span className="spin">◈</span>:'Sign In'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function RegisterForm({authForm,setAuthForm,authMsg,authLoading,onRegister,onBack,T}){
  return(
    <div className="fade-up" style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:20,padding:20}}>
      <div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:4}}>Create Account</div>
      <div style={{fontSize:13,color:T.text3,marginBottom:20}}>Choose your goal and set a PIN.</div>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:T.text3,letterSpacing:1,marginBottom:6}}>NAME</div>
          <input placeholder="Your name" value={authForm.name} onChange={e=>setAuthForm(f=>({...f,name:e.target.value}))}
            style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:12,color:T.text,padding:'11px 14px',fontSize:15}} />
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:T.text3,letterSpacing:1,marginBottom:8}}>GOAL</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {GOALS.map(g=>(
              <button key={g.id} onClick={()=>setAuthForm(f=>({...f,goal:g.id}))} className="btn"
                style={{background:authForm.goal===g.id?T.accentDim:T.input,border:`1.5px solid ${authForm.goal===g.id?T.accent:T.border}`,borderRadius:12,padding:'10px 12px',display:'flex',alignItems:'center',gap:10,textAlign:'left',width:'100%',transition:'all .15s'}}>
                <span style={{fontSize:18}}>{g.icon}</span>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:authForm.goal===g.id?T.accent:T.text}}>{g.label}</div>
                  <div style={{fontSize:11,color:T.text3}}>{g.desc}</div>
                </div>
                {authForm.goal===g.id&&<span style={{marginLeft:'auto',color:T.accent}}>✓</span>}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:T.text3,letterSpacing:1,marginBottom:6}}>PIN (4-8 digits)</div>
          <input type="password" inputMode="numeric" maxLength={8} placeholder="••••" value={authForm.pin} onChange={e=>setAuthForm(f=>({...f,pin:e.target.value}))}
            style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:12,color:T.text,padding:'11px 14px',fontSize:22,letterSpacing:6,textAlign:'center'}} />
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:T.text3,letterSpacing:1,marginBottom:6}}>CONFIRM PIN</div>
          <input type="password" inputMode="numeric" maxLength={8} placeholder="••••" value={authForm.confirmPin} onChange={e=>setAuthForm(f=>({...f,confirmPin:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&onRegister()}
            style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:12,color:T.text,padding:'11px 14px',fontSize:22,letterSpacing:6,textAlign:'center'}} />
        </div>
        {authMsg&&<div style={{color:T.accent,fontSize:13,textAlign:'center'}}>{authMsg}</div>}
        <button className="btn" onClick={onRegister} disabled={authLoading}
          style={{background:T.accent,borderRadius:12,color:'#fff',padding:14,fontSize:16,fontWeight:800,letterSpacing:2,boxShadow:`0 4px 16px ${T.accent}44`}}>
          {authLoading?'...':'Create Account'}
        </button>
        <button className="btn" onClick={onBack} style={{background:'transparent',color:T.text3,padding:4,fontSize:13,fontWeight:600}}>← Back</button>
      </div>
    </div>
  )
}

// ─── Calibration ─────────────────────────────────────────────────────────────
function CalibrationScreen({user,T,cssVars,onDone,onSkip}){
  const [lifts,setLifts]=useState({})
  const [saving,setSaving]=useState(false)
  const [step,setStep]=useState(0)
  const CALIB=[
    {muscle:'chest',     name:'Bench Press',    placeholder:'e.g. 80'},
    {muscle:'back',      name:'Deadlift',        placeholder:'e.g. 100'},
    {muscle:'legs',      name:'Squat',           placeholder:'e.g. 90'},
    {muscle:'shoulders', name:'Overhead Press',  placeholder:'e.g. 60'},
    {muscle:'arms',      name:'Barbell Curl',    placeholder:'e.g. 40'},
    {muscle:'core',      name:'Hanging Leg Raise',placeholder:'reps only'},
  ]
  async function save(){
    setSaving(true)
    const rows=Object.entries(lifts).filter(([,v])=>v&&parseFloat(v)>0).map(([muscle,weight])=>({user_id:user.id,muscle,exercise:CALIB.find(e=>e.muscle===muscle)?.name||muscle,weight:parseFloat(weight),reps:1,sets:1}))
    if(rows.length>0) await supabase.from('workouts').insert(rows)
    setSaving(false);onDone(user)
  }
  if(step===0) return(
    <div className="arise-bg" style={{...cssVars,minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{width:'100%',maxWidth:400,textAlign:'center'}}>
        <div style={{fontSize:60,marginBottom:16}}>🏋️</div>
        <div style={{fontFamily:'Bebas Neue',fontSize:34,letterSpacing:3,color:T.text,marginBottom:8}}>Hey {user.name}!</div>
        <div style={{fontSize:15,color:T.text2,lineHeight:1.7,marginBottom:28}}>Been training before? We can set your starting rank based on where you actually are right now.</div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <button className="btn" onClick={()=>setStep(1)} style={{background:T.accent,borderRadius:14,color:'#fff',padding:16,fontSize:16,fontWeight:800,letterSpacing:2,boxShadow:`0 4px 16px ${T.accent}44`}}>Yes, set my starting rank</button>
          <button className="btn" onClick={()=>onSkip(user)} style={{background:'transparent',border:`1px solid ${T.border}`,borderRadius:14,color:T.text3,padding:14,fontSize:14,fontWeight:600}}>I'm new — start from scratch</button>
        </div>
      </div>
    </div>
  )
  return(
    <div className="arise-bg" style={{...cssVars,minHeight:'100vh',paddingBottom:40}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{background:T.bg2,borderBottom:`1px solid ${T.border}`,padding:'20px 20px 16px'}}>
        <div style={{fontSize:11,letterSpacing:4,color:T.accent,fontWeight:700,marginBottom:4}}>SETUP</div>
        <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:2,color:T.text}}>Set Your Starting Rank</div>
        <div style={{fontSize:13,color:T.text2,marginTop:4}}>Enter your current working weight. Skip any you don't know.</div>
      </div>
      <div style={{padding:'16px 16px'}}>
        <div className="stagger" style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
          {CALIB.map(ex=>{
            const mg=MUSCLE_GROUPS.find(m=>m.id===ex.muscle)
            const val=lifts[ex.muscle]||''
            const est=val?calc1RM(parseFloat(val),5):0
            const ps=est>0?Math.min((est/200)*100*0.6+Math.min((parseFloat(val)*5*3/10000)*100,100)*0.4,100):0
            const pr=getRank(ps)
            return(
              <div key={ex.muscle} style={{background:T.bg2,border:`1.5px solid ${val?pr.color+'55':T.border}`,borderRadius:16,padding:14,transition:'border-color .3s'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:32,height:32,borderRadius:10,background:mg?.colorDim,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{mg?.icon}</div>
                    <div>
                      <div style={{fontSize:15,fontWeight:700,color:T.text}}>{mg?.name}</div>
                      <div style={{fontSize:11,color:T.text3}}>{ex.name}</div>
                    </div>
                  </div>
                  {val?<div style={{fontSize:13,fontWeight:700,color:pr.color}}>{pr.icon} {pr.name}</div>
                      :<div style={{fontSize:12,color:T.text3}}>◈ Beginner</div>}
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <input type="number" min="0" inputMode="decimal" placeholder={ex.placeholder} value={val}
                    onChange={e=>setLifts(l=>({...l,[ex.muscle]:e.target.value}))}
                    style={{flex:1,background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'10px 12px',fontSize:20,fontWeight:700,textAlign:'center'}} />
                  <span style={{fontSize:13,color:T.text3,fontWeight:700}}>kg</span>
                </div>
                {val&&<div style={{fontSize:11,color:T.text3,marginTop:6}}>Est. 1RM: <span style={{color:pr.color,fontWeight:700}}>{Math.round(est)}kg</span></div>}
              </div>
            )
          })}
        </div>
        <button className="btn" onClick={save} disabled={saving} style={{width:'100%',background:T.accent,borderRadius:14,color:'#fff',padding:16,fontSize:16,fontWeight:800,letterSpacing:2,boxShadow:`0 4px 16px ${T.accent}44`}}>
          {saving?'Saving...':'Save & Start'}
        </button>
        <button className="btn" onClick={()=>onSkip(user)} style={{display:'block',width:'100%',background:'transparent',color:T.text3,padding:12,fontSize:13,fontWeight:600,marginTop:8,textAlign:'center'}}>Skip</button>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function MainApp({currentUser,onLogout,allUsers,settings,setSettings,T,cssVars,onRecalibrate,showOnboarding,onOnboardingDone}){
  const [tab,setTab]                   = useState('today')
  const [workouts,setWorkouts]         = useState([])
  const [allWorkouts,setAllWorkouts]   = useState([])
  const [loading,setLoading]           = useState(true)
  const [logSuccess,setLogSuccess]     = useState(false)

  // Log form
  const [logOpen,setLogOpen]           = useState(false)
  const [logForm,setLogForm]           = useState({muscle:'chest',exercise:'',weight:'',reps:'',sets:'3'})
  const [customEx,setCustomEx]         = useState('')
  const [perHand,setPerHand]           = useState(false)
  const [logLoading,setLogLoading]     = useState(false)
  const [logMsg,setLogMsg]             = useState('')

  // Templates
  const [templates,setTemplates]       = useState([])
  const [activeTemplate,setActiveTemplate] = useState(null)
  const [checked,setChecked]           = useState({})
  const [sessionRestored,setSessionRestored] = useState(false)
  const [confirmEx,setConfirmEx]       = useState(null)
  const [confirmW,setConfirmW]         = useState('')
  const [confirmR,setConfirmR]         = useState('')
  const [confirmS,setConfirmS]         = useState('')
  const [showCreateTmpl,setShowCreateTmpl] = useState(false)
  const [newTmplName,setNewTmplName]   = useState('')
  const [newTmplExs,setNewTmplExs]     = useState([])
  const [addingEx,setAddingEx]         = useState(false)
  const [exForm,setExForm]             = useState({muscle:'chest',exercise:'',sets:'3',reps:'8',weight:''})
  const [customExTmpl,setCustomExTmpl] = useState('')

  // Body weight
  const [bodyWeights,setBodyWeights]   = useState([])
  const [bwInput,setBwInput]           = useState('')
  const [bwUnit,setBwUnit]             = useState('kg')
  const [bwLoading,setBwLoading]       = useState(false)

  // Community
  const [lbLoading,setLbLoading]       = useState(true)
  const [viewingProfile,setViewingProfile] = useState(null)
  const [challenges,setChallenges]     = useState([])
  const [myParts,setMyParts]           = useState([])
  const [allUsersWorkouts,setAllUsersWorkouts] = useState([])
  const [showCreateChallenge,setShowCreateChallenge] = useState(false)
  const [challengeForm,setChallengeForm] = useState({title:'',description:'',muscle:'chest',metric:'1rm',target:'',days:30})
  const [challengeLoading,setChallengeLoading] = useState(false)

  // Progress sub-section
  const [progressSection,setProgressSection] = useState('ranks') // ranks|history|charts|stats|body|achievements
  const [histFilter,setHistFilter]     = useState('all')
  const [chartMuscle,setChartMuscle]   = useState('chest')
  const [chartEx,setChartEx]           = useState('')

  // Settings panel
  const [showSettings,setShowSettings] = useState(false)
  const [deletePin,setDeletePin]       = useState('')
  const [deleteMsg,setDeleteMsg]       = useState('')
  const [deleteLoading,setDeleteLoading] = useState(false)
  const [showDeleteConfirm,setShowDeleteConfirm] = useState(false)

  // Onboarding
  const [obStep,setObStep]             = useState(0)
  const [showMore,setShowMore]         = useState(false)
  const [progressionData,setProgressionData] = useState({}) // exercise key -> record

  const unit = settings.unit

  const fetchWorkouts = useCallback(async()=>{
    setLoading(true)
    const{data}=await supabase.from('workouts').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false})
    if(data) setWorkouts(data)
    setLoading(false)
  },[currentUser.id])

  const fetchCommunity = useCallback(async()=>{
    setLbLoading(true)
    const[{data:aw},{data:ch},{data:pa}]=await Promise.all([
      supabase.from('workouts').select('user_id,muscle,exercise,weight,reps,sets,created_at'),
      supabase.from('challenges').select('*').order('created_at',{ascending:false}),
      supabase.from('challenge_participants').select('*').eq('user_id',currentUser.id),
    ])
    if(aw) setAllWorkouts(aw)
    if(aw) setAllUsersWorkouts(aw)
    if(ch) setChallenges(ch)
    if(pa) setMyParts(pa)
    setLbLoading(false)
  },[currentUser.id])

  const fetchBodyWeights = useCallback(async()=>{
    const{data}=await supabase.from('bodyweight').select('*').eq('user_id',currentUser.id).order('logged_at',{ascending:true})
    if(data) setBodyWeights(data)
  },[currentUser.id])

  useEffect(()=>{fetchWorkouts()},[fetchWorkouts])
  useEffect(()=>{if(tab==='community') fetchCommunity()},[tab,fetchCommunity])
  useEffect(()=>{fetchBodyWeights()},[fetchBodyWeights])
  useEffect(()=>{
    setProgressionData(loadProgression(currentUser.id))
  },[currentUser.id])

  // Persist active session so it survives app close/refresh
  useEffect(()=>{
    if(activeTemplate){
      localStorage.setItem(ACTIVE_SESSION_KEY(currentUser.id),JSON.stringify({
        templateId:activeTemplate.id,
        checked,
        savedAt:Date.now(),
      }))
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY(currentUser.id))
    }
  },[activeTemplate,checked,currentUser.id])
  useEffect(()=>{
    try{
      const saved=JSON.parse(localStorage.getItem(`arise_templates_${currentUser.id}`)||'[]')
      let finalTemplates=saved
      if(saved.length===0){
        const goal=currentUser.goal||'general'
        const defaults=(DEFAULT_TEMPLATES[goal]||DEFAULT_TEMPLATES.general).map((t,i)=>({
          id:Date.now()+i,
          name:t.name,
          exercises:t.exercises,
          created:new Date().toISOString(),
          isDefault:true,
        }))
        finalTemplates=defaults
        setTemplates(defaults)
        localStorage.setItem(`arise_templates_${currentUser.id}`,JSON.stringify(defaults))
      } else {
        setTemplates(saved)
      }
      // Restore active session if one was in progress
      try{
        const savedSession=JSON.parse(localStorage.getItem(ACTIVE_SESSION_KEY(currentUser.id))||'null')
        if(savedSession&&savedSession.templateId){
          const tmpl=finalTemplates.find(t=>t.id===savedSession.templateId)
          if(tmpl){
            setActiveTemplate(tmpl)
            setChecked(savedSession.checked||{})
            setTab('workouts')
            setSessionRestored(true)
            setTimeout(()=>setSessionRestored(false),4000)
          }
        }
      }catch{}
    }catch{}
  },[currentUser.id])

  function saveTemplates(t){setTemplates(t);localStorage.setItem(`arise_templates_${currentUser.id}`,JSON.stringify(t))}

  async function handleLog(){
    const{muscle,exercise,weight,reps,sets}=logForm
    if(!exercise||!weight||!reps||!sets){setLogMsg('Fill in all fields.');return}
    setLogLoading(true)
    const rawW=parseFloat(weight)*(perHand?2:1)
    const wKg=unit==='lbs'?rawW/2.205:rawW
    const{error}=await supabase.from('workouts').insert([{user_id:currentUser.id,muscle,exercise,weight:Math.round(wKg*10)/10,reps:parseInt(reps),sets:parseInt(sets)}])
    if(error){setLogMsg('Error saving. Try again.')}
    else{
      setLogSuccess(true);setTimeout(()=>setLogSuccess(false),2000)
      setLogMsg('');setLogForm(f=>({...f,exercise:'',weight:'',reps:'',sets:'3'}));setCustomEx('');setPerHand(false)
      setLogOpen(false);fetchWorkouts()
    }
    setLogLoading(false)
  }

  // Template helpers
  function addExToTemplate(){
    if(!exForm.exercise||!exForm.weight) return
    const ex={muscle:exForm.muscle,exercise:exForm.exercise,sets:parseInt(exForm.sets)||3,reps:parseInt(exForm.reps)||8,weight:parseFloat(exForm.weight)}
    setNewTmplExs(p=>[...p,ex]);setExForm(f=>({...f,exercise:'',weight:''}));setAddingEx(false);setCustomExTmpl('')
  }
  function saveTmpl(){
    if(!newTmplName.trim()||newTmplExs.length===0) return
    saveTemplates([{id:Date.now(),name:newTmplName.trim(),exercises:newTmplExs,created:new Date().toISOString()},...templates])
    setNewTmplName('');setNewTmplExs([]);setShowCreateTmpl(false)
  }
  function updateExWeight(tmplId,idx,w){
    const up=templates.map(t=>{if(t.id!==tmplId)return t;const e=[...t.exercises];e[idx]={...e[idx],weight:parseFloat(w)||e[idx].weight};return{...t,exercises:e}})
    saveTemplates(up);if(activeTemplate?.id===tmplId)setActiveTemplate(up.find(t=>t.id===tmplId))
  }
  async function confirmLog(){
    if(!confirmEx||!activeTemplate) return
    const wKg=unit==='lbs'?parseFloat(confirmW)/2.205:parseFloat(confirmW)
    const{error}=await supabase.from('workouts').insert([{user_id:currentUser.id,muscle:confirmEx.ex.muscle,exercise:confirmEx.ex.exercise,weight:Math.round(wKg*10)/10,reps:parseInt(confirmR),sets:parseInt(confirmS)}])
    if(!error){
      setChecked(p=>({...p,[confirmEx.i]:true}))
      updateExWeight(activeTemplate.id,confirmEx.i,wKg)
      // Record progression
      const targetReps=parseInt(confirmEx.ex.reps)||parseInt(String(confirmEx.ex.reps).split('-')[1])||8
      recordProgression(currentUser.id,confirmEx.ex.exercise,confirmEx.ex.muscle,wKg,parseInt(confirmR),targetReps)
      setProgressionData(loadProgression(currentUser.id))
      fetchWorkouts()
    }
    setConfirmEx(null)
  }
  async function handleJoinChallenge(id){
    await supabase.from('challenge_participants').insert([{challenge_id:id,user_id:currentUser.id}]);fetchCommunity()
  }
  async function createChallenge(){
    const{title,description,muscle,metric,target,days}=challengeForm
    if(!title||!target) return
    setChallengeLoading(true)
    const endsAt=new Date();endsAt.setDate(endsAt.getDate()+parseInt(days))
    await supabase.from('challenges').insert([{created_by:currentUser.id,title:title.trim(),description:description.trim(),muscle,metric,target:parseFloat(target),unit,ends_at:endsAt.toISOString()}])
    setChallengeLoading(false);setShowCreateChallenge(false);setChallengeForm({title:'',description:'',muscle:'chest',metric:'1rm',target:'',days:30});fetchCommunity()
  }
  async function handleDeleteAccount(){
    if(!deletePin){setDeleteMsg('Enter your PIN.');return}
    setDeleteLoading(true)
    const{data}=await supabase.from('users').select('id').eq('id',currentUser.id).eq('pin',deletePin).single()
    if(!data){setDeleteMsg('Wrong PIN.');setDeleteLoading(false);return}
    await supabase.from('workouts').delete().eq('user_id',currentUser.id)
    await supabase.from('users').delete().eq('id',currentUser.id)
    setDeleteLoading(false);onLogout()
  }

  // Computed
  const byMuscle=MUSCLE_GROUPS.reduce((a,mg)=>({...a,[mg.id]:workouts.filter(w=>w.muscle===mg.id)}),{})
  const scores=MUSCLE_GROUPS.reduce((a,mg)=>({...a,[mg.id]:calcScore(byMuscle[mg.id])}),{})
  const totalScore=MUSCLE_GROUPS.reduce((s,mg)=>s+scores[mg.id],0)/MUSCLE_GROUPS.length
  const overallRank=getRank(totalScore)

  const personalRecords=workouts.reduce((acc,w)=>{
    const rm=calc1RM(w.weight,w.reps)
    if(!acc[w.exercise]||rm>acc[w.exercise].rm) acc[w.exercise]={rm,weight:w.weight,reps:w.reps,date:w.created_at,id:w.id}
    return acc
  },{})

  const getWeek=d=>{const dt=new Date(d);const day=dt.getDay();const diff=dt.getDate()-day+(day===0?-6:1);return new Date(dt.setDate(diff)).toDateString()}
  const trainingWeeks=[...new Set(workouts.map(w=>getWeek(w.created_at)))].sort((a,b)=>new Date(b)-new Date(a))
  let streak=0,cur=new Date();cur.setDate(cur.getDate()-cur.getDay()+(cur.getDay()===0?-6:1))
  for(let i=0;i<trainingWeeks.length;i++){const wk=new Date(trainingWeeks[i]);if(Math.round((cur-wk)/(7*24*60*60*1000))===i)streak++;else break}

  const now=new Date();const dow=now.getDay();const sow=new Date(now);sow.setDate(now.getDate()-dow+(dow===0?-6:1));sow.setHours(0,0,0,0)
  const sowLast=new Date(sow);sowLast.setDate(sow.getDate()-7)
  const lastWeekW=workouts.filter(w=>{const d=new Date(w.created_at);return d>=sowLast&&d<sow})

  const ACHIEVEMENTS=[
    {id:'first',icon:'🌱',name:'First Rep',desc:'Log your first set',check:()=>workouts.length>=1},
    {id:'log10',icon:'📝',name:'Getting Started',desc:'Log 10 sets',check:()=>workouts.length>=10},
    {id:'log50',icon:'💪',name:'Consistent',desc:'Log 50 sets',check:()=>workouts.length>=50},
    {id:'log100',icon:'🔥',name:'Dedicated',desc:'Log 100 sets',check:()=>workouts.length>=100},
    {id:'log250',icon:'⚡',name:'Obsessed',desc:'Log 250 sets',check:()=>workouts.length>=250},
    {id:'log500',icon:'👑',name:'Legend Grinder',desc:'Log 500 sets',check:()=>workouts.length>=500},
    {id:'s2',icon:'🔥',name:'On a Roll',desc:'2 weeks in a row',check:()=>streak>=2},
    {id:'s4',icon:'💯',name:'Monthly Warrior',desc:'4 weeks in a row',check:()=>streak>=4},
    {id:'s8',icon:'🏆',name:'Iron Discipline',desc:'8 weeks in a row',check:()=>streak>=8},
    {id:'s12',icon:'🌟',name:'Unstoppable',desc:'12 weeks in a row',check:()=>streak>=12},
    {id:'pr1',icon:'⭐',name:'New Heights',desc:'First personal record',check:()=>Object.keys(personalRecords).length>=1},
    {id:'pr5',icon:'🌠',name:'PR Machine',desc:'5 personal records',check:()=>Object.keys(personalRecords).length>=5},
    {id:'pr10',icon:'💎',name:'Record Breaker',desc:'10 personal records',check:()=>Object.keys(personalRecords).length>=10},
    {id:'rn',icon:'◆',name:'Novice',desc:'Reach Novice on any muscle',check:()=>Object.values(scores).some(s=>s>=20)},
    {id:'ri',icon:'◉',name:'Intermediate',desc:'Reach Intermediate',check:()=>Object.values(scores).some(s=>s>=40)},
    {id:'ra',icon:'✦',name:'Advanced',desc:'Reach Advanced',check:()=>Object.values(scores).some(s=>s>=60)},
    {id:'re',icon:'★',name:'Elite',desc:'Reach Elite',check:()=>Object.values(scores).some(s=>s>=80)},
    {id:'rl',icon:'⬡',name:'Legend',desc:'Reach Legend',check:()=>Object.values(scores).some(s=>s>=95)},
    {id:'all',icon:'🧬',name:'Full Body',desc:'Log every muscle group',check:()=>MUSCLE_GROUPS.every(mg=>workouts.some(w=>w.muscle===mg.id))},
  ]
  const unlocked=ACHIEVEMENTS.filter(a=>{try{return a.check()}catch{return false}})
  const locked=ACHIEVEMENTS.filter(a=>{try{return !a.check()}catch{return true}})

  const plan=PLANS[currentUser.goal||'general']
  const numDays=settings.trainingDays?.length||4
  const activePlanDays=getActiveDays(plan.days,numDays)
  const todayDayIdx=now.getDay()
  const sortedTrainingDays=[...(settings.trainingDays||[])].sort((a,b)=>({Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6}[a]-{Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6}[b]))
  const dayNames={0:'Sun',1:'Mon',2:'Tue',3:'Wed',4:'Thu',5:'Fri',6:'Sat'}
  const todayShort=dayNames[todayDayIdx]
  const todayPlanIdx=sortedTrainingDays.indexOf(todayShort)
  const todayPlan=todayPlanIdx>=0?activePlanDays[todayPlanIdx]:null

  const leaderboard=allUsers.map(u=>{
    const uw=allWorkouts.filter(w=>w.user_id===u.id)
    const ms=MUSCLE_GROUPS.reduce((a,mg)=>({...a,[mg.id]:calcScore(uw.filter(w=>w.muscle===mg.id))}),{})
    const ov=MUSCLE_GROUPS.reduce((s,mg)=>s+ms[mg.id],0)/MUSCLE_GROUPS.length
    return{...u,overall:ov,muscleScores:ms,rank:getRank(ov),goal:GOALS.find(g=>g.id===(u.goal||'general'))}
  }).sort((a,b)=>b.overall-a.overall)

  // ── Shared component helpers ──────────────────────────────────────────────
  const Input=(props)=><input {...props} style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:12,color:T.text,padding:'11px 14px',fontSize:15,...(props.style||{})}} />
  const Label=({children})=><div style={{fontSize:12,fontWeight:700,color:T.text3,letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>{children}</div>
  const Card=({children,style={},...rest})=><div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:18,padding:16,...style}} {...rest}>{children}</div>
  const Section=({title,children,action})=>(
    <div style={{marginBottom:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:800,color:T.text3,letterSpacing:1,textTransform:'uppercase'}}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  )

  return (
    <div className="arise-bg" style={{...cssVars,paddingBottom:90,minHeight:'100vh',position:'relative'}}>
      <style>{GLOBAL_CSS}</style>

      {/* ── LOG SUCCESS FLASH ── */}
      {logSuccess&&(
        <div className="log-flash" style={{position:'fixed',inset:0,zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',background:T.darkMode?'rgba(255,77,109,.07)':'rgba(229,25,58,.04)'}}>
          <div style={{background:T.accent,borderRadius:20,padding:'20px 36px',textAlign:'center',boxShadow:`0 0 60px ${T.accent}55`}}>
            <div style={{fontSize:32,marginBottom:4}}>💪</div>
            <div style={{fontFamily:'Bebas Neue',fontSize:24,letterSpacing:3,color:'#fff'}}>LOGGED!</div>
          </div>
        </div>
      )}

      {/* ── ONBOARDING ── */}
      {showOnboarding&&(
        <div style={{position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,.82)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
          <div className="fade-up" style={{width:'100%',maxWidth:400,background:T.bg2,borderRadius:24,overflow:'hidden',boxShadow:'0 24px 80px rgba(0,0,0,.5)'}}>
            <div style={{display:'flex',justifyContent:'center',gap:8,padding:'20px 0 0'}}>
              {[0,1,2,3].map(i=><div key={i} style={{width:i===obStep?24:8,height:8,borderRadius:4,background:i===obStep?T.accent:T.bg3,transition:'all .3s'}} />)}
            </div>
            <div style={{padding:'20px 24px 0'}}>
              {obStep===0&&<div className="fade-up" style={{textAlign:'center'}}>
                <div style={{fontSize:56,marginBottom:12}}>👋</div>
                <div style={{fontFamily:'Bebas Neue',fontSize:30,letterSpacing:3,color:T.text,marginBottom:8}}>Welcome to ARISE</div>
                <div style={{fontSize:14,color:T.text2,lineHeight:1.7,marginBottom:20}}>Your gym tracker that turns every lift into a ranking. The more you train, the higher you climb.</div>
                {[{i:'📈',t:'Track every lift'},{i:'🏅',t:'Rank up from Beginner to Legend'},{i:'⚔️',t:'Compete with your crew'}].map(({i,t})=>(
                  <div key={t} style={{display:'flex',alignItems:'center',gap:10,background:T.bg3,borderRadius:12,padding:'10px 14px',marginBottom:8,textAlign:'left'}}>
                    <span style={{fontSize:18}}>{i}</span><span style={{fontSize:14,color:T.text2}}>{t}</span>
                  </div>
                ))}
              </div>}
              {obStep===1&&<div className="fade-up" style={{textAlign:'center'}}>
                <div style={{fontSize:48,marginBottom:12}}>🏅</div>
                <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:2,color:T.text,marginBottom:8}}>How Ranks Work</div>
                <div style={{fontSize:13,color:T.text2,lineHeight:1.6,marginBottom:16}}>Each muscle group has its own rank. Lift heavier and do more volume to score higher.</div>
                {RANKS.map(r=>(
                  <div key={r.name} style={{display:'flex',alignItems:'center',gap:10,background:T.bg3,borderRadius:10,padding:'8px 12px',marginBottom:6}}>
                    <div style={{width:28,height:28,borderRadius:8,background:r.gradient,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{r.icon}</div>
                    <span style={{fontWeight:700,color:r.color,fontSize:14,flex:1,textAlign:'left'}}>{r.name}</span>
                    <span style={{fontSize:11,color:T.text3}}>≥ {r.min} pts</span>
                  </div>
                ))}
              </div>}
              {obStep===2&&<div className="fade-up" style={{textAlign:'center'}}>
                <div style={{fontSize:48,marginBottom:12}}>💪</div>
                <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:2,color:T.text,marginBottom:8}}>3 Simple Steps</div>
                {[{n:'1',t:'Open Today tab',d:'See your workout for today and start a session.'},{n:'2',t:'Check off each exercise',d:'Log your sets as you go. Tap an exercise and enter your weight.'},{n:'3',t:'Watch your rank rise',d:'Your score updates live. Keep pushing to level up.'}].map(({n,t,d})=>(
                  <div key={n} style={{display:'flex',gap:12,background:T.bg3,borderRadius:12,padding:'12px 14px',marginBottom:10,textAlign:'left'}}>
                    <div style={{width:28,height:28,borderRadius:14,background:T.accent,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color:'#fff',flexShrink:0}}>{n}</div>
                    <div><div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:2}}>{t}</div><div style={{fontSize:12,color:T.text3,lineHeight:1.5}}>{d}</div></div>
                  </div>
                ))}
              </div>}
              {obStep===3&&<div className="fade-up" style={{textAlign:'center'}}>
                <div style={{fontSize:56,marginBottom:12}}>🚀</div>
                <div style={{fontFamily:'Bebas Neue',fontSize:30,letterSpacing:3,color:T.text,marginBottom:8}}>You're Ready!</div>
                <div style={{fontSize:14,color:T.text2,lineHeight:1.7,marginBottom:16}}>Head to the <strong style={{color:T.accent}}>Today</strong> tab. Your workout plan is waiting. Tap any exercise to start logging.</div>
                <div style={{background:T.bg3,borderRadius:12,padding:12,textAlign:'left'}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.text3,marginBottom:4}}>TIP</div>
                  <div style={{fontSize:13,color:T.text2}}>Use the <strong style={{color:T.text}}>Workouts</strong> tab to create your own templates and check them off as you train.</div>
                </div>
              </div>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:obStep===0?'1fr':'auto 1fr',gap:10,padding:'20px 24px 24px'}}>
              {obStep>0&&<button className="btn" onClick={()=>setObStep(s=>s-1)} style={{background:T.bg3,borderRadius:12,color:T.text2,padding:'12px 16px',fontSize:14,fontWeight:700}}>←</button>}
              <button className="btn" onClick={()=>{if(obStep<3)setObStep(s=>s+1);else{onOnboardingDone();setObStep(0)}}} style={{background:T.accent,borderRadius:12,color:'#fff',padding:14,fontSize:14,fontWeight:800,letterSpacing:1,boxShadow:`0 4px 14px ${T.accent}44`}}>
                {obStep===3?'Start Training 💪':'Next →'}
              </button>
            </div>
            {obStep<3&&<button onClick={()=>{onOnboardingDone();setObStep(0)}} style={{display:'block',width:'100%',background:'none',border:'none',color:T.text3,fontSize:12,padding:'0 0 16px',cursor:'pointer',fontFamily:'Nunito',textAlign:'center'}}>Skip intro</button>}
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{background:T.bg2,borderBottom:`1px solid ${T.border}`,padding:'14px 16px 12px',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:4,color:T.text,lineHeight:1}}>ARISE</div>
            {!loading&&<div style={{fontSize:12,color:overallRank.color,fontWeight:700,marginTop:1}}>{overallRank.icon} {overallRank.name} · {Math.round(totalScore)} pts</div>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {/* Theme */}
            <button onClick={()=>setSettings(s=>({...s,darkMode:!s.darkMode}))} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:12,width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:16}}>
              {settings.darkMode?'☀️':'🌙'}
            </button>
            {/* KG/LBS */}
            <div style={{display:'flex',background:T.bg3,border:`1px solid ${T.border}`,borderRadius:12,overflow:'hidden'}}>
              {['kg','lbs'].map(u=><button key={u} onClick={()=>setSettings(s=>({...s,unit:u}))} style={{padding:'6px 10px',border:'none',fontSize:11,fontWeight:700,cursor:'pointer',background:unit===u?T.accent:'transparent',color:unit===u?'#fff':T.text3,transition:'all .2s',fontFamily:'Nunito'}}>{u}</button>)}
            </div>
            {/* Avatar / settings */}
            <button onClick={()=>setShowSettings(true)} style={{width:36,height:36,borderRadius:18,background:avatarColor(currentUser.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:900,color:'#fff',border:'none',cursor:'pointer',fontFamily:'Bebas Neue'}}>{currentUser.name[0].toUpperCase()}</button>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{padding:'16px 16px 0'}}>

        {/* ══ TODAY TAB ══════════════════════════════════════════════════════ */}
        {tab==='today'&&(
          <div className="fade-up">
            {/* Greeting */}
            <div style={{marginBottom:20}}>
              <div style={{fontFamily:'Bebas Neue',fontSize:32,letterSpacing:2,color:T.text,lineHeight:1}}>
                {new Date().getHours()<12?'Good Morning':new Date().getHours()<17?'Good Afternoon':'Good Evening'}{currentUser.name.split(' ')[0]?`, ${currentUser.name.split(' ')[0]}`:''} 👋 👋
              </div>
              <div style={{fontSize:14,color:T.text3,marginTop:4}}>
                {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
              </div>
            </div>

            {/* Today's workout card */}
            {loading?<div style={{textAlign:'center',padding:40,color:T.text3}}><span className="spin" style={{fontSize:24}}>◈</span></div>:(
              <>
                {/* Quick rank overview */}
                <Card style={{marginBottom:16,position:'relative',overflow:'hidden',background:overallRank.gradient,border:'none'}}>
                  <div style={{position:'absolute',top:-10,right:-10,fontSize:80,opacity:.08,lineHeight:1}}>{overallRank.icon}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <div>
                      <div style={{fontSize:12,color:'rgba(255,255,255,.7)',letterSpacing:1,textTransform:'uppercase'}}>Overall Rank</div>
                      <div style={{fontFamily:'Bebas Neue',fontSize:32,letterSpacing:2,color:'#fff',lineHeight:1.1}}>{overallRank.name}</div>
                    </div>
                    <div className="rank-glow" style={{'--rc':overallRank.color,'--rc-dim':overallRank.color+'44',width:56,height:56,borderRadius:28,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,border:'2px solid rgba(255,255,255,.25)'}}>{overallRank.icon}</div>
                  </div>
                  <div style={{background:'rgba(0,0,0,.2)',borderRadius:6,height:6,overflow:'hidden',position:'relative'}}>
                    <div className="bar" style={{'--w':`${totalScore}%`,height:'100%',background:'rgba(255,255,255,.7)',borderRadius:6}} />
                    <div className="streak" style={{position:'absolute',top:0,width:'35%',height:'100%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent)'}} />
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:10,color:'rgba(255,255,255,.5)'}}>
                    <span>Beginner</span><span>{Math.round(totalScore)} / 100</span><span>Legend</span>
                  </div>
                </Card>

                {/* Today's plan */}
                {todayPlan?(
                  <Section title="Today's Workout">
                    <Card style={{padding:0,overflow:'hidden'}}>
                      <div style={{padding:'14px 16px 10px',borderBottom:`1px solid ${T.border}`}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <div>
                            <div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:1,color:T.text}}>{todayPlan.label}</div>
                            <div style={{fontSize:12,color:T.text3}}>{todayPlan.focus}</div>
                          </div>
                          <div style={{background:T.accentDim,border:`1px solid ${T.accent}44`,borderRadius:8,padding:'3px 10px',fontSize:11,color:T.accent,fontWeight:700}}>{todayShort}</div>
                        </div>
                      </div>
                      <div style={{padding:'10px 16px 14px'}}>
                        {todayPlan.exercises.slice(0,4).map((ex,i)=>{
                          const mg=MUSCLE_GROUPS.find(m=>m.id===ex.muscle)
                          return(
                            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:i<3?`1px solid ${T.border}`:'none'}}>
                              <div style={{width:28,height:28,borderRadius:9,background:mg?.colorDim,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>{mg?.icon}</div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:14,fontWeight:600,color:T.text}}>{ex.name}</div>
                                <div style={{fontSize:11,color:T.text3}}>{ex.sets} sets · {ex.reps} reps</div>
                              </div>
                            </div>
                          )
                        })}
                        {todayPlan.exercises.length>4&&<div style={{fontSize:12,color:T.text3,textAlign:'center',paddingTop:8}}>+{todayPlan.exercises.length-4} more</div>}
                        <button className="btn" onClick={()=>{
                          // Find matching template and open it
                          const matchName=todayPlan.label
                          const matchTmpl=templates.find(t=>t.name.toLowerCase().includes(matchName.toLowerCase().replace(' day','').toLowerCase()))
                          if(matchTmpl){setActiveTemplate(matchTmpl);setChecked({});setTab('workouts')}
                          else setTab('workouts')
                        }} style={{width:'100%',marginTop:12,background:`linear-gradient(135deg,${T.accent},${T.accent}CC)`,borderRadius:12,color:'#fff',padding:13,fontSize:15,fontWeight:800,letterSpacing:1,boxShadow:`0 4px 14px ${T.accent}33`}}>
                          Start Workout →
                        </button>
                      </div>
                    </Card>
                  </Section>
                ):(
                  <Section title="Today">
                    <Card style={{textAlign:'center',padding:24}}>
                      <div style={{fontSize:36,marginBottom:8}}>😴</div>
                      <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>Rest Day</div>
                      <div style={{fontSize:13,color:T.text3,marginBottom:16}}>No workout scheduled today. Enjoy the recovery!</div>
                      <button className="btn" onClick={()=>setLogOpen(true)} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:12,color:T.text2,padding:'10px 20px',fontSize:14,fontWeight:700}}>
                        Log anyway
                      </button>
                    </Card>
                  </Section>
                )}

                {/* Streak + last week */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
                  <Card>
                    <div style={{fontSize:28,marginBottom:4}}>🔥</div>
                    <div style={{fontFamily:'Bebas Neue',fontSize:32,letterSpacing:1,color:streak>0?'#F59E0B':T.text3,lineHeight:1}}>{streak}</div>
                    <div style={{fontSize:12,fontWeight:600,color:T.text3,marginTop:2}}>{streak===1?'week streak':streak>1?'week streak':'No streak yet'}</div>
                    {streak>=3&&<div style={{fontSize:11,color:'#F59E0B',fontWeight:700,marginTop:4}}>ON FIRE 🔥</div>}
                  </Card>
                  <Card>
                    <div style={{fontSize:28,marginBottom:4}}>📅</div>
                    <div style={{fontFamily:'Bebas Neue',fontSize:32,letterSpacing:1,color:lastWeekW.length>0?T.accent:T.text3,lineHeight:1}}>{lastWeekW.length}</div>
                    <div style={{fontSize:12,fontWeight:600,color:T.text3,marginTop:2}}>Last week</div>
                    {lastWeekW.length>0&&<div style={{fontSize:11,color:T.text3,marginTop:4}}>{Math.round(cvt(lastWeekW.reduce((s,w)=>s+w.weight*w.reps*w.sets,0),unit)/1000*10)/10}k {unit} volume</div>}
                  </Card>
                </div>

                {/* Training days picker */}
                <Section title="My Training Days">
                  <Card style={{padding:14}}>
                    <div style={{display:'flex',gap:6,marginBottom:8}}>
                      {DAYS_OF_WEEK.map(day=>{
                        const active=(settings.trainingDays||[]).includes(day)
                        return(
                          <button key={day} className="btn press" onClick={()=>setSettings(s=>{
                            const days=(s.trainingDays||[]).includes(day)
                              ?(s.trainingDays||[]).filter(d=>d!==day)
                              :[...(s.trainingDays||[]),day]
                            return{...s,trainingDays:days}
                          })} style={{flex:1,padding:'10px 2px',border:`2px solid ${active?T.accent:T.border}`,borderRadius:10,background:active?T.accentDim:'transparent',color:active?T.accent:T.text3,fontSize:11,fontWeight:800,cursor:'pointer',transition:'all .15s'}}>
                            {day}
                          </button>
                        )
                      })}
                    </div>
                    <div style={{fontSize:12,color:T.text3}}>{(settings.trainingDays||[]).length} days selected · tap to toggle</div>
                  </Card>
                </Section>

                {/* Muscle rank grid — compact */}
                <Section title="Muscle Ranks" action={<button onClick={()=>{setTab('progress');setProgressSection('ranks')}} style={{background:'none',border:'none',color:T.accent,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Nunito'}}>See all →</button>}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                    {MUSCLE_GROUPS.map(mg=>{
                      const s=scores[mg.id],r=getRank(s),next=getNextRank(s)
                      const pct=next?((s-r.min)/(next.min-r.min))*100:100
                      return(
                        <Card key={mg.id} style={{padding:12,position:'relative',overflow:'hidden',border:`1.5px solid ${mg.color}22`}}>
                          <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${mg.color},${mg.color}66)`}} />
                          <div style={{fontSize:22,marginBottom:4,marginTop:2}}>{mg.icon}</div>
                          <div style={{fontSize:11,fontWeight:700,color:T.text,marginBottom:2}}>{mg.name}</div>
                          <div style={{fontSize:12,fontWeight:800,color:mg.color,marginBottom:6}}>{r.name}</div>
                          <div style={{background:T.bg3,borderRadius:4,height:4,overflow:'hidden'}}>
                            <div className="bar" style={{'--w':`${pct}%`,height:'100%',background:`linear-gradient(90deg,${mg.color},${mg.color}88)`,borderRadius:4}} />
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </Section>
              </>
            )}
          </div>
        )}

        {/* ══ WORKOUTS TAB ════════════════════════════════════════════════════ */}
        {tab==='workouts'&&(
          <div className="fade-up">
            {/* Confirm log modal */}
            {confirmEx&&activeTemplate&&(
              <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'0 16px 24px'}}>
                <div className="fade-up" style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:20,padding:20,width:'100%',maxWidth:420}}>
                  <div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:2,color:T.text,marginBottom:2}}>Log Set</div>
                  <div style={{fontSize:13,color:T.text2,marginBottom:16}}>{confirmEx.ex.exercise}</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
                    {[[`Weight (${unit})`,confirmW,setConfirmW],['Reps',confirmR,setConfirmR],['Sets',confirmS,setConfirmS]].map(([label,val,setter])=>(
                      <div key={label}>
                        <div style={{fontSize:11,color:T.text3,fontWeight:700,marginBottom:6,textAlign:'center'}}>{label}</div>
                        <input type="number" min="0" value={val} onChange={e=>setter(e.target.value)}
                          style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'12px 6px',fontSize:22,fontWeight:800,textAlign:'center'}} />
                      </div>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    <button className="btn" onClick={()=>setConfirmEx(null)} style={{background:T.bg3,borderRadius:12,color:T.text2,padding:13,fontSize:14,fontWeight:700}}>Cancel</button>
                    <button className="btn" onClick={confirmLog} style={{background:T.accent,borderRadius:12,color:'#fff',padding:13,fontSize:14,fontWeight:800,letterSpacing:1,boxShadow:`0 4px 12px ${T.accent}44`}}>Log ✓</button>
                  </div>
                </div>
              </div>
            )}

            {activeTemplate?(
              /* ── Active session checklist ── */
              <div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                  <button className="btn" onClick={()=>{setActiveTemplate(null);setChecked({})}} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:10,color:T.text2,padding:'8px 12px',fontSize:13,fontWeight:700}}>← Back</button>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:1,color:T.text,lineHeight:1}}>{activeTemplate.name}</div>
                    <div style={{fontSize:12,color:T.text3}}>{Object.values(checked).filter(Boolean).length} / {activeTemplate.exercises.length} done</div>
                  </div>
                  {sessionRestored&&(
                    <div style={{position:'absolute',top:60,left:16,right:16,background:'#052218',border:'1px solid #10B981',borderRadius:10,padding:'8px 12px',display:'flex',alignItems:'center',gap:8,zIndex:10}}>
                      <span style={{fontSize:16}}>✅</span>
                      <span style={{fontSize:13,color:'#10B981',fontWeight:700}}>Session restored — pick up where you left off</span>
                    </div>
                  )}
                </div>
                <div style={{background:T.bg3,borderRadius:6,height:8,overflow:'hidden',marginBottom:16,position:'relative'}}>
                  <div className="bar" style={{'--w':`${(Object.values(checked).filter(Boolean).length/activeTemplate.exercises.length)*100}%`,height:'100%',background:`linear-gradient(90deg,${T.accent},#10B981)`,borderRadius:6}} />
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {activeTemplate.exercises.map((ex,i)=>{
                    const mg=MUSCLE_GROUPS.find(m=>m.id===ex.muscle)
                    const done=checked[i]===true
                    const rank=getRank(scores[ex.muscle]||0)
                    return(
                      <Card key={i} style={{opacity:done?.6:1,transition:'all .2s',border:`1.5px solid ${done?T.border:mg?.color+'33'}`,position:'relative',overflow:'hidden',padding:14}}>
                        {!done&&<div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${mg?.color},${mg?.color}66)`}} />}
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          <button onClick={()=>{if(!done){const{weight:sugW}=getSuggestedWeight(currentUser.id,ex.exercise,ex.weight,ex.muscle,parseInt(String(ex.reps).split('-').pop())||8);setConfirmEx({i,ex});setConfirmW(String(Math.round(cvt(sugW,unit)*10)/10));setConfirmR(String(ex.reps).split('-').pop()||String(ex.reps));setConfirmS(String(ex.sets))}}}
                            style={{width:36,height:36,borderRadius:18,border:`2px solid ${done?'#10B981':mg?.color}`,background:done?'#10B981':T.input,display:'flex',alignItems:'center',justifyContent:'center',cursor:done?'default':'pointer',flexShrink:0,transition:'all .2s'}}>
                            {done&&<span style={{color:'#fff',fontSize:16,fontWeight:700}}>✓</span>}
                            {!done&&<span style={{fontSize:15}}>{mg?.icon}</span>}
                          </button>
                          <div style={{flex:1}}>
                            <div style={{fontSize:15,fontWeight:700,color:done?T.text3:T.text,textDecoration:done?'line-through':'none'}}>{ex.exercise}</div>
                            <div style={{fontSize:12,color:T.text3,marginTop:1}}>{ex.sets} sets · {ex.reps} reps</div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <input type="number" value={cvt(ex.weight,unit)} onChange={e=>updateExWeight(activeTemplate.id,i,unit==='lbs'?parseFloat(e.target.value)/2.205:parseFloat(e.target.value))}
                              style={{width:60,background:'transparent',border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:'4px 6px',fontSize:15,fontWeight:700,textAlign:'center'}} />
                            <div style={{fontSize:10,color:T.text3,marginTop:2}}>{unit}</div>
                          </div>
                        </div>
                        {!done&&(()=>{
                          const targetR=parseInt(String(ex.reps).split('-').pop())||8
                          const{weight:sugW,reason:progReason,isDeload}=getSuggestedWeight(currentUser.id,ex.exercise,ex.weight,ex.muscle,targetR)
                          const sugDisplay=Math.round(cvt(sugW,unit)*10)/10
                          const baseDisplay=Math.round(cvt(ex.weight,unit)*10)/10
                          const progKey=(ex.exercise||'').toLowerCase().trim()
                          const progRecord=progressionData[progKey]
                          const isIncreased=!isDeload&&sugW>ex.weight+0.4&&progRecord
                          return(<>
                            {progReason&&(
                              <div style={{marginTop:8,background:isDeload?'rgba(245,158,11,.15)':'rgba(16,185,129,.12)',borderRadius:8,padding:'7px 10px',display:'flex',alignItems:'center',gap:6}}>
                                <span style={{fontSize:14}}>{isDeload?'⚠️':'📈'}</span>
                                <div style={{fontSize:11,color:isDeload?'#F59E0B':'#10B981',fontWeight:700,lineHeight:1.4}}>{progReason}</div>
                              </div>
                            )}
                            {isIncreased&&!progReason&&(
                              <div style={{marginTop:8,background:'rgba(16,185,129,.12)',borderRadius:8,padding:'7px 10px',display:'flex',alignItems:'center',gap:6}}>
                                <span style={{fontSize:14}}>📈</span>
                                <div style={{fontSize:11,color:'#10B981',fontWeight:700}}>Progressive overload: {baseDisplay} → {sugDisplay}{unit}</div>
                              </div>
                            )}
                            <button className="btn" onClick={()=>{
                              setConfirmEx({i,ex})
                              setConfirmW(String(sugDisplay))
                              setConfirmR(String(ex.reps).split('-').pop()||String(ex.reps))
                              setConfirmS(String(ex.sets))
                            }}
                              style={{width:'100%',marginTop:10,background:`linear-gradient(135deg,${mg?.color},${mg?.color}AA)`,borderRadius:10,color:'#fff',padding:10,fontSize:13,fontWeight:700,letterSpacing:1}}>
                              Mark Done · {sugDisplay}{unit}
                            </button>
                          </>)
                        })()}
                      </Card>
                    )
                  })}
                </div>
                {Object.values(checked).filter(Boolean).length===activeTemplate.exercises.length&&activeTemplate.exercises.length>0&&(
                  <div style={{background:'#052218',border:'1px solid #10B981',borderRadius:18,padding:20,marginTop:16,textAlign:'center'}}>
                    <div style={{fontSize:36,marginBottom:8}}>🎉</div>
                    <div style={{fontFamily:'Bebas Neue',fontSize:24,letterSpacing:2,color:'#10B981',marginBottom:4}}>Session Complete!</div>
                    <div style={{fontSize:13,color:'#10B981',marginBottom:14}}>All exercises logged. Great work.</div>
                    <button className="btn" onClick={()=>{setActiveTemplate(null);setChecked({})}} style={{background:'#10B981',borderRadius:12,color:'#fff',padding:'12px 28px',fontSize:15,fontWeight:800,letterSpacing:1}}>Finish</button>
                  </div>
                )}
              </div>
            ):(
              /* ── Template list ── */
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                  <div>
                    <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:2,color:T.text,lineHeight:1}}>Workouts</div>
                    <div style={{fontSize:13,color:T.text3}}>{templates.length} templates saved</div>
                  </div>
                  <button className="btn press" onClick={()=>setShowCreateTmpl(true)}
                    style={{width:44,height:44,borderRadius:22,background:T.accent,color:'#fff',fontSize:22,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 4px 14px ${T.accent}44`}}>+</button>
                </div>

                {showCreateTmpl&&(
                  <Card style={{marginBottom:16}}>
                    <div style={{fontFamily:'Bebas Neue',fontSize:20,letterSpacing:1,color:T.text,marginBottom:14}}>New Template</div>
                    <Label>Name</Label>
                    <input placeholder="e.g. Push Day" value={newTmplName} onChange={e=>setNewTmplName(e.target.value)}
                      style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:12,color:T.text,padding:'11px 14px',fontSize:15,marginBottom:14}} />
                    {newTmplExs.length>0&&(
                      <div style={{marginBottom:12}}>
                        <Label>Exercises ({newTmplExs.length})</Label>
                        {newTmplExs.map((ex,i)=>{
                          const mg=MUSCLE_GROUPS.find(m=>m.id===ex.muscle)
                          return(
                            <div key={i} style={{display:'flex',alignItems:'center',gap:10,background:T.bg3,borderRadius:10,padding:'10px 12px',marginBottom:6}}>
                              <span style={{fontSize:18}}>{mg?.icon}</span>
                              <div style={{flex:1}}>
                                <div style={{fontSize:14,fontWeight:700,color:T.text}}>{ex.exercise}</div>
                                <div style={{fontSize:11,color:T.text3}}>{ex.sets}×{ex.reps} · {ex.weight}{unit}</div>
                              </div>
                              <button onClick={()=>setNewTmplExs(p=>p.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:T.text3,fontSize:16,cursor:'pointer',padding:'0 4px'}}>✕</button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {addingEx?(
                      <div style={{background:T.bg3,borderRadius:12,padding:12,marginBottom:12}}>
                        <Label>Add Exercise</Label>
                        <select value={exForm.muscle} onChange={e=>{setExForm(f=>({...f,muscle:e.target.value,exercise:''}));setCustomExTmpl('')}}
                          style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'10px 12px',fontSize:14,marginBottom:8}}>
                          {MUSCLE_GROUPS.map(mg=><option key={mg.id} value={mg.id}>{mg.icon} {mg.name}</option>)}
                        </select>
                        <select value={customExTmpl?'__c__':exForm.exercise} onChange={e=>{if(e.target.value==='__c__'){setCustomExTmpl(' ');setExForm(f=>({...f,exercise:''}))}else{setCustomExTmpl('');setExForm(f=>({...f,exercise:e.target.value}))}}}
                          style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'10px 12px',fontSize:14,marginBottom:customExTmpl?8:8}}>
                          <option value="">Select exercise...</option>
                          {MUSCLE_GROUPS.find(m=>m.id===exForm.muscle)?.exercises.map(ex=><option key={ex} value={ex}>{ex}</option>)}
                          <option value="__c__">✏️ Type my own...</option>
                        </select>
                        {customExTmpl!==''&&<input autoFocus placeholder="Exercise name..." value={customExTmpl.trim()?customExTmpl:''} onChange={e=>{setCustomExTmpl(e.target.value);setExForm(f=>({...f,exercise:e.target.value}))}} style={{width:'100%',background:T.input,border:`1px solid ${T.accent}`,borderRadius:10,color:T.text,padding:'10px 12px',fontSize:14,marginBottom:8}} />}
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:10}}>
                          {[['Weight',exForm.weight,'weight'],['Reps',exForm.reps,'reps'],['Sets',exForm.sets,'sets']].map(([label,val,field])=>(
                            <div key={field}>
                              <div style={{fontSize:11,color:T.text3,fontWeight:700,marginBottom:4,textAlign:'center'}}>{label}</div>
                              <input type="number" min="0" value={val} onChange={e=>setExForm(f=>({...f,[field]:e.target.value}))} placeholder="0"
                                style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,padding:'10px 6px',fontSize:20,fontWeight:800,textAlign:'center'}} />
                            </div>
                          ))}
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                          <button className="btn" onClick={()=>{setAddingEx(false);setCustomExTmpl('')}} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:10,color:T.text2,padding:10,fontSize:13,fontWeight:700}}>Cancel</button>
                          <button className="btn" onClick={addExToTemplate} style={{background:T.accent,borderRadius:10,color:'#fff',padding:10,fontSize:13,fontWeight:700,letterSpacing:1}}>Add</button>
                        </div>
                      </div>
                    ):(
                      <button className="btn" onClick={()=>setAddingEx(true)} style={{width:'100%',background:'transparent',border:`1.5px dashed ${T.border}`,borderRadius:12,color:T.text3,padding:11,fontSize:14,fontWeight:700,marginBottom:12}}>+ Add Exercise</button>
                    )}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      <button className="btn" onClick={()=>{setShowCreateTmpl(false);setNewTmplName('');setNewTmplExs([]);setAddingEx(false)}} style={{background:T.bg3,borderRadius:12,color:T.text2,padding:12,fontSize:14,fontWeight:700}}>Cancel</button>
                      <button className="btn" onClick={saveTmpl} disabled={!newTmplName.trim()||newTmplExs.length===0} style={{background:(!newTmplName.trim()||newTmplExs.length===0)?T.bg3:T.accent,borderRadius:12,color:(!newTmplName.trim()||newTmplExs.length===0)?T.text3:'#fff',padding:12,fontSize:14,fontWeight:800,letterSpacing:1}}>Save</button>
                    </div>
                  </Card>
                )}

                {templates.length===0&&!showCreateTmpl?(
                  <div style={{textAlign:'center',padding:50,color:T.text3}}>
                    <div style={{fontSize:48,marginBottom:12}}>📋</div>
                    <div style={{fontSize:16,fontWeight:700,color:T.text2,marginBottom:8}}>No templates yet</div>
                    <div style={{fontSize:13,lineHeight:1.6,marginBottom:20}}>Create a template with your exercises, then tap it before your workout to check them off.</div>
                    <button className="btn" onClick={()=>setShowCreateTmpl(true)} style={{background:T.accent,borderRadius:12,color:'#fff',padding:'12px 28px',fontSize:15,fontWeight:800,letterSpacing:1,boxShadow:`0 4px 14px ${T.accent}44`}}>Create Template</button>
                  </div>
                ):(
                  <div className="stagger" style={{display:'flex',flexDirection:'column',gap:10}}>
                    {templates.map(tmpl=>(
                      <Card key={tmpl.id} className="lift press" onClick={()=>{setActiveTemplate(tmpl);setChecked({})}} style={{cursor:'pointer',position:'relative',overflow:'hidden',padding:0}}>
                        <div style={{position:'absolute',top:0,left:0,right:0,height:4,background:`linear-gradient(90deg,${T.accent},${T.accent}66)`}} />
                        <div style={{padding:'16px 16px 12px'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                            <div>
                              <div style={{fontFamily:'Bebas Neue',fontSize:20,letterSpacing:1,color:T.text}}>{tmpl.name}</div>
                              <div style={{fontSize:12,color:T.text3}}>{tmpl.exercises.length} exercises</div>
                            </div>
                            <button onClick={e=>{e.stopPropagation();saveTemplates(templates.filter(t=>t.id!==tmpl.id))}} style={{background:'none',border:'none',color:T.text3,fontSize:16,cursor:'pointer',padding:'0 4px'}}>✕</button>
                          </div>
                          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
                            {[...new Set(tmpl.exercises.map(e=>e.muscle))].map(mid=>{
                              const mg=MUSCLE_GROUPS.find(m=>m.id===mid)
                              return <span key={mid} style={{background:mg?.colorDim,borderRadius:20,padding:'3px 10px',fontSize:11,color:mg?.color,fontWeight:700}}>{mg?.icon} {mg?.name}</span>
                            })}
                          </div>
                          <div style={{background:T.accent,borderRadius:10,padding:'9px',textAlign:'center'}}>
                            <span style={{fontFamily:'Bebas Neue',fontSize:14,letterSpacing:3,color:'#fff'}}>START WORKOUT →</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ PROGRESS TAB ════════════════════════════════════════════════════ */}
        {tab==='progress'&&(
          <div className="fade-up">
            <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:2,color:T.text,marginBottom:16,lineHeight:1}}>Progress</div>
            {/* Section pills */}
            <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4,marginBottom:20}}>
              {[['ranks','🏅 Ranks'],['history','📝 History'],['charts','📈 Charts'],['stats','📊 Stats'],['body','⚖️ Body'],['achievements','🎖️ Awards']].map(([id,label])=>(
                <button key={id} onClick={()=>setProgressSection(id)} className="btn"
                  style={{background:progressSection===id?T.accent:T.bg2,border:`1px solid ${progressSection===id?T.accent:T.border}`,borderRadius:20,color:progressSection===id?'#fff':T.text3,padding:'7px 16px',fontSize:13,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',transition:'all .15s'}}>
                  {label}
                </button>
              ))}
            </div>

            {/* Ranks */}
            {progressSection==='ranks'&&(
              <div className="stagger">
                {MUSCLE_GROUPS.map(mg=>{
                  const s=scores[mg.id],r=getRank(s),next=getNextRank(s)
                  const pct=next?((s-r.min)/(next.min-r.min))*100:100
                  const tw=next?Math.round(cvt((next.min/100)*200*0.75,unit)):null
                  const b1=byMuscle[mg.id]?.length>0?Math.max(...byMuscle[mg.id].map(w=>calc1RM(w.weight,w.reps))):0
                  return(
                    <Card key={mg.id} style={{marginBottom:10,position:'relative',overflow:'hidden',border:`1.5px solid ${mg.color}33`}}>
                      <div style={{position:'absolute',top:0,left:0,right:0,height:4,background:`linear-gradient(90deg,${mg.color},${mg.color}66)`}} />
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,marginTop:4}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:36,height:36,borderRadius:12,background:mg.colorDim,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{mg.icon}</div>
                          <div>
                            <div style={{fontSize:16,fontWeight:800,color:T.text}}>{mg.name}</div>
                            <div style={{fontSize:12,fontWeight:700,color:mg.color}}>{r.icon} {r.name}</div>
                          </div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:1,color:mg.color}}>{Math.round(s)}</div>
                          <div style={{fontSize:10,color:T.text3}}>score</div>
                        </div>
                      </div>
                      <div style={{background:T.bg3,borderRadius:6,height:8,overflow:'hidden',marginBottom:8,position:'relative'}}>
                        <div className="bar" style={{'--w':`${pct}%`,height:'100%',background:`linear-gradient(90deg,${mg.color},${mg.color}88)`,borderRadius:6}} />
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        <div style={{background:T.bg3,borderRadius:10,padding:'8px',textAlign:'center'}}>
                          <div style={{fontSize:10,color:T.text3,marginBottom:2}}>Best 1RM</div>
                          <div style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:1,color:mg.color}}>{b1>0?`${Math.round(cvt(b1,unit))}${unit}`:'—'}</div>
                        </div>
                        <div style={{background:T.bg3,borderRadius:10,padding:'8px',textAlign:'center'}}>
                          <div style={{fontSize:10,color:T.text3,marginBottom:2}}>To Rank Up</div>
                          <div style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:1,color:next?T.accent:'#F59E0B'}}>{next&&tw?`${tw}${unit}`:'MAX 🏆'}</div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* History */}
            {progressSection==='history'&&(
              <div>
                <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4,marginBottom:14}}>
                  {[['all','All'],...MUSCLE_GROUPS.map(mg=>[mg.id,`${mg.icon} ${mg.name}`])].map(([id,label])=>(
                    <button key={id} onClick={()=>setHistFilter(id)} className="btn"
                      style={{background:histFilter===id?T.accent:T.bg2,border:`1px solid ${histFilter===id?T.accent:T.border}`,borderRadius:20,color:histFilter===id?'#fff':T.text3,padding:'6px 14px',fontSize:12,fontWeight:700,whiteSpace:'nowrap',transition:'all .15s'}}>
                      {label}
                    </button>
                  ))}
                </div>
                {(histFilter==='all'?workouts:workouts.filter(w=>w.muscle===histFilter)).length===0
                  ?<div style={{textAlign:'center',padding:40,color:T.text3}}>No sessions yet.</div>
                  :(histFilter==='all'?workouts:workouts.filter(w=>w.muscle===histFilter)).map(s=>{
                    const mg=MUSCLE_GROUPS.find(m=>m.id===s.muscle)
                    const isPR=personalRecords[s.exercise]&&s.id===personalRecords[s.exercise].id
                    const rm=Math.round(cvt(calc1RM(s.weight,s.reps),unit))
                    const dt=new Date(s.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})
                    return(
                      <div key={s.id} style={{background:T.bg2,border:`1px solid ${isPR?'#F59E0B44':T.border}`,borderRadius:14,padding:'12px 14px',marginBottom:8,position:'relative',overflow:'hidden'}}>
                        <div style={{position:'absolute',left:0,top:0,bottom:0,width:4,background:isPR?'linear-gradient(180deg,#F59E0B,#D97706)':`linear-gradient(180deg,${mg?.color},${mg?.color}66)`}} />
                        {isPR&&<div style={{position:'absolute',top:8,right:10,background:'#F59E0B22',border:'1px solid #F59E0B55',borderRadius:6,padding:'2px 8px',fontSize:10,color:'#F59E0B',fontWeight:700}}>⭐ PR</div>}
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginLeft:8,paddingRight:isPR?48:0}}>
                          <div>
                            <div style={{fontSize:15,fontWeight:700,color:T.text}}>{s.exercise}</div>
                            <div style={{fontSize:11,color:T.text3,marginTop:1}}>{mg?.icon} {mg?.name} · {dt}</div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div style={{fontFamily:'Bebas Neue',fontSize:15,letterSpacing:1,color:T.text}}>{cvt(s.weight,unit)}{unit} × {s.reps} × {s.sets}</div>
                            <div style={{fontSize:11,color:T.accent}}>1RM ~{rm}{unit}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Charts */}
            {progressSection==='charts'&&(
              <div>
                <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4,marginBottom:14}}>
                  {MUSCLE_GROUPS.map(mg=>(
                    <button key={mg.id} onClick={()=>{setChartMuscle(mg.id);setChartEx('')}} className="btn"
                      style={{background:chartMuscle===mg.id?mg.color:T.bg2,border:`1px solid ${chartMuscle===mg.id?mg.color:T.border}`,borderRadius:20,color:chartMuscle===mg.id?'#fff':T.text3,padding:'6px 14px',fontSize:12,fontWeight:700,whiteSpace:'nowrap',transition:'all .15s'}}>
                      {mg.icon} {mg.name}
                    </button>
                  ))}
                </div>
                {(()=>{
                  const mg=MUSCLE_GROUPS.find(m=>m.id===chartMuscle)
                  const exLogged=[...new Set(workouts.filter(w=>w.muscle===chartMuscle).map(w=>w.exercise))]
                  const activeEx=chartEx||exLogged[0]||''
                  const exData=workouts.filter(w=>w.exercise===activeEx).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at))
                  const rmData=exData.map(w=>({date:w.created_at,rm:calc1RM(w.weight,w.reps),weight:w.weight}))
                  if(exLogged.length===0) return <div style={{textAlign:'center',padding:40,color:T.text3}}><div style={{fontSize:36,marginBottom:8}}>📈</div><div>No {mg?.name} data yet.</div></div>
                  return(
                    <>
                      <select value={activeEx} onChange={e=>setChartEx(e.target.value)} style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:12,color:T.text,padding:'11px 14px',fontSize:15,marginBottom:14}}>
                        {exLogged.map(ex=><option key={ex} value={ex}>{ex}</option>)}
                      </select>
                      {rmData.length>1&&(()=>{
                        const vals=rmData.map(d=>cvt(d.rm,unit))
                        const minV=Math.min(...vals),maxV=Math.max(...vals),range=maxV-minV||1
                        const W=340,H=130,P=14
                        const pts=rmData.map((d,i,arr)=>({x:P+(i/(arr.length-1||1))*(W-P*2),y:H-P-(((cvt(d.rm,unit)-minV)/range)*(H-P*2)),d}))
                        const pathD=pts.map((p,i)=>i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`).join(' ')
                        const areaD=`${pathD} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`
                        const rank=getRank(scores[chartMuscle])
                        const gain=Math.round((vals[vals.length-1]-vals[0])*10)/10
                        return(
                          <Card style={{marginBottom:14}}>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
                              {[['Best 1RM',`${Math.round(Math.max(...vals))}${unit}`,mg?.color],['Latest',`${Math.round(vals[vals.length-1])}${unit}`,T.text],['Gained',`${gain>=0?'+':''}${gain}${unit}`,gain>=0?'#10B981':T.accent]].map(([l,v,c])=>(
                                <div key={l} style={{background:T.bg3,borderRadius:10,padding:'8px 6px',textAlign:'center'}}>
                                  <div style={{fontSize:10,color:T.text3,marginBottom:2}}>{l}</div>
                                  <div style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:1,color:c}}>{v}</div>
                                </div>
                              ))}
                            </div>
                            <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',display:'block'}}>
                              <defs>
                                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={mg?.color} stopOpacity="0.35"/>
                                  <stop offset="100%" stopColor={mg?.color} stopOpacity="0.02"/>
                                </linearGradient>
                              </defs>
                              {[.25,.5,.75].map((f,i)=><line key={i} x1={P} y1={P+(f*(H-P*2))} x2={W-P} y2={P+(f*(H-P*2))} stroke={T.border} strokeWidth="1" strokeDasharray="4,4"/>)}
                              <path d={areaD} fill="url(#cg)"/>
                              <path d={pathD} fill="none" stroke={mg?.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                              {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={i===pts.length-1?5:3} fill={i===pts.length-1?mg?.color:T.bg2} stroke={mg?.color} strokeWidth="2"/>)}
                            </svg>
                            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.text3,marginTop:4}}>
                              <span>{new Date(rmData[0].date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                              <span>{rmData.length} sessions</span>
                              <span>{new Date(rmData[rmData.length-1].date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                            </div>
                          </Card>
                        )
                      })()}
                    </>
                  )
                })()}
              </div>
            )}

            {/* Stats */}
            {progressSection==='stats'&&(
              <div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
                  {[['Sessions',workouts.length,'📝'],['Total Sets',workouts.reduce((s,w)=>s+w.sets,0),'💪'],['Volume',`${Math.round(cvt(workouts.reduce((s,w)=>s+w.weight*w.reps*w.sets,0),unit)/1000)}k ${unit}`,'📦'],['PRs',Object.keys(personalRecords).length,'⭐'],['Streak',`${streak} wks`,'🔥'],['Score',Math.round(totalScore),'🏅']].map(([l,v,i])=>(
                    <Card key={l} style={{textAlign:'center'}}>
                      <div style={{fontSize:24,marginBottom:4}}>{i}</div>
                      <div style={{fontFamily:'Bebas Neue',fontSize:26,letterSpacing:1,color:T.text,lineHeight:1}}>{v}</div>
                      <div style={{fontSize:11,fontWeight:600,color:T.text3,marginTop:4}}>{l}</div>
                    </Card>
                  ))}
                </div>
                {Object.keys(personalRecords).length>0&&(
                  <Section title="Personal Records">
                    {Object.entries(personalRecords).sort((a,b)=>b[1].rm-a[1].rm).slice(0,10).map(([ex,pr])=>{
                      const mg=MUSCLE_GROUPS.find(m=>m.exercises?.includes(ex))
                      return(
                        <div key={ex} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${T.border}`}}>
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
                  </Section>
                )}
              </div>
            )}

            {/* Body weight */}
            {progressSection==='body'&&(
              <div>
                <Card style={{marginBottom:14}}>
                  <Label>Log Today's Weight</Label>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:10}}>
                    <input type="number" min="0" inputMode="decimal" placeholder="0.0" value={bwInput} onChange={e=>setBwInput(e.target.value)}
                      style={{flex:1,background:T.input,border:`1px solid ${T.border}`,borderRadius:12,color:T.text,padding:'12px 14px',fontSize:26,fontWeight:800,textAlign:'center'}} />
                    <div style={{display:'flex',flexDirection:'column',gap:4}}>
                      {['kg','lbs'].map(u=><button key={u} onClick={()=>setBwUnit(u)} className="btn" style={{background:bwUnit===u?T.accent:'transparent',border:`1px solid ${bwUnit===u?T.accent:T.border}`,borderRadius:8,color:bwUnit===u?'#fff':T.text3,padding:'6px 10px',fontSize:11,fontWeight:700}}>{u}</button>)}
                    </div>
                  </div>
                  <button className="btn" onClick={async()=>{if(!bwInput)return;setBwLoading(true);const wKg=bwUnit==='lbs'?parseFloat(bwInput)/2.205:parseFloat(bwInput);await supabase.from('bodyweight').insert([{user_id:currentUser.id,weight:Math.round(wKg*10)/10,unit:'kg'}]);setBwInput('');fetchBodyWeights();setBwLoading(false)}} disabled={bwLoading}
                    style={{width:'100%',background:T.accent,borderRadius:12,color:'#fff',padding:12,fontSize:14,fontWeight:800,letterSpacing:1,boxShadow:`0 4px 12px ${T.accent}33`}}>
                    {bwLoading?'...':'Log Weight'}
                  </button>
                </Card>
                {bodyWeights.length>1&&(()=>{
                  const dW=bodyWeights.map(w=>({...w,d:Math.round(cvt(w.weight,unit)*10)/10}))
                  const vals=dW.map(w=>w.d),minV=Math.min(...vals),maxV=Math.max(...vals),range=maxV-minV||1
                  const W=340,H=110,P=12
                  const pts=dW.slice(-30).map((w,i,arr)=>({x:P+(i/(arr.length-1||1))*(W-P*2),y:H-P-(((w.d-minV)/range)*(H-P*2)),w}))
                  const pathD=pts.map((p,i)=>i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`).join(' ')
                  const areaD=`${pathD} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`
                  const diff=Math.round((dW[dW.length-1].d-dW[0].d)*10)/10
                  return(
                    <Card style={{marginBottom:14}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                        <div>
                          <div style={{fontSize:11,color:T.text3,letterSpacing:1,marginBottom:2}}>CURRENT</div>
                          <div style={{fontFamily:'Bebas Neue',fontSize:34,letterSpacing:2,color:T.text,lineHeight:1}}>{dW[dW.length-1].d} <span style={{fontSize:18,color:T.text3}}>{unit}</span></div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:11,color:T.text3,marginBottom:2}}>CHANGE</div>
                          <div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:1,color:diff<0?'#10B981':diff>0?T.accent:T.text3}}>{diff>0?'+':''}{diff} {unit}</div>
                        </div>
                      </div>
                      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',display:'block'}}>
                        <defs><linearGradient id="bwg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.accent} stopOpacity="0.3"/><stop offset="100%" stopColor={T.accent} stopOpacity="0.02"/></linearGradient></defs>
                        <path d={areaD} fill="url(#bwg)"/>
                        <path d={pathD} fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        {pts[pts.length-1]&&<circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="5" fill={T.accent} stroke={T.bg2} strokeWidth="2"/>}
                      </svg>
                    </Card>
                  )
                })()}
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {[...bodyWeights].reverse().slice(0,15).map((w,i,arr)=>{
                    const prev=arr[i+1]
                    const d=prev?Math.round((cvt(w.weight,unit)-cvt(prev.weight,unit))*10)/10:null
                    return(
                      <div key={w.id} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:12,padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div style={{fontSize:13,color:T.text2}}>{new Date(w.logged_at).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</div>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          {d!==null&&<span style={{fontSize:11,color:d<0?'#10B981':d>0?T.accent:T.text3,fontWeight:700}}>{d>0?'+':''}{d}</span>}
                          <span style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:1,color:T.text}}>{Math.round(cvt(w.weight,unit)*10)/10} {unit}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Achievements */}
            {progressSection==='achievements'&&(
              <div>
                <Card style={{marginBottom:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div style={{fontSize:14,fontWeight:700,color:T.text}}>{unlocked.length} / {ACHIEVEMENTS.length} unlocked</div>
                    <div style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:1,color:T.accent}}>{Math.round(unlocked.length/ACHIEVEMENTS.length*100)}%</div>
                  </div>
                  <div style={{background:T.bg3,borderRadius:4,height:8,overflow:'hidden',position:'relative'}}>
                    <div className="bar" style={{'--w':`${unlocked.length/ACHIEVEMENTS.length*100}%`,height:'100%',background:`linear-gradient(90deg,${T.accent},#F59E0B)`,borderRadius:4}} />
                  </div>
                </Card>
                {unlocked.length>0&&<>
                  <div style={{fontSize:12,fontWeight:700,color:'#F59E0B',letterSpacing:1,textTransform:'uppercase',marginBottom:10}}>⭐ Unlocked</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
                    {unlocked.map(a=>(
                      <Card key={a.id} style={{border:'1px solid #F59E0B33',position:'relative',overflow:'hidden'}}>
                        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,#F59E0B,transparent)'}} />
                        <div style={{fontSize:28,marginBottom:6}}>{a.icon}</div>
                        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:2}}>{a.name}</div>
                        <div style={{fontSize:11,color:T.text3,lineHeight:1.4}}>{a.desc}</div>
                        <div style={{position:'absolute',bottom:8,right:10,fontSize:10,color:'#F59E0B',fontWeight:700}}>✓</div>
                      </Card>
                    ))}
                  </div>
                </>}
                {locked.length>0&&<>
                  <div style={{fontSize:12,fontWeight:700,color:T.text3,letterSpacing:1,textTransform:'uppercase',marginBottom:10}}>🔒 Locked</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    {locked.map(a=>(
                      <Card key={a.id} style={{opacity:.5}}>
                        <div style={{fontSize:28,marginBottom:6,filter:'grayscale(1)'}}>{a.icon}</div>
                        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:2}}>{a.name}</div>
                        <div style={{fontSize:11,color:T.text3,lineHeight:1.4}}>{a.desc}</div>
                      </Card>
                    ))}
                  </div>
                </>}
              </div>
            )}
          </div>
        )}

        {/* ══ COMMUNITY TAB ═══════════════════════════════════════════════════ */}
        {tab==='community'&&(
          <div className="fade-up">
            <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:2,color:T.text,marginBottom:16,lineHeight:1}}>Community</div>
            {lbLoading?(
              <div style={{textAlign:'center',padding:40,color:T.text3}}><span className="spin" style={{fontSize:24}}>◈</span></div>
            ):(
              <>
                {/* Leaderboard */}
                <Section title="Leaderboard">
                  {leaderboard.length>=2&&(
                    <div style={{display:'flex',alignItems:'flex-end',gap:8,justifyContent:'center',marginBottom:16}}>
                      {[leaderboard[1],leaderboard[0],leaderboard[2]].filter(Boolean).map((u,i)=>{
                        const mC=['#C0C0C0','#FFD700','#CD7F32'],ms=['🥈','🥇','🥉'],hs=[100,136,84]
                        const isMe=u.id===currentUser.id
                        return(
                          <div key={u.id} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}} onClick={()=>setViewingProfile(u)}>
                            <div style={{fontSize:22}}>{ms[i]}</div>
                            <div style={{width:48,height:48,borderRadius:24,background:avatarColor(u.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:900,color:'#fff',border:`2.5px solid ${mC[i]}`,boxShadow:`0 0 12px ${mC[i]}55`,cursor:'pointer',fontFamily:'Bebas Neue'}}>{u.name[0].toUpperCase()}</div>
                            <div style={{fontSize:12,fontWeight:700,color:T.text,textAlign:'center',cursor:'pointer'}}>{u.name}</div>
                            <div style={{fontSize:11,color:u.rank.color}}>{u.rank.icon} {u.rank.name}</div>
                            <div style={{width:'100%',height:hs[i],background:isMe?T.accentDim:T.bg2,border:`1.5px solid ${mC[i]}44`,borderRadius:'10px 10px 0 0',display:'flex',alignItems:'center',justifyContent:'center'}}>
                              <div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:2,color:mC[i]}}>{Math.round(u.overall)}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
                    {leaderboard.map((u,i)=>{
                      const isMe=u.id===currentUser.id
                      return(
                        <div key={u.id} onClick={()=>setViewingProfile(u)} style={{background:isMe?T.accentDim:T.bg2,border:`1px solid ${isMe?T.accent+'44':T.border}`,borderRadius:14,padding:'12px 14px',cursor:'pointer',position:'relative',overflow:'hidden'}}>
                          {isMe&&<div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${T.accent},transparent)`}} />}
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{fontFamily:'Bebas Neue',fontSize:18,color:T.text3,width:22}}>#{i+1}</div>
                            <div style={{width:36,height:36,borderRadius:18,background:avatarColor(u.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:'#fff',fontFamily:'Bebas Neue'}}>{u.name[0].toUpperCase()}</div>
                            <div style={{flex:1}}>
                              <div style={{display:'flex',alignItems:'center',gap:6}}>
                                <span style={{fontSize:15,fontWeight:700,color:T.text}}>{u.name}</span>
                                {isMe&&<span style={{background:T.accent,color:'#fff',fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:10}}>YOU</span>}
                              </div>
                              <div style={{fontSize:11,color:T.text3}}>{u.goal?.icon} {u.goal?.label}</div>
                            </div>
                            <div style={{background:u.rank.gradient,borderRadius:8,padding:'4px 10px',boxShadow:`0 0 8px ${u.rank.color}33`}}>
                              <div style={{fontFamily:'Bebas Neue',fontSize:16,letterSpacing:1,color:'#fff'}}>{Math.round(u.overall)}</div>
                            </div>
                          </div>
                          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:4,marginTop:10}}>
                            {MUSCLE_GROUPS.map(mg=>{const s=u.muscleScores[mg.id],r=getRank(s);return(
                              <div key={mg.id} style={{background:T.bg3,borderRadius:6,padding:'4px 2px',textAlign:'center',border:`1px solid ${r.color}22`}}>
                                <div style={{fontSize:11}}>{mg.icon}</div>
                                <div style={{fontSize:9,color:r.color,fontWeight:700}}>{r.icon}</div>
                              </div>
                            )})}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Section>

                {/* Challenges */}
                <Section title="Challenges" action={
                  <button className="btn" onClick={()=>setShowCreateChallenge(v=>!v)} style={{background:T.accent,borderRadius:10,color:'#fff',padding:'6px 14px',fontSize:12,fontWeight:700,letterSpacing:1}}>+ New</button>
                }>
                  {showCreateChallenge&&(
                    <Card style={{marginBottom:12}}>
                      <div style={{fontFamily:'Bebas Neue',fontSize:18,color:T.text,marginBottom:12}}>New Challenge</div>
                      <div style={{display:'flex',flexDirection:'column',gap:10}}>
                        <div><Label>Title</Label><input placeholder="e.g. Bench Press Battle" value={challengeForm.title} onChange={e=>setChallengeForm(f=>({...f,title:e.target.value}))} style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:12,color:T.text,padding:'10px 12px',fontSize:14}} /></div>
                        <div><Label>Description</Label><input placeholder="e.g. Who hits the highest 1RM?" value={challengeForm.description} onChange={e=>setChallengeForm(f=>({...f,description:e.target.value}))} style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:12,color:T.text,padding:'10px 12px',fontSize:14}} /></div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                          <div><Label>Muscle</Label><select value={challengeForm.muscle} onChange={e=>setChallengeForm(f=>({...f,muscle:e.target.value}))} style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'9px 10px',fontSize:13}}>{MUSCLE_GROUPS.map(mg=><option key={mg.id} value={mg.id}>{mg.icon} {mg.name}</option>)}</select></div>
                          <div><Label>Metric</Label><select value={challengeForm.metric} onChange={e=>setChallengeForm(f=>({...f,metric:e.target.value}))} style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'9px 10px',fontSize:13}}><option value="1rm">Best 1RM</option><option value="volume">Total Volume</option><option value="sessions">Most Sessions</option></select></div>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                          <div><Label>Target ({unit})</Label><input type="number" min="0" placeholder="100" value={challengeForm.target} onChange={e=>setChallengeForm(f=>({...f,target:e.target.value}))} style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'9px 10px',fontSize:18,fontWeight:700,textAlign:'center'}} /></div>
                          <div><Label>Duration</Label><select value={challengeForm.days} onChange={e=>setChallengeForm(f=>({...f,days:e.target.value}))} style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,padding:'9px 10px',fontSize:13}}>{[7,14,30,60,90].map(d=><option key={d} value={d}>{d} days</option>)}</select></div>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                          <button className="btn" onClick={()=>setShowCreateChallenge(false)} style={{background:T.bg3,borderRadius:10,color:T.text2,padding:10,fontSize:13,fontWeight:700}}>Cancel</button>
                          <button className="btn" onClick={createChallenge} disabled={challengeLoading} style={{background:T.accent,borderRadius:10,color:'#fff',padding:10,fontSize:13,fontWeight:700,letterSpacing:1}}>Create</button>
                        </div>
                      </div>
                    </Card>
                  )}
                  {challenges.length===0&&!showCreateChallenge?<Card style={{textAlign:'center',padding:24}}><div style={{fontSize:36,marginBottom:8}}>⚔️</div><div style={{fontSize:15,fontWeight:700,color:T.text2,marginBottom:4}}>No challenges yet</div><div style={{fontSize:13,color:T.text3}}>Create one and challenge your crew.</div></Card>
                  :challenges.map(ch=>{
                    const mg=MUSCLE_GROUPS.find(m=>m.id===ch.muscle)
                    const isJoined=myParts.some(p=>p.challenge_id===ch.id)
                    const isExpired=new Date(ch.ends_at)<new Date()
                    const daysLeft=Math.max(0,Math.ceil((new Date(ch.ends_at)-new Date())/(1000*60*60*24)))
                    const creator=allUsers.find(u=>u.id===ch.created_by)
                    const challStart=new Date(ch.created_at),challEnd=new Date(ch.ends_at)
                    const parts=[...new Set([...myParts.filter(p=>p.challenge_id===ch.id).map(p=>p.user_id),ch.created_by])]
                    const cb=allUsers.filter(u=>parts.includes(u.id)).map(u=>{
                      const uw=allUsersWorkouts.filter(w=>w.user_id===u.id&&w.muscle===ch.muscle&&new Date(w.created_at)>=challStart&&new Date(w.created_at)<=challEnd)
                      let score=ch.metric==='1rm'?(uw.length>0?Math.max(...uw.map(w=>cvt(calc1RM(w.weight,w.reps),unit))):0):ch.metric==='volume'?Math.round(cvt(uw.reduce((s,w)=>s+w.weight*w.reps*w.sets,0),unit)):uw.length
                      return{...u,score}
                    }).sort((a,b)=>b.score-a.score)
                    const myScore=cb.find(u=>u.id===currentUser.id)?.score||0
                    const myPos=cb.findIndex(u=>u.id===currentUser.id)+1
                    return(
                      <Card key={ch.id} style={{marginBottom:10,border:`1px solid ${isExpired?T.border:T.accent+'33'}`,position:'relative',overflow:'hidden'}}>
                        {!isExpired&&<div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${T.accent},#F59E0B)`}} />}
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                          <div style={{flex:1}}>
                            <div style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:1,color:T.text}}>{ch.title}</div>
                            <div style={{fontSize:12,color:T.text3}}>{ch.description}</div>
                          </div>
                          {isExpired?<span style={{background:T.bg3,borderRadius:6,padding:'2px 8px',fontSize:10,color:T.text3,fontWeight:700}}>ENDED</span>
                          :<span style={{background:T.accentDim,border:`1px solid ${T.accent}44`,borderRadius:6,padding:'2px 8px',fontSize:10,color:T.accent,fontWeight:700}}>{daysLeft}d left</span>}
                        </div>
                        <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
                          <span style={{background:mg?.colorDim,borderRadius:20,padding:'3px 10px',fontSize:11,color:mg?.color,fontWeight:700}}>{mg?.icon} {mg?.name}</span>
                          <span style={{background:T.bg3,borderRadius:20,padding:'3px 10px',fontSize:11,color:T.text3}}>by {creator?.name||'?'}</span>
                        </div>
                        <div style={{marginBottom:10}}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.text3,marginBottom:4}}><span>Target: {ch.metric!=='sessions'?`${cvt(ch.target,unit)}${unit}`:ch.target}</span><span>You: {myScore}{ch.metric!=='sessions'?unit:''}</span></div>
                          <div style={{background:T.bg3,borderRadius:4,height:6,overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${Math.min((myScore/(ch.metric!=='sessions'?cvt(ch.target,unit):ch.target))*100,100)}%`,background:myScore>=(ch.metric!=='sessions'?cvt(ch.target,unit):ch.target)?'#10B981':T.accent,borderRadius:4,transition:'width 1s ease'}} />
                          </div>
                        </div>
                        {cb.slice(0,3).map((u,i)=>{
                          const isMe=u.id===currentUser.id
                          return(
                            <div key={u.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:i<Math.min(cb.length,3)-1?`1px solid ${T.border}`:'none'}}>
                              <span style={{fontSize:13}}>{'🥇🥈🥉'[i]}</span>
                              <div style={{width:22,height:22,borderRadius:11,background:avatarColor(u.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff',fontFamily:'Bebas Neue'}}>{u.name[0].toUpperCase()}</div>
                              <span style={{flex:1,fontSize:13,color:isMe?T.accent:T.text,fontWeight:isMe?700:400}}>{u.name}</span>
                              <span style={{fontFamily:'Bebas Neue',fontSize:14,color:T.text}}>{u.score}{ch.metric!=='sessions'?unit:''}</span>
                            </div>
                          )
                        })}
                        {!isJoined&&!isExpired&&ch.created_by!==currentUser.id&&(
                          <button className="btn" onClick={()=>handleJoinChallenge(ch.id)} style={{width:'100%',marginTop:10,background:T.accent,borderRadius:10,color:'#fff',padding:10,fontSize:13,fontWeight:800,letterSpacing:1}}>Join Challenge</button>
                        )}
                        {(isJoined||ch.created_by===currentUser.id)&&<div style={{textAlign:'center',fontSize:12,color:'#10B981',fontWeight:700,marginTop:8}}>✓ {ch.created_by===currentUser.id?'Your challenge':'Joined'}</div>}
                      </Card>
                    )
                  })}
                </Section>
              </>
            )}
          </div>
        )}

      </div>

      {/* ── LOG MODAL ── */}
      {logOpen&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'0 16px 24px'}} onClick={()=>setLogOpen(false)}>
          <div className="fade-up" onClick={e=>e.stopPropagation()} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:24,padding:20,width:'100%',maxWidth:440}}>
            <div style={{fontFamily:'Bebas Neue',fontSize:24,letterSpacing:2,color:T.text,marginBottom:2}}>Log a Set</div>
            <div style={{fontSize:13,color:T.text2,marginBottom:16}}>Weight in <span style={{color:T.accent,fontWeight:800}}>{unit.toUpperCase()}</span></div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {/* Muscle grid */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                {MUSCLE_GROUPS.map(mg=>(
                  <button key={mg.id} className="btn press" onClick={()=>{setLogForm(f=>({...f,muscle:mg.id,exercise:''}));setCustomEx('')}}
                    style={{background:logForm.muscle===mg.id?mg.colorDim:T.bg3,border:`2px solid ${logForm.muscle===mg.id?mg.color:T.border}`,borderRadius:14,padding:'10px 6px',display:'flex',flexDirection:'column',alignItems:'center',gap:4,transition:'all .15s'}}>
                    <span style={{fontSize:22}}>{mg.icon}</span>
                    <span style={{fontSize:11,fontWeight:700,color:logForm.muscle===mg.id?mg.color:T.text3}}>{mg.name}</span>
                  </button>
                ))}
              </div>
              {/* Exercise */}
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.text3,letterSpacing:1,marginBottom:6}}>EXERCISE</div>
                <select value={customEx?'__c__':logForm.exercise} onChange={e=>{if(e.target.value==='__c__'){setCustomEx(' ');setLogForm(f=>({...f,exercise:''}))}else{setCustomEx('');setLogForm(f=>({...f,exercise:e.target.value}))}}}
                  style={{width:'100%',background:T.input,border:`1px solid ${T.border}`,borderRadius:12,color:T.text,padding:'11px 14px',fontSize:15,marginBottom:customEx?8:0}}>
                  <option value="">Select exercise...</option>
                  {MUSCLE_GROUPS.find(m=>m.id===logForm.muscle)?.exercises.map(ex=><option key={ex} value={ex}>{ex}</option>)}
                  <option value="__c__">✏️ Type my own...</option>
                </select>
                {customEx!==''&&<input autoFocus placeholder="Exercise name..." value={customEx.trim()?customEx:''} onChange={e=>{setCustomEx(e.target.value);setLogForm(f=>({...f,exercise:e.target.value}))}} style={{width:'100%',background:T.input,border:`1px solid ${T.accent}`,borderRadius:12,color:T.text,padding:'11px 14px',fontSize:15}} />}
              </div>
              {/* Numbers */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                {[[`WT (${unit})`,'weight'],[`REPS`,'reps'],['SETS','sets']].map(([label,field])=>(
                  <div key={field}>
                    <div style={{fontSize:11,fontWeight:700,color:T.text3,marginBottom:6,textAlign:'center'}}>{label}</div>
                    <input type="number" min="0" value={logForm[field]} onChange={e=>setLogForm(f=>({...f,[field]:e.target.value}))} placeholder="0"
                      style={{width:'100%',background:T.bg3,border:`2px solid ${T.border}`,borderRadius:14,color:T.text,padding:'14px 6px',fontSize:26,fontWeight:900,textAlign:'center'}} />
                  </div>
                ))}
              </div>
              {/* Per-hand toggle */}
              <div style={{background:T.bg3,borderRadius:12,padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:T.text}}>Dumbbell / Per Hand</div>
                  <div style={{fontSize:11,color:T.text3,marginTop:1}}>{perHand?`${logForm.weight||0}${unit} × 2 = ${Math.round(parseFloat(logForm.weight||0)*2*10)/10}${unit} total`:'Logging total weight'}</div>
                </div>
                <button onClick={()=>setPerHand(p=>!p)} style={{width:48,height:26,borderRadius:13,border:'none',cursor:'pointer',position:'relative',background:perHand?T.accent:T.bg2,transition:'background .2s',flexShrink:0}}>
                  <div style={{position:'absolute',top:3,left:perHand?25:3,width:20,height:20,borderRadius:10,background:'#fff',transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,.25)'}} />
                </button>
              </div>
              {/* 1RM preview */}
              {logForm.weight&&logForm.reps&&(
                <div style={{background:T.bg3,borderRadius:14,padding:12,textAlign:'center'}}>
                  <div style={{fontSize:11,color:T.text3,letterSpacing:1,marginBottom:2}}>EST. 1RM</div>
                  <div style={{fontFamily:'Bebas Neue',fontSize:36,letterSpacing:2,color:T.accent}}>{Math.round(calc1RM(parseFloat(logForm.weight)*(perHand?2:1),parseInt(logForm.reps)))} {unit}</div>
                </div>
              )}
              {logMsg&&<div style={{background:T.accent+'22',border:`1px solid ${T.accent}`,borderRadius:10,padding:10,color:T.accent,fontSize:13,textAlign:'center'}}>{logMsg}</div>}
              <button className="btn" onClick={handleLog} disabled={logLoading}
                style={{background:`linear-gradient(135deg,${T.accent},${T.accent}CC)`,borderRadius:14,color:'#fff',padding:16,fontSize:18,fontWeight:900,letterSpacing:3,boxShadow:`0 6px 20px ${T.accent}44`}}>
                {logLoading?<span className="spin">◈</span>:'💪 LOG SET'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE MODAL ── */}
      {viewingProfile&&(
        <div style={{position:'fixed',inset:0,zIndex:400,background:'rgba(0,0,0,.75)',display:'flex',flexDirection:'column',justifyContent:'flex-end'}} onClick={()=>setViewingProfile(null)}>
          <div className="fade-up" onClick={e=>e.stopPropagation()} style={{background:T.bg2,borderRadius:'24px 24px 0 0',padding:0,maxHeight:'88vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'center',padding:'12px 0 0'}}><div style={{width:36,height:4,borderRadius:2,background:T.border}} /></div>
            {(()=>{
              const u=viewingProfile,isMe=u.id===currentUser.id
              const uw=allWorkouts.filter(w=>w.user_id===u.id)
              const us=MUSCLE_GROUPS.reduce((a,mg)=>({...a,[mg.id]:calcScore(uw.filter(w=>w.muscle===mg.id))}),{})
              const uo=MUSCLE_GROUPS.reduce((s,mg)=>s+us[mg.id],0)/MUSCLE_GROUPS.length
              const ur=getRank(uo),ug=GOALS.find(g=>g.id===(u.goal||'general'))
              const uv=uw.reduce((s,w)=>s+w.weight*w.reps*w.sets,0)
              const uprs=uw.reduce((a,w)=>{const rm=calc1RM(w.weight,w.reps);if(!a[w.exercise]||rm>a[w.exercise])a[w.exercise]=rm;return a},{})
              return(
                <div style={{padding:'16px 20px 32px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
                    <div style={{width:68,height:68,borderRadius:34,background:avatarColor(u.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,fontWeight:900,color:'#fff',fontFamily:'Bebas Neue',boxShadow:`0 0 20px ${avatarColor(u.name)}55`,flexShrink:0}}>{u.name[0].toUpperCase()}</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                        <div style={{fontFamily:'Bebas Neue',fontSize:26,letterSpacing:2,color:T.text,lineHeight:1}}>{u.name}</div>
                        {isMe&&<span style={{background:T.accent,color:'#fff',fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:20}}>YOU</span>}
                      </div>
                      <div style={{fontSize:12,color:T.text3,marginBottom:6}}>{ug?.icon} {ug?.label}</div>
                      <div style={{display:'inline-flex',alignItems:'center',gap:4,background:ur.gradient,borderRadius:8,padding:'3px 10px'}}>
                        <span style={{fontSize:13}}>{ur.icon}</span>
                        <span style={{fontSize:13,fontWeight:700,color:'#fff'}}>{ur.name}</span>
                      </div>
                    </div>
                    <button onClick={()=>setViewingProfile(null)} style={{background:T.bg3,border:'none',borderRadius:12,width:36,height:36,fontSize:18,color:T.text3,cursor:'pointer'}}>✕</button>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:20}}>
                    {[['Sessions',uw.length,'📝'],['PRs',Object.keys(uprs).length,'⭐'],['Vol.',`${Math.round(cvt(uv,unit)/1000)}k`,'📦'],['Score',Math.round(uo),'🏅']].map(([l,v,i])=>(
                      <div key={l} style={{background:T.bg3,borderRadius:14,padding:'10px 6px',textAlign:'center'}}>
                        <div style={{fontSize:18,marginBottom:2}}>{i}</div>
                        <div style={{fontFamily:'Bebas Neue',fontSize:18,letterSpacing:1,color:T.text,lineHeight:1}}>{v}</div>
                        <div style={{fontSize:10,color:T.text3,fontWeight:600,marginTop:2}}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:12,fontWeight:700,color:T.text3,textTransform:'uppercase',letterSpacing:1,marginBottom:12}}>{isMe?'Your Muscle Ranks':'vs You'}</div>
                  {MUSCLE_GROUPS.map(mg=>{
                    const ts=us[mg.id],ms=scores[mg.id],tr=getRank(ts),diff=ts-ms
                    const pct=Math.min((ts/100)*100,100)
                    const theyWin=diff>2,iWin=diff<-2
                    return(
                      <div key={mg.id} style={{background:T.bg3,borderRadius:14,padding:'12px 14px',marginBottom:8,border:`1.5px solid ${isMe||Math.abs(diff)<=2?T.border:theyWin?tr.color+'44':'#10B98133'}`}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div style={{width:28,height:28,borderRadius:9,background:mg.colorDim,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>{mg.icon}</div>
                            <div style={{fontSize:14,fontWeight:700,color:T.text}}>{mg.name}</div>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div style={{fontSize:13,fontWeight:700,color:tr.color}}>{tr.icon} {tr.name}</div>
                            {!isMe&&<div style={{width:26,height:26,borderRadius:13,background:Math.abs(diff)<=2?T.bg2:theyWin?tr.color+'22':'#10B98122',border:`1.5px solid ${Math.abs(diff)<=2?T.border:theyWin?tr.color:'#10B981'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>
                              {Math.abs(diff)<=2?'≈':theyWin?'↑':'↓'}
                            </div>}
                          </div>
                        </div>
                        <div style={{background:T.bg2,borderRadius:6,height:6,overflow:'hidden',position:'relative'}}>
                          <div className="bar" style={{'--w':`${pct}%`,height:'100%',background:`linear-gradient(90deg,${mg.color},${mg.color}88)`,borderRadius:6}} />
                          {!isMe&&ms>0&&<div style={{position:'absolute',top:0,bottom:0,left:`${Math.min((ms/100)*100,100)}%`,width:2,background:'#fff',opacity:.6,transform:'translateX(-50%)'}} />}
                        </div>
                        {!isMe&&Math.abs(diff)>2&&<div style={{fontSize:11,color:theyWin?tr.color:'#10B981',fontWeight:600,marginTop:4}}>{theyWin?`${u.name.split(' ')[0]} leads by ${Math.round(Math.abs(diff))} pts`:`You lead by ${Math.round(Math.abs(diff))} pts`}</div>}
                      </div>
                    )
                  })}
                  {!isMe&&(
                    <div style={{background:T.bg3,borderRadius:14,padding:14,marginTop:8}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.text3,textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>Overall</div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                        <div style={{textAlign:'center'}}><div style={{fontFamily:'Bebas Neue',fontSize:26,letterSpacing:1,color:T.accent}}>{Math.round(totalScore)}</div><div style={{fontSize:11,color:T.text3}}>You</div></div>
                        <div style={{flex:1,margin:'0 12px'}}>
                          <div style={{background:T.bg2,borderRadius:8,height:10,overflow:'hidden',position:'relative'}}>
                            <div style={{position:'absolute',left:0,top:0,bottom:0,width:`${Math.min((totalScore/Math.max(totalScore,uo))*100,100)}%`,background:`linear-gradient(90deg,${T.accent},${T.accent}99)`,borderRadius:8}} />
                            <div style={{position:'absolute',right:0,top:0,bottom:0,width:`${Math.min((uo/Math.max(totalScore,uo))*100,100)}%`,background:`linear-gradient(90deg,${ur.color}99,${ur.color})`,borderRadius:8}} />
                          </div>
                          <div style={{textAlign:'center',fontSize:11,color:T.text3,marginTop:4}}>{Math.abs(Math.round(uo-totalScore))===0?'Tied!':uo>totalScore?`${u.name.split(' ')[0]} leads by ${Math.round(uo-totalScore)} pts`:`You lead by ${Math.round(totalScore-uo)} pts`}</div>
                        </div>
                        <div style={{textAlign:'center'}}><div style={{fontFamily:'Bebas Neue',fontSize:26,letterSpacing:1,color:ur.color}}>{Math.round(uo)}</div><div style={{fontSize:11,color:T.text3}}>{u.name.split(' ')[0]}</div></div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ── SETTINGS PANEL ── */}
      {showSettings&&(
        <div style={{position:'fixed',inset:0,zIndex:400,background:'rgba(0,0,0,.75)',display:'flex',flexDirection:'column',justifyContent:'flex-end'}} onClick={()=>setShowSettings(false)}>
          <div className="fade-up" onClick={e=>e.stopPropagation()} style={{background:T.bg2,borderRadius:'24px 24px 0 0',padding:'16px 20px 40px',maxHeight:'80vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'center',marginBottom:16}}><div style={{width:36,height:4,borderRadius:2,background:T.border}} /></div>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
              <div style={{width:56,height:56,borderRadius:28,background:avatarColor(currentUser.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:900,color:'#fff',fontFamily:'Bebas Neue',boxShadow:`0 0 18px ${avatarColor(currentUser.name)}55`}}>{currentUser.name[0].toUpperCase()}</div>
              <div>
                <div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:1,color:T.text}}>{currentUser.name}</div>
                <div style={{fontSize:12,color:T.text3}}>{GOALS.find(g=>g.id===(currentUser.goal||'general'))?.icon} {GOALS.find(g=>g.id===(currentUser.goal||'general'))?.label}</div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
              {[['Workouts',workouts.length],['Score',Math.round(totalScore)]].map(([l,v])=>(
                <div key={l} style={{background:T.bg3,borderRadius:12,padding:'12px',textAlign:'center'}}>
                  <div style={{fontFamily:'Bebas Neue',fontSize:24,letterSpacing:1,color:T.text}}>{v}</div>
                  <div style={{fontSize:11,color:T.text3,fontWeight:600}}>{l}</div>
                </div>
              ))}
            </div>
            <button className="btn" onClick={onRecalibrate} style={{width:'100%',background:'transparent',border:`1px solid #3B82F6`,borderRadius:12,color:'#3B82F6',padding:12,fontSize:14,fontWeight:700,letterSpacing:1,marginBottom:10}}>◉ Recalibrate My Rank</button>
            <button className="btn" onClick={onLogout} style={{width:'100%',background:T.bg3,border:`1px solid ${T.border}`,borderRadius:12,color:T.text2,padding:12,fontSize:14,fontWeight:700,marginBottom:16}}>Sign Out</button>
            <div style={{background:T.bg2,border:`1px solid ${T.accent}33`,borderRadius:14,padding:14}}>
              <div style={{fontSize:11,color:T.accent,letterSpacing:2,textTransform:'uppercase',fontWeight:700,marginBottom:8}}>Danger Zone</div>
              <div style={{fontSize:13,color:T.text2,marginBottom:14,lineHeight:1.5}}>Permanently deletes your account and all {workouts.length} workout sessions.</div>
              {!showDeleteConfirm?(
                <button className="btn" onClick={()=>setShowDeleteConfirm(true)} style={{width:'100%',background:'transparent',border:`1px solid ${T.accent}`,borderRadius:10,color:T.accent,padding:11,fontSize:13,fontWeight:700,letterSpacing:1}}>Delete My Account</button>
              ):(
                <div>
                  <div style={{background:T.darkMode?'#2A0505':'#FFF5F5',borderRadius:10,padding:10,marginBottom:10,fontSize:12,color:T.darkMode?'#FCA5A5':'#991B1B'}}>⚠️ This cannot be undone.</div>
                  <input type="password" inputMode="numeric" maxLength={8} placeholder="••••" value={deletePin} onChange={e=>setDeletePin(e.target.value)}
                    style={{width:'100%',background:T.input,border:`1px solid ${T.accent}55`,borderRadius:10,color:T.text,padding:'11px 14px',fontSize:22,letterSpacing:8,textAlign:'center',marginBottom:10}} />
                  {deleteMsg&&<div style={{color:T.accent,fontSize:12,textAlign:'center',marginBottom:10}}>{deleteMsg}</div>}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <button className="btn" onClick={()=>{setShowDeleteConfirm(false);setDeletePin('');setDeleteMsg('')}} style={{background:T.bg3,borderRadius:10,color:T.text2,padding:11,fontSize:13,fontWeight:700}}>Cancel</button>
                    <button className="btn" onClick={handleDeleteAccount} disabled={deleteLoading} style={{background:T.accent,borderRadius:10,color:'#fff',padding:11,fontSize:13,fontWeight:700,letterSpacing:1}}>{deleteLoading?'...':'Confirm'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:200,background:T.bg2,borderTop:`1px solid ${T.border}`,paddingBottom:'env(safe-area-inset-bottom)'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',padding:'6px 0 4px'}}>
          {[
            {id:'today',     icon:'🏠', label:'Today'},
            {id:'workouts',  icon:'📋', label:'Workouts'},
            {id:'progress',  icon:'📈', label:'Progress'},
            {id:'community', icon:'🏆', label:'Community'},
          ].map(({id,icon,label})=>(
            <button key={id} onClick={()=>setTab(id)} className="btn"
              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'6px 4px',background:'transparent'}}>
              <div style={{width:38,height:38,borderRadius:12,background:tab===id?T.accentDim:'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,transition:'all .2s'}}>{icon}</div>
              <div style={{fontSize:10,fontWeight:700,color:tab===id?T.accent:T.text3,transition:'color .2s'}}>{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Floating log button */}
      <button className="btn" onClick={()=>setLogOpen(true)}
        style={{position:'fixed',bottom:72,right:20,zIndex:300,width:54,height:54,borderRadius:27,background:`linear-gradient(135deg,${T.accent},${T.accent}CC)`,color:'#fff',fontSize:26,fontWeight:900,boxShadow:`0 6px 20px ${T.accent}55`,display:'flex',alignItems:'center',justifyContent:'center'}}>
        +
      </button>
    </div>
  )
}
