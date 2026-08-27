/**
 * IMPACT · OUTCOME SELECTOR — motorbinding, D76-OMMALT.
 *
 * Kontrakten fra mocken står: `selectOutcome(state)` er det ENESTE stedet
 * fysikken kalles, og det eneste stedet enheter byttes. Alt annet (rendering,
 * chips, annotasjoner, hero) leser samme frosne `Outcome`.
 *
 * Ommalt fra mockens gamle motor til gjenoppbyggingens lag:
 *   solveFlight   → engine/src/solveFlight.js      (465 tester, bit-eksakt)
 *   hasFlight/inDomain/reason/shape → engine/src/outcomeAdapter.js
 *   trajectorySamples → adapter/src/traceShape.js traceSamples (D61/D63-laget:
 *     presentasjonsinterpolasjon forankret eksakt i motorens launch, apex,
 *     carry, landing og offline — normaliserte {d, x, h}-punkter)
 *   yards→meter  → adapter/src/convert.js (D58: konvertering skjer ETT sted;
 *     mockens YD2M-literal er død, og fysikklinten håndhever det)
 *
 * Verdensrommet er i VISNINGSENHETER (D57). Pakken er brukerens valg fra
 * onboardingens enhetssteg og leses fra `shared/sa-units.js` (D103) — den er
 * ikke lenger en konstant her. Z-up som før: +X nedslag, +Y høyre, +Z høyde.
 *
 * Domenepredikatet er motorens eget: inDomain = signedVerticalSpinLoftDeg > 0
 * (outcomeAdapter eier terskelen — se mockens filhode for fortegnshistorien).
 */

import { solveFlight } from '../../engine/src/solveFlight.js';
import { solveOutcome } from '../../engine/src/outcomeAdapter.js';
import { traceSamples } from '../../adapter/src/traceShape.js';
import { distanceForDisplay } from '../../adapter/src/convert.js';
import { getUnitSystem, onUnitChange } from '../shared/sa-units.js';

/* D103: enhetspakken er en KJØRETIDSVERDI, ikke en byggetidskonstant. Den er
   `let` med vilje — ESM live bindings gjør at importørene (impact.html) ser
   den nye verdien uten at noen må hente den på nytt. Bytt aldri her: bytt via
   `setUnitSystem()`, som er det enhetssteget kaller. */
export let UNIT_SYSTEM = getUnitSystem();
const toWorld = (yards) => distanceForDisplay(yards, UNIT_SYSTEM).value;

// Liten LRU (ikke én-slot): tegneløkken leser live + inntil 3 pins per frame,
// og en én-slot-memo ville trashe mellom dem. 8 slots dekker det med margin.
const memo = new Map();
const MEMO_MAX = 8;

/* Memoen holder ferdig konverterte verdensenheter. Bytter pakken, er hver
   lagrede Outcome regnet i feil enhet — derfor tømmes den, aldri gjenbrukes. */
onUnitChange((system) => {
  UNIT_SYSTEM = system;
  memo.clear();
});

/**
 * state → Outcome (frosset form, samme fasong som mocken):
 *   raw  — solveFlight(...) uendret (yards/mph), for breakdown-forklaringer.
 *   m    — visningsenheter, konvertert ÉN gang: carry, total, apex, curve, side.
 *   deg  — launchDir, spinAxis, launchAng, spinLoft, landAng.
 *   misc — backspin (rpm), ballSpeed (mph), smash.
 *   path — banegeometri i verdensenheter, ferdig skalert ({x,y,z}[], Z-up).
 *   physical — { inDomain, reason, hasFlight, shape } fra outcomeAdapter.
 *
 * Memoisert på de fem parametrene; `station` påvirker aldri resultatet.
 */
export function selectOutcome(state) {
  const key = [state.face, state.path, state.attack, state.dynLoft, state.speed].join('|');
  const hit = memo.get(key);
  if (hit) { memo.delete(key); memo.set(key, hit); return hit; }

  // Motorens §3-signatur — merk feltnavnene: state.face→faceAngle, state.path→clubPath.
  const raw = solveFlight({
    clubPath: state.path,
    faceAngle: state.face,
    attackAngle: state.attack,
    dynamicLoft: state.dynLoft,
    clubSpeed: state.speed,
  });
  const oc = solveOutcome(raw);

  const carryW = toWorld(raw.carry);
  const offlineW = toWorld(raw.offline);
  const apexW = toWorld(raw.apex);

  // D79 vei B: samples i YARDS med endepunkter TILORDNET motorfeltene
  // (bit-likhet per konstruksjon). Én visningsfaktor skalerer alle tre
  // aksene til verdensenheter (Z-up: +X nedslag, +Y høyre, +Z høyde).
  const k = distanceForDisplay(1, UNIT_SYSTEM).value;
  const samples = traceSamples(raw);
  const path = samples.map(p => Object.freeze({
    x: p.d * k,
    y: p.lat * k,
    z: p.h * k,
  }));

  const outcome = Object.freeze({
    raw: Object.freeze(raw),
    m: Object.freeze({
      carry: carryW,
      total: toWorld(raw.total),
      apex: apexW,
      curve: toWorld(raw.curve),
      side: offlineW,
    }),
    deg: Object.freeze({
      launchDir: raw.startDirection,
      spinAxis: raw.spinAxis,
      launchAng: raw.launchAngle,
      spinLoft: raw.spinLoft,
      landAng: raw.landingAngle,
    }),
    misc: Object.freeze({
      backspin: raw.backspin,
      ballSpeed: raw.ballSpeed,
      smash: raw.smash,
    }),
    path: Object.freeze(path),
    physical: Object.freeze({
      inDomain: oc.inDomain,
      reason: oc.reason,
      hasFlight: oc.hasFlight,
      shape: oc.shape,
    }),
  });

  memo.set(key, outcome);
  if (memo.size > MEMO_MAX) memo.delete(memo.keys().next().value);
  return outcome;
}
