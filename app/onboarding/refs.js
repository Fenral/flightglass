/**
 * ONBOARDING · REFS — leksjonens faste referansepunkter, hentet fra motoren.
 *
 * Coachmark-tekstene i steg 1 og 3 peker på bestemte punkter i leksjonen
 * («to grader tilbake …», «tolv grader loft …»). De punktene er FASTE — de
 * hører til skriptet, ikke til hvor brukeren står akkurat nå — men de er
 * fortsatt motortall, ikke literaler. Denne modulen regner dem én gang og
 * formaterer dem i brukerens enhet (D57).
 *
 * Ingen fysikk skjer her. `solveFlight` spørres; differansene er differanser
 * mellom to av motorens egne svar, som er samme klasse som Ball Flights
 * delta-setning (D64/B-h) og passerer fysikklinten.
 */

import { solveFlight } from '../../engine/src/solveFlight.js';
import { displayValue } from '../../adapter/src/displayFlight.js';
import { FLIGHT_BASIS } from './steps.js';

const shotAt = (over) => solveFlight({
  clubSpeed: FLIGHT_BASIS.speed,
  clubPath: FLIGHT_BASIS.path,
  attackAngle: FLIGHT_BASIS.attack,
  dynamicLoft: FLIGHT_BASIS.dynLoft,
  faceAngle: 0,
  ...over,
});

/**
 * Steg 1: det som gjør steget verdt å bygge appen rundt — ballen som krummer
 * mest lander nærmest, og den som går rett lander lengst unna.
 *
 * @param {'meters'|'yards'} units
 */
export function step1Refs(units) {
  const atPath = shotAt({ faceAngle: FLIGHT_BASIS.path });      // face = path → null kurve
  const twoBack = shotAt({ faceAngle: FLIGHT_BASIS.path - 2 }); // to grader tilbake
  return Object.freeze({
    sideAtPath: displayValue('lateralDistance', atPath.offline, units).text,
    curveBefore: displayValue('lateralDistance', twoBack.curve, units).text,
    sideBefore: displayValue('lateralDistance', twoBack.offline, units).text,
  });
}

/**
 * Steg 3: byttet. Mer loft kjøper høyde og bratthet, og koster carry.
 *
 * @param {'meters'|'yards'} units
 */
export function step3Refs(units) {
  const low = shotAt({ dynamicLoft: 18 });
  const high = shotAt({ dynamicLoft: 30 });
  return Object.freeze({
    apexGain: displayValue('distance', high.apex - low.apex, units).text,
    landingGain: displayValue('plainAngle', high.landingAngle - low.landingAngle, units).text,
    carryCost: displayValue('distance', low.carry - high.carry, units).text,
  });
}
