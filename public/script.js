/* ══════════════════════════════════════════
   HerHealth v2 — Main Script
══════════════════════════════════════════ */

// ── STATE ──────────────────────────────────
let currentUser  = null;
let currentRegRole = 'patient';
let currentLoginRole = 'patient';
let currentLang  = 'en';
let waterCount   = parseInt(localStorage.getItem('hh_water') || '0');
let moodLog      = JSON.parse(localStorage.getItem('hh_mood')     || '[]');
let patients     = JSON.parse(localStorage.getItem('hh_patients') || '[]');
let appointments = JSON.parse(localStorage.getItem('hh_appts')    || '[]');
let selectedMood = null;
let kickCount    = 0;
let kickSecs     = 0;
let kickInterval = null;

// ── TRANSLATIONS ───────────────────────────
const LANG = {
  en:{nav_dashboard:'Dashboard',nav_period:'Period Tracker',nav_pcos:'PCOS Risk Check',
      nav_diet:'Diet & Workout',nav_pregnancy:'Pregnancy Tracker',nav_kick:'Kick Counter',
      nav_postpartum:'Postpartum Care',nav_mood:'Mood Tracker',
      logout:'Logout',dash_title:'My Dashboard',dash_sub:'Your health overview at a glance'},
  ml:{nav_dashboard:'ഡാഷ്ബോർഡ്',nav_period:'ആർത്തവ ട്രാക്കർ',nav_pcos:'PCOS റിസ്ക് ചെക്ക്',
      nav_diet:'ഭക്ഷണം & വ്യായാമം',nav_pregnancy:'ഗർഭ ട്രാക്കർ',nav_kick:'കിക്ക് കൗണ്ടർ',
      nav_postpartum:'പ്രസവാനന്തര പരിചരണം',nav_mood:'മൂഡ് ട്രാക്കർ',
      logout:'ലോഗൗട്ട്',dash_title:'എന്റെ ഡാഷ്ബോർഡ്',dash_sub:'നിങ്ങളുടെ ആരോഗ്യ ഒറ്റനോട്ടം'},
  hi:{nav_dashboard:'डैशबोर्ड',nav_period:'पीरियड ट्रैकर',nav_pcos:'PCOS जोखिम जांच',
      nav_diet:'आहार और व्यायाम',nav_pregnancy:'गर्भावस्था ट्रैकर',nav_kick:'किक काउंटर',
      nav_postpartum:'प्रसवोत्तर देखभाल',nav_mood:'मूड ट्रैकर',
      logout:'लॉगआउट',dash_title:'मेरा डैशबोर्ड',dash_sub:'एक नज़र में स्वास्थ्य'}
};

/* ════════════════════════════════════
   CURTAIN TRANSITION SYSTEM
════════════════════════════════════ */
function navigate(targetPage) {
  const curtain = document.getElementById('curtain');
  // Open curtain
  curtain.classList.add('open');
  curtain.classList.remove('close');
  setTimeout(() => {
    // Switch page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(targetPage).classList.add('active');
    window.scrollTo(0,0);
    // Close curtain
    setTimeout(() => {
      curtain.classList.remove('open');
      curtain.classList.add('close');
    }, 300);
  }, 650);
}

function showPage(id) {
  navigate(id);
}

/* ════════════════════════════════════
   ROLE SYSTEM
════════════════════════════════════ */
function setLoginRole(role, btn) {
  currentLoginRole = role;
  btn.closest('.role-selector').querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function setRegRole(role, btn) {
  currentRegRole = role;
  btn.closest('.role-selector').querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // ASHA workers: hide height/weight/stage, show ASHA ID
  const isAsha = role === 'asha';
  document.getElementById('reg-name-lbl-text').textContent = isAsha ? 'ASHA Worker Name' : 'Patient Full Name';
  document.getElementById('reg-height-group').style.display = isAsha ? 'none' : 'block';
  document.getElementById('reg-weight-group').style.display = isAsha ? 'none' : 'block';
  document.getElementById('reg-stage-group').style.display  = isAsha ? 'none' : 'block';
  document.getElementById('asha-id-group').style.display    = isAsha ? 'block' : 'none';
}

function togglePwd(inputId, btn) {
  const inp = document.getElementById(inputId);
  const isText = inp.type === 'text';
  inp.type = isText ? 'password' : 'text';
  btn.innerHTML = `<i class="fa-solid fa-eye${isText ? '' : '-slash'}"></i>`;
}

/* ════════════════════════════════════
   AUTH
════════════════════════════════════ */
function doRegister() {
  const name    = document.getElementById('reg-name').value.trim();
  const age     = document.getElementById('reg-age').value.trim();
  const email   = document.getElementById('reg-email').value.trim();
  const phone   = document.getElementById('reg-phone').value.trim();
  const loc     = document.getElementById('reg-location').value.trim();
  const pwd     = document.getElementById('reg-pwd').value;
  const role    = currentRegRole;

  // Patient-only fields
  const height  = role === 'patient' ? document.getElementById('reg-height').value.trim() : '';
  const weight  = role === 'patient' ? document.getElementById('reg-weight').value.trim()  : '';
  const stage   = role === 'patient' ? document.getElementById('reg-stage').value : 'asha';
  const ashaId  = role === 'asha'    ? document.getElementById('reg-asha-id').value.trim() : '';

  if (!name || !age || !email || !pwd) { toast('⚠️ Please fill all required fields.'); return; }
  if (pwd.length < 6) { toast('⚠️ Password must be at least 6 characters.'); return; }

  let bmi = null;
  if (height && weight) {
    bmi = (parseFloat(weight) / Math.pow(parseFloat(height)/100, 2)).toFixed(1);
  }

  const user = { name, age, height, weight, bmi, email, phone, location: loc, stage, role, ashaId,
    registeredAt: new Date().toISOString() };
  localStorage.setItem('hh_user', JSON.stringify(user));

  toast('✅ Account created! Welcome, ' + name.split(' ')[0] + '!');
  setTimeout(() => launchApp(user), 800);
}

async function doLogin() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-pwd").value;

  try {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    // ✅ Check message instead of response.ok
    if (data.message !== "Login successful") {
      alert(data.message);
      return;
    }

    alert("Login successful!");
    console.log("User received:", data.user);
    launchApp(data.user);

  } catch (error) {
    console.error(error);
    alert("Server error");
  }
}

function launchApp(user) {
  currentUser = user;

  // Update sidebar
  const initial = user.name.charAt(0).toUpperCase();
  document.getElementById('sb-avatar').textContent = initial;
  document.getElementById('sb-uname').textContent  = user.name;
  document.getElementById('sb-urole').textContent  =
    user.role === 'asha' ? '🩺 ASHA Worker' : '💗 Patient';

  // Dashboard
  document.getElementById('dash-name').textContent = user.name.split(' ')[0];
  document.getElementById('dash-stage').textContent =
    user.stage === 'menstrual'  ? 'Menstrual / PCOS Care' :
    user.stage === 'pregnant'   ? 'Pregnancy' :
    user.stage === 'postpartum' ? 'Postpartum Recovery' : 'ASHA Worker';
  document.getElementById('dash-date').textContent = new Date().toDateString();

  // Prefill BMI if available
  if (user.bmi) {
    document.getElementById('stat-bmi').textContent = user.bmi + ' kg/m²';
    if (user.height) document.getElementById('bmi-h').value = user.height;
    if (user.weight) document.getElementById('bmi-w').value = user.weight;
  }

  // ASHA Worker extras
  if (user.role === 'asha') {
    document.getElementById('asha-group').style.display   = 'block';
    document.getElementById('asha-sb-link').style.display = 'flex';
  }

  initWater();
  initMoodHistory();
  updateAshaStats();
  renderPatients();
  renderRegUsers();
  renderAppointments();
  navigate('page-app');
  setTimeout(() => showSection('dashboard'), 800);
  applyLang(currentLang);
}

function doLogout() {
  currentUser = null;
  navigate('page-landing');
  toast('👋 Logged out successfully.');
}

/* ════════════════════════════════════
   LANGUAGE
════════════════════════════════════ */
function setLang(lang, btn) {
  currentLang = lang;
  ['en','ml','hi'].forEach(l => {
    document.getElementById('lc-'+l).classList.toggle('active', l===lang);
  });
  applyLang(lang);
}

function applyLang(lang) {
  document.querySelectorAll('[data-key]').forEach(el => {
    const k = el.getAttribute('data-key');
    if (LANG[lang] && LANG[lang][k]) el.textContent = LANG[lang][k];
  });
}

/* ════════════════════════════════════
   NAVIGATION
════════════════════════════════════ */
function showSection(id, el) {
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById('sec-' + id);
  if (sec) sec.classList.add('active');
  document.querySelectorAll('.sb-link').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  if (window.innerWidth < 900) document.getElementById('sidebar').classList.remove('open');
}

function toggleSb() {
  document.getElementById('sidebar').classList.toggle('open');
}

/* ════════════════════════════════════
   CHIP TOGGLE
════════════════════════════════════ */
function toggleChip(el) { el.classList.toggle('selected'); }

/* ════════════════════════════════════
   WATER TRACKER (Add & Remove)
════════════════════════════════════ */
function changeWater(delta) {
  const newVal = waterCount + delta;
  if (newVal < 0) { toast('💧 Already at 0 glasses.'); return; }
  if (newVal > 8) { toast('🎉 Daily water goal already reached!'); return; }
  waterCount = newVal;
  localStorage.setItem('hh_water', waterCount);
  initWater();
  if (delta > 0) toast(`💧 Water added! (${waterCount}/8 glasses)`);
  else toast(`💧 Removed one glass. (${waterCount}/8)`);
}

function initWater() {
  const wrap = document.getElementById('water-track');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const g = document.createElement('div');
    g.className = 'wglass' + (i < waterCount ? ' full' : '');
    g.textContent = i < waterCount ? '💧' : '🥛';
    wrap.appendChild(g);
  }
  const stat = document.getElementById('stat-water');
  if (stat) stat.textContent = `${waterCount} / 8 glasses`;
}

/* ════════════════════════════════════
   PERIOD TRACKER
════════════════════════════════════ */
function savePeriod() {
  const date     = document.getElementById('period-date').value;
  const cycle    = parseInt(document.getElementById('cycle-length').value) || 28;
  const duration = parseInt(document.getElementById('period-duration').value) || 5;
  const flow     = document.getElementById('flow-level').value;
  const pain     = document.getElementById('pain-level').value;
  if (!date) { toast('⚠️ Please enter your last period start date.'); return; }

  const start  = new Date(date);
  const nextP  = new Date(start); nextP.setDate(start.getDate() + cycle);
  const ovDay  = new Date(start); ovDay.setDate(start.getDate() + cycle - 14);
  const irregular = cycle < 21 || cycle > 35;

  const res = document.getElementById('period-result');
  res.style.display = 'block';
  res.innerHTML = `
    <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;margin-bottom:1rem;color:var(--purple-d)">📅 Period Summary</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:.9rem;margin-bottom:1rem">
      ${[['Next Period',nextP.toDateString()],['Ovulation Day',ovDay.toDateString()],
         ['Cycle Length',cycle+' days'],['Flow',flow||'Not set'],['Pain Level',pain+'/10']]
        .map(([l,v])=>`<div style="background:var(--bg);border-radius:10px;padding:.9rem;border:1px solid var(--brd)">
          <div style="font-size:.78rem;font-weight:800;color:var(--txt-l);margin-bottom:.2rem">${l}</div>
          <div style="font-weight:800;color:var(--txt)">${v}</div>
        </div>`).join('')}
    </div>
    ${irregular
      ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:1rem;color:#92400e">
          <strong>⚠️ Irregular Cycle Detected!</strong> Cycle ${cycle} days is outside normal range (21–35). 
          Consider checking our PCOS risk assessment and consulting a gynecologist.
        </div>`
      : `<div style="background:var(--green-l);border:1px solid var(--green);border-radius:10px;padding:1rem;color:#14532d">
          <strong>✅ Regular Cycle</strong> Your cycle looks healthy. Keep tracking for better insights!
        </div>`}
  `;
  localStorage.setItem('hh_period', JSON.stringify({date,cycle,duration,flow,pain}));
  document.getElementById('stat-period').textContent = start.toDateString();
  toast('✅ Period data saved!');
}

/* ════════════════════════════════════════════
   PCOS STAGED SYMPTOM ANALYSER
   Stages: Mild / Moderate / Severe (from image table)
════════════════════════════════════════════ */
function calcPCOS() {
  const chips = [...document.querySelectorAll('#sec-pcos .chip.selected')];
  if (chips.length === 0) { toast('⚠️ Please select at least one symptom.'); return; }

  const sevScores  = chips.map(c => parseInt(c.dataset.sev || 1));
  const familyBonus= parseInt(document.getElementById('pcos-family').value);
  const avgSev     = (sevScores.reduce((a,b)=>a+b,0) / sevScores.length) + (familyBonus * 0.3);
  const maxSev     = Math.max(...sevScores);
  const count      = chips.length;

  let stage;
  if      (maxSev === 3 && count >= 3)                      stage = 'severe';
  else if (maxSev === 3 || (avgSev >= 2.2 && count >= 3))   stage = 'severe';
  else if (avgSev >= 1.6 || (maxSev === 2 && count >= 3))   stage = 'moderate';
  else                                                        stage = 'mild';

  const detectedHTML = chips.map(c => {
    const sev = parseInt(c.dataset.sev||1);
    return `<span class="det-sym sev${sev}">${sev===1?'🌱':sev===2?'⚠️':'🚨'} ${c.textContent.trim()}</span>`;
  }).join('');

  const STAGE_DATA = {
    mild:{
      cls:'psr-mild', icon:'🌱', title:'Mild / Early Stage PCOS',
      sub:'Your symptoms suggest early-stage hormonal imbalance. Early action makes a big difference!',
      urgency:'⏰ Not urgent — but act within 1–2 months',
      what:'At this early stage, PCOS is subtle. Periods may be slightly irregular and some mild signs of androgen excess are present. Ovulation is irregular but still occurring.',
      tests:['Hormonal blood panel (LH, FSH, testosterone, AMH)','Pelvic ultrasound','Fasting blood sugar and insulin'],
      steps:['Start a low-GI anti-inflammatory diet now','Exercise 30–45 mins daily (walking or yoga)','Track your cycle every month','Reduce stress — try meditation','See a gynecologist within 1–2 months'],
      docAdvice:'Schedule a routine gynecology appointment within 4–8 weeks for a hormonal profile test.',
      statLabel:'Mild / Early Stage'
    },
    moderate:{
      cls:'psr-mod', icon:'⚠️', title:'Moderate Stage PCOS',
      sub:'Multiple PCOS symptoms at moderate severity detected. Timely medical care is important.',
      urgency:'⚠️ Consult a doctor within 2–4 weeks',
      what:'Moderate PCOS involves frequent missed periods (3–6/year), noticeable hirsutism, persistent acne, clear insulin resistance, and reduced fertility. Medical management is recommended.',
      tests:['Full hormonal panel (LH, FSH, AMH, testosterone, progesterone)','Transvaginal ultrasound for ovarian cysts','Fasting glucose and insulin resistance test','Thyroid function test'],
      steps:['Start PCOS-specific diet immediately (low GI)','Daily exercise — minimum 30 mins','Consult gynecologist for medication (Metformin or OCP)','Monitor cycle closely every month','Consider stress and sleep counselling'],
      docAdvice:'Book a gynecologist appointment within 2–4 weeks. Bring a 3-month period diary if available.',
      statLabel:'Moderate Risk'
    },
    severe:{
      cls:'psr-sev', icon:'🚨', title:'Severe / Advanced Stage PCOS',
      sub:'Significant PCOS symptoms detected. Please seek medical attention soon — early treatment helps greatly.',
      urgency:'🚨 Please see a doctor within 1 week',
      what:'Severe PCOS presents with amenorrhea (absent periods), absent ovulation, marked hirsutism, treatment-resistant acne, obesity, and high risk of Type 2 diabetes and infertility without treatment.',
      tests:['Comprehensive hormonal panel — urgently','Transvaginal ultrasound (polycystic ovaries check)','Fasting blood glucose and HbA1c','Lipid profile and liver function tests','Thyroid panel','AMH (ovarian reserve assessment)'],
      steps:['Seek medical consultation urgently (this week)','Do not ignore — untreated severe PCOS causes Type 2 diabetes, infertility, and cardiovascular risk','Start prescribed medications immediately when given','Eliminate sugar, maida, and refined carbs completely','Monitor health every 4–6 weeks with your doctor'],
      docAdvice:'🚨 Urgent: Book a gynecologist this week. Mention all symptoms. Request full hormonal panel and pelvic ultrasound.',
      statLabel:'High Risk — Severe'
    }
  };

  const d = STAGE_DATA[stage];
  document.getElementById('stat-pcos').textContent = d.statLabel;

  const res = document.getElementById('pcos-result');
  res.style.display = 'block';
  res.innerHTML = `
    <div class="pcos-stage-result ${d.cls}">
      <div class="psr-header">
        <div class="psr-icon">${d.icon}</div>
        <div><div class="psr-title">${d.title}</div><div class="psr-sub">${d.sub}</div></div>
        <div class="psr-score">${chips.length}<small><br/>symptoms</small></div>
      </div>
      <div class="psr-body">
        <div style="background:var(--bg);border-radius:10px;padding:1rem;margin-bottom:1.2rem;font-size:.87rem;border-left:4px solid var(--purple)">
          <strong>🔍 Urgency:</strong> ${d.urgency}
        </div>
        <h4 style="margin-bottom:.6rem">🧬 Your selected symptoms:</h4>
        <div class="pcos-detected-syms">${detectedHTML}</div>
        <h4 style="margin-bottom:.5rem;margin-top:1rem">📖 What this stage means:</h4>
        <p style="font-size:.88rem;color:var(--txt-m);line-height:1.7;margin-bottom:1.2rem">${d.what}</p>
        <div class="psr-grid">
          <div class="psr-item">
            <strong>🧪 Recommended Tests</strong>
            <ul style="margin-top:.4rem;list-style:none">
              ${d.tests.map(t=>`<li style="font-size:.82rem;color:var(--txt-m);padding:.15rem 0;display:flex;gap:.4rem"><span>›</span>${t}</li>`).join('')}
            </ul>
          </div>
          <div class="psr-item">
            <strong>✅ Action Steps</strong>
            <ul style="margin-top:.4rem;list-style:none">
              ${d.steps.map(s=>`<li style="font-size:.82rem;color:var(--txt-m);padding:.15rem 0;display:flex;gap:.4rem"><span>›</span>${s}</li>`).join('')}
            </ul>
          </div>
        </div>
        <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:1rem;margin-bottom:1.2rem;font-size:.87rem">
          <strong>🩺 Doctor's Advice:</strong> ${d.docAdvice}
        </div>
        <div class="psr-actions">
          <button class="psr-action-btn pab-doc" onclick="showSection('doctor')">
            <i class="fa-solid fa-user-doctor"></i> Book Appointment
          </button>
          <button class="psr-action-btn pab-diet" onclick="showSection('diet')">
            <i class="fa-solid fa-salad"></i> PCOS Diet Plan
          </button>
          <button class="psr-action-btn pab-chat" onclick="toggleChatbot(); setTimeout(()=>sendQuick('I have '+stage+' stage PCOS. What should I do?'),400)">
            <i class="fa-solid fa-comments"></i> Ask HerHealth Bot
          </button>
        </div>
      </div>
    </div>
  `;
  res.scrollIntoView({behavior:'smooth', block:'start'});
  toast(`✅ Analysis complete — ${d.statLabel}`);
}

/* ════════════════════════════════════
   BMI CALCULATOR
════════════════════════════════════ */
function calcBMI() {
  const h = parseFloat(document.getElementById('bmi-h').value);
  const w = parseFloat(document.getElementById('bmi-w').value);
  if (!h || !w) { toast('⚠️ Please enter both height and weight.'); return; }

  const bmi = (w / Math.pow(h/100, 2)).toFixed(1);
  const cats = [
    {max:18.5, cat:'Underweight',     bg:'#dbeafe', tip:'Focus on nutrient-rich foods. Consult a nutritionist.'},
    {max:25,   cat:'Normal Weight ✅', bg:  'var(--green-l)', tip:'Great! Maintain with balanced diet and exercise.'},
    {max:30,   cat:'Overweight',      bg:  '#fef9c3', tip:'Reduce refined carbs and sugar. Increase physical activity.'},
    {max:999,  cat:'Obese',           bg:  'var(--rose-l)', tip:'Please consult a doctor. Weight management is crucial for PCOS.'}
  ];
  const c = cats.find(x => parseFloat(bmi) <= x.max);

  const res = document.getElementById('bmi-result');
  res.style.display = 'block';
  res.style.background = c.bg;
  res.style.borderRadius = '12px';
  res.style.padding = '1.5rem';
  res.innerHTML = `
    <span class="bmi-big">${bmi}</span>
    <div class="bmi-cat">${c.cat}</div>
    <div class="bmi-tip">${c.tip}</div>
  `;
  document.getElementById('stat-bmi').textContent = bmi + ' kg/m²';
}

/* ════════════════════════════════════
   TABS
════════════════════════════════════ */
function switchTab(id, btn) {
  btn.closest('.tab-bar').querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.tab-body').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ════════════════════════════════════
   PREGNANCY TRACKER
════════════════════════════════════ */
const FRUITS = [
  'Poppy seed 🌱','Sesame seed','Lentil','Apple seed','Peppercorn',
  'Sweet pea 🫘','Blueberry 🫐','Raspberry','Olive','Prune 🍑',
  'Lime 🍋','Plum','Peach 🍑','Lemon 🍋','Apple 🍎',
  'Avocado 🥑','Pear 🍐','Bell pepper 🫑','Tomato 🍅','Banana 🍌',
  'Carrot 🥕','Spaghetti squash','Corn 🌽','Ear of corn','Rutabaga',
  'Scallion','Cauliflower 🥦','Eggplant 🍆','Butternut squash','Cucumber 🥒',
  'Zucchini','Pineapple 🍍','Coconut 🥥','Cantaloupe 🍈','Honeydew 🍈',
  'Romaine lettuce','Winter melon','Watermelon 🍉','Pumpkin 🎃','Jackfruit'
];
const VACCINES = {8:'Tetanus Toxoid (TT) 1st dose',16:'TT 2nd dose',24:'Anti-D if Rh-negative',36:'Flu vaccine'};
const NUTRITION = {1:'Folic acid 400mcg, prenatal vitamins. Avoid alcohol & raw fish.',13:'Iron (27mg/day), Calcium (1000mg/day), continue folic acid.',28:'Increase iron. Omega-3 (fish/flaxseed). Vitamin D important.',37:'Protein-rich foods. Small frequent meals. Avoid spicy food.'};

function calcPregnancy() {
  const lmp = document.getElementById('preg-lmp').value;
  if (!lmp) { toast('⚠️ Please enter your LMP date.'); return; }

  const now   = new Date();
  const lmpD  = new Date(lmp);
  const weeks = Math.min(Math.max(Math.floor((now - lmpD)/(1000*60*60*24*7)), 1), 40);
  const due   = new Date(lmpD); due.setDate(lmpD.getDate() + 280);

  let nut = NUTRITION[1];
  for (const [w,n] of Object.entries(NUTRITION)) { if (weeks >= parseInt(w)) nut = n; }
  let vac = 'No vaccines this week. Focus on prenatal vitamins.';
  for (const [w,v] of Object.entries(VACCINES)) { if (weeks >= parseInt(w)) vac = v; }

  const trim = weeks <= 12 ? 'First Trimester 🌱' : weeks <= 27 ? 'Second Trimester 🌸' : 'Third Trimester 🌺';

  document.getElementById('pw-num').textContent   = weeks;
  document.getElementById('pw-title').textContent = `${trim}  ·  Due: ${due.toDateString()}`;
  document.getElementById('pw-fruit').textContent = `Baby is the size of a ${FRUITS[weeks-1] || 'baby'}`;
  document.getElementById('pw-desc').textContent  =
    weeks <= 12 ? "Baby's major organs are forming. Rest well, avoid stress and take folic acid daily." :
    weeks <= 27 ? "Baby can now hear sounds and move actively! You may start feeling kicks." :
                  "Baby is almost ready! Prepare your hospital bag and finalize birth plan.";
  document.getElementById('pw-nutrition').textContent = nut;
  document.getElementById('pw-vaccine').textContent   = vac;

  const bagItems = ['ID & hospital papers','Insurance card','Comfortable clothes (3 sets)',
    'Toiletries','Baby clothes (3 sets)','Diapers & wipes','Baby blanket',
    'Nursing bra','Phone charger','Healthy snacks','Camera / charger','Baby car seat'];
  document.getElementById('bag-items').innerHTML = bagItems.map(i =>
    `<div class="bag-item" onclick="this.classList.toggle('done')"><i class="fa-solid fa-check"></i>${i}</div>`
  ).join('');

  document.getElementById('preg-result').style.display = 'block';
  toast('✅ Pregnancy week calculated!');
}

/* ════════════════════════════════════
   KICK COUNTER
════════════════════════════════════ */
function addKick() {
  kickCount++;
  document.getElementById('kick-num').textContent = kickCount;
  document.getElementById('kick-log').textContent = `Last kick: ${new Date().toLocaleTimeString()}`;

  if (kickCount === 1 && !kickInterval) {
    kickInterval = setInterval(() => {
      kickSecs++;
      const m = String(Math.floor(kickSecs/60)).padStart(2,'0');
      const s = String(kickSecs%60).padStart(2,'0');
      document.getElementById('kick-timer').textContent = `${m}:${s}`;
    }, 1000);
  }
  if (kickCount >= 10) {
    const min = Math.floor(kickSecs/60);
    const msg = document.getElementById('kick-msg');
    msg.style.display = 'block';
    msg.textContent = `🎉 10 kicks in ${min} minute${min!==1?'s':''}! Baby is active and healthy!`;
    clearInterval(kickInterval); kickInterval = null;
    toast('🎉 10 kicks reached! Baby is doing great!');
  }
}

function resetKick() {
  kickCount = 0; kickSecs = 0;
  clearInterval(kickInterval); kickInterval = null;
  document.getElementById('kick-num').textContent  = '0';
  document.getElementById('kick-timer').textContent = '00:00';
  document.getElementById('kick-log').textContent   = '';
  document.getElementById('kick-msg').style.display = 'none';
}

/* ════════════════════════════════════
   POSTPARTUM
════════════════════════════════════ */
function showRecovery() {
  const type = document.getElementById('delivery-type').value;
  if (!type) return;

  const data = {
    normal:[
      {em:'💓',title:'Week 1–2 Recovery',points:['Rest as much as possible','Ice packs for perineal pain','Sitz bath 2–3 times/day','Avoid heavy lifting for 6 weeks','Use stool softeners as needed']},
      {em:'🥗',title:'Nutrition',points:['High fiber diet to prevent constipation','Iron-rich foods (spinach, dates, jaggery)','Protein-rich foods for healing','Plenty of fluids – 3L/day','Avoid spicy and gas-causing foods']},
      {em:'🚶',title:'Gentle Movement',points:['Short walks from Day 2','Kegel exercises from Day 3','Gentle stretching after Week 2','No intense exercise for 6 weeks','Pelvic floor therapy if needed']},
      {em:'🩺',title:'Call Doctor If…',points:['Heavy bleeding (soaking pad/hour)','Fever above 38.5°C','Severe pain or swelling','Signs of infection at wound','Difficulty urinating']}
    ],
    csec:[
      {em:'💓',title:'C-Section Week 1–2',points:['Absolute rest for 24–48 hrs','Keep incision clean and dry','Take prescribed pain medication','Support abdomen when coughing/sneezing','No driving for 4–6 weeks']},
      {em:'🥗',title:'Post C-Section Nutrition',points:['Start with liquids, progress to solids','Avoid gas-causing foods (beans, cabbage)','High protein for incision healing','Iron & Vitamin C for blood recovery','Stay well hydrated – 3L/day']},
      {em:'🚶',title:'Safe Activity',points:['Short walks by Day 3','Nothing heavier than baby','Avoid stairs as much as possible','Full recovery takes 6–8 weeks','Core exercises only after 8 weeks']},
      {em:'⚠️',title:'C-Section Warning Signs',points:['Redness / oozing at incision','Fever above 38°C','Severe abdominal pain','Difficulty breathing','Leg swelling or pain']}
    ]
  };

  const info = document.getElementById('recovery-info');
  info.style.display = 'grid';
  ['rc1','rc2','rc3','rc4'].forEach((id,i) => {
    const d = data[type][i];
    document.getElementById(id).innerHTML = `
      <div class="ic-badge">${d.em}</div>
      <h4>${d.title}</h4>
      <ul>${d.points.map(p=>`<li>${p}</li>`).join('')}</ul>`;
  });
}

/* ════════════════════════════════════
   MOOD TRACKER
════════════════════════════════════ */
function pickMood(score, el) {
  document.querySelectorAll('.mood-em').forEach(e => e.classList.remove('sel'));
  el.classList.add('sel');
  selectedMood = {score, emoji: el.textContent};
}

function saveMood() {
  if (!selectedMood) { toast('⚠️ Please select your mood first.'); return; }
  const note = document.getElementById('mood-note').value.trim();
  const entry = {...selectedMood, note, date: new Date().toLocaleString()};
  moodLog.unshift(entry);
  if (moodLog.length > 30) moodLog.pop();
  localStorage.setItem('hh_mood', JSON.stringify(moodLog));
  document.getElementById('mood-note').value = '';
  selectedMood = null;
  document.querySelectorAll('.mood-em').forEach(e => e.classList.remove('sel'));
  initMoodHistory();
  // PPD check
  const recent = moodLog.slice(0,5);
  if (recent.length >= 5 && recent.every(m => m.score <= 2)) {
    document.getElementById('ppd-banner').style.display = 'flex';
  }
  toast('✅ Mood logged!');
}

function initMoodHistory() {
  const hist = document.getElementById('mood-hist');
  if (!hist) return;
  if (moodLog.length === 0) {
    hist.innerHTML = `<p style="color:var(--txt-l);font-size:.88rem">No mood entries yet. Start tracking above!</p>`;
    return;
  }
  const moodNames = {5:'Great',4:'Good',3:'Okay',2:'Sad',1:'Very Low'};
  hist.innerHTML = `<h4 style="margin-bottom:.8rem;color:var(--txt-m)">Recent Moods</h4>` +
    moodLog.slice(0,7).map(m => `
      <div class="mood-entry">
        <span class="me-em">${m.emoji}</span>
        <div>
          <div style="font-weight:700;font-size:.9rem">${moodNames[m.score]||'—'}</div>
          ${m.note?`<div style="color:var(--txt-l);font-size:.78rem">${m.note}</div>`:''}
        </div>
        <span class="me-date">${m.date}</span>
      </div>`).join('');
}

/* ════════════════════════════════════
   DOCTOR CONSULTANCY
════════════════════════════════════ */
function selectSpec(spec, el) {
  document.querySelectorAll('.spec-card').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  document.getElementById('doc-spec').value = spec;
}

function bookAppointment() {
  const spec  = document.getElementById('doc-spec').value;
  const date  = document.getElementById('doc-date').value;
  const time  = document.getElementById('doc-time').value;
  const sym   = document.getElementById('doc-symptoms').value.trim();
  const mode  = [...document.querySelectorAll('#sec-doctor .chip.selected')].map(c=>c.textContent).join(', ');

  if (!spec)  { toast('⚠️ Please select a specialty.'); return; }
  if (!date)  { toast('⚠️ Please choose a preferred date.'); return; }
  if (!time)  { toast('⚠️ Please select a time.'); return; }

  const appt = { id: Date.now(), spec, date, time, symptoms: sym, mode: mode || 'Not specified',
    bookedAt: new Date().toLocaleString() };
  appointments.unshift(appt);
  localStorage.setItem('hh_appts', JSON.stringify(appointments));
  document.getElementById('doc-spec').value   = '';
  document.getElementById('doc-date').value   = '';
  document.getElementById('doc-time').value   = '';
  document.getElementById('doc-symptoms').value = '';
  document.querySelectorAll('#sec-doctor .chip.selected').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.spec-card').forEach(c => c.classList.remove('sel'));
  renderAppointments();
  toast('✅ Appointment booked successfully!');
}

function cancelAppt(id) {
  appointments = appointments.filter(a => a.id !== id);
  localStorage.setItem('hh_appts', JSON.stringify(appointments));
  renderAppointments();
  toast('🗑️ Appointment cancelled.');
}

function renderAppointments() {
  const wrap = document.getElementById('appt-items');
  const noEl = document.getElementById('no-appt');
  if (!wrap) return;
  if (appointments.length === 0) {
    wrap.innerHTML = ''; noEl.style.display = 'block'; return;
  }
  noEl.style.display = 'none';
  wrap.innerHTML = appointments.slice(0,6).map(a => `
    <div class="appt-card">
      <i class="fa-solid fa-calendar-check"></i>
      <div class="appt-info">
        <div class="appt-spec">${a.spec}</div>
        <div class="appt-meta">📅 ${new Date(a.date).toDateString()} · ⏰ ${a.time} · ${a.mode}</div>
        ${a.symptoms ? `<div class="appt-meta">📝 ${a.symptoms}</div>` : ''}
      </div>
      <button class="appt-del" onclick="cancelAppt(${a.id})"><i class="fa-solid fa-times"></i> Cancel</button>
    </div>`).join('');
}

/* ════════════════════════════════════
   ASHA WORKER
════════════════════════════════════ */
function addPatient() {
  const name    = document.getElementById('ap-name').value.trim();
  const age     = document.getElementById('ap-age').value.trim();
  const village = document.getElementById('ap-village').value.trim();
  const mob     = document.getElementById('ap-mob').value.trim();
  const stage   = document.getElementById('ap-stage').value;
  const risk    = document.getElementById('ap-risk').value;
  const notes   = document.getElementById('ap-notes').value.trim();

  if (!name || !age) { toast('⚠️ Patient name and age are required.'); return; }
  patients.push({id:Date.now(), name, age, village, mob, stage, risk, notes});
  localStorage.setItem('hh_patients', JSON.stringify(patients));
  ['ap-name','ap-age','ap-village','ap-mob','ap-notes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  updateAshaStats();
  renderPatients();
  toast('✅ Patient added!');
}

function removePatient(id) {
  patients = patients.filter(p => p.id !== id);
  localStorage.setItem('hh_patients', JSON.stringify(patients));
  updateAshaStats();
  renderPatients();
  toast('🗑️ Patient removed.');
}

function updateAshaStats() {
  const el = id => document.getElementById(id);
  if (!el('at-total')) return;
  el('at-total').textContent = patients.length;
  el('at-high').textContent  = patients.filter(p=>p.risk==='high').length;
  el('at-preg').textContent  = patients.filter(p=>p.stage==='pregnant').length;
  el('at-post').textContent  = patients.filter(p=>p.stage==='postpartum').length;
}

function renderPatients() {
  const tbody = document.getElementById('pt-tbody');
  const noEl  = document.getElementById('no-pts');
  if (!tbody) return;
  if (patients.length === 0) {
    tbody.innerHTML=''; noEl.style.display='block'; return;
  }
  noEl.style.display = 'none';
  tbody.innerHTML = patients.map(p => `
    <tr>
      <td><strong>${p.name}</strong></td>
      <td>${p.age}</td>
      <td>${p.village||'—'}</td>
      <td>${p.mob||'—'}</td>
      <td>${p.stage.charAt(0).toUpperCase()+p.stage.slice(1)}</td>
      <td><span class="risk-badge r-${p.risk}">${p.risk.charAt(0).toUpperCase()+p.risk.slice(1)}</span></td>
      <td style="font-size:.78rem;color:var(--txt-l);max-width:140px">${p.notes||'—'}</td>
      <td><button style="background:var(--rose-l);border:1px solid #fecdd3;color:#9f1239;border-radius:7px;padding:.3rem .6rem;font-size:.75rem;font-weight:700;cursor:pointer;font-family:inherit"
        onclick="removePatient(${p.id})"><i class="fa-solid fa-trash"></i></button></td>
    </tr>`).join('');
}

/* Registered users visible to ASHA worker */
function renderRegUsers() {
  const wrap = document.getElementById('reg-users-list');
  if (!wrap) return;
  const saved = JSON.parse(localStorage.getItem('hh_user') || 'null');
  if (!saved || saved.role === 'asha') {
    wrap.innerHTML = `<p class="no-data-msg"><i class="fa-solid fa-user-slash"></i> No patient users registered yet.</p>`;
    return;
  }
  const stageLabel = {menstrual:'Menstrual / PCOS', pregnant:'Pregnant', postpartum:'Postpartum'};
  const bmiTxt = saved.bmi ? ` · BMI: ${saved.bmi}` : '';
  const htwtTxt = (saved.height && saved.weight) ? ` · Height: ${saved.height}cm · Weight: ${saved.weight}kg` : '';
  wrap.innerHTML = `
    <div class="reg-user-card">
      <div class="ruc-av">${saved.name.charAt(0).toUpperCase()}</div>
      <div>
        <div class="ruc-name">${saved.name}</div>
        <div class="ruc-meta">Age: ${saved.age||'—'} · ${saved.location||'—'} · 📱 ${saved.phone||'—'}${htwtTxt}${bmiTxt}</div>
        <div class="ruc-meta">📧 ${saved.email}</div>
      </div>
      <span class="ruc-stage">${stageLabel[saved.stage]||saved.stage}</span>
    </div>`;
}

/* ════════════════════════════════════
   TOAST
════════════════════════════════════ */
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

/* ════════════════════════════════════
   INIT
════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('dash-date').textContent = new Date().toDateString();
  // Close curtain on load
  setTimeout(() => {
    const c = document.getElementById('curtain');
    c.classList.add('close');
  }, 100);
});

/* ════════════════════════════════════════════
   HERHEALTH CHATBOT ENGINE
════════════════════════════════════════════ */
let chatbotOpen = false;

// Knowledge base — keyword → response
const CB_KB = [
  // PCOS
  { keys:['pcos symptom','pcos sign','what is pcos','pcos mean'],
    ans:`🌸 <strong>PCOS Symptoms by Stage:</strong><br/><br/>
🌱 <strong>Mild/Early:</strong> Slightly irregular periods, occasional acne, mild facial hair, minimal hair thinning, mild weight gain.<br/><br/>
⚠️ <strong>Moderate:</strong> Frequent missed periods (3–6/year), noticeable body hair, persistent acne, abdominal weight gain, insulin resistance.<br/><br/>
🚨 <strong>Severe:</strong> No periods (amenorrhea), absent ovulation, treatment-resistant acne, obesity, dark skin patches, high diabetes risk, significant infertility.<br/><br/>
👉 Go to <strong>PCOS Symptom Checker</strong> in the app to find your exact stage!` },

  { keys:['pcos risk','at risk','do i have pcos','check pcos'],
    ans:`To check your PCOS risk, go to the <strong>PCOS Risk Check</strong> section in the sidebar. Select all symptoms that apply to you — the app will automatically identify if you are at <strong>Mild, Moderate, or Severe</strong> stage and give you personalized advice. 💜` },

  { keys:['pcos diet','eat pcos','food pcos','pcos nutrition'],
    ans:`🥗 <strong>PCOS-Friendly Diet Tips:</strong><br/>
✅ Eat: Brown rice, millets (ragi, jowar), whole wheat roti, lentils, leafy greens, flaxseeds, amla<br/>
✅ Proteins: Eggs, tofu, chickpeas, fish (sardines)<br/>
✅ Drinks: Spearmint tea, cinnamon water, coconut water<br/>
🚫 Avoid: Sugar, maida, junk food, fried snacks, sugary drinks<br/><br/>
A low glycemic index (low-GI) diet is key for managing insulin resistance in PCOS! 💪` },

  { keys:['pcos workout','exercise pcos','yoga pcos','gym pcos'],
    ans:`🧘 <strong>Best Exercises for PCOS:</strong><br/>
🚶 Brisk walking 30 mins/day<br/>
🧘 Yoga: Butterfly pose, Cobra pose, Child's pose<br/>
💪 Strength: Squats, lunges, glute bridges, planks<br/>
🌬️ Breathing: Anulom-Vilom 10 mins daily<br/><br/>
Exercise helps reduce insulin resistance and balance hormones — even 30 mins/day makes a big difference! 🌸` },

  { keys:['mild pcos','early stage pcos','early pcos'],
    ans:`🌱 <strong>Mild / Early Stage PCOS:</strong><br/>
Your periods are slightly irregular (cycles >35 days), you may have occasional acne and mild facial hair. Ovulation is irregular but still present.<br/><br/>
<strong>What to do:</strong><br/>
✅ Low-GI diet and daily exercise<br/>
✅ Track your cycle monthly<br/>
✅ Consult a gynecologist within 1–2 months for a hormonal blood test<br/><br/>
Early action leads to full control! 💪` },

  { keys:['moderate pcos'],
    ans:`⚠️ <strong>Moderate Stage PCOS:</strong><br/>
You're missing periods frequently (3–6/year), experiencing noticeable hirsutism, persistent acne, and insulin resistance signs.<br/><br/>
<strong>Action needed:</strong><br/>
🩺 Consult gynecologist within 2–4 weeks<br/>
🧪 Get: Hormonal panel, ultrasound, fasting glucose test<br/>
💊 Doctor may prescribe Metformin or oral contraceptives<br/>
🥗 Strict low-GI diet and 30 min daily exercise` },

  { keys:['severe pcos','high risk pcos','serious pcos'],
    ans:`🚨 <strong>Severe / Advanced PCOS:</strong><br/>
You may have no periods (amenorrhea), absent ovulation, treatment-resistant acne, significant weight issues and high diabetes risk.<br/><br/>
<strong>Please act this week:</strong><br/>
🩺 Book a gynecologist appointment urgently<br/>
🧪 Request: Comprehensive hormonal panel, pelvic ultrasound, HbA1c, lipid profile<br/>
⚠️ Untreated severe PCOS leads to Type 2 diabetes, infertility and heart disease<br/><br/>
You're not alone — proper treatment makes a huge difference! 💜` },

  // PERIOD
  { keys:['period irregular','irregular period','cycle irregular','cycle length'],
    ans:`📅 <strong>Irregular Periods — What it means:</strong><br/>
A normal cycle is 21–35 days. If yours is consistently shorter or longer, or you skip months, it may indicate:<br/>
🔹 PCOS or PCOD<br/>
🔹 Thyroid imbalance<br/>
🔹 Stress or weight changes<br/><br/>
<strong>What to do:</strong> Track your cycle in the <strong>Period Tracker</strong> section for 3 months, then consult a gynecologist with your records.` },

  { keys:['period pain','cramp','dysmenorrhea','painful period'],
    ans:`😣 <strong>Period Pain (Dysmenorrhea):</strong><br/>
Mild cramping is normal. Severe pain could indicate endometriosis or fibroids.<br/><br/>
<strong>Immediate relief:</strong><br/>
🔥 Heating pad on lower abdomen<br/>
💊 Ibuprofen or mefenamic acid (as prescribed)<br/>
🧘 Yoga poses: Child's pose, Balasana<br/>
🚶 Light walking helps<br/><br/>
See a doctor if pain is 7/10 or above, or disrupts daily life.` },

  // PREGNANCY
  { keys:['pregnancy sign','am i pregnant','pregnancy symptom','early pregnancy'],
    ans:`🤰 <strong>Early Pregnancy Signs:</strong><br/>
🔹 Missed period<br/>
🔹 Breast tenderness / swelling<br/>
🔹 Nausea, especially in morning<br/>
🔹 Fatigue and sleepiness<br/>
🔹 Frequent urination<br/>
🔹 Light spotting (implantation bleeding)<br/>
🔹 Food aversions or cravings<br/><br/>
Take a home pregnancy test from Day 1 of missed period. Confirm with a doctor! 🌸` },

  { keys:['pregnancy nutrition','pregnancy diet','eat pregnancy','folic acid'],
    ans:`🥗 <strong>Pregnancy Nutrition Guide:</strong><br/>
🍃 Folic acid 400mcg daily (prevents neural tube defects)<br/>
💊 Iron 27mg/day (prevents anaemia)<br/>
🥛 Calcium 1000mg/day<br/>
🐟 Omega-3 (salmon, sardines, flaxseeds)<br/>
☀️ Vitamin D (sunlight + egg yolks)<br/><br/>
🚫 Avoid: Raw fish, alcohol, excess caffeine, papaya, pineapple<br/><br/>
Use the <strong>Pregnancy Tracker</strong> for week-by-week nutrition reminders! 💜` },

  { keys:['pregnancy danger','emergency pregnancy','bleeding pregnancy','pregnancy warning'],
    ans:`🚨 <strong>Pregnancy Warning Signs — Go to hospital immediately if:</strong><br/>
🩸 Heavy vaginal bleeding<br/>
🤰 Severe abdominal pain or cramping<br/>
🦵 Sudden swelling of face/hands/legs<br/>
👁️ Sudden vision changes or severe headache<br/>
🫁 Difficulty breathing<br/>
🐣 Reduced or no fetal movement after 28 weeks<br/><br/>
Call 108 or go to nearest hospital IMMEDIATELY for any of these! ❗` },

  // POSTPARTUM
  { keys:['postpartum depression','ppd','baby blues','sad after delivery','crying after birth'],
    ans:`💜 <strong>Postpartum Depression (PPD):</strong><br/>
It is very common — affects 1 in 5 new mothers. You are not weak or a bad mother.<br/><br/>
<strong>Signs of PPD:</strong><br/>
😢 Persistent sadness or emptiness<br/>
😴 Extreme fatigue beyond normal tiredness<br/>
😰 Anxiety or panic attacks<br/>
😤 Irritability or anger<br/>
🤱 Difficulty bonding with baby<br/><br/>
<strong>Please reach out:</strong><br/>
👩‍⚕️ Talk to your doctor<br/>
💬 iCall helpline: 9152987821<br/>
💜 You deserve support — use the <strong>Mood Tracker</strong> daily!` },

  { keys:['breastfeed','breast feed','nursing','latching','milk supply'],
    ans:`🤱 <strong>Breastfeeding Tips:</strong><br/>
✅ Nurse every 2–3 hours (8–12 times/day for newborn)<br/>
✅ Ensure proper latch — baby's mouth covers areola, not just nipple<br/>
✅ Drink 3L of water daily<br/>
✅ Eat galactagogues: methi seeds, garlic, oats, moringa<br/>
✅ Rest when baby sleeps<br/><br/>
🚫 Avoid: Caffeine excess, alcohol, certain medications<br/><br/>
If you have pain, fever, or very low supply — consult a lactation counsellor! 💜` },

  // DOCTOR
  { keys:['see doctor','when doctor','consult doctor','book appointment','need doctor'],
    ans:`🩺 <strong>When to See a Doctor — Gynecology:</strong><br/>
✅ Always see a doctor if:<br/>
🔹 Periods missed for 3+ months<br/>
🔹 PCOS symptoms getting worse<br/>
🔹 Severe period pain<br/>
🔹 Difficulty getting pregnant after 1 year of trying<br/>
🔹 Heavy bleeding (soaking more than 1 pad/hour)<br/>
🔹 Postpartum symptoms lasting >2 weeks<br/><br/>
👉 Use the <strong>Doctor Consultancy</strong> section to book your appointment! 📅` },

  // BMI / WEIGHT
  { keys:['bmi','body mass index','overweight','underweight','healthy weight'],
    ans:`⚖️ <strong>BMI Guide for Women:</strong><br/>
🟢 Under 18.5 — Underweight<br/>
🟢 18.5–24.9 — Normal (healthy)<br/>
🟡 25–29.9 — Overweight<br/>
🔴 30 and above — Obese<br/><br/>
For PCOS management, keeping BMI under 25 significantly helps regulate hormones and menstrual cycles.<br/><br/>
Use the <strong>BMI Calculator</strong> in the app! 📊` },

  // GENERAL
  { keys:['water','hydration','drink water','daily water'],
    ans:`💧 <strong>Daily Water Goal:</strong><br/>
Women should drink 8–10 glasses (2–3 litres) of water daily.<br/><br/>
For PCOS: Spearmint tea and cinnamon water help reduce androgens naturally.<br/>
For Pregnancy: 3L/day minimum.<br/>
For Breastfeeding: 3.5L/day.<br/><br/>
Track it using the <strong>Water Intake tracker</strong> on your Dashboard! 🌊` },

  { keys:['sleep','insomnia','rest','tired'],
    ans:`😴 <strong>Sleep Tips for Hormonal Health:</strong><br/>
✅ 7–9 hours per night<br/>
✅ Consistent sleep and wake time (even weekends)<br/>
✅ Avoid screens 1 hour before bed<br/>
✅ Cool, dark, quiet room<br/>
✅ Try chamomile tea or warm milk at night<br/><br/>
Poor sleep worsens PCOS, pregnancy outcomes, and postpartum recovery. Sleep is medicine! 💜` },

  { keys:['hello','hi','hey','namaste','hai'],
    ans:`👋 Hello! I'm your <strong>HerHealth Assistant</strong> 💗<br/><br/>
I can help you understand:<br/>
🩸 PCOS stages and symptoms<br/>
🤰 Pregnancy guidance<br/>
💊 Diet and medication tips<br/>
💜 Postpartum care<br/>
🩺 When to see a doctor<br/><br/>
What would you like help with today?` },

  { keys:['thank','thanks','ok','okay','great','helpful'],
    ans:`💗 You're very welcome! Remember — taking care of your health is an act of love for yourself.<br/><br/>
If you have more questions, I'm always here. Stay well! 🌸` }
];

function getBotReply(msg) {
  const lower = msg.toLowerCase();
  for (const item of CB_KB) {
    if (item.keys.some(k => lower.includes(k))) return item.ans;
  }
  // Fallback
  return `💜 I understand your question about "<strong>${msg}</strong>".<br/><br/>
For the most accurate guidance on this, I recommend:<br/>
🩺 Use the <strong>Doctor Consultancy</strong> section to speak to a specialist<br/>
🔍 Try the <strong>PCOS Symptom Checker</strong> for PCOS-related questions<br/>
💬 Ask more specifically and I'll do my best to help!<br/><br/>
Some quick topics I can help with: PCOS symptoms, pregnancy signs, diet tips, doctor visits, postpartum care, BMI, water intake, sleep tips.`;
}

function toggleChatbot() {
  chatbotOpen = !chatbotOpen;
  document.getElementById('chatbot-panel').classList.toggle('open', chatbotOpen);
  if (chatbotOpen) {
    document.getElementById('cb-input').focus();
  }
}

function sendChat() {
  const inp = document.getElementById('cb-input');
  const msg = inp.value.trim();
  if (!msg) return;
  inp.value = '';
  addChatMsg(msg, 'user');
  // Remove quick replies after first message
  const qr = document.getElementById('cb-quick');
  if (qr) qr.remove();
  showTyping();
  setTimeout(() => {
    removeTyping();
    addChatMsg(getBotReply(msg), 'bot');
  }, 900 + Math.random() * 600);
}

function sendQuick(msg) {
  const inp = document.getElementById('cb-input');
  inp.value = msg;
  sendChat();
  const qr = document.getElementById('cb-quick');
  if (qr) qr.remove();
}

function addChatMsg(html, role) {
  const wrap = document.getElementById('cb-messages');
  const div = document.createElement('div');
  div.className = `cb-msg ${role}`;
  div.innerHTML = `<div class="cb-bubble">${html}</div>`;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function showTyping() {
  const wrap = document.getElementById('cb-messages');
  const t = document.createElement('div');
  t.className = 'cb-msg bot';
  t.id = 'cb-typing-indicator';
  t.innerHTML = `<div class="cb-typing"><span></span><span></span><span></span></div>`;
  wrap.appendChild(t);
  wrap.scrollTop = wrap.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('cb-typing-indicator');
  if (t) t.remove();
}
