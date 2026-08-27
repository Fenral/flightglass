import { readContext, updateContext } from '../shared/sa-v1-context.js';
// D76: gammel mockmotor byttet til engine/ (drop-in); formatering via adapter.
import { solveFlight } from '../../engine/src/solveFlight.js';
import { displayValue } from '../../adapter/src/displayFlight.js';
import { mountConnectionsMap } from './connections-map.js';
import { runOpeningSplash } from './sa-opening.js';
import * as saIap from '../shared/sa-iap.js';
import { track } from '../shared/sa-analytics.js';

const byId = id => document.getElementById(id);
const accessCenter = byId('accessCenter');
const mapRoot = document.querySelector('[data-home-connections]');
const defaultActions = byId('homeDefaultActions');
const askSelected = byId('homeAskSelected');
const iapReady = saIap.init();
const GUIDE_TARGETS = Object.freeze({
  plane: ['impact', 'attack-angle'],
  direction: ['direction', 'face-path'],
  lowpoint: ['impact', 'low-point'],
  ballposition: ['impact', 'low-point'],
  archeight: ['impact', 'thin-contact'],
  attack: ['impact', 'attack-angle'],
  path: ['direction', 'face-path'],
  face: ['direction', 'face-or-path-first'],
  loft: ['launch-spin', 'dynamic-loft-spin-loft'],
  speed: ['distance', 'ball-speed-smash'],
  strike: ['impact', 'fat-contact'],
  spinloft: ['launch-spin', 'dynamic-loft-spin-loft'],
  spinaxis: ['direction', 'curve-right'],
  launchdir: ['direction', 'start-right'],
  launchangle: ['launch-spin', 'ball-too-high'],
  ballspeed: ['distance', 'ball-speed-smash'],
  backspin: ['launch-spin', 'backspin'],
  curve: ['direction', 'curve-right'],
  apex: ['launch-spin', 'ballooning'],
  carry: ['distance', 'lost-carry'],
  landingangle: ['distance', 'carry-total'],
  side: ['direction', 'curve-right'],
  total: ['distance', 'carry-total'],
});

let context = readContext();

function setContext(patch) {
  context = updateContext(patch);
  return context;
}

function guideHref(id) {
  const [topic, question] = GUIDE_TARGETS[id] || ['direction', 'face-path'];
  return `./jarvis.html?topic=${encodeURIComponent(topic)}&question=${encodeURIComponent(question)}`;
}

function renderMapState(state) {
  mapRoot.dataset.connectionsState = state.selected ? 'focused' : 'all';
  defaultActions.hidden = state.selected;
  askSelected.hidden = !state.selected;
  if (state.selected) {
    askSelected.href = guideHref(state.id);
    askSelected.firstChild.textContent = `Ask about ${state.info.label} `;
  }
}

const connections = mountConnectionsMap(mapRoot, {
  initialSelected: null,
  initialMode: 'causes',
  onSelectionChange: renderMapState,
});

let accessCenterOpener = null;
byId('openAccessCenter').addEventListener('click', () => {
  accessCenterOpener = document.activeElement;
  byId('restoreHomeStatus').textContent = '';
  accessCenter.showModal();
  requestAnimationFrame(() => byId('accessCenterTitle').focus({ preventScroll: true }));
});
accessCenter.addEventListener('click', event => {
  if (event.target === accessCenter) accessCenter.close();
});
accessCenter.addEventListener('close', () => {
  const target = accessCenterOpener;
  accessCenterOpener = null;
  if (target?.isConnected) requestAnimationFrame(() => target.focus({ preventScroll: true }));
});
byId('restoreHomePurchases').addEventListener('click', async () => {
  const button = byId('restoreHomePurchases');
  const status = byId('restoreHomeStatus');
  button.disabled = true;
  status.textContent = 'Checking your store account…';
  await iapReady;
  const result = await saIap.restoreDetailed();
  button.disabled = false;
  if (result.status === saIap.PURCHASE_STATUS.SUCCESS) {
    status.textContent = 'Flightglass Pro restored.';
    track('restore_completed', { route: 'home', restored: true });
  } else if (result.status === saIap.PURCHASE_STATUS.NOT_FOUND) {
    status.textContent = 'No Flightglass Pro purchase was found for this store account.';
  } else if (result.status === saIap.PURCHASE_STATUS.UNAVAILABLE) {
    status.textContent = saIap.isNative()
      ? 'Store access is unavailable in this build. Try again after the app store connection is configured.'
      : 'Open the native iOS or Android app to restore purchases.';
  } else {
    status.textContent = 'The store could not check purchases. Check your connection and try again.';
  }
});

/* ── Onboarding (D97: den gamle firestegs-dialogen er fjernet) ─────────────
 *
 * Mockens onboarding var fire skjermbilder AV appen. D56 sier seks hands-on
 * steg INNE i appen, og D97 avgjorde at den vinner: skjermbilder råtner i takt
 * med at skjermene endres, og en illustrasjon av en flate er ikke flaten.
 *
 * Home er onboardingens anker (D96) — den starter her og lander her. Selve
 * stegene bor i `app/onboarding/` og monteres på de ekte skjermene.
 */
const { needsUnitsQuestion, mountUnitsScreen, currentStep, goToCurrentStep, beginOnboarding } =
  await import('../onboarding/onboarding.js');

/* «?»-knappen åpnet den gamle turen. Den kan ikke bli stående død, så den
   starter de seks stegene på nytt — samme betydning som før, nytt innhold.
   Enheten spørres ikke om igjen; det valget er tatt og bor i Innstillinger
   den dagen den flaten finnes (D27-resten, flagget som ubygget).
   MERK: at knappen skal RESTARTE framfor å forsvinne er mitt valg, ikke et
   vedtak — meldt som E-b. */
byId('openHomeTour').addEventListener('click', () => {
  beginOnboarding();
  goToCurrentStep();
});

await runOpeningSplash();

if (needsUnitsQuestion()) {
  /* D56/D103: ett obligatorisk spørsmål, og det kommer FØR steg 1 — alle tall
     i de seks stegene vises i valgt enhet. Ett trykk er hele svaret. */
  mountUnitsScreen(() => goToCurrentStep());
} else if (currentStep() != null) {
  /* Kom brukeren tilbake til Home midt i onboardingen, fortsetter den der. */
  goToCurrentStep();
} else {
  requestAnimationFrame(() => byId('homeMain')?.focus({ preventScroll: true }));
}

window.__flightglassHome = Object.freeze({
  getContext: () => readContext(),
  getConnectionsState: connections.getState,
});
