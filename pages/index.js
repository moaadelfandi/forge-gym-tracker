import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ─── Constants ────────────────────────────────────────────────────────────────

const RANKS = [
  { name:'Beginner',     color:'#6B7280', bg:'#1F2937', min:0,  icon:'◈' },
  { name:'Novice',       color:'#10B981', bg:'#064E3B', min:20, icon:'◆' },
  { name:'Intermediate', color:'#3B82F6', bg:'#1E3A5F', min:40, icon:'◉' },
  { name:'Advanced',     color:'#8B5CF6', bg:'#2E1065', min:60, icon:'✦' },
  { name:'Elite',        color:'#F59E0B', bg:'#451A03', min:80, icon:'★' },
  { name:'Legend',       color:'#EF4444', bg:'#450A0A', min:95, icon:'⬡' },
]

const GOALS = [
  { id:'david_laid',   label:'David Laid Aesthetic', icon:'⚔️',  desc:'Lean, proportional, V-taper physique' },
  { id:'strength',     label:'General Strength',     icon:'💪',  desc:'Build overall strength across all lifts' },
  { id:'powerlifting', label:'Powerlifting',          icon:'🏋️', desc:'Maximize squat, bench, and deadlift' },
  { id:'fat_loss',     label:'Fat Loss / Conditioning', icon:'🔥', desc:'Burn fat, build endurance and tone' },
  { id:'athlete',      label:'Athlete / Sports',     icon:'🏅',  desc:'Explosive power and athletic performance' },
  { id:'general',      label:'No Specific Goal',     icon:'📊',  desc:'Just track workouts and see progress' },
]

const MUSCLE_GROUPS = [
  { id:'chest',     name:'Chest',     icon:'🫁', exercises:['Bench Press','Incline Bench Press','Decline Bench Press','Dumbbell Fly','Incline Dumbbell Fly','Cable Fly','Cable Crossover','Chest Dip','Push-up','Pec Deck Machine','Smith Machine Bench','Landmine Press'] },
  { id:'back',      name:'Back',      icon:'🔱', exercises:['Deadlift','Barbell Row','Pull-ups','Chin-ups','Lat Pulldown','Seated Cable Row','Single Arm Dumbbell Row','T-Bar Row','Face Pull','Straight Arm Pulldown','Rack Pull','Meadows Row','Cable Pull-over'] },
  { id:'legs',      name:'Legs',      icon:'⚡', exercises:['Squat','Front Squat','Leg Press','Romanian Deadlift','Hack Squat','Lunges','Bulgarian Split Squat','Leg Extension','Leg Curl','Calf Raise','Goblet Squat','Hip Thrust','Sumo Deadlift','Step-ups'] },
  { id:'shoulders', name:'Shoulders', icon:'△',  exercises:['Overhead Press','Arnold Press','Lateral Raise','Face Pull','Front Raise','Rear Delt Fly','Cable Lateral Raise','Dumbbell Shoulder Press','Machine Shoulder Press','Upright Row','Shrugs','Cable Face Pull','Reverse Pec Deck'] },
  { id:'arms',      name:'Arms',      icon:'◎',  exercises:['Barbell Curl','Dumbbell Curl','Hammer Curl','Incline Dumbbell Curl','Cable Curl','Preacher Curl','Tricep Dip','Skull Crusher','Tricep Pushdown','Overhead Tricep Extension','Close Grip Bench Press','Cable Overhead Tricep Extension','Diamond Push-up','Concentration Curl'] },
  { id:'core',      name:'Core',      icon:'◇',  exercises:['Plank','Ab Wheel','Hanging Leg Raise','Cable Crunch','Dragon Flag','Decline Sit-up','Russian Twist','Hollow Body Hold','L-sit','Weighted Crunch','Landmine Twist','Pallof Press','Dead Bug','Bicycle Crunch'] },
]

// ─── Goal-based plans ─────────────────────────────────────────────────────────

const PLANS = {
  david_laid: {
    title: 'David Laid Aesthetic',
    subtitle: '4-day Push/Pull/Legs/Upper',
    days: [
      { day:'Day 1', label:'PUSH', focus:'Chest · Shoulders · Triceps',
        tip:'David Laid prioritizes heavy incline work for upper chest thickness and strict lateral raises for 3D shoulder caps.',
        exercises:[
          { name:'Incline Bench Press', muscle:'chest',     sets:4, reps:'6-8',   note:'Primary mass builder — go heavy, full range of motion' },
          { name:'Bench Press',         muscle:'chest',     sets:3, reps:'8-10',  note:'Full chest activation, slight arch, retract scapula' },
          { name:'Cable Fly',           muscle:'chest',     sets:3, reps:'12-15', note:'Stretch hard at the bottom, squeeze at the top' },
          { name:'Overhead Press',      muscle:'shoulders', sets:4, reps:'6-8',   note:'Builds shoulder width and mass — press straight up' },
          { name:'Lateral Raise',       muscle:'shoulders', sets:4, reps:'15-20', note:'Strict form, lead with elbows, no swinging' },
          { name:'Tricep Pushdown',     muscle:'arms',      sets:3, reps:'12-15', note:'Full extension at bottom, elbows locked at sides' },
          { name:'Skull Crusher',       muscle:'arms',      sets:3, reps:'10-12', note:'Keep elbows tucked, lower to forehead slowly' },
        ]},
      { day:'Day 2', label:'PULL', focus:'Back · Biceps · Rear Delts',
        tip:'David Laid is known for his V-taper. Heavy deadlifts and wide-grip pull-ups build the foundation.',
        exercises:[
          { name:'Deadlift',         muscle:'back', sets:4, reps:'4-6',   note:'King of all lifts — brace your core hard' },
          { name:'Pull-ups',         muscle:'back', sets:4, reps:'6-10',  note:'Wide grip for lat width, full hang at bottom' },
          { name:'Barbell Row',      muscle:'back', sets:3, reps:'8-10',  note:'Chest to bar, control the eccentric' },
          { name:'Lat Pulldown',     muscle:'back', sets:3, reps:'10-12', note:'Full stretch at top, pull to upper chest' },
          { name:'Seated Cable Row', muscle:'back', sets:3, reps:'12-15', note:'Squeeze shoulder blades together' },
          { name:'Barbell Curl',     muscle:'arms', sets:3, reps:'8-10',  note:'Slow eccentric for bicep peak' },
          { name:'Hammer Curl',      muscle:'arms', sets:3, reps:'10-12', note:'Builds brachialis for arm thickness' },
          { name:'Face Pull',        muscle:'back', sets:3, reps:'15-20', note:'Rear delt health and width' },
        ]},
      { day:'Day 3', label:'LEGS', focus:'Quads · Hamstrings · Glutes · Calves',
        tip:'David Laid squats deep with full range of motion. Balanced legs = better overall proportions.',
        exercises:[
          { name:'Squat',                 muscle:'legs', sets:4, reps:'6-8',   note:'Full depth, chest up, knees track over toes' },
          { name:'Romanian Deadlift',     muscle:'legs', sets:4, reps:'8-10',  note:'Feel the hamstring stretch at the bottom' },
          { name:'Leg Press',             muscle:'legs', sets:3, reps:'10-12', note:'High foot placement for glute activation' },
          { name:'Bulgarian Split Squat', muscle:'legs', sets:3, reps:'10-12', note:'Each leg separately — brutal but effective' },
          { name:'Leg Extension',         muscle:'legs', sets:3, reps:'15-20', note:'Squeeze and hold at the top' },
          { name:'Leg Curl',              muscle:'legs', sets:3, reps:'12-15', note:'Slow and controlled' },
          { name:'Calf Raise',            muscle:'legs', sets:4, reps:'15-20', note:'Full range, pause at bottom' },
        ]},
      { day:'Day 4', label:'UPPER', focus:'Full Upper · Weak Points · Core',
        tip:'Use this day to bring up weak points. David Laid stays proportional by targeting what needs the most work.',
        exercises:[
          { name:'Decline Bench Press',       muscle:'chest',     sets:3, reps:'8-10',  note:'Lower chest detail and fullness' },
          { name:'Single Arm Dumbbell Row',   muscle:'back',      sets:3, reps:'10-12', note:'Full stretch, full contraction' },
          { name:'Arnold Press',              muscle:'shoulders', sets:3, reps:'10-12', note:'Great for shoulder roundness' },
          { name:'Cable Lateral Raise',       muscle:'shoulders', sets:3, reps:'15-20', note:'Constant tension on medial delt' },
          { name:'Incline Dumbbell Curl',     muscle:'arms',      sets:3, reps:'10-12', note:'Long head bicep stretch' },
          { name:'Overhead Tricep Extension', muscle:'arms',      sets:3, reps:'12-15', note:'Long head stretch — adds mass' },
          { name:'Ab Wheel',                  muscle:'core',      sets:3, reps:'10-15', note:'Control the rollout' },
          { name:'Hanging Leg Raise',         muscle:'core',      sets:3, reps:'12-15', note:'No swinging, curl hips up' },
        ]},
    ]
  },

  strength: {
    title: 'General Strength',
    subtitle: '4-day Upper/Lower split',
    days: [
      { day:'Day 1', label:'UPPER A', focus:'Chest · Back · Shoulders heavy',
        tip:'Focus on progressive overload. Add weight every session, even if just 2.5kg.',
        exercises:[
          { name:'Bench Press',        muscle:'chest',     sets:4, reps:'5',    note:'Work up to a heavy top set' },
          { name:'Barbell Row',        muscle:'back',      sets:4, reps:'5',    note:'Match your bench weight over time' },
          { name:'Overhead Press',     muscle:'shoulders', sets:3, reps:'5',    note:'Strict press, no leg drive' },
          { name:'Pull-ups',           muscle:'back',      sets:3, reps:'6-8',  note:'Add weight when you can do 10+ easily' },
          { name:'Dumbbell Curl',      muscle:'arms',      sets:3, reps:'10-12',note:'Controlled reps' },
          { name:'Tricep Pushdown',    muscle:'arms',      sets:3, reps:'10-12',note:'Full extension each rep' },
        ]},
      { day:'Day 2', label:'LOWER A', focus:'Squat · Hamstrings heavy',
        tip:'Squat is the king of lower body strength. Prioritize form over weight.',
        exercises:[
          { name:'Squat',             muscle:'legs', sets:4, reps:'5',    note:'Top set heavy, rest back off sets' },
          { name:'Romanian Deadlift', muscle:'legs', sets:3, reps:'8',    note:'Hamstring focus' },
          { name:'Leg Press',         muscle:'legs', sets:3, reps:'10',   note:'Volume work after squats' },
          { name:'Leg Curl',          muscle:'legs', sets:3, reps:'10-12',note:'Controlled eccentric' },
          { name:'Calf Raise',        muscle:'legs', sets:4, reps:'15',   note:'Full range' },
          { name:'Plank',             muscle:'core', sets:3, reps:'60s',  note:'Brace hard' },
        ]},
      { day:'Day 3', label:'UPPER B', focus:'Chest · Back · Arms volume',
        tip:'Today is volume day — more reps, build the muscle to support heavier lifts.',
        exercises:[
          { name:'Incline Bench Press',   muscle:'chest', sets:4, reps:'8-10', note:'Upper chest development' },
          { name:'Lat Pulldown',          muscle:'back',  sets:4, reps:'8-10', note:'Lat width' },
          { name:'Cable Fly',             muscle:'chest', sets:3, reps:'12-15',note:'Chest pump' },
          { name:'Seated Cable Row',      muscle:'back',  sets:3, reps:'10-12',note:'Mid back thickness' },
          { name:'Barbell Curl',          muscle:'arms',  sets:3, reps:'10',   note:'Heavy curl' },
          { name:'Skull Crusher',         muscle:'arms',  sets:3, reps:'10',   note:'Tricep mass' },
        ]},
      { day:'Day 4', label:'LOWER B', focus:'Deadlift · Quads volume',
        tip:'Deadlift is the most complete strength movement. It builds everything.',
        exercises:[
          { name:'Deadlift',           muscle:'back', sets:4, reps:'5',    note:'Heaviest lift of the week' },
          { name:'Front Squat',        muscle:'legs', sets:3, reps:'6-8',  note:'Quad dominant, builds core too' },
          { name:'Leg Extension',      muscle:'legs', sets:3, reps:'12-15',note:'Quad isolation after compounds' },
          { name:'Hip Thrust',         muscle:'legs', sets:3, reps:'10-12',note:'Glute strength' },
          { name:'Calf Raise',         muscle:'legs', sets:3, reps:'15',   note:'Full range' },
          { name:'Ab Wheel',           muscle:'core', sets:3, reps:'10',   note:'Core stability for heavy lifts' },
        ]},
    ]
  },

  powerlifting: {
    title: 'Powerlifting',
    subtitle: '4-day Squat/Bench/Deadlift focus',
    days: [
      { day:'Day 1', label:'SQUAT', focus:'Squat heavy · Accessory work',
        tip:'Powerlifting is about one thing: moving maximum weight. Every accessory exists to serve the big three.',
        exercises:[
          { name:'Squat',             muscle:'legs', sets:5, reps:'3-5',  note:'Working up to max effort sets' },
          { name:'Leg Press',         muscle:'legs', sets:3, reps:'10',   note:'Volume for quad strength' },
          { name:'Romanian Deadlift', muscle:'legs', sets:3, reps:'8',    note:'Posterior chain accessory' },
          { name:'Leg Curl',          muscle:'legs', sets:3, reps:'10-12',note:'Hamstring health' },
          { name:'Ab Wheel',          muscle:'core', sets:4, reps:'10',   note:'Core stability is everything in squat' },
        ]},
      { day:'Day 2', label:'BENCH', focus:'Bench heavy · Tricep accessories',
        tip:'Triceps are 60% of your bench. Train them seriously.',
        exercises:[
          { name:'Bench Press',           muscle:'chest', sets:5, reps:'3-5',  note:'Competition grip, leg drive, arch' },
          { name:'Close Grip Bench Press',muscle:'arms',  sets:3, reps:'6-8',  note:'Tricep strength for lockout' },
          { name:'Tricep Pushdown',       muscle:'arms',  sets:4, reps:'10-12',note:'High volume tricep work' },
          { name:'Skull Crusher',         muscle:'arms',  sets:3, reps:'8-10', note:'Long head tricep' },
          { name:'Overhead Press',        muscle:'shoulders',sets:3,reps:'8',  note:'Shoulder health' },
          { name:'Face Pull',             muscle:'back',  sets:3, reps:'15',   note:'Rotator cuff health' },
        ]},
      { day:'Day 3', label:'DEADLIFT', focus:'Deadlift heavy · Back accessories',
        tip:'The deadlift is the ultimate test of total body strength.',
        exercises:[
          { name:'Deadlift',           muscle:'back', sets:5, reps:'2-4',  note:'Max effort — brace and drive' },
          { name:'Rack Pull',          muscle:'back', sets:3, reps:'5',    note:'Overload the lockout' },
          { name:'Barbell Row',        muscle:'back', sets:4, reps:'6-8',  note:'Back thickness for the pull' },
          { name:'Lat Pulldown',       muscle:'back', sets:3, reps:'10',   note:'Lats stay tight in deadlift' },
          { name:'Hanging Leg Raise',  muscle:'core', sets:3, reps:'12',   note:'Core bracing practice' },
        ]},
      { day:'Day 4', label:'ACCESSORY', focus:'Weak points · Volume',
        tip:'Use this day to address what is limiting your big three lifts.',
        exercises:[
          { name:'Front Squat',            muscle:'legs',      sets:3, reps:'5',    note:'Quad and core strength for squat' },
          { name:'Incline Bench Press',    muscle:'chest',     sets:3, reps:'8',    note:'Upper chest for bench' },
          { name:'Sumo Deadlift',          muscle:'legs',      sets:3, reps:'5',    note:'Hip and glute strength' },
          { name:'Overhead Tricep Extension',muscle:'arms',    sets:3, reps:'12',   note:'Tricep lockout strength' },
          { name:'Barbell Curl',           muscle:'arms',      sets:3, reps:'10',   note:'Bicep tendon health' },
          { name:'Pallof Press',           muscle:'core',      sets:3, reps:'12',   note:'Anti-rotation core stability' },
        ]},
    ]
  },

  fat_loss: {
    title: 'Fat Loss / Conditioning',
    subtitle: '4-day Full body circuit style',
    days: [
      { day:'Day 1', label:'FULL A', focus:'Compound lifts · High volume',
        tip:'Keep rest short (60-90 sec). The goal is to keep heart rate elevated while building muscle.',
        exercises:[
          { name:'Squat',          muscle:'legs',      sets:4, reps:'12-15',note:'Moderate weight, keep moving' },
          { name:'Bench Press',    muscle:'chest',     sets:3, reps:'12',   note:'Controlled reps, short rest' },
          { name:'Barbell Row',    muscle:'back',      sets:3, reps:'12',   note:'Full range, squeeze at top' },
          { name:'Overhead Press', muscle:'shoulders', sets:3, reps:'12',   note:'Strict form' },
          { name:'Plank',          muscle:'core',      sets:3, reps:'45s',  note:'Brace throughout' },
          { name:'Bicycle Crunch', muscle:'core',      sets:3, reps:'20',   note:'Core burn' },
        ]},
      { day:'Day 2', label:'UPPER', focus:'Upper body · Arms · Shoulders',
        tip:'Higher reps burn more calories. Focus on squeezing every muscle hard.',
        exercises:[
          { name:'Incline Bench Press', muscle:'chest',     sets:3, reps:'12-15',note:'Chest pump' },
          { name:'Lat Pulldown',        muscle:'back',      sets:3, reps:'12-15',note:'Back width' },
          { name:'Lateral Raise',       muscle:'shoulders', sets:4, reps:'15-20',note:'Medial delt burn' },
          { name:'Cable Fly',           muscle:'chest',     sets:3, reps:'15',   note:'Stretch and squeeze' },
          { name:'Dumbbell Curl',       muscle:'arms',      sets:3, reps:'15',   note:'High rep pump' },
          { name:'Tricep Pushdown',     muscle:'arms',      sets:3, reps:'15',   note:'Keep moving' },
        ]},
      { day:'Day 3', label:'LOWER', focus:'Legs · Glutes · Calves',
        tip:'Legs are the biggest muscle group — training them burns the most calories.',
        exercises:[
          { name:'Romanian Deadlift',     muscle:'legs', sets:4, reps:'12',   note:'Hamstring focus, full stretch' },
          { name:'Leg Press',             muscle:'legs', sets:3, reps:'15',   note:'High rep, short rest' },
          { name:'Bulgarian Split Squat', muscle:'legs', sets:3, reps:'12',   note:'Each leg' },
          { name:'Leg Extension',         muscle:'legs', sets:3, reps:'15-20',note:'Quad burn' },
          { name:'Leg Curl',              muscle:'legs', sets:3, reps:'15',   note:'Hamstring burn' },
          { name:'Calf Raise',            muscle:'legs', sets:4, reps:'20',   note:'High rep calves' },
        ]},
      { day:'Day 4', label:'FULL B', focus:'Full body · Circuit · Core',
        tip:'Finish the week strong. Push the pace today.',
        exercises:[
          { name:'Deadlift',           muscle:'back',      sets:3, reps:'10',   note:'Moderate weight, full body activation' },
          { name:'Push-up',            muscle:'chest',     sets:3, reps:'15-20',note:'Bodyweight burn' },
          { name:'Pull-ups',           muscle:'back',      sets:3, reps:'8-10', note:'As many as possible' },
          { name:'Goblet Squat',       muscle:'legs',      sets:3, reps:'15',   note:'Light and fast' },
          { name:'Ab Wheel',           muscle:'core',      sets:3, reps:'12',   note:'Full rollout' },
          { name:'Hanging Leg Raise',  muscle:'core',      sets:3, reps:'15',   note:'Core finisher' },
        ]},
    ]
  },

  athlete: {
    title: 'Athlete / Sports Performance',
    subtitle: '4-day Power + Strength + Agility',
    days: [
      { day:'Day 1', label:'POWER', focus:'Explosive strength · Lower body',
        tip:'Athletic performance is built on power. Train fast and explosively on your compound movements.',
        exercises:[
          { name:'Squat',             muscle:'legs', sets:5, reps:'4-6',  note:'Explode up, controlled down' },
          { name:'Romanian Deadlift', muscle:'legs', sets:3, reps:'6-8',  note:'Hip hinge power' },
          { name:'Hip Thrust',        muscle:'legs', sets:4, reps:'8-10', note:'Glute power for sprinting' },
          { name:'Leg Extension',     muscle:'legs', sets:3, reps:'12',   note:'Quad isolation' },
          { name:'Calf Raise',        muscle:'legs', sets:4, reps:'15',   note:'Ankle power' },
          { name:'Pallof Press',      muscle:'core', sets:3, reps:'12',   note:'Anti-rotation stability' },
        ]},
      { day:'Day 2', label:'UPPER POWER', focus:'Pressing · Pulling · Rotational',
        tip:'Upper body power translates directly to throwing, pushing, and contact sports.',
        exercises:[
          { name:'Bench Press',    muscle:'chest',     sets:4, reps:'5',    note:'Explosive press' },
          { name:'Barbell Row',    muscle:'back',      sets:4, reps:'5',    note:'Explosive pull' },
          { name:'Overhead Press', muscle:'shoulders', sets:3, reps:'6-8',  note:'Overhead power' },
          { name:'Pull-ups',       muscle:'back',      sets:3, reps:'6-8',  note:'Relative strength' },
          { name:'Face Pull',      muscle:'back',      sets:3, reps:'15',   note:'Shoulder health' },
          { name:'Ab Wheel',       muscle:'core',      sets:3, reps:'10',   note:'Core transfer of power' },
        ]},
      { day:'Day 3', label:'STRENGTH', focus:'Deadlift · Heavy compounds',
        tip:'Strength is the foundation of all athletic qualities. Get strong first.',
        exercises:[
          { name:'Deadlift',        muscle:'back', sets:4, reps:'4-5',  note:'Max strength focus' },
          { name:'Front Squat',     muscle:'legs', sets:3, reps:'5',    note:'Quad and core strength' },
          { name:'Barbell Row',     muscle:'back', sets:3, reps:'6',    note:'Back thickness' },
          { name:'Overhead Press',  muscle:'shoulders',sets:3,reps:'6', note:'Shoulder pressing strength' },
          { name:'Barbell Curl',    muscle:'arms', sets:3, reps:'8',    note:'Elbow flexor strength' },
          { name:'Hanging Leg Raise',muscle:'core',sets:3, reps:'12',  note:'Hip flexor strength' },
        ]},
      { day:'Day 4', label:'CONDITIONING', focus:'Volume · Weak points · Core',
        tip:'Conditioning work improves your ability to repeat high-quality efforts throughout a game or match.',
        exercises:[
          { name:'Bulgarian Split Squat', muscle:'legs',      sets:3, reps:'10',   note:'Single leg power' },
          { name:'Incline Bench Press',   muscle:'chest',     sets:3, reps:'10',   note:'Upper chest pressing' },
          { name:'Lat Pulldown',          muscle:'back',      sets:3, reps:'10',   note:'Lat strength' },
          { name:'Lateral Raise',         muscle:'shoulders', sets:3, reps:'15',   note:'Shoulder stability' },
          { name:'Hammer Curl',           muscle:'arms',      sets:3, reps:'12',   note:'Grip and arm strength' },
          { name:'Dragon Flag',           muscle:'core',      sets:3, reps:'6-8',  note:'Full core strength' },
        ]},
    ]
  },

  general: {
    title: 'No Specific Goal',
    subtitle: '4-day balanced program',
    days: [
      { day:'Day 1', label:'PUSH', focus:'Chest · Shoulders · Triceps',
        tip:'Just show up, work hard, log your sets. Progress will come.',
        exercises:[
          { name:'Bench Press',     muscle:'chest',     sets:3, reps:'8-10', note:'Standard chest press' },
          { name:'Incline Bench',   muscle:'chest',     sets:3, reps:'10',   note:'Upper chest' },
          { name:'Overhead Press',  muscle:'shoulders', sets:3, reps:'8-10', note:'Shoulder press' },
          { name:'Lateral Raise',   muscle:'shoulders', sets:3, reps:'15',   note:'Side delts' },
          { name:'Tricep Pushdown', muscle:'arms',      sets:3, reps:'12',   note:'Tricep isolation' },
          { name:'Cable Fly',       muscle:'chest',     sets:3, reps:'12',   note:'Chest finisher' },
        ]},
      { day:'Day 2', label:'PULL', focus:'Back · Biceps',
        tip:'Focus on feeling the muscles work. Mind-muscle connection matters.',
        exercises:[
          { name:'Deadlift',        muscle:'back', sets:3, reps:'6-8',  note:'Hinge movement' },
          { name:'Barbell Row',     muscle:'back', sets:3, reps:'8-10', note:'Horizontal pull' },
          { name:'Lat Pulldown',    muscle:'back', sets:3, reps:'10-12',note:'Vertical pull' },
          { name:'Seated Cable Row',muscle:'back', sets:3, reps:'12',   note:'Mid back' },
          { name:'Barbell Curl',    muscle:'arms', sets:3, reps:'10',   note:'Bicep curl' },
          { name:'Hammer Curl',     muscle:'arms', sets:3, reps:'12',   note:'Brachialis' },
        ]},
      { day:'Day 3', label:'LEGS', focus:'Quads · Hamstrings · Glutes',
        tip:'Leg day is non-negotiable. Consistent leg training builds a solid base.',
        exercises:[
          { name:'Squat',             muscle:'legs', sets:4, reps:'8-10', note:'Full depth squat' },
          { name:'Romanian Deadlift', muscle:'legs', sets:3, reps:'10',   note:'Hamstrings' },
          { name:'Leg Press',         muscle:'legs', sets:3, reps:'12',   note:'Quad volume' },
          { name:'Leg Extension',     muscle:'legs', sets:3, reps:'15',   note:'Quad isolation' },
          { name:'Leg Curl',          muscle:'legs', sets:3, reps:'12',   note:'Hamstring isolation' },
          { name:'Calf Raise',        muscle:'legs', sets:3, reps:'15',   note:'Calves' },
        ]},
      { day:'Day 4', label:'UPPER', focus:'Full Upper · Core',
        tip:'Use this day for anything you feel needs more work.',
        exercises:[
          { name:'Pull-ups',              muscle:'back',      sets:3, reps:'6-10', note:'Bodyweight pull' },
          { name:'Dumbbell Shoulder Press',muscle:'shoulders',sets:3, reps:'10',   note:'Shoulder press' },
          { name:'Dumbbell Curl',         muscle:'arms',      sets:3, reps:'12',   note:'Bicep' },
          { name:'Skull Crusher',         muscle:'arms',      sets:3, reps:'12',   note:'Tricep' },
          { name:'Cable Fly',             muscle:'chest',     sets:3, reps:'12',   note:'Chest detail' },
          { name:'Ab Wheel',              muscle:'core',      sets:3, reps:'10',   note:'Core' },
          { name:'Hanging Leg Raise',     muscle:'core',      sets:3, reps:'12',   note:'Core finisher' },
        ]},
    ]
  },
}


// ─── Adaptive plan based on training days selected ───────────────────────────
// Each goal has full day templates. We pick which days to include based on
// how many training days the user selected (1-7), using smart splits:
// 1 day  → Full Body
// 2 days → Upper / Lower
// 3 days → Push / Pull / Legs
// 4 days → Push / Pull / Legs / Upper
// 5 days → Push / Pull / Legs / Upper / Lower
// 6 days → Push / Pull / Legs / Push / Pull / Legs
// 7 days → all 4 + extra Upper/Lower/Full
// We achieve this by mapping day counts to indices into the plan's day array,
// and for goals that only have 4 days we cycle/repeat intelligently.

function getActiveDays(planDays, numSelected) {
  const total = planDays.length
  if (numSelected <= 0) return []
  if (numSelected >= total) {
    // repeat the cycle if user picks more days than plan has
    const result = []
    for (let i = 0; i < numSelected; i++) result.push({...planDays[i % total], day: `Day ${i+1}`})
    return result
  }
  // Smart selection: spread evenly across the plan
  const indices = {
    1: [0],
    2: [0, 1],
    3: [0, 1, 2],
    4: [0, 1, 2, 3],
    5: [0, 1, 2, 3, 1],
    6: [0, 1, 2, 0, 1, 2],
    7: [0, 1, 2, 3, 0, 1, 2],
  }
  const picks = (indices[numSelected] || Array.from({length:numSelected},(_,i)=>i%total))
  return picks.map((idx, i) => ({...planDays[idx], day: `Day ${i+1}`}))
}

const DAYS_OF_WEEK = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const AVATAR_COLORS = ['#EF4444','#F59E0B','#10B981','#3B82F6','#8B5CF6','#EC4899','#06B6D4','#84CC16']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calc1RM(weight, reps) {
  if (reps === 1) return weight
  return weight * (36 / (37 - reps))
}
function calcScore(sessions) {
  if (!sessions || sessions.length === 0) return 0
  const best1RM    = Math.max(...sessions.map(s => calc1RM(s.weight, s.reps)))
  const bestVolume = Math.max(...sessions.map(s => s.weight * s.reps * s.sets))
  return Math.min((best1RM/200)*100,100)*0.6 + Math.min((bestVolume/10000)*100,100)*0.4
}
function getRank(score) {
  for (let i = RANKS.length-1; i>=0; i--) if (score >= RANKS[i].min) return RANKS[i]
  return RANKS[0]
}
function getNextRank(score) {
  for (let i = 0; i < RANKS.length; i++) if (score < RANKS[i].min) return RANKS[i]
  return null
}
function convertWeight(kg, unit) {
  return unit==='lbs' ? Math.round(kg*2.205*10)/10 : Math.round(kg*10)/10
}
function avatarColor(name) {
  let h=0; for (let i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h)
  return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length]
}

const SETTINGS_KEY = 'forge_settings_v2'
const SESSION_KEY  = 'forge_session_v1'
function loadSettings() {
  try { const s = JSON.parse(localStorage.getItem(SETTINGS_KEY)); return s ? {...{unit:'kg',trainingDays:['Mon','Tue','Thu','Fri'],ownSplit:false},...s} : {unit:'kg',trainingDays:['Mon','Tue','Thu','Fri'],ownSplit:false} }
  catch { return {unit:'kg',trainingDays:['Mon','Tue','Thu','Fri'],ownSplit:false} }
}
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null }
  catch { return null }
}

const S = {
  input: { width:'100%', background:'#0F1520', border:'1px solid #1A2332', borderRadius:8, color:'#E2E8F0', padding:'12px 14px', fontSize:15, fontFamily:'Barlow Condensed, sans-serif' },
  label: { fontSize:10, letterSpacing:3, color:'#64748B', textTransform:'uppercase', marginBottom:6, display:'block' },
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [currentUser, setCurrentUser] = useState(loadSession)
  const [screen, setScreen]           = useState('login')
  const [users, setUsers]             = useState([])
  const [authForm, setAuthForm]       = useState({name:'',pin:'',confirmPin:'',goal:'david_laid'})
  const [authMsg, setAuthMsg]         = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [pendingUser, setPendingUser]   = useState(null) // user waiting for calibration

  const fetchUsers = useCallback(async () => {
    const {data} = await supabase.from('users').select('id,name,goal').order('name')
    if (data) setUsers(data)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  useEffect(() => {
    if (currentUser) { localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser)); setScreen('app') }
    else             { localStorage.removeItem(SESSION_KEY); setScreen('login') }
  }, [currentUser])

  async function handleRegister() {
    const {name,pin,confirmPin,goal} = authForm
    if (!name.trim()||!pin)     { setAuthMsg('Enter a name and PIN.'); return }
    if (pin.length<4)           { setAuthMsg('PIN must be at least 4 digits.'); return }
    if (pin!==confirmPin)       { setAuthMsg('PINs do not match.'); return }
    setAuthLoading(true)
    const id = name.trim().toLowerCase().replace(/\s+/g,'-')+'-'+Date.now()
    const {error} = await supabase.from('users').insert([{id, name:name.trim(), pin, goal}])
    if (error) { setAuthMsg('Error creating account. Try again.'); setAuthLoading(false); return }
    setPendingUser({id, name:name.trim(), goal})
    setScreen('calibrate')
    setAuthLoading(false)
  }

  async function handleLogin(userId) {
    const {pin} = authForm
    if (!pin) { setAuthMsg('Enter your PIN.'); return }
    setAuthLoading(true)
    const {data,error} = await supabase.from('users').select('*').eq('id',userId).eq('pin',pin).single()
    if (error||!data) { setAuthMsg('Wrong PIN. Try again.'); setAuthLoading(false); return }
    setCurrentUser({id:data.id, name:data.name, goal:data.goal||'general'})
    setAuthMsg(''); setAuthLoading(false)
  }

  function handleLogout() {
    setCurrentUser(null)
    setAuthForm({name:'',pin:'',confirmPin:'',goal:'david_laid'})
    setAuthMsg(''); setSelectedUser(null)
  }

  if (screen==='app' && currentUser) return <MainApp currentUser={currentUser} onLogout={handleLogout} allUsers={users} onRecalibrate={()=>{ setPendingUser(currentUser); setScreen('calibrate') }} />
  if (screen==='calibrate' && pendingUser) return <CalibrationScreen user={pendingUser} onDone={(user)=>{ setCurrentUser(user); setPendingUser(null) }} onSkip={(user)=>{ setCurrentUser(user); setPendingUser(null) }} />

  return (
    <div style={{minHeight:'100vh',background:'#080C10',color:'#E2E8F0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,fontFamily:'Barlow Condensed, sans-serif'}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}input,select{outline:none;font-family:'Barlow Condensed',sans-serif;}input:focus,select:focus{border-color:#EF4444!important;}.btn{transition:all 0.2s;cursor:pointer;}.btn:hover:not(:disabled){filter:brightness(1.1);}.btn:disabled{opacity:.6;cursor:not-allowed;}.ubtn{transition:all 0.2s;cursor:pointer;}.ubtn:hover{border-color:#EF444466!important;transform:translateY(-1px);}.goal-btn{transition:all 0.2s;cursor:pointer;}.goal-btn:hover{border-color:#EF444466!important;}`}</style>

      <div style={{width:'100%',maxWidth:400}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontSize:11,letterSpacing:4,color:'#EF4444',fontWeight:700}}>PHYSIQUE TRACKER</div>
          <div style={{fontSize:44,fontWeight:900,letterSpacing:2,lineHeight:1}}>FORGE</div>
          <div style={{fontSize:12,color:'#475569',marginTop:4}}>Track. Rank. Dominate.</div>
        </div>

        {screen==='login' && (
          <div>
            {!selectedUser ? (
              <>
                <div style={{fontSize:11,color:'#64748B',letterSpacing:3,textTransform:'uppercase',marginBottom:12}}>Select Profile</div>
                {users.length===0
                  ? <div style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:12,padding:20,textAlign:'center',color:'#475569',marginBottom:16}}>No accounts yet. Create the first one below.</div>
                  : <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
                      {users.map(u => {
                        const goal = GOALS.find(g=>g.id===(u.goal||'general'))
                        return (
                          <button key={u.id} className="ubtn" onClick={()=>{setSelectedUser(u);setAuthForm(f=>({...f,pin:''}));setAuthMsg('')}} style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',gap:12,textAlign:'left',width:'100%'}}>
                            <div style={{width:42,height:42,borderRadius:21,background:avatarColor(u.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:900,color:'#fff',flexShrink:0}}>{u.name[0].toUpperCase()}</div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:16,fontWeight:700,color:'#E2E8F0'}}>{u.name}</div>
                              <div style={{fontSize:11,color:'#475569'}}>{goal?.icon} {goal?.label}</div>
                            </div>
                            <div style={{color:'#475569',fontSize:20}}>›</div>
                          </button>
                        )
                      })}
                    </div>
                }
              </>
            ) : (
              <div style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:12,padding:20,marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
                  <div style={{width:44,height:44,borderRadius:22,background:avatarColor(selectedUser.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:900,color:'#fff'}}>{selectedUser.name[0].toUpperCase()}</div>
                  <div>
                    <div style={{fontSize:18,fontWeight:800}}>{selectedUser.name}</div>
                    <button onClick={()=>{setSelectedUser(null);setAuthMsg('')}} style={{background:'none',border:'none',color:'#475569',fontSize:11,cursor:'pointer',padding:0,fontFamily:'inherit'}}>← Back</button>
                  </div>
                </div>
                <label style={S.label}>Your PIN</label>
                <input type="password" inputMode="numeric" maxLength={8} placeholder="••••"
                  value={authForm.pin} onChange={e=>setAuthForm(f=>({...f,pin:e.target.value}))}
                  onKeyDown={e=>e.key==='Enter'&&handleLogin(selectedUser.id)}
                  style={{...S.input,fontSize:24,letterSpacing:8,textAlign:'center',marginBottom:14}} />
                {authMsg && <div style={{color:'#EF4444',fontSize:12,marginBottom:10,textAlign:'center'}}>{authMsg}</div>}
                <button className="btn" onClick={()=>handleLogin(selectedUser.id)} disabled={authLoading} style={{width:'100%',background:'linear-gradient(135deg,#EF4444,#DC2626)',border:'none',borderRadius:8,color:'#fff',padding:14,fontSize:15,fontWeight:800,letterSpacing:2,fontFamily:'inherit'}}>{authLoading?'...':'SIGN IN'}</button>
              </div>
            )}
            <button className="btn" onClick={()=>{setScreen('register');setAuthMsg('');setSelectedUser(null)}} style={{width:'100%',background:'transparent',border:'1px solid #1A2332',borderRadius:8,color:'#64748B',padding:12,fontSize:13,fontWeight:700,letterSpacing:2,fontFamily:'inherit'}}>CREATE NEW ACCOUNT</button>
          </div>
        )}

        {screen==='register' && (
          <div style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:12,padding:20}}>
            <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>Create Account</div>
            <div style={{fontSize:12,color:'#64748B',marginBottom:20,fontFamily:'Barlow,sans-serif'}}>Set up your personal profile and goal.</div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={S.label}>Your Name</label>
                <input placeholder="e.g. Moaad" value={authForm.name} onChange={e=>setAuthForm(f=>({...f,name:e.target.value}))} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Your Goal</label>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {GOALS.map(g=>(
                    <button key={g.id} className="goal-btn" onClick={()=>setAuthForm(f=>({...f,goal:g.id}))} style={{
                      background: authForm.goal===g.id ? '#EF444415' : '#080C10',
                      border:`1px solid ${authForm.goal===g.id?'#EF4444':'#1A2332'}`,
                      borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', gap:10, textAlign:'left', width:'100%',
                    }}>
                      <span style={{fontSize:18}}>{g.icon}</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:authForm.goal===g.id?'#EF4444':'#E2E8F0'}}>{g.label}</div>
                        <div style={{fontSize:11,color:'#475569',fontFamily:'Barlow,sans-serif'}}>{g.desc}</div>
                      </div>
                      {authForm.goal===g.id && <span style={{marginLeft:'auto',color:'#EF4444',fontSize:16}}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={S.label}>PIN (4-8 digits)</label>
                <input type="password" inputMode="numeric" maxLength={8} placeholder="••••" value={authForm.pin} onChange={e=>setAuthForm(f=>({...f,pin:e.target.value}))} style={{...S.input,fontSize:22,letterSpacing:6,textAlign:'center'}} />
              </div>
              <div>
                <label style={S.label}>Confirm PIN</label>
                <input type="password" inputMode="numeric" maxLength={8} placeholder="••••" value={authForm.confirmPin} onChange={e=>setAuthForm(f=>({...f,confirmPin:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&handleRegister()} style={{...S.input,fontSize:22,letterSpacing:6,textAlign:'center'}} />
              </div>
              {authMsg && <div style={{color:'#EF4444',fontSize:12,textAlign:'center'}}>{authMsg}</div>}
              <button className="btn" onClick={handleRegister} disabled={authLoading} style={{background:'linear-gradient(135deg,#EF4444,#DC2626)',border:'none',borderRadius:8,color:'#fff',padding:14,fontSize:15,fontWeight:800,letterSpacing:2,fontFamily:'inherit'}}>{authLoading?'...':'CREATE ACCOUNT'}</button>
              <button className="btn" onClick={()=>{setScreen('login');setAuthMsg('')}} style={{background:'transparent',border:'none',color:'#475569',fontSize:12,fontWeight:700,letterSpacing:1,fontFamily:'inherit',padding:4}}>← Back to login</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


// ─── Calibration Screen ───────────────────────────────────────────────────────

function CalibrationScreen({ user, onDone, onSkip }) {
  const [lifts, setLifts]       = useState({})
  const [saving, setSaving]     = useState(false)
  const [step, setStep]         = useState(0) // 0 = intro, 1 = inputs, 2 = done
  const unit = 'kg' // use kg internally, shown as kg for now

  // Representative exercise per muscle for calibration
  const CALIB_EXERCISES = [
    { muscle:'chest',     name:'Bench Press',     placeholder:'e.g. 80' },
    { muscle:'back',      name:'Deadlift',         placeholder:'e.g. 100' },
    { muscle:'legs',      name:'Squat',            placeholder:'e.g. 90' },
    { muscle:'shoulders', name:'Overhead Press',   placeholder:'e.g. 60' },
    { muscle:'arms',      name:'Barbell Curl',     placeholder:'e.g. 40' },
    { muscle:'core',      name:'Hanging Leg Raise',placeholder:'reps only' },
  ]

  async function handleSave() {
    setSaving(true)
    const entries = Object.entries(lifts).filter(([,v])=>v && parseFloat(v) > 0)
    if (entries.length > 0) {
      const rows = entries.map(([muscle, weight]) => {
        const ex = CALIB_EXERCISES.find(e=>e.muscle===muscle)
        // Store as a calibration entry with reps=1 (so 1RM = weight entered)
        return {
          user_id: user.id,
          muscle,
          exercise: ex?.name || muscle,
          weight: parseFloat(weight),
          reps: 1,
          sets: 1,
        }
      })
      await supabase.from('workouts').insert(rows)
    }
    setSaving(false)
    onDone(user)
  }

  const S2 = {
    input: { width:'100%', background:'#080C10', border:'1px solid #1A2332', borderRadius:8, color:'#E2E8F0', padding:'12px 14px', fontSize:18, fontWeight:700, fontFamily:'Barlow Condensed, sans-serif', textAlign:'center' },
  }

  if (step === 0) return (
    <div style={{minHeight:'100vh',background:'#080C10',color:'#E2E8F0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,fontFamily:'Barlow Condensed, sans-serif'}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}.btn{transition:all 0.2s;cursor:pointer;}.btn:hover:not(:disabled){filter:brightness(1.1);}`}</style>
      <div style={{width:'100%',maxWidth:400,textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:16}}>🏋️</div>
        <div style={{fontSize:11,letterSpacing:4,color:'#EF4444',fontWeight:700,marginBottom:8}}>WELCOME TO FORGE</div>
        <div style={{fontSize:28,fontWeight:900,marginBottom:16}}>Hey {user.name}!</div>
        <div style={{fontSize:14,color:'#94A3B8',fontFamily:'Barlow,sans-serif',lineHeight:1.7,marginBottom:28}}>
          Have you been training before? We can set your starting rank based on where you actually are — not start everyone at Beginner.
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <button className="btn" onClick={()=>setStep(1)} style={{background:'linear-gradient(135deg,#EF4444,#DC2626)',border:'none',borderRadius:10,color:'#fff',padding:16,fontSize:15,fontWeight:800,letterSpacing:2,fontFamily:'inherit'}}>
            YES, SET MY STARTING RANK
          </button>
          <button className="btn" onClick={()=>onSkip(user)} style={{background:'transparent',border:'1px solid #1A2332',borderRadius:10,color:'#64748B',padding:14,fontSize:13,fontWeight:700,letterSpacing:2,fontFamily:'inherit'}}>
            I'M NEW — START FROM SCRATCH
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#080C10',color:'#E2E8F0',fontFamily:'Barlow Condensed, sans-serif',paddingBottom:40}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}input{outline:none;font-family:'Barlow Condensed',sans-serif;}input:focus{border-color:#EF4444!important;}.btn{transition:all 0.2s;cursor:pointer;}.btn:hover:not(:disabled){filter:brightness(1.1);}.btn:disabled{opacity:.6;cursor:not-allowed;}`}</style>

      {/* Header */}
      <div style={{background:'linear-gradient(180deg,#0F1520 0%,#080C10 100%)',borderBottom:'1px solid #1A2332',padding:'20px 20px 16px'}}>
        <div style={{fontSize:11,letterSpacing:4,color:'#EF4444',fontWeight:700,marginBottom:4}}>CALIBRATION</div>
        <div style={{fontSize:24,fontWeight:900,lineHeight:1.1}}>Set Your Starting Rank</div>
        <div style={{fontSize:13,color:'#64748B',marginTop:4,fontFamily:'Barlow,sans-serif'}}>Enter your current best working weight for each lift. Skip any you don't know.</div>
      </div>

      <div style={{padding:'20px 16px'}}>
        {/* Info card */}
        <div style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:12,padding:14,marginBottom:20}}>
          <div style={{fontSize:11,color:'#EF4444',letterSpacing:2,textTransform:'uppercase',marginBottom:6}}>How this works</div>
          <div style={{fontSize:13,color:'#94A3B8',fontFamily:'Barlow,sans-serif',lineHeight:1.6}}>
            Enter the weight you can currently lift for a solid working set (the weight you normally train with, not your absolute max). We'll use this to calculate your 1RM and assign your rank. Leave blank to start from scratch on that muscle.
          </div>
        </div>

        {/* Lift inputs */}
        <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:20}}>
          {CALIB_EXERCISES.map(ex => {
            const mg = MUSCLE_GROUPS.find(m=>m.id===ex.muscle)
            const val = lifts[ex.muscle] || ''
            // Live rank preview
            const est1RM = val ? calc1RM(parseFloat(val), 5) : 0 // assume 5 reps for working weight
            const previewScore = est1RM > 0 ? Math.min((est1RM/200)*100*0.6 + Math.min((parseFloat(val)*5*3/10000)*100,100)*0.4, 100) : 0
            const previewRank = getRank(previewScore)
            return (
              <div key={ex.muscle} style={{background:'#0F1520',border:`1px solid ${val ? previewRank.color+'44' : '#1A2332'}`,borderRadius:12,padding:14,transition:'border-color 0.3s'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700}}>{mg?.icon} {mg?.name}</div>
                    <div style={{fontSize:11,color:'#64748B'}}>{ex.name}</div>
                  </div>
                  {val ? (
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:13,fontWeight:800,color:previewRank.color}}>{previewRank.icon} {previewRank.name}</div>
                      <div style={{fontSize:10,color:'#64748B'}}>starting rank</div>
                    </div>
                  ) : (
                    <div style={{fontSize:11,color:'#475569'}}>◈ Beginner</div>
                  )}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8,alignItems:'center'}}>
                  <input
                    type="number" min="0" inputMode="decimal"
                    placeholder={ex.placeholder}
                    value={val}
                    onChange={e=>setLifts(l=>({...l,[ex.muscle]:e.target.value}))}
                    style={{...S2.input}}
                  />
                  <div style={{fontSize:12,color:'#475569',fontWeight:700,whiteSpace:'nowrap'}}>kg</div>
                </div>
                {val && (
                  <div style={{marginTop:8,fontSize:11,color:'#64748B'}}>
                    Est. 1RM: <span style={{color:previewRank.color,fontWeight:700}}>{Math.round(est1RM)}kg</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <button className="btn" onClick={handleSave} disabled={saving} style={{background:'linear-gradient(135deg,#EF4444,#DC2626)',border:'none',borderRadius:10,color:'#fff',padding:16,fontSize:15,fontWeight:800,letterSpacing:2,fontFamily:'inherit'}}>
            {saving ? '...' : 'SAVE & START'}
          </button>
          <button className="btn" onClick={()=>onSkip(user)} style={{background:'transparent',border:'none',color:'#475569',padding:10,fontSize:12,fontWeight:700,letterSpacing:1,fontFamily:'inherit'}}>
            Skip — I'll log naturally
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function MainApp({currentUser, onLogout, allUsers, onRecalibrate}) {
  const [tab,setTab]               = useState('dashboard')
  const [workouts,setWorkouts]     = useState([])
  const [allWorkouts,setAllWorkouts] = useState([]) // for leaderboard
  const [loading,setLoading]       = useState(true)
  const [lbLoading,setLbLoading]   = useState(true)
  const [logForm,setLogForm]       = useState({muscle:'chest',exercise:'',weight:'',reps:'',sets:''})
  const [logMsg,setLogMsg]         = useState('')
  const [logLoading,setLogLoading] = useState(false)
  const [histFilter,setHistFilter] = useState('all')
  const [settings,setSettings]     = useState(loadSettings)
  const [planDay,setPlanDay]       = useState(0)
  const [expandedEx,setExpandedEx] = useState(null)
  const [deletePin,setDeletePin]   = useState('')
  const [deleteMsg,setDeleteMsg]   = useState('')
  const [deleteLoading,setDeleteLoading] = useState(false)
  const [showDeleteConfirm,setShowDeleteConfirm] = useState(false)

  useEffect(()=>{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings))},[settings])

  const fetchWorkouts = useCallback(async()=>{
    setLoading(true)
    const {data,error} = await supabase.from('workouts').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false})
    if (!error&&data) setWorkouts(data)
    setLoading(false)
  },[currentUser.id])

  const fetchAllWorkouts = useCallback(async()=>{
    setLbLoading(true)
    const {data,error} = await supabase.from('workouts').select('user_id,muscle,weight,reps,sets')
    if (!error&&data) setAllWorkouts(data)
    setLbLoading(false)
  },[])

  useEffect(()=>{fetchWorkouts()},[fetchWorkouts])
  useEffect(()=>{if(tab==='leaderboard') fetchAllWorkouts()},[tab,fetchAllWorkouts])

  async function handleLog() {
    const {muscle,exercise,weight,reps,sets} = logForm
    if (!exercise||!weight||!reps||!sets) { setLogMsg('⚠ Fill in all fields.'); return }
    setLogLoading(true)
    const weightKg = settings.unit==='lbs' ? parseFloat(weight)/2.205 : parseFloat(weight)
    const {error} = await supabase.from('workouts').insert([{
      user_id:currentUser.id, muscle, exercise,
      weight:Math.round(weightKg*10)/10,
      reps:parseInt(reps), sets:parseInt(sets),
    }])
    if (error) { console.error(error); setLogMsg(`✗ Error: ${error.message}`) }
    else {
      setLogMsg(`✓ Logged ${exercise} — ${weight}${settings.unit} × ${reps} reps × ${sets} sets`)
      setLogForm(f=>({...f,exercise:'',weight:'',reps:'',sets:''}))
      fetchWorkouts()
    }
    setLogLoading(false)
    setTimeout(()=>setLogMsg(''),4000)
  }


  async function handleDeleteAccount() {
    if (!deletePin) { setDeleteMsg('Enter your PIN to confirm.'); return }
    setDeleteLoading(true)
    // Verify PIN first
    const {data, error} = await supabase.from('users').select('id').eq('id', currentUser.id).eq('pin', deletePin).single()
    if (error || !data) { setDeleteMsg('Wrong PIN. Try again.'); setDeleteLoading(false); return }
    // Delete all workouts for this user
    await supabase.from('workouts').delete().eq('user_id', currentUser.id)
    // Delete user account
    await supabase.from('users').delete().eq('id', currentUser.id)
    setDeleteLoading(false)
    onLogout()
  }

  const unit = settings.unit
  const plan = PLANS[currentUser.goal||'general']
  const numTrainingDays = settings.trainingDays.length || 4
  const activePlanDays  = getActiveDays(plan.days, numTrainingDays)
  const splitLabel = {1:'1-day Full Body',2:'2-day Upper/Lower',3:'3-day Push/Pull/Legs',4:'4-day split',5:'5-day split',6:'6-day split',7:'7-day split'}[numTrainingDays] || `${numTrainingDays}-day split`
  // Keep planDay in bounds when number of training days changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{ if(planDay >= activePlanDays.length) setPlanDay(0) },[numTrainingDays])

  const byMuscle = MUSCLE_GROUPS.reduce((acc,mg)=>({...acc,[mg.id]:workouts.filter(w=>w.muscle===mg.id)}),{})
  const scores   = MUSCLE_GROUPS.reduce((acc,mg)=>({...acc,[mg.id]:calcScore(byMuscle[mg.id])}),{})
  const totalScore  = MUSCLE_GROUPS.reduce((s,mg)=>s+scores[mg.id],0)/MUSCLE_GROUPS.length
  const overallRank = getRank(totalScore)
  const filtered    = histFilter==='all' ? workouts : workouts.filter(w=>w.muscle===histFilter)

  const sortedTrainingDays = [...settings.trainingDays].sort((a,b)=>{
    const o={Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6}; return o[a]-o[b]
  })

  // Leaderboard computation
  const leaderboard = allUsers.map(u => {
    const uw = allWorkouts.filter(w=>w.user_id===u.id)
    const muscleScores = MUSCLE_GROUPS.reduce((acc,mg)=>{
      acc[mg.id] = calcScore(uw.filter(w=>w.muscle===mg.id))
      return acc
    },{})
    const overall = MUSCLE_GROUPS.reduce((s,mg)=>s+muscleScores[mg.id],0)/MUSCLE_GROUPS.length
    const topMuscle = MUSCLE_GROUPS.reduce((best,mg)=>muscleScores[mg.id]>muscleScores[best.id]?mg:best, MUSCLE_GROUPS[0])
    const goal = GOALS.find(g=>g.id===(u.goal||'general'))
    return { ...u, overall, muscleScores, topMuscle, rank:getRank(overall), goal }
  }).sort((a,b)=>b.overall-a.overall)

  return (
    <div style={{minHeight:'100vh',background:'#080C10',color:'#E2E8F0',paddingBottom:80,fontFamily:'Barlow Condensed, sans-serif'}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        input,select{outline:none;font-family:'Barlow Condensed',sans-serif;}
        input:focus,select:focus{border-color:#EF4444!important;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0F1520}::-webkit-scrollbar-thumb{background:#2D3748;border-radius:2px}
        .tb{transition:all 0.2s;}.tb:hover{opacity:.8;}
        .rc{transition:transform 0.2s,box-shadow 0.2s;}.rc:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(0,0,0,.5);}
        .lb2{transition:all 0.2s;}.lb2:hover:not(:disabled){filter:brightness(1.15);transform:scale(1.02);}.lb2:disabled{opacity:.6;cursor:not-allowed;}
        .db{transition:all 0.2s;}.db:hover{filter:brightness(1.1);}
        .ec{transition:border-color 0.2s;cursor:pointer;}.ec:hover{border-color:#EF444455!important;}
        .tog{transition:all 0.2s;cursor:pointer;}
        @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.si{animation:slideIn 0.3s ease forwards}
        @keyframes spin{to{transform:rotate(360deg)}}.sp{animation:spin 1s linear infinite;display:inline-block;}
      `}</style>

      {/* HEADER */}
      <div style={{background:'linear-gradient(180deg,#0F1520 0%,#080C10 100%)',borderBottom:'1px solid #1A2332',padding:'14px 16px 0'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <div>
            <div style={{fontSize:10,letterSpacing:4,color:'#EF4444',fontWeight:700,textTransform:'uppercase'}}>PHYSIQUE TRACKER</div>
            <div style={{fontSize:26,fontWeight:900,letterSpacing:1,lineHeight:1.1}}>FORGE</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
            <div style={{display:'flex',background:'#0F1520',border:'1px solid #1A2332',borderRadius:20,overflow:'hidden'}}>
              {['kg','lbs'].map(u=>(
                <button key={u} className="tog" onClick={()=>setSettings(s=>({...s,unit:u}))} style={{padding:'4px 12px',border:'none',fontSize:10,fontWeight:700,fontFamily:'inherit',letterSpacing:1,cursor:'pointer',background:unit===u?'#EF4444':'transparent',color:unit===u?'#fff':'#475569'}}>{u.toUpperCase()}</button>
              ))}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:22,height:22,borderRadius:11,background:avatarColor(currentUser.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,color:'#fff'}}>{currentUser.name[0].toUpperCase()}</div>
              <span style={{fontSize:12,fontWeight:700,color:'#94A3B8'}}>{currentUser.name}</span>
              <button onClick={onLogout} style={{background:'none',border:'none',color:'#475569',fontSize:10,cursor:'pointer',fontFamily:'inherit',letterSpacing:1}}>OUT</button>
            </div>
          </div>
        </div>
        {!loading&&(
          <div style={{marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <span style={{fontSize:10,color:'#64748B',letterSpacing:2}}>OVERALL</span>
              <span style={{fontSize:14,fontWeight:800,color:overallRank.color}}>{overallRank.icon} {overallRank.name} · {Math.round(totalScore)}</span>
            </div>
            <div style={{background:'#1A2332',borderRadius:3,height:3,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${totalScore}%`,background:overallRank.color,borderRadius:3,transition:'width 1s ease'}} />
            </div>
          </div>
        )}
        <div style={{display:'flex',overflowX:'auto'}}>
          {[['dashboard','RANKS'],['plan','PLAN'],['log','LOG'],['history','HIST'],['stats','STATS'],['leaderboard','🏆'],['settings','⚙️']].map(([id,label])=>(
            <button key={id} className="tb" onClick={()=>setTab(id)} style={{
              flex:'0 0 auto',padding:'10px 12px',border:'none',cursor:'pointer',
              fontSize:10,fontWeight:700,letterSpacing:1.5,fontFamily:'inherit',
              background:'transparent',
              color:tab===id?'#EF4444':'#475569',
              borderBottom:tab===id?'2px solid #EF4444':'2px solid transparent',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{padding:'20px 16px'}}>

        {/* DASHBOARD */}
        {tab==='dashboard'&&(
          <div className="si">
            {loading?<div style={{textAlign:'center',padding:60,color:'#475569'}}><div className="sp" style={{fontSize:28,marginBottom:10}}>◈</div><div>Loading...</div></div>:(
              <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
                  {MUSCLE_GROUPS.map(mg=>{
                    const score=scores[mg.id],rank=getRank(score),next=getNextRank(score)
                    const pct=next?((score-rank.min)/(next.min-rank.min))*100:100
                    return (
                      <div key={mg.id} className="rc" style={{background:rank.bg,border:`1px solid ${rank.color}33`,borderRadius:12,padding:14,position:'relative',overflow:'hidden'}}>
                        <div style={{position:'absolute',top:-10,right:-10,fontSize:50,opacity:0.06}}>{mg.icon}</div>
                        <div style={{fontSize:10,color:'#64748B',letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>{mg.name}</div>
                        <div style={{fontSize:20,fontWeight:800,color:rank.color,marginBottom:2}}>{rank.icon} {rank.name}</div>
                        <div style={{fontSize:11,color:'#94A3B8',marginBottom:8}}>Score: {Math.round(score)}</div>
                        <div style={{background:'#00000033',borderRadius:3,height:4,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${pct}%`,background:rank.color,borderRadius:3,transition:'width 1s ease'}} />
                        </div>
                        {next?<div style={{fontSize:9,color:'#64748B',marginTop:4}}>→ {next.name}</div>
                             :<div style={{fontSize:9,color:rank.color,marginTop:4}}>MAX RANK</div>}
                      </div>
                    )
                  })}
                </div>
                <div style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:12,padding:16}}>
                  <div style={{fontSize:11,color:'#64748B',letterSpacing:3,textTransform:'uppercase',marginBottom:12}}>Rank Tiers</div>
                  {RANKS.map(r=>(
                    <div key={r.name} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'1px solid #1A233215'}}>
                      <span style={{color:r.color,fontSize:14}}>{r.icon}</span>
                      <span style={{color:r.color,fontWeight:700,fontSize:13,flex:1}}>{r.name}</span>
                      <span style={{color:'#475569',fontSize:11}}>≥ {r.min}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* PLAN */}
        {tab==='plan'&&(
          <div className="si">
            <div style={{fontSize:22,fontWeight:900,letterSpacing:1,marginBottom:2}}>{plan.title}</div>
            <div style={{fontSize:13,color:'#64748B',marginBottom:16,fontFamily:'Barlow,sans-serif'}}>
              {settings.ownSplit ? 'Your own split · rank targets below' : `${splitLabel} · ${settings.trainingDays.length} days selected`}
            </div>

            {/* Own split toggle */}
            <div style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:12,padding:14,marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700}}>I have my own split</div>
                  <div style={{fontSize:11,color:'#475569',fontFamily:'Barlow,sans-serif',marginTop:2}}>Just show me rank targets, not a program</div>
                </div>
                <button className="tog" onClick={()=>setSettings(s=>({...s,ownSplit:!s.ownSplit}))} style={{
                  width:48,height:26,borderRadius:13,border:'none',cursor:'pointer',position:'relative',
                  background:settings.ownSplit?'#EF4444':'#1A2332',transition:'background 0.2s',flexShrink:0,
                }}>
                  <div style={{position:'absolute',top:3,left:settings.ownSplit?24:4,width:20,height:20,borderRadius:10,background:'#fff',transition:'left 0.2s'}} />
                </button>
              </div>
            </div>

            {settings.ownSplit ? (
              /* ── OWN SPLIT MODE: just show rank targets per muscle ── */
              <div>
                <div style={{fontSize:10,color:'#64748B',letterSpacing:3,textTransform:'uppercase',marginBottom:10}}>Rank Targets — What to hit next</div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {MUSCLE_GROUPS.map(mg=>{
                    const muscleScore = scores[mg.id]
                    const rank  = getRank(muscleScore)
                    const next  = getNextRank(muscleScore)
                    const sessions = byMuscle[mg.id]||[]
                    const best1RM  = sessions.length>0 ? Math.max(...sessions.map(s=>calc1RM(s.weight,s.reps))) : 0
                    const targetW  = next ? Math.round(convertWeight((next.min/100)*200*0.75, unit)) : null
                    const pct = next ? ((muscleScore-rank.min)/(next.min-rank.min))*100 : 100
                    return (
                      <div key={mg.id} style={{background:rank.bg,border:`1px solid ${rank.color}33`,borderRadius:12,padding:14}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                          <div style={{fontSize:16,fontWeight:800}}>{mg.icon} {mg.name}</div>
                          <div style={{fontSize:14,fontWeight:700,color:rank.color}}>{rank.icon} {rank.name}</div>
                        </div>
                        <div style={{background:'#00000033',borderRadius:3,height:4,overflow:'hidden',marginBottom:10}}>
                          <div style={{height:'100%',width:`${pct}%`,background:rank.color,borderRadius:3,transition:'width 1s ease'}} />
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom: next ? 10 : 0}}>
                          <div style={{background:'#00000033',borderRadius:8,padding:'8px 6px',textAlign:'center'}}>
                            <div style={{fontSize:10,color:'#64748B',letterSpacing:1,marginBottom:2}}>YOUR BEST 1RM</div>
                            <div style={{fontSize:18,fontWeight:800,color:rank.color}}>{best1RM>0?`${Math.round(convertWeight(best1RM,unit))}${unit}`:'—'}</div>
                          </div>
                          <div style={{background:'#00000033',borderRadius:8,padding:'8px 6px',textAlign:'center'}}>
                            <div style={{fontSize:10,color:'#64748B',letterSpacing:1,marginBottom:2}}>TARGET TO RANK UP</div>
                            <div style={{fontSize:18,fontWeight:800,color:next?'#EF4444':'#F59E0B'}}>{next&&targetW?`${targetW}${unit}`:'🏆 MAX'}</div>
                          </div>
                        </div>
                        {next&&targetW&&(
                          <div style={{background:'#00000033',borderRadius:8,padding:'8px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div style={{fontSize:11,color:'#64748B'}}>Next: {next.icon} {next.name}</div>
                            <button onClick={()=>{setLogForm(f=>({...f,muscle:mg.id,exercise:''}));setTab('log')}} style={{background:'#EF4444',border:'none',borderRadius:6,color:'#fff',padding:'4px 10px',fontSize:10,fontWeight:800,letterSpacing:1,cursor:'pointer',fontFamily:'inherit'}}>LOG →</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* ── GUIDED PLAN MODE ── */
              <div>
                <div style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:12,padding:14,marginBottom:16}}>
                  <div style={{fontSize:10,color:'#64748B',letterSpacing:3,textTransform:'uppercase',marginBottom:10}}>Your Training Days</div>
                  <div style={{display:'flex',gap:5}}>
                    {DAYS_OF_WEEK.map(day=>{
                      const active=settings.trainingDays.includes(day)
                      return <button key={day} className="db" onClick={()=>setSettings(s=>{const days=s.trainingDays.includes(day)?s.trainingDays.filter(d=>d!==day):[...s.trainingDays,day];return{...s,trainingDays:days}})} style={{flex:1,padding:'8px 2px',border:`1px solid ${active?'#EF4444':'#1A2332'}`,borderRadius:8,background:active?'#EF444422':'transparent',color:active?'#EF4444':'#475569',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{day}</button>
                    })}
                  </div>
                  <div style={{fontSize:11,color:'#475569',marginTop:8}}>{settings.trainingDays.length} days · tap to toggle</div>
                </div>

                <div style={{display:'flex',gap:8,marginBottom:16,overflowX:'auto',paddingBottom:4}}>
                  {activePlanDays.map((d,i)=>(
                    <button key={i} className="db" onClick={()=>{setPlanDay(i);setExpandedEx(null)}} style={{padding:'8px 14px',border:`1px solid ${planDay===i?'#EF4444':'#1A2332'}`,borderRadius:20,background:planDay===i?'#EF4444':'#0F1520',color:planDay===i?'#fff':'#64748B',fontSize:11,fontWeight:700,letterSpacing:1,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>{d.day}: {d.label}</button>
                  ))}
                </div>

                {(()=>{
                  const d=activePlanDays[planDay]||activePlanDays[0], assignedDay=sortedTrainingDays[planDay]
                  return (
                    <div>
                      <div style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:12,padding:16,marginBottom:12}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                          <div>
                            <div style={{fontSize:24,fontWeight:900}}>{d.label}</div>
                            <div style={{fontSize:12,color:'#64748B'}}>{d.focus}</div>
                          </div>
                          {assignedDay&&<div style={{background:'#EF444422',border:'1px solid #EF444444',borderRadius:8,padding:'4px 12px',fontSize:12,color:'#EF4444',fontWeight:700}}>{assignedDay}</div>}
                        </div>
                        <div style={{background:'#080C10',borderRadius:8,padding:12,borderLeft:'3px solid #EF4444'}}>
                          <div style={{fontSize:10,color:'#EF4444',letterSpacing:2,textTransform:'uppercase',marginBottom:4}}>Tip</div>
                          <div style={{fontSize:12,color:'#94A3B8',fontFamily:'Barlow,sans-serif',lineHeight:1.6}}>{d.tip}</div>
                        </div>
                      </div>

                      <div style={{fontSize:10,color:'#64748B',letterSpacing:3,textTransform:'uppercase',marginBottom:10}}>Exercises — tap to expand</div>
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        {d.exercises.map((ex,i)=>{
                          const mg=MUSCLE_GROUPS.find(m=>m.id===ex.muscle)
                          const muscleScore=scores[ex.muscle],rank=getRank(muscleScore),next=getNextRank(muscleScore)
                          const sessions=byMuscle[ex.muscle]||[]
                          const best1RM=sessions.length>0?Math.max(...sessions.map(s=>calc1RM(s.weight,s.reps))):0
                          const targetW=next?Math.round(convertWeight((next.min/100)*200*0.75,unit)):null
                          const isExp=expandedEx===`${planDay}-${i}`
                          return (
                            <div key={i} className="ec" onClick={()=>setExpandedEx(isExp?null:`${planDay}-${i}`)} style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:10,overflow:'hidden'}}>
                              <div style={{padding:'12px 14px'}}>
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                  <div style={{flex:1}}>
                                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                                      <span style={{fontSize:12,color:'#475569',fontWeight:700}}>{i+1}</span>
                                      <span style={{fontSize:15,fontWeight:700}}>{ex.name}</span>
                                    </div>
                                    <div style={{fontSize:11,color:'#64748B'}}>{mg?.icon} {mg?.name} · {ex.sets}×{ex.reps}</div>
                                  </div>
                                  <div style={{textAlign:'right',marginLeft:8}}>
                                    <div style={{fontSize:11,color:rank.color,fontWeight:700}}>{rank.icon} {rank.name}</div>
                                    <div style={{fontSize:11,color:'#475569',marginTop:2}}>{isExp?'▲':'▼'}</div>
                                  </div>
                                </div>
                              </div>
                              {isExp&&(
                                <div style={{borderTop:'1px solid #1A2332',padding:14,background:'#080C10'}}>
                                  <div style={{fontSize:12,color:'#94A3B8',fontFamily:'Barlow,sans-serif',marginBottom:12,lineHeight:1.6}}>💡 {ex.note}</div>
                                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                                    <div style={{background:'#0F1520',borderRadius:8,padding:10,textAlign:'center'}}>
                                      <div style={{fontSize:10,color:'#64748B',marginBottom:4}}>YOUR BEST 1RM</div>
                                      <div style={{fontSize:20,fontWeight:800,color:rank.color}}>{best1RM>0?`${Math.round(convertWeight(best1RM,unit))}${unit}`:'—'}</div>
                                    </div>
                                    <div style={{background:'#0F1520',borderRadius:8,padding:10,textAlign:'center'}}>
                                      <div style={{fontSize:10,color:'#64748B',marginBottom:4}}>TARGET TO RANK UP</div>
                                      <div style={{fontSize:20,fontWeight:800,color:next?'#EF4444':'#F59E0B'}}>{next&&targetW?`${targetW}${unit}`:'🏆 MAX'}</div>
                                    </div>
                                  </div>
                                  {next&&targetW&&(
                                    <div style={{background:'#0F1520',borderRadius:8,padding:12,borderLeft:`3px solid ${next.color}`,marginBottom:10}}>
                                      <div style={{fontSize:11,color:next.color,fontWeight:700,marginBottom:4}}>To reach {next.icon} {next.name}:</div>
                                      <div style={{fontSize:12,color:'#94A3B8',fontFamily:'Barlow,sans-serif',lineHeight:1.5}}>Work up to ~{targetW}{unit} for a working set. Log every session to track progress.</div>
                                    </div>
                                  )}
                                  <button onClick={e=>{e.stopPropagation();setLogForm({muscle:ex.muscle,exercise:ex.name,weight:'',reps:'',sets:''});setTab('log')}} style={{width:'100%',background:'#EF4444',border:'none',borderRadius:8,color:'#fff',padding:11,fontSize:12,fontWeight:800,letterSpacing:2,cursor:'pointer',fontFamily:'inherit'}}>LOG THIS EXERCISE →</button>
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
        {/* LOG */}
        {tab==='log'&&(
          <div className="si">
            <div style={{fontSize:22,fontWeight:800,letterSpacing:1,marginBottom:4}}>LOG A SET</div>
            <div style={{fontSize:13,color:'#64748B',marginBottom:20,fontFamily:'Barlow,sans-serif'}}>Weight in <span style={{color:'#EF4444',fontWeight:700}}>{unit.toUpperCase()}</span> · toggle top-right</div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={S.label}>Muscle Group</label>
                <select value={logForm.muscle} onChange={e=>setLogForm(f=>({...f,muscle:e.target.value,exercise:''}))} style={S.input}>
                  {MUSCLE_GROUPS.map(mg=><option key={mg.id} value={mg.id}>{mg.icon} {mg.name}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Exercise</label>
                <select value={logForm.exercise} onChange={e=>setLogForm(f=>({...f,exercise:e.target.value}))} style={S.input}>
                  <option value="">Select exercise...</option>
                  {MUSCLE_GROUPS.find(m=>m.id===logForm.muscle)?.exercises.map(ex=><option key={ex} value={ex}>{ex}</option>)}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                {[['weight',`WT (${unit})`],['reps','REPS'],['sets','SETS']].map(([field,label])=>(
                  <div key={field}>
                    <label style={S.label}>{label}</label>
                    <input type="number" min="0" value={logForm[field]} onChange={e=>setLogForm(f=>({...f,[field]:e.target.value}))} placeholder="0"
                      style={{...S.input,fontSize:20,fontWeight:700,textAlign:'center',padding:'12px 6px'}} />
                  </div>
                ))}
              </div>
              {logForm.weight&&logForm.reps&&(
                <div style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:8,padding:12,textAlign:'center'}}>
                  <div style={{fontSize:11,color:'#64748B',letterSpacing:2}}>ESTIMATED 1RM</div>
                  <div style={{fontSize:28,fontWeight:900,color:'#EF4444'}}>{Math.round(calc1RM(parseFloat(logForm.weight),parseInt(logForm.reps)))} {unit}</div>
                </div>
              )}
              <button className="lb2" onClick={handleLog} disabled={logLoading} style={{background:'linear-gradient(135deg,#EF4444,#DC2626)',border:'none',borderRadius:10,color:'#fff',padding:16,fontSize:16,fontWeight:800,letterSpacing:3,cursor:'pointer',textTransform:'uppercase',fontFamily:'inherit'}}>
                {logLoading?<span className="sp">◈</span>:'LOG SET'}
              </button>
              {logMsg&&<div style={{background:logMsg.startsWith('✓')?'#064E3B':'#450A0A',border:`1px solid ${logMsg.startsWith('✓')?'#10B981':'#EF4444'}`,borderRadius:8,padding:12,color:logMsg.startsWith('✓')?'#10B981':'#EF4444',fontSize:13,textAlign:'center'}}>{logMsg}</div>}
            </div>
          </div>
        )}

        {/* HISTORY */}
        {tab==='history'&&(
          <div className="si">
            <div style={{fontSize:22,fontWeight:800,letterSpacing:1,marginBottom:4}}>HISTORY</div>
            <div style={{fontSize:13,color:'#64748B',marginBottom:16,fontFamily:'Barlow,sans-serif'}}>{workouts.length} sessions logged.</div>
            <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4,marginBottom:16}}>
              {[['all','All'],...MUSCLE_GROUPS.map(mg=>[mg.id,mg.name])].map(([id,label])=>(
                <button key={id} onClick={()=>setHistFilter(id)} style={{background:histFilter===id?'#EF4444':'#0F1520',border:'1px solid '+(histFilter===id?'#EF4444':'#1A2332'),borderRadius:20,color:histFilter===id?'#fff':'#64748B',padding:'6px 14px',fontSize:11,fontWeight:700,letterSpacing:1,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'inherit'}}>{label}</button>
              ))}
            </div>
            {loading?<div style={{textAlign:'center',padding:40,color:'#475569'}}>Loading...</div>
            :filtered.length===0?<div style={{textAlign:'center',padding:40,color:'#475569'}}><div style={{fontSize:32,marginBottom:8}}>◈</div><div>No sessions yet.</div></div>
            :<div style={{display:'flex',flexDirection:'column',gap:8}}>
              {filtered.map(s=>{
                const mg=MUSCLE_GROUPS.find(m=>m.id===s.muscle)
                const dW=convertWeight(s.weight,unit)
                const rm=Math.round(convertWeight(calc1RM(s.weight,s.reps),unit))
                const dt=new Date(s.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
                return (
                  <div key={s.id} style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:10,padding:'12px 14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div>
                        <div style={{fontSize:15,fontWeight:700}}>{s.exercise}</div>
                        <div style={{fontSize:11,color:'#64748B',marginTop:2}}>{mg?.icon} {mg?.name} · {dt}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:13,fontWeight:700}}>{dW}{unit} × {s.reps} × {s.sets}</div>
                        <div style={{fontSize:11,color:'#EF4444'}}>1RM ~{rm}{unit}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>}
          </div>
        )}

        {/* STATS */}
        {tab==='stats'&&(
          <div className="si">
            <div style={{fontSize:22,fontWeight:800,letterSpacing:1,marginBottom:4}}>STATS</div>
            <div style={{fontSize:13,color:'#64748B',marginBottom:20,fontFamily:'Barlow,sans-serif'}}>Your strength breakdown.</div>
            {MUSCLE_GROUPS.map(mg=>{
              const sessions=byMuscle[mg.id]||[],score=scores[mg.id],rank=getRank(score),next=getNextRank(score)
              if (sessions.length===0) return <div key={mg.id} style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:10,padding:14,marginBottom:10,opacity:.5}}><div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:700}}>{mg.icon} {mg.name}</span><span style={{fontSize:12,color:'#475569'}}>No data yet</span></div></div>
              const best1RM=Math.max(...sessions.map(s=>calc1RM(s.weight,s.reps)))
              const totalVol=sessions.reduce((s,w)=>s+w.weight*w.reps*w.sets,0)
              const topEx=sessions.reduce((a,s)=>{a[s.exercise]=(a[s.exercise]||0)+1;return a},{})
              const favEx=Object.entries(topEx).sort((a,b)=>b[1]-a[1])[0]?.[0]
              const targetW=next?Math.round(convertWeight((next.min/100)*200,unit)):null
              return (
                <div key={mg.id} style={{background:rank.bg,border:`1px solid ${rank.color}33`,borderRadius:12,padding:14,marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <div style={{fontSize:16,fontWeight:800}}>{mg.icon} {mg.name}</div>
                    <div style={{fontSize:14,fontWeight:700,color:rank.color}}>{rank.icon} {rank.name}</div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:8}}>
                    {[['Best 1RM',`${Math.round(convertWeight(best1RM,unit))}${unit}`],['Total Vol.',`${Math.round(convertWeight(totalVol,unit)/1000)}k`],['Sessions',sessions.length]].map(([label,val])=>(
                      <div key={label} style={{background:'#00000033',borderRadius:8,padding:'8px 6px',textAlign:'center'}}>
                        <div style={{fontSize:10,color:'#64748B',letterSpacing:1}}>{label}</div>
                        <div style={{fontSize:17,fontWeight:800,color:rank.color}}>{val}</div>
                      </div>
                    ))}
                  </div>
                  {next&&targetW&&<div style={{background:'#00000033',borderRadius:8,padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontSize:11,color:'#64748B'}}>Target for {next.icon} {next.name}</div><div style={{fontSize:14,fontWeight:800,color:next.color}}>{targetW}{unit} 1RM</div></div>}
                  {favEx&&<div style={{marginTop:8,fontSize:11,color:'#64748B'}}>Top exercise: <span style={{color:'#94A3B8'}}>{favEx}</span></div>}
                </div>
              )
            })}
            <div style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:12,padding:16,marginTop:8}}>
              <div style={{fontSize:11,letterSpacing:3,color:'#64748B',textTransform:'uppercase',marginBottom:10}}>Totals</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[['Sessions',workouts.length],['Total Sets',workouts.reduce((s,w)=>s+w.sets,0)],['Volume',`${Math.round(convertWeight(workouts.reduce((s,w)=>s+w.weight*w.reps*w.sets,0),unit)/1000)}k ${unit}`],['Score',Math.round(totalScore)]].map(([label,val])=>(
                  <div key={label} style={{background:'#080C10',borderRadius:8,padding:'12px 10px',textAlign:'center'}}>
                    <div style={{fontSize:10,color:'#64748B',letterSpacing:1}}>{label}</div>
                    <div style={{fontSize:22,fontWeight:900}}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        {tab==='leaderboard'&&(
          <div className="si">
            <div style={{fontSize:22,fontWeight:900,letterSpacing:1,marginBottom:2}}>LEADERBOARD</div>
            <div style={{fontSize:13,color:'#64748B',marginBottom:20,fontFamily:'Barlow,sans-serif'}}>Who's dominating the gym.</div>

            {lbLoading?<div style={{textAlign:'center',padding:40,color:'#475569'}}><div className="sp" style={{fontSize:24,marginBottom:8}}>◈</div><div>Loading...</div></div>:(
              <>
                {/* Top 3 podium */}
                {leaderboard.length>=2&&(
                  <div style={{display:'flex',alignItems:'flex-end',gap:8,marginBottom:20,justifyContent:'center'}}>
                    {[leaderboard[1],leaderboard[0],leaderboard[2]].filter(Boolean).map((u,i)=>{
                      const pos=i===0?2:i===1?1:3
                      const heights=[100,130,85]
                      const medalColors=['#C0C0C0','#FFD700','#CD7F32']
                      const medals=['🥈','🥇','🥉']
                      return (
                        <div key={u.id} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                          <div style={{fontSize:20}}>{medals[i]}</div>
                          <div style={{width:48,height:48,borderRadius:24,background:avatarColor(u.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:900,color:'#fff',border:`2px solid ${medalColors[i]}`}}>{u.name[0].toUpperCase()}</div>
                          <div style={{fontSize:12,fontWeight:700,textAlign:'center'}}>{u.name}</div>
                          <div style={{fontSize:11,color:u.rank.color,fontWeight:700}}>{u.rank.icon} {u.rank.name}</div>
                          <div style={{width:'100%',height:heights[i],background:u.id===currentUser.id?'#EF444433':'#0F1520',border:`1px solid ${medalColors[i]}44`,borderRadius:'8px 8px 0 0',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <div style={{fontSize:18,fontWeight:900,color:medalColors[i]}}>{Math.round(u.overall)}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Full rankings */}
                <div style={{fontSize:10,color:'#64748B',letterSpacing:3,textTransform:'uppercase',marginBottom:10}}>Overall Rankings</div>
                <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
                  {leaderboard.map((u,i)=>{
                    const isMe = u.id===currentUser.id
                    return (
                      <div key={u.id} style={{background:isMe?'#EF444415':'#0F1520',border:`1px solid ${isMe?'#EF444444':'#1A2332'}`,borderRadius:12,padding:'12px 14px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          <div style={{fontSize:16,fontWeight:900,color:'#475569',width:24,textAlign:'center'}}>#{i+1}</div>
                          <div style={{width:38,height:38,borderRadius:19,background:avatarColor(u.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:'#fff',flexShrink:0}}>{u.name[0].toUpperCase()}</div>
                          <div style={{flex:1}}>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              <span style={{fontSize:15,fontWeight:700}}>{u.name}</span>
                              {isMe&&<span style={{fontSize:10,background:'#EF4444',color:'#fff',padding:'1px 6px',borderRadius:10,fontWeight:700}}>YOU</span>}
                            </div>
                            <div style={{fontSize:11,color:'#475569'}}>{u.goal?.icon} {u.goal?.label} · {u.rank.icon} {u.rank.name}</div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div style={{fontSize:20,fontWeight:900,color:u.rank.color}}>{Math.round(u.overall)}</div>
                            <div style={{fontSize:10,color:'#475569'}}>score</div>
                          </div>
                        </div>
                        {/* Muscle breakdown */}
                        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:4,marginTop:10}}>
                          {MUSCLE_GROUPS.map(mg=>{
                            const s=u.muscleScores[mg.id],r=getRank(s)
                            return (
                              <div key={mg.id} style={{background:'#080C10',borderRadius:6,padding:'4px 2px',textAlign:'center'}}>
                                <div style={{fontSize:10}}>{mg.icon}</div>
                                <div style={{fontSize:9,color:r.color,fontWeight:700}}>{r.icon}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Muscle group leaderboards */}
                <div style={{fontSize:10,color:'#64748B',letterSpacing:3,textTransform:'uppercase',marginBottom:10}}>By Muscle Group</div>
                {MUSCLE_GROUPS.map(mg=>{
                  const sorted=[...leaderboard].sort((a,b)=>b.muscleScores[mg.id]-a.muscleScores[mg.id])
                  const top=sorted[0]
                  if (!top||top.muscleScores[mg.id]===0) return null
                  return (
                    <div key={mg.id} style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:10,padding:'12px 14px',marginBottom:8}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                        <div style={{fontSize:14,fontWeight:700}}>{mg.icon} {mg.name}</div>
                        <div style={{fontSize:11,color:'#64748B'}}>Top scores</div>
                      </div>
                      {sorted.slice(0,3).filter(u=>u.muscleScores[mg.id]>0).map((u,i)=>{
                        const isMe=u.id===currentUser.id
                        const rank=getRank(u.muscleScores[mg.id])
                        return (
                          <div key={u.id} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0',borderBottom:i<2?'1px solid #1A233215':'none'}}>
                            <span style={{color:'#475569',fontSize:12,width:16}}>#{i+1}</span>
                            <div style={{width:26,height:26,borderRadius:13,background:avatarColor(u.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,color:'#fff',flexShrink:0}}>{u.name[0].toUpperCase()}</div>
                            <span style={{flex:1,fontSize:13,fontWeight:isMe?700:400,color:isMe?'#EF4444':'#E2E8F0'}}>{u.name}{isMe?' (you)':''}</span>
                            <span style={{fontSize:12,color:rank.color,fontWeight:700}}>{rank.icon} {Math.round(u.muscleScores[mg.id])}</span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* SETTINGS */}
        {tab==='settings'&&(
          <div className="si">
            <div style={{fontSize:22,fontWeight:900,letterSpacing:1,marginBottom:2}}>SETTINGS</div>
            <div style={{fontSize:13,color:'#64748B',marginBottom:20,fontFamily:'Barlow,sans-serif'}}>Manage your account.</div>

            {/* Account info */}
            <div style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontSize:10,color:'#64748B',letterSpacing:3,textTransform:'uppercase',marginBottom:12}}>Account</div>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                <div style={{width:48,height:48,borderRadius:24,background:avatarColor(currentUser.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:900,color:'#fff'}}>{currentUser.name[0].toUpperCase()}</div>
                <div>
                  <div style={{fontSize:18,fontWeight:800}}>{currentUser.name}</div>
                  <div style={{fontSize:12,color:'#64748B'}}>{GOALS.find(g=>g.id===(currentUser.goal||'general'))?.icon} {GOALS.find(g=>g.id===(currentUser.goal||'general'))?.label}</div>
                </div>
              </div>
              <div style={{background:'#080C10',borderRadius:8,padding:'10px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:12,color:'#64748B'}}>Total workouts logged</span>
                <span style={{fontSize:16,fontWeight:800,color:'#E2E8F0'}}>{workouts.length}</span>
              </div>
            </div>

            {/* Recalibrate */}
            <div style={{background:'#0F1520',border:'1px solid #1A2332',borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontSize:10,color:'#64748B',letterSpacing:3,textTransform:'uppercase',marginBottom:8}}>Starting Rank</div>
              <div style={{fontSize:13,color:'#94A3B8',fontFamily:'Barlow,sans-serif',marginBottom:14,lineHeight:1.5}}>
                Already been training? Set your starting rank based on your current lifts so the leaderboard reflects where you actually are.
              </div>
              <button onClick={onRecalibrate} style={{width:'100%',background:'transparent',border:'1px solid #3B82F6',borderRadius:8,color:'#3B82F6',padding:12,fontSize:13,fontWeight:700,letterSpacing:2,cursor:'pointer',fontFamily:'inherit'}}>
                ◉ RECALIBRATE MY RANK
              </button>
            </div>

            {/* Delete account */}
            <div style={{background:'#0F1520',border:'1px solid #450A0A',borderRadius:12,padding:16}}>
              <div style={{fontSize:10,color:'#EF4444',letterSpacing:3,textTransform:'uppercase',marginBottom:8}}>Danger Zone</div>
              <div style={{fontSize:13,color:'#94A3B8',fontFamily:'Barlow,sans-serif',marginBottom:16,lineHeight:1.5}}>
                Deleting your account will permanently remove your profile and <strong style={{color:'#E2E8F0'}}>all {workouts.length} workout sessions</strong>. This cannot be undone.
              </div>

              {!showDeleteConfirm ? (
                <button onClick={()=>setShowDeleteConfirm(true)} style={{width:'100%',background:'transparent',border:'1px solid #EF4444',borderRadius:8,color:'#EF4444',padding:12,fontSize:13,fontWeight:700,letterSpacing:2,cursor:'pointer',fontFamily:'inherit'}}>
                  DELETE MY ACCOUNT
                </button>
              ) : (
                <div>
                  <div style={{background:'#450A0A',borderRadius:8,padding:12,marginBottom:12,fontSize:12,color:'#FCA5A5',fontFamily:'Barlow,sans-serif',lineHeight:1.5}}>
                    ⚠️ This will delete your account and all your workout data permanently.
                  </div>
                  <label style={{fontSize:10,letterSpacing:3,color:'#64748B',textTransform:'uppercase',marginBottom:6,display:'block'}}>Confirm with your PIN</label>
                  <input type="password" inputMode="numeric" maxLength={8} placeholder="••••"
                    value={deletePin} onChange={e=>setDeletePin(e.target.value)}
                    style={{width:'100%',background:'#080C10',border:'1px solid #EF444466',borderRadius:8,color:'#E2E8F0',padding:'12px 14px',fontSize:22,letterSpacing:8,textAlign:'center',fontFamily:'Barlow Condensed,sans-serif',marginBottom:10}} />
                  {deleteMsg&&<div style={{color:'#EF4444',fontSize:12,textAlign:'center',marginBottom:10}}>{deleteMsg}</div>}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <button onClick={()=>{setShowDeleteConfirm(false);setDeletePin('');setDeleteMsg('')}} style={{background:'transparent',border:'1px solid #1A2332',borderRadius:8,color:'#64748B',padding:12,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                      CANCEL
                    </button>
                    <button onClick={handleDeleteAccount} disabled={deleteLoading} style={{background:'#EF4444',border:'none',borderRadius:8,color:'#fff',padding:12,fontSize:13,fontWeight:800,letterSpacing:1,cursor:'pointer',fontFamily:'inherit',opacity:deleteLoading?0.6:1}}>
                      {deleteLoading ? '...' : 'CONFIRM'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{position:'fixed',bottom:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,#EF4444,transparent)'}} />
    </div>
  )
}
