import { readContext, updateContext } from '../shared/sa-v1-context.js';
import { solveFlight } from '../shared/impact-flight.js';
import { mountConnectionsMap } from './connections-map.js';
import { runOpeningSplash } from './sa-opening.js';
import * as saIap from '../shared/sa-iap.js';
import { track } from '../shared/sa-analytics.js';

const byId = id => document.getElementById(id);
const onboarding = byId('onboarding');
const onboardingScroll = onboarding.querySelector('.onboarding-scroll');
const steps = [...onboarding.querySelectorAll('[data-onboarding-step]')];
const live = byId('onboardingLive');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const labLoft = byId('onboardingLoft');
const accessCenter = byId('accessCenter');
const mapRoot = document.querySelector('[data-home-connections]');
const defaultActions = byId('homeDefaultActions');
const askSelected = byId('homeAskSelected');
const iapReady = saIap.init();
const LAB_INPUT = Object.freeze({
  clubSpeed: 90,
  faceAngle: 2,
  clubPath: 0,
  attackAngle: 3,
});
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
labLoft.value = String(context.onboarding.labLoft);

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

function renderLab({ announce = false, persist = false } = {}) {
  const dynamicLoft = Number(labLoft.value);
  const result = solveFlight({ ...LAB_INPUT, dynamicLoft });
  const progress = (dynamicLoft - Number(labLoft.min))
    / (Number(labLoft.max) - Number(labLoft.min));

  byId('labLoftValue').textContent = `${dynamicLoft.toFixed(1)}°`;
  byId('labLaunch').textContent = `${result.launchAngle.toFixed(1)}°`;
  byId('labSpinLoft').textContent = `${result.spinLoft.toFixed(1)}°`;
  byId('labBackspin').textContent = `${Math.round(result.backspin)} rpm`;
  labLoft.style.setProperty('--lab-progress', `${(progress * 100).toFixed(1)}%`);
  if (persist) {
    setContext({ onboarding: { labLoft: dynamicLoft } });
    track('onboarding_lab_changed', { changeKey: 'dynamicLoft', value: dynamicLoft });
  }

  const lab = byId('onboardingLab');
  lab.classList.remove('is-updating');
  if (!reducedMotion) requestAnimationFrame(() => lab.classList.add('is-updating'));

  if (announce) {
    live.textContent = `Delivered loft ${dynamicLoft.toFixed(0)} degrees. Launch ${result.launchAngle.toFixed(1)} degrees, spin loft ${result.spinLoft.toFixed(1)} degrees, backspin ${Math.round(result.backspin)} rpm.`;
  }
}

function stepLab(delta) {
  const next = Math.max(
    Number(labLoft.min),
    Math.min(Number(labLoft.max), Number(labLoft.value) + delta),
  );
  labLoft.value = String(next);
  renderLab({ announce: true, persist: true });
}

function renderStep(step, { focus = true, announce = true } = {}) {
  const safeStep = Math.max(1, Math.min(4, Number(step) || 1));
  for (const section of steps) {
    const active = Number(section.dataset.onboardingStep) === safeStep;
    section.hidden = !active;
    section.classList.remove('is-entering');
    if (active && !reducedMotion) {
      requestAnimationFrame(() => {
        section.classList.add('is-entering');
        section.addEventListener('animationend', () => section.classList.remove('is-entering'), { once: true });
      });
    }
  }
  byId('onboardingProgress').textContent = `Step ${safeStep} of 4`;
  byId('onboardingProgressBar').style.transform = `scaleX(${safeStep * .25})`;
  byId('onboardingBack').hidden = safeStep === 1;
  onboarding.dataset.currentStep = String(safeStep);
  onboardingScroll.scrollTop = 0;
  if (safeStep === 3) renderLab();

  const heading = onboarding.querySelector(`[data-onboarding-step="${safeStep}"] h2`);
  if (announce) live.textContent = `Step ${safeStep} of 4. ${heading?.textContent || ''}`;
  if (focus && heading) requestAnimationFrame(() => heading.focus({ preventScroll: true }));
}

function goToStep(step) {
  setContext({ onboarding: { step, dismissed: false } });
  renderStep(context.onboarding.step);
}

function openOnboarding({ restart = false } = {}) {
  const step = restart ? 1 : context.onboarding.step;
  setContext({ onboarding: { step, dismissed: false } });
  document.body.dataset.onboardingActive = 'true';
  if (!onboarding.open) {
    if (typeof onboarding.showModal === 'function') onboarding.showModal();
    else onboarding.setAttribute('open', '');
  }
  renderStep(step, { focus: true, announce: true });
  track('onboarding_started', { step });
}

function closeOnboarding({ complete = false } = {}) {
  setContext({ onboarding: { complete, dismissed: true } });
  document.body.removeAttribute('data-onboarding-active');
  if (onboarding.open && typeof onboarding.close === 'function') onboarding.close();
  else onboarding.removeAttribute('open');
  connections.reset();
  requestAnimationFrame(() => byId('homeMain')?.focus({ preventScroll: true }));
}

byId('openHomeTour').addEventListener('click', () => {
  openOnboarding({ restart: context.onboarding.complete });
});
byId('beginOnboarding').addEventListener('click', () => goToStep(2));
byId('continueTour').addEventListener('click', () => goToStep(3));
byId('continueFromLab').addEventListener('click', () => goToStep(4));
byId('onboardingBack').addEventListener('click', () => goToStep(context.onboarding.step - 1));
byId('onboardingLater').addEventListener('click', () => closeOnboarding({ complete: context.onboarding.complete }));
byId('finishOnboarding').addEventListener('click', () => {
  track('onboarding_completed', { step: 4, completed: true });
  closeOnboarding({ complete: true });
});

labLoft.addEventListener('input', () => renderLab());
labLoft.addEventListener('change', () => renderLab({ announce: true, persist: true }));
byId('labLoftDown').addEventListener('click', () => stepLab(-1));
byId('labLoftUp').addEventListener('click', () => stepLab(1));

for (const link of onboarding.querySelectorAll('[data-complete-onboarding]')) {
  link.addEventListener('click', () => {
    setContext({ onboarding: { complete: true, dismissed: true, step: 4 } });
    track('onboarding_completed', { step: 4, completed: true });
  });
}

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

onboarding.addEventListener('cancel', event => {
  event.preventDefault();
  closeOnboarding({ complete: context.onboarding.complete });
});

renderLab();
await runOpeningSplash();

if (!context.onboarding.complete && !context.onboarding.dismissed) {
  requestAnimationFrame(() => openOnboarding());
} else {
  requestAnimationFrame(() => byId('homeMain')?.focus({ preventScroll: true }));
}

window.__flightglassHome = Object.freeze({
  getContext: () => readContext(),
  getConnectionsState: connections.getState,
  openOnboarding,
});
