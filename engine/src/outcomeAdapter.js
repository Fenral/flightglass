/**
 * outcomeAdapter — Outcome-adapteren over `solveFlight`.
 * Produserer `hasFlight`, `inDomain`, `reason` og `shape`.
 *
 * BASELINE. Reproduserer dagens motor eksakt, inkludert alt som ser ut som en
 * bug. Ingen forbedring, ingen opprydding. `motor/export/flight-golden.json`
 * er fasit. Avviker denne modulen fra fixturen, er det modulen som har feil.
 *
 * ── HVA LAGET ER ─────────────────────────────────────────────────────────
 *
 * ENGINE-GAPS §2–4 og FUNN F4: ingen av de tre predikatfeltene returneres av
 * `solveFlight`. De er felt i et adapterlag OVER solveren (`impact-outcome.js`
 * i den gamle kodebasen). Fixturens `_meta.requestedFieldsAbsentFromSolveFlight`
 * bekrefter det ordrett:
 *
 *   ["hasFlight", "inDomain", "reason", "rk4Diagnostics"]
 *
 * `shape` derimot ER et solveFlight-felt — det står i `_meta.returnedFields` og
 * ligger i `out` på alle 5028 caser. Det ligger her fordi oppgaven ba om det,
 * og fordi engine/README.md ellers plasserer det i en egen `src/shape.js`.
 *
 * Modulen tar ferdige tall fra `out` og regner ingen fysikk. Ingen I/O, ingen
 * skjult tilstand, ingen trigonometri (og dermed ingen ULP-felle for
 * grader → radianer).
 *
 * ── DE TRE PREDIKATENE ───────────────────────────────────────────────────
 *
 * ENGINE-GAPS §2, ordrett:
 *
 *   hasFlight = (carry > 0)
 *
 * ENGINE-GAPS §3, ordrett:
 *
 *   inDomain = (signedVerticalSpinLoftDeg > 0)
 *
 * «No speed, Reynolds, spin-parameter, launch, carry, clamp or RK4 diagnostic
 * enters this predicate.» Det er tynnere enn spec-en antyder (FUNN F4) — og
 * skal forbli tynt. `hasFlight` og `inDomain` er UAVHENGIGE: fixturen har
 * caser i alle fire kombinasjonene (4267 / 379 / 254 / 128).
 *
 * ENGINE-GAPS §4, ordrett — nøyaktig to verdier:
 *
 *   reason = null            når signedVerticalSpinLoftDeg  > 0
 *   reason = "spin-loft"     når signedVerticalSpinLoftDeg <= 0
 *
 * `reason` er altså det eksakte komplementet til `inDomain`. Én eneste
 * feilmodus er dekket; 02-BALL-FLIGHT akseptansekriterium 8 ber `reason`
 * forklare all ugyldig tilstand, men motoren kan bare forklare denne ene.
 * Ikke utvid settet her — det ville vært ny oppførsel, ikke baseline.
 *
 * ── SHAPE ────────────────────────────────────────────────────────────────
 *
 * 15 verdier, satt sammen av ett startord og ett kurveord:
 *
 *   start:  ''  | 'Pull' | 'Push'                  fra `startDirection`
 *   kurve:  ''  | 'Draw' | 'Fade' | 'Hook' | 'Slice'   fra `faceToPath`
 *
 * Er begge tomme, er etiketten `'Straight'`. Ellers `[start, kurve]` joinet
 * med ett mellomrom. Det gir nøyaktig de 15 verdiene fixturen inneholder.
 *
 * Kilden for kurveordet er den EKTE `faceToPath`, ikke en tilbakeregnet
 * spinnakse — det er verifisert i den gamle testsuiten (`VERIFY.md`:
 * «shape labels use true face-to-path, not a recovered fitted spin-axis
 * gain»), og fixturen bekrefter det: både `startDirection → startord` og
 * `faceToPath → kurveord` er rene funksjoner uten én eneste tvetydig bøtte.
 *
 * ⚠ TERSKLENE ER FITTET, IKKE DOKUMENTERT. Ingen spec-fil oppgir dem
 * (engine/README.md, «Åpne punkter»). Fixturens rutenett låser dem bare til
 * intervaller, og alle tre valgene under ligger inne i sitt intervall:
 *
 *   felt          fixturen viser                        terskel her
 *   |startDir|    ≤ 1.4800000000000004 → ''             1.5   ∈ (1.48, 1.55]
 *                 ≥ 1.5499999999999998 → Pull/Push
 *   |faceToPath|  = 0 → ''                              1     ∈ (0, 1]
 *                 1 … 6 → Draw/Fade
 *                 ≥ 7.5 → Hook/Slice                    7     ∈ (6, 7.5]
 *
 * Fixturen har ingen case i hullene (1.48, 1.55), (0, 1) eller (6, 7.5), så
 * den kan ikke skille 1.5 fra 1.52, 1 fra 0.5, eller 7 fra 7.5. Alle 5028
 * caser matcher uansett hvilken verdi i intervallet man velger. Finner en
 * senere agent den ekte kilden, er det disse tre konstantene som skal endres
 * — ingenting annet. `test/outcomeAdapter.test.js` regner intervallene ut av
 * fixturen på nytt og feiler hvis en terskel havner utenfor.
 *
 * ── STRENGENE ────────────────────────────────────────────────────────────
 *
 * `shape` og `"spin-loft"` er ikke presentasjonsdata. De er faktiske felt- og
 * feltverdier i baseline-`out` / Outcome-adapteren, og en reproduksjon må
 * emittere dem ordrett for å matche fixturen — samme begrunnelse som
 * `aeroModelIdentity` i `src/constants.js`. Ingen farger, ingen tips, ingen
 * lokalisering: etikettene er data, ikke brukervendt kopi. UI-laget oversetter
 * dem selv om det trenger det.
 *
 * ── KONSTANTER SOM MANGLER I constants.js ────────────────────────────────
 *
 * `src/constants.js` eies av en annen modul og har ingen shape-terskler og
 * ingen reason-kode. De fire konstantene under ligger derfor her. Flyttes de
 * til `constants.js` senere, skal de FLYTTES — ikke dupliseres.
 */

/* ── Konstanter (se «Konstanter som mangler i constants.js» over) ───────── */

/**
 * ENGINE-GAPS §4: den ene ikke-null `reason`-verdien Outcome-adapteren har.
 * Maskinkode, ikke brukertekst.
 */
export const spinLoftReason = 'spin-loft';

/**
 * FITTET. `|startDirection|` under denne gir tomt startord.
 * Fixture-intervall: (1.4800000000000004, 1.5499999999999998].
 */
export const shapeStartStraightMaxDeg = 1.5;

/**
 * FITTET. `|faceToPath|` under denne gir tomt kurveord.
 * Fixture-intervall: (0, 1].
 */
export const shapeCurveStraightMaxDeg = 1;

/**
 * FITTET. `|faceToPath|` fra og med denne gir Hook/Slice i stedet for
 * Draw/Fade. Fixture-intervall: (6, 7.5].
 */
export const shapeCurveMajorMinDeg = 7;

/** De 15 `shape`-verdiene i baseline. Frosset; testen sjekker settet. */
export const shapeLabels = Object.freeze([
  'Straight',
  'Pull',
  'Push',
  'Draw',
  'Fade',
  'Hook',
  'Slice',
  'Pull Draw',
  'Pull Fade',
  'Pull Hook',
  'Pull Slice',
  'Push Draw',
  'Push Fade',
  'Push Hook',
  'Push Slice',
]);

/* ── ENGINE-GAPS §2–4: de tre predikatfeltene ──────────────────────────── */

/**
 * ENGINE-GAPS §2: `hasFlight = (carry > 0)`.
 *
 * `carry` er yards (spec §6). Fortegnet er det samme i meter, så enheten
 * spiller ingen rolle for predikatet. Baseline har ingen negativ carry — 382
 * av 5028 caser har nøyaktig `0`, resten er positive.
 *
 * Skrevet som `carry > 0`, ikke `!(carry <= 0)`: for `NaN` gir begge `false`,
 * men den første er den formen ENGINE-GAPS oppgir.
 *
 * Fixturen returnerer ikke feltet, men tre av dens egne felt er avledet av det
 * og pinner det indirekte i alle 5028 caser (0 avvik hver):
 *   `landingAngle === 0`, `rollFrac === 0`, `landingDomainTerm === 0`.
 * Se `test/outcomeAdapter.test.js`.
 *
 * @param {number} carry carry i yards
 * @returns {boolean}
 */
export function hasFlight(carry) {
  return carry > 0;
}

/**
 * ENGINE-GAPS §3: `inDomain = (signedVerticalSpinLoftDeg > 0)`.
 *
 * Merk `>` og ikke `>=`: nøyaktig `0` er UTENFOR domenet. Spec §9 sin
 * «No flight»-golden case (`90 / 0 / 0 / 0 / 0`) har
 * `signedVerticalSpinLoftDeg = 0` og er dokumentert med `inDomain = false`,
 * og fixturens `edge.in-domain-false.zero-vertical-spin-loft-*` er eksportert
 * nettopp for denne grensen.
 *
 * `signedVerticalSpinLoftDeg` er `dynamicLoft − attackAngle` (eksakt i alle
 * 5028 caser). Den er SIGNERT — ikke `spinLoft`/`spinLoft3DDeg`, som begge er
 * ikke-negative 3-D-vinkler og aldri kunne gitt `false`.
 *
 * @param {number} signedVerticalSpinLoftDeg grader, `dynamicLoft − attackAngle`
 * @returns {boolean}
 */
export function inDomain(signedVerticalSpinLoftDeg) {
  return signedVerticalSpinLoftDeg > 0;
}

/**
 * ENGINE-GAPS §4: `null` i domenet, `"spin-loft"` utenfor. Ingen tredje verdi.
 *
 * Uttrykt via {@link inDomain} slik at de to aldri kan komme i utakt.
 *
 * @param {number} signedVerticalSpinLoftDeg grader
 * @returns {null | 'spin-loft'}
 */
export function outcomeReason(signedVerticalSpinLoftDeg) {
  return inDomain(signedVerticalSpinLoftDeg) ? null : spinLoftReason;
}

/* ── shape ─────────────────────────────────────────────────────────────── */

/**
 * Startordet. Fortegn (spec §4, høyrehendt golfer): `+` = høyre.
 *
 * `''` betyr «ingen startetikett», ikke `'Straight'` — `'Straight'` er
 * etiketten for at BEGGE ordene er tomme, og settes i {@link shape}.
 *
 * @param {number} startDirection grader, `+` = ballen starter høyre
 * @returns {'' | 'Pull' | 'Push'}
 */
export function startLabel(startDirection) {
  if (Math.abs(startDirection) < shapeStartStraightMaxDeg) return '';
  return startDirection > 0 ? 'Push' : 'Pull';
}

/**
 * Kurveordet, fra den ekte `faceToPath` (= `faceAngle − clubPath`).
 *
 * Positivt gap (åpen flate relativt banen) → Fade/Slice = kurve mot høyre;
 * negativt → Draw/Hook = kurve mot venstre. Fixturen er entydig på begge
 * fortegn i alle 5028 caser.
 *
 * MERK: dette er en ren geometrisk gap-klassifisering. Den ser ikke på om
 * ballen faktisk fløy — 382 caser uten flukt får kurveord som «Pull Hook»
 * likevel, og `curve`-feltet deres er `0`. Det er baseline. Ikke maskér det.
 *
 * @param {number} faceToPath grader, `faceAngle − clubPath`
 * @returns {'' | 'Draw' | 'Fade' | 'Hook' | 'Slice'}
 */
export function curveLabel(faceToPath) {
  const gap = Math.abs(faceToPath);
  if (gap < shapeCurveStraightMaxDeg) return '';
  if (gap < shapeCurveMajorMinDeg) return faceToPath > 0 ? 'Fade' : 'Draw';
  return faceToPath > 0 ? 'Slice' : 'Hook';
}

/**
 * `shape` — én av de 15 verdiene i {@link shapeLabels}.
 *
 * @param {number} startDirection grader
 * @param {number} faceToPath grader
 * @returns {string}
 */
export function shape(startDirection, faceToPath) {
  const start = startLabel(startDirection);
  const curve = curveLabel(faceToPath);

  if (start === '') return curve === '' ? 'Straight' : curve;
  return curve === '' ? start : `${start} ${curve}`;
}

/* ── Adapteren ─────────────────────────────────────────────────────────── */

/**
 * Outcome-adapteren samlet. Ren funksjon over ferdige `solveFlight`-felt.
 *
 * Tar hele `out`-objektet uendret hvis kalleren vil — bare de fire feltene
 * under leses, og ekstra felt ignoreres.
 *
 * Ingen validering av input: spec §3 legger parsing og coercion i et separat
 * adapterlag, og en kastende sjekk her ville vært ny oppførsel, ikke baseline.
 *
 * @param {{carry: number, signedVerticalSpinLoftDeg: number,
 *          startDirection: number, faceToPath: number}} flight
 * @returns {{hasFlight: boolean, inDomain: boolean,
 *            reason: null | 'spin-loft', shape: string}}
 */
export function solveOutcome({
  carry,
  signedVerticalSpinLoftDeg,
  startDirection,
  faceToPath,
}) {
  return {
    hasFlight: hasFlight(carry),
    inDomain: inDomain(signedVerticalSpinLoftDeg),
    reason: outcomeReason(signedVerticalSpinLoftDeg),
    shape: shape(startDirection, faceToPath),
  };
}
