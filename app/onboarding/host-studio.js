/**
 * ONBOARDING · VERT — Impact Studio (landskap).
 *
 * Steg 4–5 bor her. Modulen tegner ingenting og regner ingenting: den peker
 * onboardingen mot skjermens egne funksjoner (`window.__studio`) og formaterer
 * avlesninger gjennom adapteren, aldri for hånd.
 *
 * D107 låser coachmarkens sone i landskap — midtbåndets nedre kant, mellom
 * strike-insetten og orb-railen, aldri over toppstripen. `rect()` under leverer
 * nettopp de tre kantene `steps.js` måler mot.
 */

import { formatLongitudinalCm, formatLieMm } from '../../adapter/src/displayStudio.js';
import { LIE_PRESETS } from '../../engine/src/contactModel.js';

/**
 * @param {object} api window.__studio
 * @returns {object} vertskontrakten
 */
export function studioHost(api) {
  const el = (id) => document.getElementById(id);

  return {
    screen: 'studio',

    apply(script) {
      api.applyStudio({
        plane: script.plane,
        dir: script.dir,
        low: script.low,
        arc: script.arc,
        club: script.club,
        lie: script.lie,
      });
    },

    read(name) {
      const s = api.state;
      if (name === 'low') return s.low;
      if (name === 'arc') return s.arc;
      if (name === 'turfBand') return api.solved ? api.solved.turfBand : null;
      /* D67: foran/bak bærer ORD, aldri nakent fortegn — og ordet kommer fra
         adapteren, slik at coachmarken sier nøyaktig det avlesningen sier. */
      if (name === 'lowPointText') {
        return api.solved ? formatLongitudinalCm(api.solved.effectiveLowPointX * 100) : '';
      }
      /* D3b: underlaget står i samme visning som turfstatusen. */
      if (name === 'lieText') return formatLieMm(LIE_PRESETS[s.lie]);
      return undefined;
    },

    rect(name) {
      /* Low point-markøren er CANVAS, ikke DOM — men Studio skriver
         posisjonen sin til `stage.dataset.lowPointMarker` («view,x,y,1») som
         instrumenteringskrok. Onboardingen leser den for å kunne holde seg
         unna det steget faktisk ber brukeren se på (D114/G-2).
         Returnerer null før scenen har tegnet; kallstedet har fallback. */
      if (name === 'lowPointMarker') {
        const stage = el('stage');
        const parts = (stage && stage.dataset.lowPointMarker || '').split(',');
        if (parts.length < 3) return null;
        const x = Number(parts[1]);
        const y = Number(parts[2]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        const s = stage.getBoundingClientRect();
        return { left: s.left + x, top: s.top + y, right: s.left + x, bottom: s.top + y, width: 0, height: 0 };
      }
      const bySelector = { rail: '.rail', controls: '.controls', topStrip: '.top' };
      if (bySelector[name]) {
        const node = document.querySelector(bySelector[name]);
        return node ? node.getBoundingClientRect() : new DOMRect(0, 0, 0, 0);
      }
      const map = { inset: 'inset', stage: 'stage' };
      const node = el(map[name]);
      return node ? node.getBoundingClientRect() : new DOMRect(0, 0, 0, 0);
    },

    onInput(cb) {
      /* Boblefase + mikrotask, av samme målte grunn som i Ball Flight-verten:
         med capture leste onboardingen tilstanden FØR skjermen hadde skrevet
         den, og lå ett trykk bak. */
      const handler = () => queueMicrotask(cb);
      document.addEventListener('input', handler);
      document.addEventListener('click', handler);
      return () => {
        document.removeEventListener('input', handler);
        document.removeEventListener('click', handler);
      };
    },

    /* D102: hopp over gir skjermens egen standard — Studios RESET er nettopp
       det dokumenterte eksemplet (spec 03 regel 5), så vi kaller den. */
    reset() { api.reset(); },

    setActiveParam(key) { api.selectParam(key); },

    /* D3b: «Pure» og «ingen turfkontakt» leses som en selvmotsigelse uten at
       underlaget er synlig. Insetten bærer LIE-navnet og mm-verdien. */
    openStrikeInset() { api.setInspect(true); },
  };
}
