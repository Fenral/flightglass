/**
 * TRACESHAPE — banens tegneform mellom motorens endepunkter (D61).
 *
 * `solveFlight` returnerer 81 felt, og ingen av dem er banens form: RK4
 * integrerer kurven og kaster punktene. Formen som tegnes er derfor en
 * TEGNEANTAGELSE over motorens tall — projeksjon/interpolasjon, ikke fysikk,
 * og ikke en måling. Eksakte avlesninger kommer alltid fra motoroutput,
 * aldri fra kurvepunktene (spec §7).
 *
 * Den bor i adapter/ av samme grunn som konverteringen: det skal finnes ÉN
 * form. Tegner Ball Flight og D-plane hver sin kurve for samme slag, har
 * appen to påstander om én ballbane. Fysikklinten håndhever grensen —
 * trigonometri er tillatt her (kategori 2) og forbudt i app/.
 *
 * Geometrien er flyttet uendret fra strøm A sin Ball Flight-prototype
 * (app/ball-flight/bf.js, 2026-08-25) — formvalgene er A sine, verifisert
 * mot DESIGN.md; denne flyttingen endrer ingen koeffisient:
 *
 *   topPoints    — retningsplanet. Rett startretning + kvadratisk
 *                  lateralavvik som ender EKSAKT i `out.offline`.
 *   heightPoints — høydeplanet. Kubisk Bézier som treffer launch angle,
 *                  apex, carry og landing angle eksakt; degenererer til en
 *                  parabel når slaget ikke har en tegnbar bue.
 *
 * Alt er yards inn og yards ut. Konvertering til visningsenhet skjer i
 * `convert.js` ETTERPÅ — aldri her, aldri i rendereren.
 *
 * Kontrakt som resten av adapterlaget (spec §3-etos): endelige tall inn,
 * ellers kast. Rene funksjoner, ingen tilstand, `out` røres aldri.
 */

function assertFiniteField(out, field) {
  const value = out[field];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(
      `traceShape: out.${field} må være et endelig tall, fikk ${String(value)}.`,
    );
  }
  return value;
}

function assertSampleCount(n) {
  if (!Number.isInteger(n) || n < 1) {
    throw new TypeError(`traceShape: n må være et positivt heltall, fikk ${String(n)}.`);
  }
}

/**
 * Enhetsvektor for en motorvinkel — strålene i rendererne (launch line,
 * retningslinje) og senere hele D-plane. Vedtatt av eier 2026-08-25 som
 * oppfølging av lintkategoriseringen: projeksjon av motortall (kategori 2)
 * leveres av adapteren, aldri regnes i app/.
 *
 * Returnerer `[sin, cos]` av vinkelen. SAMME par bærer ulike roller per
 * plan — ikke bytt om komponentene i kallstedet, bruk riktig indeks:
 *
 *   topp-view  (DIRECTION): [sin, cos] = [lateral, downrange]
 *   høyde-view (HEIGHT):    [cos, sin] = [downrange, opp]   (indeks 1, 0)
 *
 * @param {number} deg motorvinkel i grader (f.eks. startDirection, launchAngle)
 * @returns {Readonly<[number, number]>} frossen enhetsvektor `[sin, cos]`
 */
export function directionRay(deg) {
  if (typeof deg !== 'number' || !Number.isFinite(deg)) {
    throw new TypeError(`traceShape: deg må være et endelig tall, fikk ${String(deg)}.`);
  }
  const a = deg * Math.PI / 180;
  return Object.freeze([Math.sin(a), Math.cos(a)]);
}

/* ── Delte interne hjelpere ────────────────────────────────────────────────
 * ÉN kilde for grenvalg og kurveparametre. `topPoints`, `heightPoints` og
 * `traceSamples` er tre projeksjoner av de samme uttrykkene — de kan ikke
 * komme i utakt uten at det skjer her, ett sted. (D79 invariant-begrunnelse.)
 */

/** Lateralkurvens parametre. Uttrykkene er bit-like originalen i bf.js. */
function lateralParams(out) {
  const startDirection = assertFiniteField(out, 'startDirection');
  const C = assertFiniteField(out, 'carry');
  const offline = assertFiniteField(out, 'offline');
  const a = startDirection * Math.PI / 180;
  const sinA = Math.sin(a);
  const cosA = Math.cos(a);
  return { C, offline, sinA, cosA, dEnd: offline - C * sinA };
}

/**
 * Høydeprofilens grenvalg og kontrollpunkter. Samme predikat og samme
 * uttrykk som alltid — flyttet hit uendret så begge konsumentene deler dem.
 */
function heightBranch(out) {
  const C = assertFiniteField(out, 'carry');
  const apex = assertFiniteField(out, 'apex');
  const launchAngle = assertFiniteField(out, 'launchAngle');
  const landingAngle = assertFiniteField(out, 'landingAngle');
  const tanL = Math.tan(launchAngle * Math.PI / 180);
  const tanA = Math.tan(landingAngle * Math.PI / 180);
  if (!(C > 0) || !(apex > 0) || tanL <= 0.005 || tanA <= 0.005) {
    return { degenerate: true, C, apex };
  }
  const xT = C * tanA / (tanL + tanA);
  const yT = xT * tanL;
  const s = apex / (0.75 * yT);            // z(0.5) = 0.75·s·yT = apex, eksakt
  return {
    degenerate: false, C, apex,
    p1: [s * xT, s * yT],
    p2: [C - s * (C - xT), s * yT],
  };
}

/**
 * Retningsplanet (DIRECTION): banen sett ovenfra, i yards.
 *
 * Rett linje langs `startDirection`, pluss et kvadratisk lateralavvik som
 * vokser med kvadratet av banefraksjonen og ender eksakt i `out.offline`.
 * Leser kun `startDirection`, `carry`, `offline`.
 *
 * @param {object} out returobjekt fra `solveFlight`
 * @param {number} [n] antall segmenter; returnerer n + 1 punkter
 * @returns {Array<[number, number]>} `[lateralYd, downrangeYd]` per punkt
 */
export function topPoints(out, n = 64) {
  assertSampleCount(n);
  const { C, sinA, cosA, dEnd } = lateralParams(out);
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const u = (i / n) * C;
    pts.push([u * sinA + dEnd * (i / n) ** 2, u * cosA]);
  }
  return pts;
}

/**
 * Høydeplanet (HEIGHT): banen sett fra siden, i yards.
 *
 * Kubisk Bézier fra [0, 0] til [carry, 0] som treffer launch angle-tangenten
 * i start, landing angle-tangenten i slutt, og apex eksakt i t = 0.5.
 * Har slaget ingen tegnbar bue (carry eller apex ≤ 0, eller en tangent under
 * 0.005) degenererer formen til parabelen `4·apex·t·(1−t)`, klampet mot
 * bakken. Leser kun `carry`, `apex`, `launchAngle`, `landingAngle`.
 *
 * @param {object} out returobjekt fra `solveFlight`
 * @param {number} [n] antall segmenter; returnerer n + 1 punkter
 * @returns {Array<[number, number]>} `[downrangeYd, heightYd]` per punkt
 */
export function heightPoints(out, n = 64) {
  assertSampleCount(n);
  const { degenerate, C, apex, p1, p2 } = heightBranch(out);

  const pts = [];
  if (degenerate) {
    for (let i = 0; i <= n; i += 1) {
      const t = i / n;
      pts.push([t * C, Math.max(0, 4 * apex * t * (1 - t))]);
    }
    return pts;
  }
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const w1 = 3 * (1 - t) ** 2 * t, w2 = 3 * (1 - t) * t ** 2, w3 = t ** 3;
    pts.push([w1 * p1[0] + w2 * p2[0] + w3 * C, w1 * p1[1] + w2 * p2[1]]);
  }
  return pts;
}

/**
 * BANEPOLYLINJEN I 3D — D79, vei B (eiervedtak 2026-08-25).
 *
 * (n + 1) frosne punkter `{ lat, d, h }`, ALT I YARDS:
 *
 *   lat  sideveis, + = høyre (spec §4)
 *   d    banekoordinat langs bakkesporet, 0 → carry
 *   h    høyde over bakken
 *
 * D79-invariantene, og hvordan de holdes:
 *   1  Ren funksjon her i traceShape — motorens `out` inn, punktliste ut.
 *   2  Endepunktene er BIT-LIKE motorens felt fordi de TILORDNES, aldri
 *      regnes: første punkt er {0, 0, 0}, siste er {out.offline, out.carry, 0}.
 *      (Vei B ble valgt fordi normaliserte brøker målt over fixturen bommet
 *      med 1 ULP i 410 av 4646 caser etter denormalisering — divisjon kan
 *      ikke love bit-likhet; tilordning kan.)
 *   3  Kun presentasjonsinterpolasjon: de indre punktene bruker NØYAKTIG
 *      samme uttrykk som `topPoints`/`heightPoints`, via de delte hjelperne
 *      `lateralParams`/`heightBranch`. Launch-, apex- og landingankrene
 *      arves derfra uendret.
 *   4  Testene ligger i `adapter/test/traceShape.test.js`, inkludert
 *      Object.is-endepunkter over samtlige fixture-caser.
 *
 * Aksevalg (delegert i D79): `d` er banekoordinaten [0, carry] — samme akse
 * som høydeprofilen alltid har brukt. `topPoints` sin downrange er u·cos(a)
 * og forblir sitt eget 2D-view; scenen konsumerer denne og skalerer selv til
 * visningsenheter (via `distanceForDisplay`-faktoren, D57).
 *
 * @param {object} out returobjekt fra `solveFlight`
 * @param {number} [n] antall segmenter; returnerer n + 1 punkter
 * @returns {ReadonlyArray<Readonly<{lat: number, d: number, h: number}>>}
 */
export function traceSamples(out, n = 64) {
  assertSampleCount(n);
  const { C, offline, sinA, dEnd } = lateralParams(out);
  const hb = heightBranch(out);

  const pts = new Array(n + 1);
  // Invariant 2: endepunktene tilordnes motorens felt — bit-like per definisjon.
  pts[0] = Object.freeze({ lat: 0, d: 0, h: 0 });
  pts[n] = Object.freeze({ lat: offline, d: C, h: 0 });

  for (let i = 1; i < n; i += 1) {
    const t = i / n;
    let u, h;
    if (hb.degenerate) {
      u = t * C;
      h = Math.max(0, 4 * hb.apex * t * (1 - t));
    } else {
      const w1 = 3 * (1 - t) ** 2 * t, w2 = 3 * (1 - t) * t ** 2, w3 = t ** 3;
      u = w1 * hb.p1[0] + w2 * hb.p2[0] + w3 * C;
      h = w1 * hb.p1[1] + w2 * hb.p2[1];
    }
    // Lateralkurven er lat(u) fra topPoints; brøken er u/C i bezier-grenen
    // (C > 0 garantert der) og t i den degenererte (dekker C = 0, som i dag).
    const f = hb.degenerate ? t : u / C;
    pts[i] = Object.freeze({ lat: u * sinA + dEnd * f ** 2, d: u, h });
  }
  return Object.freeze(pts);
}
