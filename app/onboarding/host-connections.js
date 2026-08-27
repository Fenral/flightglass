/**
 * ONBOARDING · VERT — Connections.
 *
 * Steg 6 bor her, og er det eneste lesesteget (D101): Connections er
 * motoruavhengig (D44), så det finnes ingen størrelse å dra i. Kartet åpnes på
 * Curve med roten fokusert, og coachmarken knytter kjeden til steg 1 ved å
 * peke på Club Face og Club Path — de to brukeren nettopp dro (D104).
 *
 * Kjeden som tegnes er grafens egen: Curve ← Spin Axis ← Club Face · Club Path ·
 * Attack Angle · Dynamic Loft. Brevets Face-to-Path-node finnes ikke i grafen,
 * og grafen røres aldri for hånd (D47).
 */

/**
 * @param {object} api window.__connections
 * @returns {object} vertskontrakten
 */
export function connectionsHost(api) {
  const el = (id) => document.getElementById(id);
  const rectOf = (id) => {
    const node = el(id);
    return node ? node.getBoundingClientRect() : new DOMRect(0, 0, 0, 0);
  };

  return {
    screen: 'connections',

    /* Steg 6 har ingen skript: metrikken settes i `enter`, ikke som tilstand. */
    apply() {},

    read() { return undefined; },

    rect(name) {
      /* Målt: nodekortet står ÅPENT fra start fordi roten er fokusert, så
         «nederst» er opptatt. Ledig felt er mellom nøkkellinjen og kortet. */
      if (name === 'edgeKey') return rectOf('edge-key');
      if (name === 'nodeCard') return rectOf('node-card');
      return rectOf('diagram');
    },

    onInput(cb) {
      const handler = () => queueMicrotask(cb);
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    },

    /* D102: hopp over gir skjermens egen standard — og Connections' egen
       hviletilstand ER metrikkvelgeren (D68). */
    reset() { api.showSelector(); },

    setActiveParam() {},

    setMetric(id) { if (api.state.metric !== id) api.selectMetric(id); },
  };
}
