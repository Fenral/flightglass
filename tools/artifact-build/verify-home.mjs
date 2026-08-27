/**
 * Differensialtest av home-bundelen mot den ekte motoren.
 *
 * Samme begrunnelse som `verify.mjs`: bundleren skriver om import- og
 * export-linjer, og en feil der ville gitt tall som ser rimelige ut. Home-mocken
 * viser ett slag (D60-standarden), men den viser det gjennom hele kjeden
 * solveFlight → outcomeAdapter → selectOutcome → displayValue. Testen sveiper
 * derfor femdimensjonalt og krever `Object.is`-likhet på hvert felt.
 *
 * Grafen testes også: node- og kantantall må stemme med D47-fasiten, ellers
 * har bundleren mistet default-eksporten.
 */

const RAW_FIELDS = Object.freeze([
  'carry', 'total', 'apex', 'curve', 'offline', 'startDirection', 'spinAxis',
  'launchAngle', 'spinLoft', 'landingAngle', 'backspin', 'ballSpeed', 'smash',
]);

/**
 * @param {string} bundleSource bundelen slik den legges inn i sida
 * @param {string} rootUrl file:-URL til prosjektroten
 * @returns {Promise<{cases:number, mismatches:number, first:object|null, graph:string}>}
 */
export async function verifyHomeBundle(bundleSource, rootUrl) {
  const { solveFlight: realSolve } = await import(`${rootUrl}/engine/src/solveFlight.js`);
  const { solveOutcome: realOutcome } = await import(`${rootUrl}/engine/src/outcomeAdapter.js`);
  const realGraph = (await import(`${rootUrl}/app/connections/graph-data.js`)).default;

  // eslint-disable-next-line no-new-func -- bundelen kjøres slik sida kjører den
  const M = new Function(`${bundleSource}\nreturn __M;`)();
  const bundledSolve = M['engine/src/solveFlight.js'].solveFlight;
  const bundledOutcome = M['engine/src/outcomeAdapter.js'].solveOutcome;
  const bundledGraph = M['app/connections/graph-data.js'].default;
  const { selectOutcome } = M['app/ball-flight/impact-outcome.js'];
  const { displayValue } = M['adapter/src/displayFlight.js'];

  /* Grafen: default-eksporten er det nye i bundleren, så den sjekkes eksplisitt */
  let graph = 'ok';
  if (!bundledGraph || !Array.isArray(bundledGraph.nodes)) {
    graph = 'default-eksporten mangler eller er tom';
  } else if (bundledGraph.nodes.length !== realGraph.nodes.length
          || bundledGraph.edges.length !== realGraph.edges.length) {
    graph = `${bundledGraph.nodes.length}/${bundledGraph.edges.length} mot fasitens `
          + `${realGraph.nodes.length}/${realGraph.edges.length}`;
  } else {
    const bad = realGraph.edges.find((e, i) => {
      const b = bundledGraph.edges[i];
      return b.from !== e.from || b.to !== e.to || b.type !== e.type || b.strength !== e.strength;
    });
    if (bad) graph = `kant avviker: ${bad.id}`;
  }

  let cases = 0, mismatches = 0, first = null;
  for (let speed = 70; speed <= 120; speed += 10) {
    for (let face = -12; face <= 12; face += 3) {
      for (let path = -12; path <= 12; path += 3) {
        for (let attack = -6; attack <= 6; attack += 3) {
          for (let dynLoft = 8; dynLoft <= 40; dynLoft += 8) {
            const shot = { speed, face, path, attack, dynLoft };
            const a = realSolve({
              clubPath: path, faceAngle: face, attackAngle: attack,
              dynamicLoft: dynLoft, clubSpeed: speed,
            });
            const b = selectOutcome(shot).raw;
            cases += 1;
            for (const f of RAW_FIELDS) {
              if (!Object.is(a[f], b[f])) {
                mismatches += 1;
                first ??= { field: f, shot, real: a[f], bundled: b[f] };
                break;
              }
            }
            /* utfallsklassifiseringen og visningslaget må også overleve */
            const oa = realOutcome(a);
            const ob = bundledOutcome(b);
            if (oa.shape !== ob.shape || oa.inDomain !== ob.inDomain) {
              mismatches += 1;
              first ??= { field: 'shape/inDomain', shot, real: oa.shape, bundled: ob.shape };
            }
            /* D57: enhetspakkene heter `meters` og `yards`. */
            const txt = displayValue('distance', b.carry, 'meters').text;
            if (typeof txt !== 'string' || !txt.length) {
              mismatches += 1;
              first ??= { field: 'displayValue', shot };
            }
          }
        }
      }
    }
  }
  return { cases, mismatches, first, graph };
}
