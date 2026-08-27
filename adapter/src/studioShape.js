/**
 * STUDIOSHAPE — Studios buegeometri som tegnepunkter (D61/D62-snittet,
 * eierbekreftet for strøm B 2026-08-25).
 *
 * `studioSolve` returnerer buens definisjon — `lowPointWorld`, `planeBasis`,
 * `thetaAtImpact`, kryssinger — men ingen polylinje: motoren eier kurven som
 * matematikk, ikke som punkter. Samplingen og projeksjonen ned til et
 * skjermplan er kategori 2 (projeksjon mellom motorens tall) og bor derfor
 * her, aldri i `app/`. Fysikklinten håndhever grensen.
 *
 * Ingen egen kurveform finnes her: hvert punkt kommer fra motorens egen
 * `arcPoint` (ENGINE-GAPS §8 `P(t)`), importert — ikke reimplementert. Denne
 * modulen velger bare HVILKE t-verdier som samples og HVILKET plan de
 * projiseres på. Det er tegneantagelsen, og den skal ligge ett sted.
 *
 * Verdensakser (spec §8, Studio): +x = target, +y = bort fra Face
 * On-kameraet, +z = opp. Meter.
 *
 *   Face On:  skjermplanet er (x, z) — target mot høyre, opp er opp.
 *   DTL:      kamera bak ballen, ser langs +x. Skjerm-høyre = −y, slik at
 *             positiv club path (høyre, spec §4) peker mot høyre på skjermen.
 *
 * Meter inn, meter ut. Px-skalering er ren skjermgeometri (kategori 3) og
 * skjer i rendereren. Rene funksjoner; `solved` røres aldri.
 */

import { arcPoint } from '../../engine/src/studioContact.js';
import { studioRadius } from '../../engine/src/constants.js';

function assertFinite(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`studioShape: ${name} må være et endelig tall, fikk ${String(value)}.`);
  }
}

function assertPoint3(p, name) {
  if (p === null || typeof p !== 'object') {
    throw new TypeError(`studioShape: ${name} må være et {x,y,z}-punkt, fikk ${String(p)}.`);
  }
  assertFinite(p.x, `${name}.x`);
  assertFinite(p.y, `${name}.y`);
  assertFinite(p.z, `${name}.z`);
}

function assertSolved(solved) {
  if (solved === null || typeof solved !== 'object') {
    throw new TypeError('studioShape: solved må være studioSolve sitt returobjekt.');
  }
  assertPoint3(solved.lowPointWorld, 'solved.lowPointWorld');
  const b = solved.planeBasis;
  if (!b || typeof b !== 'object') {
    throw new TypeError('studioShape: solved.planeBasis mangler.');
  }
  assertPoint3(b.u, 'solved.planeBasis.u');
  assertPoint3(b.m, 'solved.planeBasis.m');
}

function assertSampleCount(n) {
  if (!Number.isInteger(n) || n < 2) {
    throw new TypeError(`studioShape: n må være et heltall ≥ 2, fikk ${String(n)}.`);
  }
}

/**
 * Face On-projeksjonen av et verdenspunkt: (x, z).
 * @param {{x: number, y: number, z: number}} p meter
 * @returns {[number, number]} `[xM, zM]`
 */
export function faceOnPoint(p) {
  assertPoint3(p, 'p');
  return [p.x, p.z];
}

/**
 * DTL-projeksjonen av et verdenspunkt: (−y, z). Skjerm-høyre = golferens
 * høyre, så positiv club path leser som høyre — samme konvensjon som L/R/C.
 * @param {{x: number, y: number, z: number}} p meter
 * @returns {[number, number]} `[rightM, zM]`
 */
export function dtlPoint(p) {
  assertPoint3(p, 'p');
  return [-p.y, p.z];
}

function sampleArc(solved, n, spanRad, project) {
  assertSolved(solved);
  assertSampleCount(n);
  assertFinite(spanRad, 'spanRad');
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const t = -spanRad + (2 * spanRad * i) / n;
    pts.push(project(arcPoint(solved.lowPointWorld, solved.planeBasis, t)));
  }
  return pts;
}

/**
 * Buen samplet symmetrisk om low point (t = 0), projisert til Face On.
 * Spennet 0.6 rad dekker hele inputdomenet: maks |thetaAtImpact| er ~0.45
 * (ball position ±20 cm pluss full swing direction-forskyvning), og
 * bakkekryssingene ved arc height −5 cm ligger ved ~0.31 rad.
 *
 * @param {object} solved returobjekt fra `studioSolve`
 * @param {number} [n] antall segmenter; returnerer n + 1 punkter
 * @param {number} [spanRad] halvspenn i radianer
 * @returns {Array<[number, number]>} `[xM, zM]` per punkt
 */
export function faceOnArcPoints(solved, n = 96, spanRad = 0.6) {
  return sampleArc(solved, n, spanRad, faceOnPoint);
}

/**
 * Samme bue projisert til DTL. Større spenn (1.0 rad) fordi DTL-perspektivet
 * er der planhelningen skal LESES — buen må rekke opp langs glasset.
 *
 * @param {object} solved returobjekt fra `studioSolve`
 * @param {number} [n] antall segmenter; returnerer n + 1 punkter
 * @param {number} [spanRad] halvspenn i radianer
 * @returns {Array<[number, number]>} `[rightM, zM]` per punkt
 */
export function dtlArcPoints(solved, n = 96, spanRad = 1.0) {
  return sampleArc(solved, n, spanRad, dtlPoint);
}

/**
 * Ghost club-skaftet i Face On: en strek fra buepunktet ved `thetaRad` innover
 * mot buens senter (den radiale retningen — skaftet peker dit i en stiv
 * énplansmodell). Senteret er `LP + R·m` per ENGINE-GAPS §8.
 *
 * @param {object} solved returobjekt fra `studioSolve`
 * @param {number} thetaRad hendelsen som forklarer utfallet (treff eller entry)
 * @param {number} [shaftLenM] skjermskaftets lengde i meter
 * @returns {{sole: [number, number], grip: [number, number]}}
 */
export function faceOnClubShaft(solved, thetaRad, shaftLenM = 0.45) {
  assertSolved(solved);
  assertFinite(thetaRad, 'thetaRad');
  assertFinite(shaftLenM, 'shaftLenM');
  const p = arcPoint(solved.lowPointWorld, solved.planeBasis, thetaRad);
  const centre = {
    x: solved.lowPointWorld.x + studioRadius * solved.planeBasis.m.x,
    y: solved.lowPointWorld.y + studioRadius * solved.planeBasis.m.y,
    z: solved.lowPointWorld.z + studioRadius * solved.planeBasis.m.z,
  };
  const [px, pz] = faceOnPoint(p);
  const [cx, cz] = faceOnPoint(centre);
  const dx = cx - px;
  const dz = cz - pz;
  const len = Math.hypot(dx, dz);
  if (len === 0) {
    return { sole: [px, pz], grip: [px, pz + shaftLenM] };
  }
  return { sole: [px, pz], grip: [px + (dx / len) * shaftLenM, pz + (dz / len) * shaftLenM] };
}

/* ── D76-ommalingen: mockens scene konsumerer buens verdenspunkter, tangenter,
   planpunkter og en pinhole-projeksjon. Alt dette er kategori 2 (projeksjon
   mellom motorens tall) og bor her — app-laget mapper kun til piksler. ── */

/**
 * Ett buepunkt i verdenskoordinater — motorens `arcPoint`, kun med
 * kontraktsjekk. Scenene sampler vilkårlige theta (divot, transienter).
 *
 * @param {object} solved returobjekt fra `studioSolve`
 * @param {number} thetaRad
 * @returns {{x: number, y: number, z: number}} meter
 */
export function arcWorldPoint(solved, thetaRad) {
  assertSolved(solved);
  assertFinite(thetaRad, 'thetaRad');
  return arcPoint(solved.lowPointWorld, solved.planeBasis, thetaRad);
}

/**
 * Buen samplet symmetrisk om low point, i verdenskoordinater (for
 * DTL-perspektivet og de vindusklippede segmentene).
 *
 * @param {object} solved returobjekt fra `studioSolve`
 * @param {number} [n] antall segmenter; returnerer n + 1 punkter
 * @param {number} [spanRad] halvspenn i radianer
 * @returns {Array<{x: number, y: number, z: number}>} meter
 */
export function arcWorldPoints(solved, n = 96, spanRad = 0.6) {
  assertSolved(solved);
  assertSampleCount(n);
  assertFinite(spanRad, 'spanRad');
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const t = -spanRad + (2 * spanRad * i) / n;
    pts.push(arcPoint(solved.lowPointWorld, solved.planeBasis, t));
  }
  return pts;
}

/**
 * Buens tangentretning ved theta: d/dθ P(θ) = R cos θ · u + R sin θ · m.
 * Retningsvektor (ikke normalisert) — rendereren skalerer selv.
 *
 * @param {object} solved returobjekt fra `studioSolve`
 * @param {number} thetaRad
 * @returns {{x: number, y: number, z: number}}
 */
export function tangentWorld(solved, thetaRad) {
  assertSolved(solved);
  assertFinite(thetaRad, 'thetaRad');
  const { u, m } = solved.planeBasis;
  const along = studioRadius * Math.cos(thetaRad);
  const inward = studioRadius * Math.sin(thetaRad);
  return {
    x: along * u.x + inward * m.x,
    y: along * u.y + inward * m.y,
    z: along * u.z + inward * m.z,
  };
}

/**
 * Punkt i svingplanet: LP + a·u + b·m. Glassflaten i begge visninger er
 * quads av disse — planets form eies dermed her, ikke i rendereren.
 *
 * @param {object} solved returobjekt fra `studioSolve`
 * @param {number} alongM langs u (meter)
 * @param {number} upM langs m (meter)
 * @returns {{x: number, y: number, z: number}}
 */
export function planePoint(solved, alongM, upM) {
  assertSolved(solved);
  assertFinite(alongM, 'alongM');
  assertFinite(upM, 'upM');
  const lp = solved.lowPointWorld;
  const { u, m } = solved.planeBasis;
  return {
    x: lp.x + alongM * u.x + upM * m.x,
    y: lp.y + alongM * u.y + upM * m.y,
    z: lp.z + alongM * u.z + upM * m.z,
  };
}

/**
 * Pinhole-kamera for DTL-perspektivet (mockens kamera, flyttet hit fordi
 * projeksjon av motorens verdenspunkter er kategori 2). Z-opp-verden.
 *
 * @param {{pos: object, look: object, fovDeg: number, xStretch?: number,
 *          screenX?: number}} spec
 * @param {number} w viewport-bredde i px
 * @param {number} h viewport-høyde i px
 * @returns {object} kamerabasis for `projectPoint`
 */
export function pinholeCamera(spec, w, h) {
  assertPoint3(spec.pos, 'spec.pos');
  assertPoint3(spec.look, 'spec.look');
  assertFinite(spec.fovDeg, 'spec.fovDeg');
  assertFinite(w, 'w');
  assertFinite(h, 'h');
  const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
  const cross = (a, b) => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  });
  const norm = (v) => {
    const mLen = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / mLen, y: v.y / mLen, z: v.z / mLen };
  };
  const fwd = norm(sub(spec.look, spec.pos));
  const right = norm(cross(fwd, { x: 0, y: 0, z: 1 }));
  const upVec = norm(cross(right, fwd));
  return {
    pos: spec.pos,
    fwd,
    right,
    upVec,
    focal: (h / 2) / Math.tan(((spec.fovDeg * Math.PI) / 180) / 2),
    w,
    h,
    xStretch: spec.xStretch ?? 1,
    screenX: spec.screenX ?? 0,
  };
}

/**
 * Projiser et verdenspunkt gjennom `pinholeCamera`-basisen.
 * `null` når punktet ligger bak kameraet; `d` er kameradybden (taper).
 *
 * @param {{x: number, y: number, z: number}} p meter
 * @param {object} cam fra `pinholeCamera`
 * @returns {{x: number, y: number, d: number}|null} px
 */
export function projectPoint(p, cam) {
  assertPoint3(p, 'p');
  const rel = { x: p.x - cam.pos.x, y: p.y - cam.pos.y, z: p.z - cam.pos.z };
  const dot = (a, c) => a.x * c.x + a.y * c.y + a.z * c.z;
  const xC = dot(rel, cam.right);
  const yC = dot(rel, cam.upVec);
  const zC = dot(rel, cam.fwd);
  if (zC <= 0.01) return null;
  return {
    x: cam.w / 2 + cam.screenX + (xC / zC) * cam.focal * cam.xStretch,
    y: cam.h / 2 - (yC / zC) * cam.focal,
    d: zC,
  };
}

/**
 * Swing plane-glasset i DTL: et linjestykke gjennom treffpunktet langs planets
 * bratteste retning (basisvektoren `m` projisert til DTL). For swing
 * direction 0 er stigningen eksakt tan(swing plane) — glasset ER planvinkelen.
 *
 * @param {object} solved returobjekt fra `studioSolve`
 * @param {number} [halfLenM] halvlengde i meter
 * @returns {[[number, number], [number, number]]} to endepunkter `[rightM, zM]`
 */
export function dtlPlaneSegment(solved, halfLenM = 0.8) {
  assertSolved(solved);
  assertFinite(halfLenM, 'halfLenM');
  assertPoint3(solved.impactPoint, 'solved.impactPoint');
  const [px, pz] = dtlPoint(solved.impactPoint);
  const rx = -solved.planeBasis.m.y; // dtl-projeksjonen av m: right = −m.y
  const dz = solved.planeBasis.m.z;
  const len = Math.hypot(rx, dz);
  if (len === 0) {
    return [[px - halfLenM, pz], [px + halfLenM, pz]];
  }
  const ux = rx / len;
  const uz = dz / len;
  return [
    [px - ux * halfLenM, pz - uz * halfLenM],
    [px + ux * halfLenM, pz + uz * halfLenM],
  ];
}
