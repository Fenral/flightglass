/**
 * studioContact — Impact Studio sin kontaktgeometri. ENGINE-GAPS §7, §8, §9.
 *
 * BASELINE. Reproduserer dagens motor (kilde-commit
 * 410a365d47de5c7a1542edc71d0336cd5b7d1b56) bit-eksakt mot
 * `motor/export/studio-golden.json`: 2500 av 2500 caser, maks avvik 0 på alle
 * elleve tallfelt. Ingenting her er ryddet, forbedret eller modernisert.
 *
 * Verdensakser (spec §8, Studio — IKKE de samme som flight):
 *   +x = target, +y = bort fra Face On-kameraet, +z = opp. Meter.
 *
 * Modulen eier seks felt i `cases[].out`:
 *
 *   contactHeight         meter; sålens høyde ved ballen (= clubZ)
 *   groundCrossingTheta0  radian eller null
 *   groundEntry           {x,y,z} meter eller null
 *   groundExit            {x,y,z} meter eller null
 *   faceCentreOffsetMm    millimeter, rå float før UI-avrunding
 *   clubBallContact       {clubZ, offset, offsetRatio, theta}
 *
 * ── Kjeden, ordrett fra ENGINE-GAPS §7 ───────────────────────────────────
 *
 *   xLP   = (10.5 − ballPositionCm) / 100
 *   zLP   = (arcHeightCm + zClub) / 100,  zClub = −0.2 cm iron, +1.8 cm driver
 *   φ     = swingPlane · π/180
 *   xEff  = xLP − swingDirection · R cos φ · π/180
 *   θ     = asin(clamp(−xEff / R, −0.999, 0.999))
 *   clubZ = zLP + R(1 − cos θ) sin φ            ← contactHeight
 *
 * ── Bakkekryssingen, ordrett fra ENGINE-GAPS §8 ──────────────────────────
 *
 *   c = 1 + zLP / (R sin φ)
 *   c ≥ 1 eller c ≤ −1  → begge kryssingene er null
 *   ellers θ_g = arccos(c), Entry = P(−θ_g), Exit = P(+θ_g)
 *
 *   ψ  = −swingDirection · π/180
 *   u  = (cos ψ, sin ψ, 0)
 *   m  = (−sin ψ cos φ, cos ψ cos φ, sin φ)
 *   d  = R(1 − cos θ) cos φ            (θ = treff-theta, ikke kryssings-theta)
 *   LP = (xEff cos ψ + d sin ψ, xEff sin ψ − d cos ψ, zLP)
 *   P(t) = LP + R sin t · u + R(1 − cos t) · m
 *
 * ── Face-centre offset, ordrett fra ENGINE-GAPS §9 ───────────────────────
 *
 *   faceCentreOffsetMm = ((lift + rBall) − (clubZ + sweet)) · 1000
 *
 * ── ULP-KRITISKE DETALJER (verifisert mot fixturen, ikke gjettet) ─────────
 *
 *  1. Grader → radianer er Studio-formen `(deg * Math.PI) / 180`, IKKE
 *     `deg * degToRad`. Gjelder både φ og ψ:
 *
 *        φ  via (deg*PI)/180 → `thetaAtImpact` og `contactHeight` 2500/2500
 *        ψ  via (deg*PI)/180 → `planeBasis.u.y` 2500/2500
 *        ψ  via deg*degToRad → `planeBasis.u.y` 1000/2500
 *
 *     Unntaket er den avsluttende gradskalaen i `perDegree`
 *     (`R · cos φ · π/180`), som er gruppert `* (Math.PI / 180)`, altså
 *     `* degToRad`. Bit-eksakt `effectiveLowPointX` krever BEGGE
 *     konvensjonene i samme uttrykk. Blandingen finnes i dagens kode.
 *
 *  2. cm → meter er DIVISJON med 100. `* 0.01` er 1 ULP unna og gir feil
 *     `lowPointX` i 250 av 2500 caser. Derfor `/ cmPerMetre`.
 *
 *  3. `contactHeight` er `zLP + R * (1 - cos θ) * sin φ` venstre-mot-høyre.
 *        zLP + R*((1−cos)·sin)      2176/2500
 *        zLP + (1−cos)*(R·sin)      2230/2500
 *        zLP + R*(1−cos)*sin        2500/2500  ← denne
 *
 *  4. `d` er `R * (1 - cos θ) * cos φ` venstre-mot-høyre. Alternativene gir
 *     2050/2500 og 2040/2500 på `lowPointWorld.y`.
 *
 *  5. `faceCentreOffsetMm` beholder parentesene fra ENGINE-GAPS §9 og
 *     multipliserer med 1000:
 *        (lift + rBall − clubZ − sweet) * 1000   1807/2500
 *        ((lift+rBall) − (clubZ+sweet)) / 0.001  2170/2500
 *        ((lift+rBall) − (clubZ+sweet)) * 1000   2500/2500  ← denne
 *
 *  6. `offsetRatio` er `(clubZ − rBall) / rBall`, ikke `clubZ / rBall − 1`
 *     (1413/2500).
 *
 * ── TO TING FIXTUREN VISER SOM SPEC-EN IKKE SIER ─────────────────────────
 *
 *  A. `groundEntry.z` / `groundExit.z` er IKKE tvunget til 0. Fixturen har
 *     f.eks. `-1.3877787807814457e-17` — den rå flyttallsresten av
 *     `zLP + R(1−cos θ_g) sin φ`. Punktene beregnes med den generelle
 *     `P(t)`, uten et etterfølgende «sett z = 0». Nuller man z, ryker 1125
 *     caser. Ikke «rydd» det.
 *
 *  B. `clubBallContact.offset` bruker Studios ballradius 0.0213, og driveren
 *     får INGEN løftkorreksjon her — `driverBallLiftM` inngår bare i
 *     `faceCentreOffsetMm`. Det ser inkonsistent ut. Det er dagens motor.
 *     (FUNN F1/F7: driverpresentasjonen er en stand-in.)
 *
 * ── DELT GEOMETRI MED studio-geometry ────────────────────────────────────
 *
 * `planeBasis`, `lowPointWorld`, `effectiveLowPointX` og `thetaAtImpact` er
 * `src/studio-geometry.js` sine felt i `out`, men ENGINE-GAPS §8 trenger dem
 * for å bygge Entry/Exit. De ligger derfor her som eksporterte hjelpere, og
 * `solveStudioContact` returnerer dem IKKE — returobjektet er de seks feltene
 * denne modulen eier. Når studio-geometry legges, bør den ene importere fra
 * den andre i stedet for at begge holder hver sin kopi. Uttrykkene over er
 * bit-eksakte mot fixturen og skal ikke skrives om i den flyttingen.
 */

import {
  arcZ0Cm,
  cmPerMetre,
  degToRad,
  driverBallLiftM,
  studioBallPositionOffsetCm,
  studioBallRadius,
  studioRadius,
  studioThetaSinClamp,
  sweetSpotAboveSoleM,
} from './constants.js';

/**
 * Ballens løft over bakken per køllemodus, meter.
 *
 * ⚠ Ligger her, ikke i constants.js, fordi constants.js bare eksponerer
 * `driverBallLiftM` (fixturens `_meta.constants.driverBallLiftM`). Jern-verdien
 * 0 står ikke i fixturen — den er implisitt i ENGINE-GAPS §9 («lift = 0 for
 * iron»). Skal noen flytte kartet til constants.js senere, er `iron: 0` det
 * eneste tallet som ikke har en fixture-kilde.
 */
const ballLiftM = Object.freeze({ iron: 0, driver: driverBallLiftM });

/**
 * Meter → millimeter. ENGINE-GAPS §9 skalerer med `· 1000`.
 *
 * ⚠ Ligger her, ikke i constants.js, av samme grunn: fixturen eksponerer ingen
 * enhetskonstant, bare den skalerte verdien `faceCentreOffsetMm`.
 */
const metreToMillimetre = 1000;

/**
 * Lokal clamp. `src/math.js` er ikke lagt ennå, og denne modulen eier bare sin
 * egen fil. Ingen kortslutninger: NaN inn gir NaN ut, som i kildemotoren.
 *
 * @param {number} value
 * @param {number} minimum
 * @param {number} maximum
 * @returns {number}
 */
function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

/* ── §8.1 Input → motorstate ─────────────────────────────────────────────── */

/**
 * `xLP = (10.5 − ballPositionCm) / 100` (spec §8.1).
 * Positiv `ballPositionCm` er forover/målsiden, så low point flyttes bakover.
 *
 * @param {number} ballPositionCm
 * @returns {number} meter, ballrelativt low point
 */
export function lowPointX(ballPositionCm) {
  return (studioBallPositionOffsetCm - ballPositionCm) / cmPerMetre;
}

/**
 * `zLP = (arcHeightCm + zClub) / 100` (spec §8.1, ENGINE-GAPS §7), der
 * `zClub` er −0.2 cm for iron og +1.8 cm for driver.
 *
 * Driveroffseten tilhører den uvaliderte stand-in-modusen (spec §8.1). Den er
 * med fordi baseline er baseline.
 *
 * @param {number} arcHeightCm
 * @param {'iron'|'driver'} clubMode
 * @returns {number} meter, klubbrelativ low point-høyde
 */
export function lowPointZ(arcHeightCm, clubMode) {
  return (arcHeightCm + arcZ0Cm[clubMode]) / cmPerMetre;
}

/**
 * Bueplanets helning φ i radianer. Studio-gruppering `(deg * Math.PI) / 180`
 * — se punkt 1 i filhodet, `deg * degToRad` er 1 ULP unna og ryker.
 *
 * @param {number} swingPlaneDeg
 * @returns {number} radianer
 */
export function swingPlaneRad(swingPlaneDeg) {
  return (swingPlaneDeg * Math.PI) / 180;
}

/**
 * Planets rotasjon om vertikalen, ψ = −swingDirection · π/180 (ENGINE-GAPS §8).
 * Fortegnet er snudd i forhold til `swingDirection`; det er kildens konvensjon.
 *
 * @param {number} swingDirectionDeg
 * @returns {number} radianer
 */
export function planeYawRad(swingDirectionDeg) {
  return (-swingDirectionDeg * Math.PI) / 180;
}

/* ── §8.2–8.3 Effektivt low point og treffparameter ──────────────────────── */

/**
 * `perDegree = R · cos φ · π/180` (spec §8.2).
 *
 * ⚠ Den avsluttende gradskalaen er gruppert `* (Math.PI / 180)` — altså
 * `* degToRad` — selv om φ selv bruker den motsatte grupperingen. Blandingen
 * er nødvendig for bit-eksakt `effectiveLowPointX`. Se punkt 1 i filhodet.
 *
 * @param {number} swingPlaneRadians φ
 * @returns {number} meter horisontal forskyvning per grad swing direction
 */
export function lowPointShiftPerDegree(swingPlaneRadians) {
  return studioRadius * Math.cos(swingPlaneRadians) * degToRad;
}

/**
 * `xEff = xLP − swingDirection · perDegree` (spec §8.2).
 * En flatere plane gir større horisontal forskyvning per grad.
 *
 * @param {number} lowPointXMetres     xLP
 * @param {number} swingDirectionDeg
 * @param {number} swingPlaneRadians   φ
 * @returns {number} meter
 */
export function effectiveLowPointX(
  lowPointXMetres,
  swingDirectionDeg,
  swingPlaneRadians,
) {
  return (
    lowPointXMetres - swingDirectionDeg * lowPointShiftPerDegree(swingPlaneRadians)
  );
}

/**
 * `θ = asin(clamp(−xEff / R, −0.999, 0.999))` (spec §8.3).
 *
 * Clampen på ±0.999 er kildens, ikke ±1. Innenfor fixturens inputgrid når
 * `|xEff| / R` aldri høyere enn 0.44, så clampen er aldri observert aktiv —
 * den er med fordi spec §8.3 og kilden har den.
 *
 * @param {number} effectiveLowPointXMetres xEff
 * @returns {number} radianer, signert buelengdeparameter ved treff
 */
export function thetaAtImpact(effectiveLowPointXMetres) {
  return Math.asin(
    clamp(
      -effectiveLowPointXMetres / studioRadius,
      -studioThetaSinClamp,
      studioThetaSinClamp,
    ),
  );
}

/* ── ENGINE-GAPS §7 Kontakthøyde ─────────────────────────────────────────── */

/**
 * `contactHeight = clubZ = zLP + R(1 − cos θ) sin φ` (ENGINE-GAPS §7).
 *
 * Sålens høyde ved ballen. Negativ betyr at køllen er under bakkenivå.
 * Venstre-mot-høyre; se punkt 3 i filhodet.
 *
 * @param {number} lowPointZMetres   zLP
 * @param {number} thetaRadians      θ ved treff
 * @param {number} swingPlaneRadians φ
 * @returns {number} meter
 */
export function contactHeight(lowPointZMetres, thetaRadians, swingPlaneRadians) {
  return (
    lowPointZMetres +
    studioRadius * (1 - Math.cos(thetaRadians)) * Math.sin(swingPlaneRadians)
  );
}

/* ── ENGINE-GAPS §8 Buen i verdenskoordinater ────────────────────────────── */

/**
 * Bueplanets ortonormale basis (ENGINE-GAPS §8):
 *
 *   u = (cos ψ, sin ψ, 0)                    horisontal, langs svingretningen
 *   m = (−sin ψ cos φ, cos ψ cos φ, sin φ)   i planet, mot buens senter
 *
 * @param {number} planeYawRadians   ψ
 * @param {number} swingPlaneRadians φ
 * @returns {{u: {x: number, y: number, z: number}, m: {x: number, y: number, z: number}}}
 */
export function planeBasis(planeYawRadians, swingPlaneRadians) {
  const cosYaw = Math.cos(planeYawRadians);
  const sinYaw = Math.sin(planeYawRadians);
  const cosPlane = Math.cos(swingPlaneRadians);
  const sinPlane = Math.sin(swingPlaneRadians);

  return {
    u: { x: cosYaw, y: sinYaw, z: 0 },
    m: { x: -sinYaw * cosPlane, y: cosYaw * cosPlane, z: sinPlane },
  };
}

/**
 * Low point i verdenskoordinater (ENGINE-GAPS §8):
 *
 *   d  = R(1 − cos θ) cos φ
 *   LP = (xEff cos ψ + d sin ψ, xEff sin ψ − d cos ψ, zLP)
 *
 * `θ` er treff-thetaen, ikke kryssings-thetaen: `d` forskyver low point slik
 * at `P(θ_treff)` lander på ballen i (0, 0, contactHeight). `d` er
 * venstre-mot-høyre; se punkt 4 i filhodet.
 *
 * @param {number} effectiveLowPointXMetres xEff
 * @param {number} lowPointZMetres          zLP
 * @param {number} thetaRadians             θ ved treff
 * @param {number} planeYawRadians          ψ
 * @param {number} swingPlaneRadians        φ
 * @returns {{x: number, y: number, z: number}} meter
 */
export function lowPointWorld(
  effectiveLowPointXMetres,
  lowPointZMetres,
  thetaRadians,
  planeYawRadians,
  swingPlaneRadians,
) {
  const cosYaw = Math.cos(planeYawRadians);
  const sinYaw = Math.sin(planeYawRadians);
  const depth =
    studioRadius * (1 - Math.cos(thetaRadians)) * Math.cos(swingPlaneRadians);

  return {
    x: effectiveLowPointXMetres * cosYaw + depth * sinYaw,
    y: effectiveLowPointXMetres * sinYaw - depth * cosYaw,
    z: lowPointZMetres,
  };
}

/**
 * `P(t) = LP + R sin t · u + R(1 − cos t) · m` (ENGINE-GAPS §8).
 * Punktet på buen ved parameter `t`.
 *
 * @param {{x: number, y: number, z: number}} lowPointWorldMetres LP
 * @param {{u: {x: number, y: number, z: number}, m: {x: number, y: number, z: number}}} basis
 * @param {number} thetaRadians t
 * @returns {{x: number, y: number, z: number}} meter
 */
export function arcPoint(lowPointWorldMetres, basis, thetaRadians) {
  const along = studioRadius * Math.sin(thetaRadians);
  const inward = studioRadius * (1 - Math.cos(thetaRadians));

  return {
    x: lowPointWorldMetres.x + along * basis.u.x + inward * basis.m.x,
    y: lowPointWorldMetres.y + along * basis.u.y + inward * basis.m.y,
    z: lowPointWorldMetres.z + along * basis.u.z + inward * basis.m.z,
  };
}

/**
 * `θ_g = arccos(1 + zLP / (R sin φ))`, eller `null` når `|c| ≥ 1`
 * (ENGINE-GAPS §8).
 *
 * `c ≥ 1` betyr at low point ligger på eller over bakken — buen krysser aldri.
 * 1375 av 2500 caser i fixturen er null, og alle 1375 har `zLP ≥ 0`.
 *
 * ⚠ RETTET 2026-08-25, BASELINE-FUNN [12]. Predikatet var `c >= 1 || c <= -1`
 * ordrett fra ENGINE-GAPS §8. Er `sin φ = 0` OG `zLP = 0` blir `c` NaN, begge
 * sammenligningene `false`, og funksjonen returnerte `Math.acos(NaN)` = NaN i
 * et offentlig felt. `swingPlane = 0` finnes ikke i fixturen, så rettingen
 * endrer null av de 2500 casene — verifisert. Ikke-endelig `c` gir nå `null`,
 * som er det samme svaret som «buen krysser aldri bakken».
 *
 * @param {number} lowPointZMetres   zLP
 * @param {number} swingPlaneRadians φ
 * @returns {number|null} radianer, alltid ikke-negativ, eller null
 */
export function groundCrossingTheta0(lowPointZMetres, swingPlaneRadians) {
  const cosTheta =
    1 + lowPointZMetres / (studioRadius * Math.sin(swingPlaneRadians));
  if (!Number.isFinite(cosTheta)) return null;
  if (cosTheta >= 1 || cosTheta <= -1) return null;
  return Math.acos(cosTheta);
}

/**
 * Entry og Exit der buen krysser bakken: `Entry = P(−θ_g)`, `Exit = P(+θ_g)`.
 * Begge er `null` når `θ_g` er null.
 *
 * `z` beregnes med den generelle `P(t)` og er derfor ikke eksakt 0 — se punkt A
 * i filhodet. Ikke nuller den.
 *
 * @param {{x: number, y: number, z: number}} lowPointWorldMetres LP
 * @param {{u: {x: number, y: number, z: number}, m: {x: number, y: number, z: number}}} basis
 * @param {number|null} crossingThetaRadians θ_g
 * @returns {{groundEntry: {x: number, y: number, z: number}|null,
 *            groundExit: {x: number, y: number, z: number}|null}}
 */
export function groundCrossings(
  lowPointWorldMetres,
  basis,
  crossingThetaRadians,
) {
  if (crossingThetaRadians === null) {
    return { groundEntry: null, groundExit: null };
  }
  return {
    groundEntry: arcPoint(lowPointWorldMetres, basis, -crossingThetaRadians),
    groundExit: arcPoint(lowPointWorldMetres, basis, crossingThetaRadians),
  };
}

/* ── ENGINE-GAPS §9 Face-centre offset ───────────────────────────────────── */

/**
 * `faceCentreOffsetMm = ((lift + rBall) − (clubZ + sweet)) · 1000`
 * (ENGINE-GAPS §9).
 *
 * Positiv: ballen møter flaten over dens senter. Negativ: under.
 * Rå float — UI-ets heltallsavrunding hører ikke hjemme i motoren.
 *
 * Baseline går til −121 mm på driver, på en flate som er ~60 mm høy (FUNN F7).
 * Det er en selvmotsigelse i stand-in-modusen, ikke en regnefeil her.
 *
 * Parentesene og `· 1000` er begge load-bearing; se punkt 5 i filhodet.
 *
 * @param {number} clubZMetres    contactHeight
 * @param {'iron'|'driver'} clubMode
 * @returns {number} millimeter
 */
export function faceCentreOffsetMm(clubZMetres, clubMode) {
  return (
    (ballLiftM[clubMode] +
      studioBallRadius -
      (clubZMetres + sweetSpotAboveSoleM[clubMode])) *
    metreToMillimetre
  );
}

/* ── Kølle/ball-kontakt ──────────────────────────────────────────────────── */

/**
 * `clubBallContact` — sålehøyden ved ballen, uttrykt relativt Studios
 * ballradius 0.0213 m.
 *
 *   offset      = clubZ − rBall     meter; 0 = sålen i ballens senterhøyde
 *   offsetRatio = offset / rBall    dimensjonsløs; −1 = sålen på bakken
 *
 * Ingen løftkorreksjon for driver — se punkt B i filhodet.
 *
 * @param {number} clubZMetres  contactHeight
 * @param {number} thetaRadians θ ved treff
 * @returns {{clubZ: number, offset: number, offsetRatio: number, theta: number}}
 */
export function clubBallContact(clubZMetres, thetaRadians) {
  const offset = clubZMetres - studioBallRadius;
  return {
    clubZ: clubZMetres,
    offset,
    offsetRatio: offset / studioBallRadius,
    theta: thetaRadians,
  };
}

/* ── Samlet solve ────────────────────────────────────────────────────────── */

/**
 * Hele ENGINE-GAPS §7–9 i ett kall. Ren funksjon: samme input gir alltid samme
 * output, ingen delt tilstand, ingen I/O, ingen presentasjonsdata.
 *
 * Feltnavnene er fixturens egne (`studio-golden.json` → `cases[].out`), slik at
 * en sammenligning ikke trenger en oversettelse i midten.
 *
 * `planeBasis`, `lowPointWorld`, `effectiveLowPointX` og `thetaAtImpact`
 * beregnes underveis, men returneres IKKE — de tilhører studio-geometry.
 * Trenger du dem, kall hjelperne over.
 *
 * @param {{swingPlane: number, swingDirection: number, ballPositionCm: number,
 *          arcHeightCm: number, clubMode: 'iron'|'driver'}} input
 *   grader, grader, centimeter, centimeter, køllemodus.
 * @returns {{
 *   contactHeight: number,
 *   groundCrossingTheta0: number|null,
 *   groundEntry: {x: number, y: number, z: number}|null,
 *   groundExit: {x: number, y: number, z: number}|null,
 *   faceCentreOffsetMm: number,
 *   clubBallContact: {clubZ: number, offset: number, offsetRatio: number, theta: number}
 * }}
 */
export function solveStudioContact({
  swingPlane,
  swingDirection,
  ballPositionCm,
  arcHeightCm,
  clubMode,
}) {
  const planeRadians = swingPlaneRad(swingPlane);
  const yawRadians = planeYawRad(swingDirection);

  const xLowPoint = lowPointX(ballPositionCm);
  const zLowPoint = lowPointZ(arcHeightCm, clubMode);
  const xEffective = effectiveLowPointX(xLowPoint, swingDirection, planeRadians);
  const theta = thetaAtImpact(xEffective);

  const clubZ = contactHeight(zLowPoint, theta, planeRadians);

  const basis = planeBasis(yawRadians, planeRadians);
  const lowPoint = lowPointWorld(
    xEffective,
    zLowPoint,
    theta,
    yawRadians,
    planeRadians,
  );

  const crossingTheta = groundCrossingTheta0(zLowPoint, planeRadians);
  const { groundEntry, groundExit } = groundCrossings(
    lowPoint,
    basis,
    crossingTheta,
  );

  return {
    contactHeight: clubZ,
    groundCrossingTheta0: crossingTheta,
    groundEntry,
    groundExit,
    faceCentreOffsetMm: faceCentreOffsetMm(clubZ, clubMode),
    clubBallContact: clubBallContact(clubZ, theta),
  };
}
