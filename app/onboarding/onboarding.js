/**
 * ONBOARDING · CONTROLLER — seks steg inne i de EKTE skjermene (D56).
 *
 * Onboardingen eier ingen skjerm. Den monteres OPPÅ Ball Flight, Impact Studio
 * og Connections, skriver tilstanden stegene krever (D99), legger coachmarken
 * i det som er ledig (D100) og kommer seg ut igjen. Finnes det en mockup av en
 * skjerm her, er det en feil — det finnes bare appen.
 *
 * ── VERTSKONTRAKTEN ────────────────────────────────────────────────────────
 * Hver skjerm leverer et lite objekt til `mountOnboarding()`:
 *
 *   screen            'ball-flight' | 'studio' | 'connections'
 *   apply(script)     sett tilstanden ØYEBLIKKELIG (D99), ingen glidning
 *   read(name)        les en live verdi (face, dynLoft, low, arc, turfBand …)
 *   rect(name)        DOMRect for et navngitt element — grunnlaget for D100
 *   onInput(cb)       kall cb når brukeren har dratt i noe; returner avmelding
 *   reset()           tilbake til skjermens egen standard (D102, hopp over)
 *   setActiveParam(n) løft en parameter til aktiv
 *   setLens/readLens  kun Ball Flight · openStrikeInset kun Studio ·
 *   setMetric         kun Connections
 *
 * Verten vet ingenting om steg. Onboardingen vet ingenting om tegning.
 *
 * ── REKKEFØLGEN OVER DOKUMENTER ────────────────────────────────────────────
 * Stegene spenner tre dokumenter, så «hvilket steg er vi på» kan ikke bo i en
 * variabel. Den bor i sessionStorage og leses av hver vert når den monterer.
 */

import { STEPS, TOTAL } from './steps.js';
import { CHROME, UNITS_SCREEN } from './copy.js';
import { step1Refs, step3Refs } from './refs.js';
import { getUnitSystem, setUnitSystem, hasChosenUnits } from '../shared/sa-units.js';

const STATE_KEY = 'fg.onboarding.v1';

/* D96: home/ er onboardingens midlertidige anker — start og landing. */
const HOME_URL = '../home/index.html';

const SCREEN_URL = Object.freeze({
  'ball-flight': '../ball-flight/impact.html',
  studio: '../studio/index.html',
  connections: '../connections/index.html#curve',
});

/* ── tilstand ─────────────────────────────────────────────────────────────── */

function readState() {
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Number.isInteger(parsed && parsed.step) ? parsed : null;
  } catch { return null; }
}

function writeState(state) {
  try { sessionStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch { /* øktverdi holder */ }
}

function clearState() {
  try { sessionStorage.removeItem(STATE_KEY); } catch { /* ingenting å rydde */ }
}

/** Hvilket steg onboardingen står på, eller null når den ikke kjører. */
export function currentStep() {
  const s = readState();
  return s ? s.step : null;
}

/** Start på steg 1. Kalles av enhetsskjermen når valget er tatt. */
export function beginOnboarding() { writeState({ step: 1 }); }

/** Avslutt — både «ferdig» og «hopp over» ender her (D101/D102). */
export function endOnboarding() { clearState(); }

/** Har brukeren vært gjennom det obligatoriske spørsmålet? (D56) */
export function needsUnitsQuestion() { return !hasChosenUnits(); }

/**
 * Send brukeren til skjermen der gjeldende steg bor. Home kaller denne etter
 * enhetsvalget, og igjen hvis brukeren kommer tilbake midt i onboardingen —
 * Home er ankeret (D96), ikke et steg.
 */
export function goToCurrentStep() {
  const step = currentStep();
  if (step == null) return false;
  const def = STEPS.find(s => s.n === step);
  if (!def) { endOnboarding(); return false; }
  window.location.href = SCREEN_URL[def.screen];
  return true;
}

/* ── plassering (D100) ────────────────────────────────────────────────────── */

/**
 * Oversett stegets `place()`-svar til CSS. Alle tall kommer fra vertens egne
 * målte rektangler; ingen av dem er hardkodet.
 */
function applyPlacement(el, spec, host) {
  const margin = 16;
  el.style.left = ''; el.style.right = ''; el.style.top = ''; el.style.bottom = '';
  el.style.width = ''; el.style.maxHeight = '';

  if (spec.pointer) el.dataset.pointer = spec.pointer;
  else delete el.dataset.pointer;
  el.dataset.orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

  /* ── SONE-PLASSERING (D107/D114) ─────────────────────────────────────────
     Et steg kan levere en hel ledig sone i stedet for én kant. Boksen legges
     da i sonens NEDRE kant og klemmes inn i alle fire. Høyden begrenses av
     sonen selv — er teksten høyere, ruller den heller enn å vokse ut av
     flaten den skulle holde seg unna. */
  if (spec.zone) {
    const z = spec.zone;
    const left = Math.max(margin, Math.min(z.left, window.innerWidth - margin - 160));
    const right = Math.min(window.innerWidth - margin, Math.max(z.right, left + 160));
    el.style.left = Math.round(left) + 'px';
    el.style.width = Math.round(right - left) + 'px';
    /* Sonens EGEN høyde, uten gulv. Et gulv her (jeg satte 96 px) lot boksen
       vokse ut over sonen og havne 1 px fra toppstripen — garantien sonen
       finnes for å gi, brutt av bekvemmelighetshensyn. Er sonen lav, ruller
       boksen; det er et ærlig signal om at flaten er trang. */
    el.style.maxHeight = Math.round(Math.max(0, z.bottom - z.top)) + 'px';
    el.style.bottom = Math.round(Math.max(margin, window.innerHeight - z.bottom)) + 'px';
    return;
  }

  const leftEdge = spec.leftEdge == null ? margin : spec.leftEdge;
  const rightEdge = spec.rightEdge == null ? window.innerWidth - margin : spec.rightEdge;
  const available = Math.max(120, rightEdge - leftEdge);
  const width = spec.width == null ? available : available * spec.width;

  el.style.left = Math.round(Math.max(margin, leftEdge)) + 'px';
  el.style.width = Math.round(Math.min(width, window.innerWidth - 2 * margin)) + 'px';

  if (spec.bottom != null) el.style.bottom = Math.round(spec.bottom) + 'px';
  if (spec.top != null) el.style.top = Math.round(spec.top) + 'px';
  if (spec.maxHeight != null) el.style.maxHeight = Math.round(spec.maxHeight) + 'px';

  /* Pekeren skal treffe det den peker på, ikke boksens midte. */
  if (spec.pointer && spec.pointAt) {
    const target = host.rect(spec.pointAt);
    el.style.setProperty('--ob-pointer-x', Math.round(target.left + target.width / 2 - leftEdge) + 'px');
  }
}

/* ── coachmarken ──────────────────────────────────────────────────────────── */

function buildCoachmark() {
  const box = document.createElement('section');
  box.className = 'ob-coachmark';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', 'Onboarding');
  box.innerHTML = [
    '<div class="ob-head"><span class="ob-counter"></span></div>',
    '<p class="ob-text"></p>',
    '<div class="ob-actions">',
    '<button type="button" class="ob-btn ob-skip"></button>',
    '<button type="button" class="ob-btn ob-next"></button>',
    '</div>',
  ].join('');
  return box;
}

/* ── montering ────────────────────────────────────────────────────────────── */

/**
 * Monter onboardingen i en vert. Er onboardingen ikke i gang, gjør denne
 * ingenting. Står den på et steg som hører til en annen skjerm, sendes
 * brukeren dit steget faktisk bor.
 *
 * @param {object} host vertskontrakten over
 * @returns {{active: boolean, teardown?: () => void}}
 */
export function mountOnboarding(host) {
  const step = currentStep();
  if (step == null) return { active: false };

  const def = STEPS.find(s => s.n === step);
  if (!def) { endOnboarding(); return { active: false }; }

  if (def.screen !== host.screen) {
    window.location.href = SCREEN_URL[def.screen];
    return { active: false };
  }

  const units = getUnitSystem();
  const refs = {
    step1: step1Refs(units),
    step3: step3Refs(units),
    step4: () => ({ lowPoint: host.read('lowPointText') }),
    step5: () => ({ lie: host.read('lieText') }),
  };

  /* Progresjonsflagg lever per steg: de svarer på «har brukeren sett det
     ennå», og det spørsmålet nullstilles når steget gjør det. */
  host.progress = {};

  const box = buildCoachmark();
  document.body.appendChild(box);
  const counterEl = box.querySelector('.ob-counter');
  const textEl = box.querySelector('.ob-text');
  const skipEl = box.querySelector('.ob-skip');
  const nextEl = box.querySelector('.ob-next');

  counterEl.textContent = CHROME.counter(def.n, TOTAL);
  skipEl.textContent = CHROME.skip;
  nextEl.textContent = def.n === TOTAL ? CHROME.done : CHROME.next;

  /* D105: et steg kan bære handlingen selv. Da tegnes ingen NEXT — knappen
     ville tilbudt en vei rundt det steget ber om. */
  const showsNext = def.chrome ? def.chrome.next !== false : true;
  if (!showsNext) nextEl.remove();

  /* D99: tilstanden settes ØYEBLIKKELIG ved stegbytte. */
  if (def.script) host.apply(def.script);
  def.enter(host);

  let offInput = null;

  function teardown() {
    if (offInput) offInput();
    window.removeEventListener('resize', onResize);
    document.removeEventListener('click', exitOnHome, true);
    document.removeEventListener('keydown', exitOnEscape, true);
    box.remove();
  }

  function render() {
    def.watch(host);
    textEl.textContent = def.text(host, refs);
    if (showsNext) nextEl.disabled = def.gate ? !def.gate(host) : false;
    applyPlacement(box, def.place(host), host);
  }

  function onResize() { applyPlacement(box, def.place(host), host); }

  function advance() {
    if (def.n === TOTAL) { endOnboarding(); teardown(); window.location.href = HOME_URL; return; }
    const next = STEPS.find(s => s.n === def.n + 1);
    writeState({ step: def.n + 1 });
    teardown();
    if (next.screen === host.screen) mountOnboarding(host);
    else window.location.href = SCREEN_URL[next.screen];
  }

  /* D102: hopp over gir en fornuftig standardtilstand — skjermens egen. */
  function skip() { endOnboarding(); teardown(); host.reset(); }

  nextEl.addEventListener('click', advance);
  skipEl.addEventListener('click', skip);

  /* D102: HOME-sirkelen forblir AKTIV under onboardingen, og et trykk
     avslutter den som hopp.
     Uten dette blir HOME en felle: Home er onboardingens anker (D96) og
     sender brukeren tilbake til gjeldende steg, så trykket ville loopet i
     stedet for å slippe folk ut. NAVIGASJON.md sier tilbakeveien aldri
     forsvinner — da kan den heller ikke gå i ring.
     Capture, slik at vi rekker å avslutte før lenken navigerer eller
     nav.js sin Escape-håndtering flytter dokumentet. */
  function exitOnHome(event) {
    const home = event.target.closest?.('[data-home-exit], .home-circle, .ts-back');
    if (!home) return;
    endOnboarding();
    teardown();
  }
  function exitOnEscape(event) {
    if (event.key !== 'Escape') return;
    endOnboarding();
    teardown();
  }
  document.addEventListener('click', exitOnHome, true);
  document.addEventListener('keydown', exitOnEscape, true);

  /* Steg 2 har ingen tallendring: handlingen ER linsebyttet, så byttet fører
     videre av seg selv i stedet for å kreve et ekstra trykk. */
  function onInput() {
    render();
    if (def.n === 2 && def.gate(host)) advance();
  }

  offInput = host.onInput(onInput);
  window.addEventListener('resize', onResize);

  render();
  return { active: true, teardown };
}

/* ── enhetsskjermen (D103) ────────────────────────────────────────────────── */

/**
 * Ett obligatorisk spørsmål, før steg 1 (D56). Ett trykk ER svaret — ingen
 * fortsett-knapp. Modellgrense-setningen står her, fordi dette er den eneste
 * tall-frie flaten før første tall (D11).
 *
 * @param {() => void} onChosen kalles når pakken er valgt
 * @returns {HTMLElement} skjermen, allerede i DOM
 */
export function mountUnitsScreen(onChosen) {
  const screen = document.createElement('div');
  screen.className = 'ob-units';
  screen.setAttribute('role', 'dialog');
  screen.setAttribute('aria-modal', 'true');
  screen.setAttribute('aria-label', UNITS_SCREEN.title);

  const choices = UNITS_SCREEN.options
    .map(o => '<button type="button" class="ob-choice" data-system="' + o.system + '">' + o.label + '</button>')
    .join('');

  screen.innerHTML = [
    '<h1 class="ob-units-title">' + UNITS_SCREEN.title + '</h1>',
    '<div class="ob-choices">' + choices + '</div>',
    '<p class="ob-units-support">' + UNITS_SCREEN.support + '</p>',
    '<p class="ob-units-boundary">' + UNITS_SCREEN.boundary + '</p>',
  ].join('');

  screen.addEventListener('click', (e) => {
    const btn = e.target.closest('.ob-choice');
    if (!btn) return;
    setUnitSystem(btn.dataset.system);
    beginOnboarding();
    screen.remove();
    if (onChosen) onChosen();
  });

  document.body.appendChild(screen);
  const first = screen.querySelector('.ob-choice');
  if (first) first.focus({ preventScroll: true });
  return screen;
}
