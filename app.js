'use strict';

/* ---------- Данни за стъпките ---------- */
// part: ключ на частта; wetcoat: true → показва се само в WetCoat ден
const PARTS = {
  a: { name: 'А — Джантите',   color: 'var(--part-a)' },
  b: { name: 'Б — WetCoat',    color: 'var(--part-b)' },
  v: { name: 'В — Каросерията', color: 'var(--part-v)' },
  g: { name: 'Г — Подсушаване', color: 'var(--part-g)' },
};

const STEPS = [
  // ЧАСТ А — Джантите (винаги първо, и четирите наведнъж)
  { part: 'a', emoji: '🪣', title: 'Забъркай кофата',
    text: 'Напълни кофата с вода и 1–2 капачки Bathe. Разбъркай на пяна.',
    tip: 'Кофата и гъбата са само за джанти.' },
  { part: 'a', emoji: '💦', title: 'Изплакни четирите джанти',
    text: 'Свали хлабавата кал от всичките четири джанти с водоструйката.',
    tip: 'Пистолет на 20–30 см от ръбовете.' },
  { part: 'a', emoji: '🧽', title: 'Измий четирите джанти',
    text: 'Всяка джанта с гъбата: спици, лице, борд. Без силно търкане.',
    warn: 'Не пипай лицето с общата четка на автомивката — тя дращи.' },
  { part: 'a', emoji: '🪣', title: 'Изплаквай гъбата',
    text: 'Между джантите топвай гъбата в кофата, за да махаш песъчинките.' },
  { part: 'a', emoji: '💦', title: 'Изплакни четирите джанти',
    text: 'Още веднъж всичките четири с водоструйката.' },

  // ЧАСТ Б — WetCoat (само на 2–3 месеца)
  { part: 'b', wetcoat: true, emoji: '🧴', title: 'Напръскай WetCoat',
    text: 'Върху мокрите джанти — по 2–4 пръскания на всяка.',
    warn: 'Само поне 1–2 седмици след ремонта.' },
  { part: 'b', wetcoat: true, emoji: '💦', title: 'Изплакни обилно',
    text: 'Реакцията става при изплакването.' },
  { part: 'b', wetcoat: true, emoji: '🧻', title: 'Подсуши веднага',
    text: 'С микрофибърна кърпа.' },

  // ЧАСТ В — Каросерията
  { part: 'v', emoji: '🚿', title: 'Изплакни колата',
    text: 'Отгоре надолу.' },
  { part: 'v', emoji: '🫧', title: 'Активна пяна',
    text: 'Покрий колата отгоре надолу.' },
  { part: 'v', emoji: '⏳', title: 'Изчакай пяната',
    text: '1–2 минути, да не изсъхва (особено на слънце).',
    timer: 90 },
  { part: 'v', emoji: '💦', title: 'Изплакни обилно',
    text: 'Отгоре надолу, докато няма пяна.' },

  // ЧАСТ Г — Подсушаване
  { part: 'g', emoji: '🧻', title: 'Подсуши джантите',
    text: 'С тяхната кърпа.' },
  { part: 'g', emoji: '✨', title: 'Подсуши колата',
    text: 'С другата кърпа (твърдата вода в София оставя варовик).' },
];

const RULES = [
  ['Кофа и гъба за джанти', ' — само за джанти.'],
  ['Джанти винаги първо', ', после каросерия.'],
  ['WetCoat не е всеки път', ' — на 2–3 месеца.'],
  ['Първите 1–2 седмици след ремонта:', ' само миене.'],
  ['Водоструйка на 20–30 см', ' от ръбовете.'],
];

const LS_KEY = 'ds3-wetcoat';

/* ---------- Състояние ---------- */
const state = {
  wetcoat: false,
  steps: [],   // видимите стъпки според избора
  index: 0,
  timer: null, // { remaining, running, id }
};

const app = document.getElementById('app');

/* ---------- Помощни ---------- */
function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function visibleSteps() {
  return STEPS.filter((s) => !s.wetcoat || state.wetcoat);
}

function clearTimer() {
  if (state.timer && state.timer.id) clearInterval(state.timer.id);
  state.timer = null;
}

/* ---------- Стартов екран ---------- */
function renderStart() {
  clearTimer();
  const screen = el(`
    <section class="screen start">
      <div class="logo">🚿</div>
      <h1>Миене на кола</h1>
      <p class="sub">Воден гид стъпка по стъпка</p>
      <p class="question">Днес WetCoat ден ли е?</p>
      <div class="choices">
        <button class="btn btn-primary" data-choice="yes">Да — слагам WetCoat</button>
        <button class="btn btn-secondary" data-choice="no">Не — само миене</button>
      </div>
      <button class="info-link" id="startInfo">ℹ️ Петте правила</button>
    </section>
  `);

  screen.querySelectorAll('[data-choice]').forEach((b) => {
    b.addEventListener('click', () => {
      state.wetcoat = b.dataset.choice === 'yes';
      localStorage.setItem(LS_KEY, b.dataset.choice);
      state.steps = visibleSteps();
      state.index = 0;
      renderStep();
    });
  });
  screen.querySelector('#startInfo').addEventListener('click', openInfo);

  swap(screen);
}

/* ---------- Екран на стъпка ---------- */
function renderStep() {
  clearTimer();
  const steps = state.steps;
  const i = state.index;
  const step = steps[i];
  const part = PARTS[step.part];
  const total = steps.length;

  let noteHtml = '';
  if (step.warn) {
    noteHtml = `<div class="note warn"><span class="ico">⚠️</span><span>${step.warn}</span></div>`;
  } else if (step.tip) {
    noteHtml = `<div class="note tip"><span class="ico">💡</span><span>${step.tip}</span></div>`;
  }

  let timerHtml = '';
  if (step.timer) {
    timerHtml = `
      <div class="timer">
        <div class="timer-display" id="timerDisplay">${fmt(step.timer)}</div>
        <button class="btn btn-primary" id="timerBtn">Пусни таймер</button>
      </div>`;
  }

  const pct = Math.round(((i + 1) / total) * 100);

  const screen = el(`
    <section class="screen step" style="--part-color:${part.color}">
      <div class="topbar">
        <div class="progress-track">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="progress-label">
          <span class="part-badge">Част ${part.name}</span>
          <span>Стъпка ${i + 1} от общо ${total}</span>
        </div>
      </div>

      <div class="card">
        <div class="emoji">${step.emoji}</div>
        <h2>${step.title}</h2>
        <p class="instruction">${step.text}</p>
        ${noteHtml}
        ${timerHtml}
      </div>

      <div class="nav">
        <button class="btn btn-ghost" id="backBtn">← Назад</button>
        <button class="btn btn-primary" id="nextBtn">${i === total - 1 ? 'Готово ✓' : 'Напред →'}</button>
      </div>
    </section>
  `);

  screen.querySelector('#backBtn').addEventListener('click', () => {
    if (i === 0) { renderStart(); }
    else { state.index--; renderStep(); }
  });
  screen.querySelector('#nextBtn').addEventListener('click', () => {
    if (i === total - 1) { renderFinal(); }
    else { state.index++; renderStep(); }
  });

  if (step.timer) setupTimer(screen, step.timer);

  swap(screen);
}

/* ---------- Таймер ---------- */
function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function setupTimer(screen, seconds) {
  const display = screen.querySelector('#timerDisplay');
  const btn = screen.querySelector('#timerBtn');
  state.timer = { remaining: seconds, running: false, id: null };

  btn.addEventListener('click', () => {
    const t = state.timer;
    if (t.running) return;
    // рестарт след завършване
    if (t.remaining <= 0) {
      t.remaining = seconds;
      display.classList.remove('done');
      display.textContent = fmt(t.remaining);
    }
    t.running = true;
    btn.textContent = 'Отброяване…';
    btn.disabled = true;
    t.id = setInterval(() => {
      t.remaining--;
      display.textContent = t.remaining <= 0 ? 'Готово — изплакни сега' : fmt(t.remaining);
      if (t.remaining <= 0) {
        clearInterval(t.id);
        t.id = null;
        t.running = false;
        display.classList.add('done');
        btn.textContent = 'Пусни отново';
        btn.disabled = false;
      }
    }, 1000);
  });
}

/* ---------- Финален екран ---------- */
function renderFinal() {
  clearTimer();
  const rulesHtml = RULES.map(
    ([b, rest]) => `<li><strong>${b}</strong>${rest}</li>`
  ).join('');

  const screen = el(`
    <section class="screen final">
      <div class="logo">🎉</div>
      <h1>Готово!</h1>
      <p class="sub">Колата е чиста${state.wetcoat ? ' и с пресен WetCoat' : ''}.</p>

      <div class="summary">
        <h3>Петте правила</h3>
        <ol class="rules">${rulesHtml}</ol>
      </div>

      <div class="actions">
        <button class="btn btn-primary" id="restartBtn">Започни отново</button>
      </div>
    </section>
  `);

  screen.querySelector('#restartBtn').addEventListener('click', renderStart);
  swap(screen);
}

/* ---------- Инфо панел ---------- */
const infoOverlay = document.getElementById('infoOverlay');
function openInfo() { infoOverlay.hidden = false; }
function closeInfo() { infoOverlay.hidden = true; }
document.getElementById('infoClose').addEventListener('click', closeInfo);
infoOverlay.addEventListener('click', (e) => { if (e.target === infoOverlay) closeInfo(); });

/* ---------- Смяна на екран ---------- */
function swap(screen) {
  app.innerHTML = '';
  app.appendChild(screen);
  window.scrollTo(0, 0);
}

/* ---------- Service worker ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: './' })
      .then((reg) => console.log('SW регистриран:', reg.scope))
      .catch((err) => console.warn('SW грешка:', err));
  });
}

/* ---------- Спри double-tap zoom (резервно, за iOS) ---------- */
// Дори когато CSS touch-action се игнорира, блокираме второто бързо тапване.
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 320) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });

/* ---------- Старт ---------- */
renderStart();
