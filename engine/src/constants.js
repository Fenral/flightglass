/**
 * Flightglass engine — numeriske konstanter.
 *
 * BASELINE. Alle verdier her er hentet ordrett fra:
 *   - 01-PHYSICS-AND-MECHANICS-ENGINE.md §5 (Ball Flight) og §8 (Impact Studio)
 *   - motor/export/ENGINE-GAPS.md (hull spec-en ikke dekket)
 *   - motor/export/flight-golden.json og studio-golden.json (fasit)
 *
 * Ingen verdi her er avrundet, "ryddet" eller forbedret. Ser et tall feil ut,
 * er det fordi dagens motor har det tallet. Endring av en verdi her endrer
 * baseline og skal ikke skje uten en eksplisitt, versjonert fysikkendring.
 *
 * NAVNGIVING: der golden-fixturen eksponerer konstanten som et felt i `out`,
 * bruker vi feltnavnet uendret (launchIntercept, smashModelIntercept,
 * spinCalibrationLow, …). Der fixturen bare eksponerer den avledede verdien
 * (f.eks. `startFaceW`, `rollFrac`), bruker vi feltnavnet som prefiks.
 * Kommentaren over hver gruppe oppgir hvor verdien kommer fra.
 *
 * Ingen farger, UI-strenger eller presentasjonsdata. Ett unntak, eksplisitt
 * merket: `aeroModelIdentity` nederst, som er provenance-strenger `out`
 * faktisk inneholder og som en reproduksjon må emittere for å matche fixturen.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Enheter og konvertering  (spec §5.5, §5.7, §6, §8.1)
 * ───────────────────────────────────────────────────────────────────────── */

/** mph → m/s. Spec §5.4: `ClubSpeed × 0.44704`. */
export const mphToMps = 0.44704;

/** yard → meter. Spec §6: UI-adapteren konverterer én gang med 0.9144. */
export const yardToMetre = 0.9144;

/**
 * Centimeter per meter. Spec §8.1: `LowPointX = (10.5 − BallPositionCm) / 100`.
 *
 * ⚠ DIVIDER med denne. Ikke multipliser med 0.01 — det er 1 ULP unna og gir
 * feil `lowPointX` i 250 av 2500 studio-caser. Derfor er konstanten 100 og
 * ikke 0.01: den gale operasjonen skal være tungvint å skrive.
 */
export const cmPerMetre = 100;

/**
 * Grader → radianer.
 *
 * ⚠ ULP-FELLE, VERIFISERT MOT BEGGE FIXTURENE. De to motorene bruker ULIK
 * rekkefølge, og forskjellen er 1–2 ULP — nok til å bryte bit-eksakte tester.
 *
 *   Flight  (`flightglass-3d-spin-model.js`):  `deg * (Math.PI / 180)`
 *           altså `deg * degToRad`. Gir 5028/5028 bit-eksakt `faceNormalUnit`.
 *           Den motsatte rekkefølgen gir bare 4189/5028.
 *
 *   Studio  (`swing-parameters-and-impact.js`): `(deg * Math.PI) / 180`
 *           altså IKKE `deg * degToRad`. Gir 2500/2500 bit-eksakt på
 *           `planeBasis.m.z`, `thetaAtImpact` og `contactHeight`.
 *           `deg * degToRad` gir 2000 / 2300 / 2354.
 *
 * Unntak inne i Studio: den avsluttende gradskalaen i `perDegree`
 * (spec §8.2, `Radius × cos(φ) × π/180`) er gruppert som `* (Math.PI / 180)`
 * — altså `* degToRad`. Den blandingen finnes i dagens kode. Behold den.
 */
export const degToRad = Math.PI / 180;

/** Radianer → grader. */
export const radToDeg = 180 / Math.PI;

/** rpm → rad/s. ENGINE-GAPS §1: `ω₀ = uₛ · totalSpinRpm · (2π/60)`. */
export const rpmToRadPerSec = (2 * Math.PI) / 60;

/** rad/s → rpm. Spec §5.4: `spinRadPerSecond × 60 / (2π)`. */
export const radPerSecToRpm = 60 / (2 * Math.PI);

/* ─────────────────────────────────────────────────────────────────────────
 * Ball, kølle og miljø  (spec §5.4, §5.7)
 * ───────────────────────────────────────────────────────────────────────── */

/** Golfballens masse i kg. Spec §5.4 og §5.7. */
export const ballMass = 0.04593;

/**
 * Golfballens radius i meter, flight-motoren. Spec §5.4 og §5.7.
 * MERK: Studio bruker en ANNEN ballradius (`studioBallRadius` = 0.0213).
 * Det avviket finnes i dagens motor og skal beholdes.
 */
export const ballRadius = 0.021335;

/** Standard lufttetthet i kg/m³. Spec §5.7. */
export const airDensity = 1.225;

/** Kinematisk viskositet i m²/s, brukt til Reynolds. Spec §5.7. */
export const kinematicViscosity = 1.46e-5;

/** Tyngdeakselerasjon i m/s². Spec §5.7. */
export const gravity = 9.80665;

/** Vind i m/s. Spec §5.7: null vind. `airVelocity = velocity − wind`. */
export const wind = Object.freeze([0, 0, 0]);

/** Antatt køllehodemasse i kg. Spec §5.4. */
export const clubHeadMass = 0.2;

/** Ballens treghetsfaktor (dimensjonsløs). Spec §5.4. */
export const inertiaFactor = 0.4;

/* ─────────────────────────────────────────────────────────────────────────
 * RK4-integrasjon  (spec §5.7, ENGINE-GAPS §1)
 * ───────────────────────────────────────────────────────────────────────── */

/** Spinntap per sekund: `d|ω|/dt = −0.04 · |ω|`. Spec §5.7.
 *  Fixture: `out.aeroModel.spinDecayPerSecond`. */
export const spinDecay = 0.04;

/** Fast RK4-steg i sekunder. Spec §5.7.
 *  Fixture: `out.aeroModel.integrationStepSeconds`. */
export const rk4Step = 0.01;

/** Maksimal flukttid i sekunder. Nås ikke bakken innen dette, skal solveren
 *  feile (fixture: `edge.rk4-no-ground-within-30-seconds` kaster
 *  "Flight did not reach the ground within maxTimeSeconds"). Spec §5.7. */
export const maxFlightTime = 30;

/** Startshøyde z₀ i meter. ENGINE-GAPS §1: state initialiseres til
 *  `[0, 0, 1e-6, v₀, |ω₀|]` — ikke z = 0. */
export const rk4InitialHeight = 1e-6;

/* ─────────────────────────────────────────────────────────────────────────
 * §5.1 Startretning
 *   faceWeight = clamp(0.90 − 0.005 × DynamicLoft, 0.60, 0.88)
 *   StartDirection = faceWeight × FaceAngle + (1 − faceWeight) × ClubPath
 * Fixture eksponerer den avledede vekten som `out.startFaceW`.
 * ───────────────────────────────────────────────────────────────────────── */

export const startFaceWIntercept = 0.9;
export const startFaceWLoftSlope = 0.005;
export const startFaceWMinimum = 0.6;
export const startFaceWMaximum = 0.88;

/* ─────────────────────────────────────────────────────────────────────────
 * §5.3 Launch Angle (modellert fit)
 *   interceptBlend = clamp(DynamicLoft / 10, 0, 1)
 *   LaunchAngle = launchIntercept × interceptBlend
 *               + launchLoftW × DynamicLoft
 *               + launchLoftQuadratic × DynamicLoft²
 *               + launchAttackW × AttackAngle
 * ───────────────────────────────────────────────────────────────────────── */

export const launchIntercept = 10.391891433573875;
export const launchLoftW = -0.1693792957175766;
export const launchLoftQuadratic = 0.012024703872880052;
export const launchAttackW = 0.25;

/** Loft-graden der intercept-blend når 1. Fixture eksponerer den avledede
 *  verdien som `out.launchInterceptBlend`. */
export const launchInterceptBlendFullAtDeg = 10;

/* ─────────────────────────────────────────────────────────────────────────
 * §5.5 Smash og Ball Speed
 *   smashEfficiency = clamp(intercept + linear × SpinLoft + quadratic × SpinLoft²,
 *                           smashMinimum, smashMaximum)
 *   BallSpeed = ClubSpeed × smashEfficiency
 * SpinLoft her er den 3-dimensjonale `spinLoft3DDeg`, ikke den signerte
 * vertikale. Verifisert mot fixturen.
 * ───────────────────────────────────────────────────────────────────────── */

export const smashModelIntercept = 1.544034400161688;
export const smashSpinLoftLinear = -0.0033788247838473073;
export const smashSpinLoftQuadratic = -0.00006496570484201677;
export const smashMinimum = 1.15;
export const smashMaximum = 1.52;

/* ─────────────────────────────────────────────────────────────────────────
 * §5.4 Spin og spinnakse
 *   verticalSpinLoft = abs(DynamicLoft − AttackAngle)
 *   spinCalibration  = spinCalibrationLow
 *                    + spinCalibrationRange
 *                      / (1 + exp(−(verticalSpinLoft − spinCalibrationMidpointDeg)
 *                                 / spinCalibrationWidthDeg))
 *   totalSpinRpm     = clamp(spinRadPerSecond × 60/(2π), 0, 9000)
 * ───────────────────────────────────────────────────────────────────────── */

export const spinCalibrationLow = 0.81;
export const spinCalibrationRange = 0.32;
export const spinCalibrationMidpointDeg = 31.98;
export const spinCalibrationWidthDeg = 2.14;

/** Nedre clamp på total spin. Spec §5.4: ingen kunstig minimumsverdi. */
export const minTotalSpinRpm = 0;

/** Sanity ceiling. FUNN F5: denne slår inn på 12 % av realistiske slag.
 *  Det er en synlig modellgrense, ikke et unntak. Behold verdien. */
export const maxTotalSpinRpm = 9000;

/** ENGINE-GAPS §5: er `abs(abs(p) − 1) < 1e-14` returneres
 *  `sign(p) × totalSpinRpm` eksakt, ellers `p × totalSpinRpm`. */
export const signedBackspinCollinearEpsilon = 1e-14;

/** ENGINE-GAPS §5: fallback for backspin-aksen `b = unit(l × z)` når
 *  krysset degenererer. */
export const backspinAxisFallback = Object.freeze([1, 0, 0]);

/* ─────────────────────────────────────────────────────────────────────────
 * §5.6 Carry, Apex, Landing Angle og Total
 *   carryBallSpeedFit    = carryBallSpeedLinear × BallSpeed
 *                        + carryBallSpeedQuadratic × BallSpeed²
 *   launchEfficiency     = sqrt(clamp(max(0, LaunchAngle) / 10, 0, 1))
 *   Carry                = carryBallSpeedFit × launchEfficiency
 *   Apex                 = apexBasePerBallSpeed × BallSpeed × launchEfficiency
 *                        + apexLaunchPerBallSpeedDeg × BallSpeed
 *                          × max(0, LaunchAngle) × launchEfficiency
 *   landingModel         = landingBase − landingSpinAmplitude
 *                          × exp(−verticalSpinLoft / landingSpinLoftTau)
 *   LandingAngle         = hasFlight ? clamp(landingModel, 32, 60) : 0
 *   rollFraction         = Carry > 0
 *                        ? clamp(0.04 − (LandingAngle − 45) × 0.0015, 0.012, 0.055)
 *                        : 0
 *   Total                = Carry × (1 + rollFraction)
 * ───────────────────────────────────────────────────────────────────────── */

export const carryBallSpeedLinear = 0.9205937574433162;
export const carryBallSpeedQuadratic = 0.004072298666112809;

/** Launch-graden der launchEfficiency når 1. Fixture: `out.carryFullLaunchAtDeg`. */
export const carryFullLaunchAtDeg = 10;

export const apexBasePerBallSpeed = 0.1300557732;
export const apexLaunchPerBallSpeedDeg = 0.0079993922;

export const landingBase = 52.8;

/** Amplituden i `52.8 − 41.5 × exp(−vsl/10.9)`. Fixture eksponerer bare det
 *  avledede leddet som `out.landingSpinTerm` (= −41.5 × exp(…)). */
export const landingSpinAmplitude = 41.5;

export const landingSpinLoftTau = 10.9;
export const landingMinimum = 32;
export const landingMaximum = 60;

/** Fixture eksponerer den avledede verdien som `out.rollFrac`. */
export const rollFracIntercept = 0.04;
export const rollFracLandingReferenceDeg = 45;
export const rollFracLandingSlope = 0.0015;
export const rollFracMinimum = 0.012;
export const rollFracMaximum = 0.055;

/* ─────────────────────────────────────────────────────────────────────────
 * §5.7 Aerodynamisk koeffisientbro
 *   Cl = liftCoefficientFactor × max(0, S)^liftCoefficientExponent
 *   CdBridge = dragBridgeBase
 *            + dragBridgeReynoldsAmplitude
 *              / (1 + exp((Re − dragBridgeReynoldsMidpoint) / dragBridgeReynoldsWidth))
 *            + dragBridgeSpinAmplitude × S / (dragBridgeSpinHalf + S)
 *   Cd = CdBridge × dragCompatibilityScale
 * ───────────────────────────────────────────────────────────────────────── */

export const liftCoefficientFactor = 0.4072;
export const liftCoefficientExponent = 0.4;

export const dragBridgeBase = 0.2016141765;
export const dragBridgeReynoldsAmplitude = 0.0463816544;
export const dragBridgeReynoldsMidpoint = 85000;
export const dragBridgeReynoldsWidth = 9000;
export const dragBridgeSpinAmplitude = 0.06;
export const dragBridgeSpinHalf = 0.15;

/** Fast 7-jern-kompatibilitetskalibrering for curve-solven. Spec §5.7 sier
 *  eksplisitt at dette IKKE er en fysisk ballegenskap.
 *  Fixture: `out.aeroModel.dragCompatibilityScale`. */
export const dragCompatibilityScale = 1.275116456035;

/** Fixture: `out.aeroModel.referenceAnchorDragScale`. Samme tall som
 *  `dragCompatibilityScale` i baseline; holdes som eget felt fordi fixturen
 *  emitterer begge. */
export const referenceAnchorDragScale = 1.275116456035;

/** Koeffisientbroens deklarerte gyldighetsområde, [min, maks].
 *  Fixture: `out.aerodynamicDiagnostics.reynoldsValidity`.
 *  FUNN F2: 87 % av realistiske slag faller utenfor. `extrapolated: true` er
 *  normaltilstanden — ikke bygg en UI-advarsel på den. */
export const reynoldsValidity = Object.freeze([70000, 210000]);

/** Fixture: `out.aerodynamicDiagnostics.spinParameterValidity`. */
export const spinParameterValidity = Object.freeze([0.08, 0.2]);

/* ─────────────────────────────────────────────────────────────────────────
 * ENGINE-GAPS §6 — carry-projeksjon av RK4-kurve
 * ───────────────────────────────────────────────────────────────────────── */

/** Rå downrange må være minst dette (meter) før projeksjonen defineres.
 *  Fixture: `out.curveCarryProjectionMinimumDownrangeM`. */
export const curveCarryProjectionMinimumDownrangeM = 1;

/** Er target carry ≤ dette, er projeksjonen definert med skala 1.
 *  ENGINE-GAPS §6. */
export const curveCarryProjectionTargetCarryEpsilon = 1e-12;

/* ─────────────────────────────────────────────────────────────────────────
 * §8 Impact Studio  (verdensakser: +X = target, +Y = bort fra Face On, +Z = opp)
 * Fixture: `studio-golden.json._meta.constants`.
 * ───────────────────────────────────────────────────────────────────────── */

/** Buens radius i meter. Spec §8.1. Fixture: `_meta.constants.radiusM`. */
export const studioRadius = 1.2;

/** Ballradius i meter brukt av Studio. Spec §8.5.
 *  Fixture: `_meta.constants.ballRadiusM`.
 *  MERK: dette er IKKE `ballRadius` (0.021335). Studio og flight bruker to
 *  ulike ballradier i dagens motor. Behold avviket. */
export const studioBallRadius = 0.0213;

/** Spec §8.1: `LowPointX = (10.5 − BallPositionCm) / 100`. */
export const studioBallPositionOffsetCm = 10.5;

/** Spec §8.3: `asin(clamp(−EffectiveLowPointX / Radius, −0.999, 0.999))`. */
export const studioThetaSinClamp = 0.999;

/** Fixture: `_meta.constants.planeDefaultDeg`. Default swing plane. */
export const studioPlaneDefaultDeg = 55;

/** Fixture: `_meta.constants.samples`. Antall samplepunkter langs buen. */
export const studioSamples = 96;

/** Fixture: `_meta.constants.sweepDeg` / `sweepRad`. Buens synlige sveip;
 *  `planePolygon` avhenger av dette.
 *  ⚠ `studioSweepRad` er `(48 * Math.PI) / 180`, IKKE `48 * degToRad` — de to
 *  skiller seg med 1 ULP. Bruk literalen her, ikke en ny utregning. */
export const studioSweepDeg = 48;
export const studioSweepRad = 0.8377580409572781;

/** Spec §8.1: klubbrelativ z-offset i cm.
 *  Iron LowPointZ = (ArcHeightCm − 0.2) / 100
 *  Driver LowPointZ = (ArcHeightCm + 1.8) / 100
 *  Fixture: `_meta.constants.arcZ0Cm`. */
export const arcZ0Cm = Object.freeze({ iron: -0.2, driver: 1.8 });

/** ENGINE-GAPS §9: sweet spot over sålen, meter.
 *  Fixture: `_meta.constants.sweetSpotAboveSoleM`. */
export const sweetSpotAboveSoleM = Object.freeze({ iron: 0.0213, driver: 0.033 });

/** ENGINE-GAPS §9: ballens løft over bakken for driver, meter (iron = 0).
 *  Fixture: `_meta.constants.driverBallLiftM`. */
export const driverBallLiftM = 0.03;

/** Spec §8.5 / fixture `_meta.constants`: low point 20–150 mm foran ballen er
 *  Pure-vinduet, 105 mm er modellens ideelle midtpunkt. */
export const lowPointAheadMinM = 0.02;
export const lowPointAheadMaxM = 0.15;
export const lowPointIdealM = 0.105;

/** Spec §8.5: Duff er kølle mer enn 25 mm under bakken ved ballen.
 *  Spec-en dokumenterer ikke de øvrige båndterskler numerisk — de må fittes
 *  mot studio-golden.json. Se README, "Åpne punkter". */
export const duffDepthM = 0.025;

/* ─────────────────────────────────────────────────────────────────────────
 * Provenance — ikke fysikk, ikke presentasjon.
 *
 * Disse strengene er faktiske felt i `flight-golden.json` sine `out`-objekter.
 * En reproduksjon må emittere dem ordrett for å matche fixturen. De er tatt
 * med her slik at ingen hardkoder dem inne i en solver. De er IKKE UI-tekst
 * og skal ikke rendres som brukervendt kopi.
 * ───────────────────────────────────────────────────────────────────────── */

export const aeroModelIdentity = Object.freeze({
  coefficientSetId:
    'tour-class-v1-era-bridge-v1+legacy-7iron-curve-flight-anchor-v1',
  baseCoefficientSetId: 'tour-class-v1-era-bridge-v1',
  class: 'historical Pro-V1-class isotropic bridge',
  exactNamedBall: false,
  validityKnown: true,
  reverseMagnusPolicy:
    'not modeled; positive-lift bridge is extrapolated below Reynolds 70000',
  disclosure:
    'Historical Pro-V1-class isotropic bridge; not exact current named-ball physics because proprietary modern coefficients are unavailable. Legacy-carry compatibility constraint for the curve flight only; not a ball property or named-ball calibration. Terminal RK4 lateral displacement is projected by its downrange ratio onto the retained Flightglass carry; this is a disclosed compatibility transform, not a measured ball coefficient.',
  club: '7iron',
});
