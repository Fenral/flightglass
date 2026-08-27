/**
 * STUDIO SOLVE v2 — produksjonsstien for Impact Studio.
 *
 * `deriveImpact.js` beholdes som pinnet v1-baseline (samme mønster som
 * `aero-reference.js`), slik at endringen kan måles i stedet for påstås.
 * Se `D7-DIFF.md`.
 *
 * ── Tre ting v1 buntet sammen ──────────────────────────────────────────────
 * `clubMode` bar tre uavhengige beslutninger i ett valg:
 *
 *   1. `lift`   ballens høyde over bakkeplanet  →  UNDERLAGET
 *   2. `sweet`  sweetspotens høyde over sålen   →  KØLLA
 *   3. `zClub`  −0,2 cm jern / +1,8 cm driver   →  PIGGEN, en tredje gang
 *
 * Punkt 3 er den som overrasket. `lowPointZ = (arcHeightCm + zClub)/100` gjorde
 * buens bunnpunkt køllespesifikt — men buens bunn er en egenskap ved SVINGEN,
 * ikke ved kølla. `zClub` kodet at driveren står på pigg, altså det samme som
 * `lift` allerede kodet. Samme opplysning to steder, med ulikt fortegn og ulik
 * enhet.
 *
 * I v2 er `lowPointZ = arcHeightCm / 100`. Underlaget lever kun i
 * `lieHeightMm`, og kun i kontaktberegningen.
 *
 * Attack angle og club path er UBERØRT — verifisert bit-identiske mellom jern
 * og driver over 1250 matchede par i v1, fordi `zClub` aldri nådde dem.
 *
 * Rene funksjoner. Ingen tilstand, ingen I/O, ingen presentasjonsdata.
 */

import {
  solveStudioGeometry,
} from './studioGeometry.js';
import {
  swingPlaneRad, planeYawRad, planeBasis, arcPoint,
  groundCrossingTheta0, groundCrossings,
} from './studioContact.js';
import {
  strikeContact, CLUB_GEOMETRY, LIE_PRESETS, ballRadiusM,
} from './contactModel.js';
import { strikeBand } from './strikeBand.js';

const STUDIO_RADIUS_M = 1.2;

/** Spec §3: ingen parsing, ingen koersjon. Kast på brudd. */
function assertContract(input) {
  const nums = ['swingPlane', 'swingDirection', 'ballPositionCm', 'arcHeightCm', 'lieHeightMm'];
  for (const k of nums) {
    if (typeof input[k] !== 'number' || !Number.isFinite(input[k])) {
      throw new TypeError(`studioSolve: ${k} må være et endelig tall, fikk ${input[k]}`);
    }
  }
  if (input.lieHeightMm < 0) {
    throw new RangeError(`studioSolve: lieHeightMm kan ikke være negativ, fikk ${input.lieHeightMm}`);
  }
  if (!input.club || typeof input.club.sweetSpotHeightMm !== 'number') {
    throw new TypeError('studioSolve: club må være en oppføring fra CLUB_GEOMETRY');
  }
}

/**
 * Buens bunnpunkt over bakken. **Kun svingens arc height** — ingen køllekorreksjon.
 * v1 la til `zClub` her, som kodet piggen en gang til. Se filhodet.
 */
export function lowPointZv2(arcHeightCm) {
  return arcHeightCm / 100;
}

/**
 * @param {object} input
 * @param {number} input.swingPlane      grader
 * @param {number} input.swingDirection  grader
 * @param {number} input.ballPositionCm  cm relativt buens low point
 * @param {number} input.arcHeightCm     cm
 * @param {number} input.lieHeightMm     ballens høyde over bakkeplanet
 * @param {object} input.club            oppføring fra CLUB_GEOMETRY
 * @param {number} input.dynamicLoftDeg  for vertikal slagflatehøyde
 */
export function studioSolve(input) {
  assertContract(input);
  const {
    swingPlane, swingDirection, ballPositionCm, arcHeightCm,
    lieHeightMm, club, dynamicLoftDeg,
  } = input;

  /* §8.1–8.4 — uendret fra v1. Attack og path er køllenøytrale. */
  const geometry = solveStudioGeometry({
    swingPlane, swingDirection, ballPositionCm, arcHeightCm, clubMode: 'iron',
  });

  const planeRadians = swingPlaneRad(swingPlane);
  const yawRadians = planeYawRad(swingDirection);
  const basis = planeBasis(yawRadians, planeRadians);

  /* v2: buens bunn er svingens, ikke køllas. */
  const zLowPoint = lowPointZv2(arcHeightCm);
  const theta = geometry.thetaAtImpact;

  /* Køllehøyde ved ballen, samme geometri som GAPS §7 men uten zClub-fudgen. */
  const clubHeightM =
    zLowPoint + STUDIO_RADIUS_M * (1 - Math.cos(theta)) * Math.sin(planeRadians);

  /* Bakkekryssingene. NaN-vakten fra BASELINE-FUNN [12] er beholdt. */
  const crossingTheta = groundCrossingTheta0(zLowPoint, planeRadians);
  const lowPoint = {
    x: geometry.effectiveLowPointX * Math.cos(yawRadians),
    y: geometry.effectiveLowPointX * Math.sin(yawRadians),
    z: zLowPoint,
  };
  const { groundEntry, groundExit } = groundCrossings(lowPoint, basis, crossingTheta);

  /* Treffpunkt på slagflaten — to mål, D24. */
  const contact = strikeContact({
    lieHeightMm,
    clubHeightMm: clubHeightM * 1000,
    club,
    dynamicLoftDeg,
  });

  /* Én klassifiserer, regime valgt av underlaget. D5, D17b. */
  const band = strikeBand({
    lieHeightMm,
    clubHeightM,
    effectiveLowPointM: geometry.effectiveLowPointX,
    thetaAtImpact: theta,
    offsetMm: contact.offsetMm,
    halfFaceMm: contact.halfFaceMm,
  });

  return {
    /* køllenøytral geometri */
    attackAngle: geometry.attackAngle,
    clubPath: geometry.clubPath,
    lowPointX: geometry.lowPointX,
    lowPointZ: zLowPoint,
    effectiveLowPointX: geometry.effectiveLowPointX,
    thetaAtImpact: theta,
    lowPointWorld: lowPoint,
    planeBasis: basis,
    impactPoint: arcPoint(lowPoint, basis, theta),

    /* bakkekryssing */
    groundCrossingTheta0: crossingTheta,
    groundEntry,
    groundExit,

    /* kontakt — to mål, D24 */
    clubHeightM,
    faceCentreOffsetMm: contact.offsetMm,
    faceCentreOffsetRatio: contact.offsetRatio,
    onFace: contact.onFace,
    verticalFaceHeightMm: contact.verticalFaceHeightMm,

    /* klassifisering — begge svar, alltid. Se U1 og D3b. */
    turfBand: band.turfBand,
    facePosition: band.facePosition,
    strikeRegime: band.regime,
    hasTurfContact: band.hasTurfContact,
    strikeLead: band.lead,

    /* proveniens: hva som ble antatt, ikke skjult */
    lieHeightMm,
    sweetSpotHeightMm: club.sweetSpotHeightMm,
    clubGeometryConfidence: club.confidence,
    ballRadiusM,
  };
}

export { CLUB_GEOMETRY, LIE_PRESETS };
