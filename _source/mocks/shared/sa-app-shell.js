export const APP_ROUTES = Object.freeze([
  {
    id: 'home',
    label: 'Home',
    href: '../home/index.html',
    file: 'index.html',
  },
  {
    id: 'range',
    label: 'Range',
    href: '../ball-flight/impact.html',
    file: 'impact.html',
  },
  {
    id: 'studio',
    label: 'Studio',
    href: '../impact-studio/impact-studio.html',
    file: 'impact-studio.html',
  },
  {
    id: 'jarvis',
    label: 'Guide',
    href: './jarvis.html',
    file: 'jarvis.html',
  },
]);

const ORIENTATION = Object.freeze({
  home: 'portrait',
  range: 'portrait',
  studio: 'landscape',
  jarvis: null,
});

function routeFromDocument(doc) {
  const declared = doc.body?.dataset.saRoute;
  if (APP_ROUTES.some((route) => route.id === declared)) return declared;

  const file = new URL(doc.location.href).pathname.split('/').pop() || 'index.html';
  return APP_ROUTES.find((route) => route.file === file)?.id || null;
}

function installOrientationGuard(doc, currentRoute) {
  const expected = ORIENTATION[currentRoute];
  const overlay = doc.querySelector('.rotate');
  if (!expected || !overlay || !doc.defaultView?.matchMedia) return;

  const media = doc.defaultView.matchMedia(`(orientation: ${expected})`);
  const original = {
    role: overlay.getAttribute('role'),
    ariaModal: overlay.getAttribute('aria-modal'),
    tabIndex: overlay.getAttribute('tabindex'),
  };
  const managed = new Map();
  let lastFocus = null;

  const setAttribute = (name, value) => {
    if (value === null) overlay.removeAttribute(name);
    else overlay.setAttribute(name, value);
  };

  const sync = () => {
    const blocked = !media.matches;
    overlay.toggleAttribute('data-sa-orientation-blocked', blocked);

    if (blocked) {
      lastFocus = doc.activeElement;
      setAttribute('role', 'dialog');
      setAttribute('aria-modal', 'true');
      setAttribute('tabindex', '0');

      for (const child of doc.body.children) {
        if (child === overlay || child.tagName === 'SCRIPT') continue;
        if (!managed.has(child)) managed.set(child, child.hasAttribute('inert'));
        child.setAttribute('inert', '');
      }

      doc.defaultView.requestAnimationFrame(() => overlay.focus({ preventScroll: true }));
      return;
    }

    setAttribute('role', original.role);
    setAttribute('aria-modal', original.ariaModal);
    setAttribute('tabindex', original.tabIndex);
    for (const [child, wasInert] of managed) {
      if (!wasInert) child.removeAttribute('inert');
    }
    managed.clear();

    if (lastFocus instanceof doc.defaultView.HTMLElement && lastFocus.isConnected) {
      lastFocus.focus({ preventScroll: true });
    }
    lastFocus = null;
  };

  overlay.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || !overlay.hasAttribute('data-sa-orientation-blocked')) return;
    event.preventDefault();
    overlay.focus({ preventScroll: true });
  });
  media.addEventListener?.('change', sync);
  sync();
}

export function mountAppShell(doc = document) {
  if (!doc.body || doc.body.dataset.saShellReady === 'true') return;

  const currentRoute = routeFromDocument(doc);
  if (!currentRoute) return;
  doc.body.dataset.saRoute = currentRoute;
  doc.body.dataset.saShellReady = 'true';
  doc.body.classList.add('sa-shell-ready');
  installOrientationGuard(doc, currentRoute);

  // Passive and idempotent: entitlement state is ready before a protected
  // value moment, but this never opens pricing or interrupts cold launch.
  import('./sa-iap.js').then(({ init }) => init()).catch(() => {});

  try {
    const debug = new URLSearchParams(doc.location.search).get('sa_debug');
    const local = ['localhost', '127.0.0.1'].includes(doc.location.hostname)
      && doc.location.protocol === 'http:' && Boolean(doc.location.port);
    if (local && debug === 'paywall') import('./sa-paywall.js').catch(() => {});
  } catch (_) {}

  if (currentRoute === 'range') {
    import('./sa-range-context.js')
      .then(({ mountGuidedRangeContext }) => mountGuidedRangeContext(doc))
      .catch(() => {});
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountAppShell(), { once: true });
  } else {
    mountAppShell();
  }
}
