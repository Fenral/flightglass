/**
 * ONBOARDING · VERT — Ball Flight.
 *
 * Oversetter vertskontrakten i `onboarding.js` til den EKTE skjermens eget
 * api (`window.__impact`). Modulen tegner ingenting, regner ingenting og
 * holder ingen tilstand: den peker onboardingen mot skjermens egne funksjoner.
 *
 * Steg 1–3 bor her. Linsene er kamerastasjoner i skjermen: 2 = DIRECTION,
 * 1 = HEIGHT (D40 — to linser, ikke tre).
 */

const LENS_BY_STATION = Object.freeze({ 1: 'HEIGHT', 2: 'DIRECTION' });
const STATION_BY_LENS = Object.freeze({ HEIGHT: 1, DIRECTION: 2 });

/* D60 — appens standardslag. «Hopp over gir en fornuftig standardtilstand»
   (D102), og skjermens egen standard ER den fornuftige tilstanden. */
const DEFAULT_SHOT = Object.freeze({ face: 2.0, path: 0.0, attack: 3.0, dynLoft: 24, speed: 90 });

/**
 * @param {object} api window.__impact
 * @returns {object} vertskontrakten
 */
export function ballFlightHost(api) {
  const el = (id) => document.getElementById(id);

  return {
    screen: 'ball-flight',

    apply(script) {
      /* Onboardingen snakker stegets språk; skjermen sitt. Oversettelsen er
         ett sted, her, så `steps.js` slipper å kjenne feltnavn.
         `setRangeMode()` tar ikke lenger argument (D124: shot-lesetilstanden
         og Details er ute, instrumentet står permanent i redigering). Kallet
         beholdes fordi det bygger panelet og remåler scenen — men uten en
         verdi som later som om modusen kan velges. */
      api.setRangeMode();
      api.applyShot({
        speed: script.speed,
        face: script.face,
        path: script.path,
        attack: script.attack,
        dynLoft: script.dynLoft,
      });
    },

    read(name) {
      if (name === 'face') return api.state.face;
      if (name === 'dynLoft') return api.state.dynLoft;
      if (name === 'path') return api.state.path;
      return undefined;
    },

    rect(name) {
      const map = { inputPanel: 'panel', lensSwitch: 'stseg', scene: 'stage' };
      const node = el(map[name]);
      return node ? node.getBoundingClientRect() : new DOMRect(0, 0, 0, 0);
    },

    onInput(cb) {
      /* Bobler, ikke capture — og så ett mikrotask-hopp til. Grunnen er målt:
         med capture kjørte onboardingen FØR skjermens egen slider-handler, så
         porten leste forrige verdi og lå ett trykk bak. Mikrotasken garanterer
         at alle synkrone lyttere for hendelsen er ferdige før vi leser. */
      const handler = () => queueMicrotask(cb);
      document.addEventListener('input', handler);
      document.addEventListener('click', handler);
      return () => {
        document.removeEventListener('input', handler);
        document.removeEventListener('click', handler);
      };
    },

    reset() {
      /* `setRangeMode('shot')` er fjernet: shot-tilstanden finnes ikke lenger
         (D124), så kallet var en no-op som pekte på en flate som er borte.
         Standardslaget er hele svaret på «hopp over» (D102/D60). */
      api.applyShot({ ...DEFAULT_SHOT });
    },

    setActiveParam(key) { api.setActiveParam(key); },

    /* Linsevelgeren lå opprinnelig skjult i «shot»-modus, og et steg som pekte
       på den pekte da på et element uten flate — målt: #stseg fikk rect top 0
       og coachmarken havnet utenfor bildet. Etter D124 er skjermen permanent i
       redigering, så velgeren er alltid tegnet. Kallet står som garanti for at
       panelet ER bygget når steg 2 monterer, ikke som et modusbytte. */
    ensureLensVisible() { api.setRangeMode(); },

    setLens(name) { api.setStation(STATION_BY_LENS[name]); },

    /* `state.station` LERPER mellom stasjonene (kamerabevegelse), så den er en
       flyttallsverdi midt i et bytte og forteller ikke hva brukeren valgte.
       `stationTarget` gjør det, og er lest i samme øyeblikk som trykket. */
    readLens() { return LENS_BY_STATION[Math.round(api.stationTarget)]; },
  };
}
