/**
 * offlineComposition — §5.8 Sluttposisjon. Produserer `offline`.
 *
 * BASELINE. Reproduserer dagens motor eksakt, inkludert operasjonsrekkefølgen
 * og den dokumenterte ekstremvinkelfeilen. Ingen forbedring, ingen opprydding.
 * `motor/export/flight-golden.json` er fasit.
 *
 * Spec 01-PHYSICS-AND-MECHANICS-ENGINE.md §5.8, ordrett:
 *
 *   Offline = Carry × sin(StartDirection × π/180) + Curve
 *
 * Alt er i yards. `carry` og `curve` er yards inn, `offline` er yards ut.
 * UI-adapteren konverterer til meter én gang med `0.9144` (spec §6); denne
 * modulen konverterer ingenting.
 *
 * Fortegn (spec §4, høyrehendt golfer): `+` = høyre for alle tre.
 * `offline > 0` betyr at ballen ender høyre for mållinjen (spec linje 93).
 *
 * Denne modulen beregner ikke `carry`, `startDirection` eller `curve`. Den er
 * komposisjonssteget nedstrøms for alle tre, og tar dem som ferdige tall.
 *
 * ── FEILEN SOM SKAL REPRODUSERES ──────────────────────────────────────────
 *
 * Spec §5.8 dokumenterer dette som en ekstremvinkelbegrensning: `Curve` er
 * målt vinkelrett på LAUNCH-LINJEN, mens `Offline` er målt vinkelrett på
 * MÅLLINJEN. Å legge dem sammen direkte hopper over rotasjonen mellom de to
 * aksesettene. Den geometrisk konsistente formen ville vært
 *
 *   Carry × sin(StartDirection) + Curve × cos(StartDirection)
 *
 * altså med et ekstra `cos(StartDirection)`-ledd på curve-komponenten. Det
 * leddet finnes ikke i dagens motor, og det skal ikke legges til her.
 * (`Carry` er heller ikke launch-linje-lengden, men den empiriske
 * carry-distansen — enda et ledd i den samme forenklingen.)
 *
 * Størrelsen på avviket, målt over hele fixturen:
 *
 *   grid.realistic-band   maks 0.0366 yd  (≈ 3.3 cm) — «liten i sliderområdet»
 *   grid.full-width       maks 4.1450 yd  (≈ 3.79 m) ved |StartDirection| 15°
 *
 * Legger du til cos-leddet, bryter 4015 av 5028 caser — nøyaktig de 4015 som
 * har `curve ≠ 0`, og alle 4015 bryter også med 1e-9 relativ toleranse, ikke
 * bare bit-eksakt. Se `test/offlineComposition.test.js`, testen «cos-leddet
 * mangler». README-fellen nr. 6 sier det samme.
 *
 * ── ULP-FELLE: grader → radianer ──────────────────────────────────────────
 *
 * ⚠ DENNE MODULEN BRUKER IKKE `degToRad`. Det er ikke en forglemmelse.
 *
 * README og `constants.js` sier at flight-motoren grupperer som
 * `deg * (Math.PI / 180)`, altså `deg * degToRad`. Det stemmer for
 * `flightglass-3d-spin-model.js` (D-plane, spinnprojeksjon). §5.8-komposisjonen
 * ligger et annet sted — `impact-flight.js` — og grupperer motsatt:
 *
 *   (StartDirection * Math.PI) / 180        5028/5028 bit-eksakt, avvik 0
 *   StartDirection * degToRad               4529/5028, maks avvik 2.84e-14
 *
 * 499 caser skiller, og de peker alle samme vei. Null caser peker motsatt.
 * Grupperingen her er derfor fixture-bevist, ikke antatt. Bytt den ikke.
 *
 * `180` finnes ikke som konstant i `src/constants.js` (bare bakt inn i
 * `degToRad`/`radToDeg`), så den ligger lokalt her — se `degreesPerHalfTurn`.
 *
 * Ingen I/O. Ingen skjult tilstand. Ingen presentasjonsdata.
 */

/* ── Lokale konstanter ──────────────────────────────────────────────────── */

/**
 * Grader per halv omdreining, `180`.
 *
 * Finnes ikke i `src/constants.js` — den filen eksponerer bare de ferdige
 * forholdstallene `degToRad = Math.PI / 180` og `radToDeg = 180 / Math.PI`, og
 * begge har feil gruppering for §5.8 (se modulkommentaren). Konstanten er lagt
 * her fordi denne modulen ikke eier `constants.js`. Flyttes dit hvis en annen
 * modul trenger samme gruppering; da skal denne fjernes, ikke dupliseres.
 */
export const degreesPerHalfTurn = 180;

/* ── §5.8 ───────────────────────────────────────────────────────────────── */

/**
 * `StartDirection × π/180` — grader til radianer, med §5.8-grupperingen.
 *
 * Skrevet som `(deg * Math.PI) / degreesPerHalfTurn`, IKKE `deg * degToRad`.
 * De to er 1 ULP fra hverandre og fixturen skiller dem i 499 caser.
 * Se ULP-avsnittet i modulkommentaren.
 *
 * @param {number} startDirectionDeg startretning i grader, `+` = høyre
 * @returns {number} samme vinkel i radianer
 */
export function startDirectionRad(startDirectionDeg) {
  return (startDirectionDeg * Math.PI) / degreesPerHalfTurn;
}

/**
 * Sidekomponenten fra startretningen alene: `Carry × sin(StartDirection)`.
 *
 * Dette er grunnen til at et rent push/pull får sideavvik selv når
 * `Curve = 0` (spec §5.8). Ved `StartDirection = 0` er leddet `0` og `offline`
 * blir identisk med `curve` — fixture-belagt i 206 caser.
 *
 * BASELINE-DETALJ: `Carry` er den empiriske carry-distansen langs bakken, ikke
 * lengden langs launch-linjen. Forenklingen er en del av feilen §5.8
 * dokumenterer. Ikke «fiks» den.
 *
 * @param {number} carry carry i yards
 * @param {number} startDirectionDeg startretning i grader, `+` = høyre
 * @returns {number} sideavvik i yards fra startlinjen alene, `+` = høyre
 */
export function startLineSide(carry, startDirectionDeg) {
  return carry * Math.sin(startDirectionRad(startDirectionDeg));
}

/**
 * Selve komposisjonen: `startLineSide + curve`.
 *
 * ⚠ `curve` legges til URORT. Ingen `cos(StartDirection)`. Se
 * modulkommentaren — det er feilen spec §5.8 dokumenterer og som denne
 * baselinen skal bevare.
 *
 * Addisjon er kommutativ i IEEE 754, så leddrekkefølgen er ikke en ULP-felle
 * her (i motsetning til grupperingen inne i {@link startDirectionRad}).
 *
 * @param {number} startLineSideYd fra {@link startLineSide}, yards
 * @param {number} curve launch-linje-relativ curve i yards, `+` = høyre
 * @returns {number} `offline` i yards, `+` = høyre for mållinjen
 */
export function composeOffline(startLineSideYd, curve) {
  return startLineSideYd + curve;
}

/**
 * §5.8 samlet. Ren funksjon.
 *
 * Tar de tre ferdige verdiene fra oppstrøms — `carry` (§5.6),
 * `startDirection` (§5.1) og `curve` (§5.7 + GAPS §6). Denne modulen beregner
 * ingen av dem og validerer dem ikke: spec §3 legger parsing og coercion i et
 * separat adapterlag, og en kastende sjekk her ville vært ny oppførsel.
 *
 * Ingen guard på `hasFlight`. Den finnes ikke i §5.8, og trengs ikke: uten
 * flukt er både `carry` og `curve` allerede `0` oppstrøms, og `0 × sin(x) + 0`
 * er `0`. Fixturen bekrefter det i alle 382 casene med `carry = 0`.
 *
 * Felter utover de tre ignoreres bevisst, slik at kalleren kan videresende
 * hele flight state uendret.
 *
 * @param {{carry: number, startDirection: number, curve: number}} flight
 * @returns {{offline: number}} yards, `+` = høyre for mållinjen
 */
export function solveOfflineComposition({ carry, startDirection, curve }) {
  return {
    offline: composeOffline(startLineSide(carry, startDirection), curve),
  };
}
