/**
 * ONBOARDING · VERT — Impact Studio (portrett, v4).
 *
 * Steg 4–5 bor her. Modulen tegner ingenting og regner ingenting: den peker
 * onboardingen mot skjermens egne funksjoner (`window.__studio`) og formaterer
 * avlesninger gjennom adapteren, aldri for hånd.
 *
 * ── REVISJON ETTER v4 (D133–D141) ──────────────────────────────────────────
 * Studio er bygget om fra landskap til portrett. Rollene i `rect()` er nye:
 *
 *   FØR (landskap)        NÅ (portrett v4)
 *   .top                  .topbar + .metrics + .strike-strip
 *   #inset                — finnes ikke; lie bor i `.scene-tools`
 *   .rail                 — finnes ikke; parameterne bor i `.control-deck`
 *   .controls             .control-deck
 *
 * `openStrikeInset` er fjernet fra kontrakten: strike-svaret er alltid synlig
 * i portrett, så kallet ville latt som det gjorde noe. B har siden fjernet
 * `setInspect` fra API-et, som nå er nøyaktig de fem rollene denne filen
 * bruker: state · solved · applyStudio · selectParam · reset.
 *
 * **D3b er fortsatt oppfylt, men av et annet element:** lie-velgeren i
 * `.scene-tools` viser navn OG mm («FAIRWAY · 8 mm») i samme visning som
 * strike-båndet. Sonen holder seg unna den — mister vi den, mister vi
 * underlaget, og «Pure uten bakkekryssing» blir en selvmotsigelse igjen.
 */

import { formatLongitudinalCm, formatLieMm } from '../../adapter/src/displayStudio.js';
import { LIE_PRESETS } from '../../engine/src/contactModel.js';

/**
 * @param {object} api window.__studio
 * @returns {object} vertskontrakten
 */
export function studioHost(api) {
  const el = (id) => document.getElementById(id);
  const EMPTY = () => new DOMRect(0, 0, 0, 0);

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
      /* DET STEGET BER BRUKEREN SE PÅ — sonen skal aldri dekke det (D114).
       *
       * Vi måler de EKTE SVG-elementene, ikke `stage.dataset.lowPointMarker`.
       * Grunnen er ikke lenger at kroken er upålitelig — B rettet den
       * 2026-08-28, og jeg har verifisert at den nå treffer `#foLowPoint`
       * innenfor 0,1 px. Grunnen er at kroken bare kjenner LOW POINT, og i
       * v4 er det ikke low point som beveger seg:
       *
       *   `#foLowPoint`   står FAST  (uendret gjennom hele vandringen)
       *   `#foBallGroup`  VANDRER    (x 181 → 240 over −8…+12 cm)
       *
       * Steg 4 ber brukeren se den bevegelsen. En vakt som bare følger
       * markøren ville vernet om det som står stille og latt boksen legge seg
       * oppå det som flytter seg. Derfor vernes BEGGE, som ett anker.
       *
       * (Historikk verdt å beholde: kroken skrev opprinnelig SVG-brukerenheter
       * mens forbrukeren leste dem som CSS-piksler — 131 px feil, usynlig i
       * enhver DOM-sjekk. Å måle elementene direkte har ingen enhet å ta feil
       * av, og overlever neste ombygging uten å måtte revideres.) */
      if (name === 'lowPointMarker') {
        const nodes = ['foLowPoint', 'foBallGroup', 'dtlImpactPoint', 'dtlBallGroup']
          .map(el)
          .filter((n) => n && n.getBoundingClientRect().width > 0);
        if (!nodes.length) return null;
        const rects = nodes.map((n) => n.getBoundingClientRect());
        const top = Math.min(...rects.map((r) => r.top));
        const left = Math.min(...rects.map((r) => r.left));
        const right = Math.max(...rects.map((r) => r.right));
        const bottom = Math.max(...rects.map((r) => r.bottom));
        return { left, top, right, bottom, width: right - left, height: bottom - top };
      }

      /* Rollenavnene følger B sin overleveringsspec, så kontrakten leses likt
         fra begge sider. Alle tre topp-elementene er HARDE kanter: de bærer
         avlesningene stegene peker på, og en coachmark oppå dem skjuler
         svaret steget nettopp ba brukeren se. */
      const bySelector = {
        topStrip: '.topbar',
        /* Overtar insettens D3b-jobb: turfstatus + mm. */
        strikeStrip: '#strikeStrip',
        /* Kølle- og lie-velgerne — lie-NAVNET bor her (D3b sin andre halvdel). */
        contextTools: '.scene-tools',
        controls: '.control-deck',
        stage: '#stage',
      };
      const node = bySelector[name] ? document.querySelector(bySelector[name]) : null;
      return node ? node.getBoundingClientRect() : EMPTY();
    },

    onInput(cb) {
      /* Boblefase + mikrotask, av samme målte grunn som i Ball Flight-verten:
         med capture leste onboardingen tilstanden FØR skjermen hadde skrevet
         den, og lå ett trykk bak. `change` er med fordi v4 bruker <select>
         for kølle og lie. */
      const handler = () => queueMicrotask(cb);
      document.addEventListener('input', handler);
      document.addEventListener('change', handler);
      document.addEventListener('click', handler);
      return () => {
        document.removeEventListener('input', handler);
        document.removeEventListener('change', handler);
        document.removeEventListener('click', handler);
      };
    },

    /* D102: hopp over gir skjermens egen standard — Studios egen Reset. */
    reset() { api.reset(); },

    setActiveParam(key) { api.selectParam(key); },
  };
}
