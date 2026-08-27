/**
 * D0 mot AMATØRSEGMENTET — utrullbroen (D49).
 *
 * Amatørdata finnes kun som TOTAL. Motoren produserer carry.
 * Bruker låste D49: motorens EGEN rollFrac-modell som bro, ikke et oppfunnet tall.
 *
 * ⚠ Broen er KUN en sammenligning. Den rører aldri fysikken.
 * ⚠ Motorens rollFrac er selv ukalibrert. Det står i porten, ikke i en fotnote.
 */
import { solveFlight } from '../src/solveFlight.js';

/* Arccos, kildeverifisert. Driver totaldistanse per handicap, menn.
   Granskerens anbefaling: bruk Arccos hcp 10.0-14.9 = 223 som anker —
   Shot Scopes hcp-10-rad ligger systematisk høyt i SYV uavhengige køller. */
const AMATOR_DRIVER = [
  { hcp: '0.0-4.9',   totalYd: 250 },
  { hcp: '5.0-9.9',   totalYd: 236 },
  { hcp: '10.0-14.9', totalYd: 223 },
  { hcp: '15.0-19.9', totalYd: 211 },
  { hcp: '20.0-24.9', totalYd: 199 },
  { hcp: '25.0-29.9', totalYd: 188 },
  { hcp: '30+',       totalYd: 175 },
];

/** Finn køllefart som gir målt totaldistanse, ved typisk driverlevering. */
function speedForTotal(targetTotal) {
  let lo = 40, hi = 140;
  for (let i = 0; i < 120; i++) {
    const m = (lo + hi) / 2;
    const r = solveFlight({ clubSpeed: m, faceAngle: 0, clubPath: 0,
                            attackAngle: -0.9, dynamicLoft: 12.5 });
    if (r.total < targetTotal) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

console.log('D0 — AMATØRSEGMENT, driver. Utrullbro per D49.\n');
console.log('⚠ Broen er motorens egen rollFrac. Den er UKALIBRERT.');
console.log('⚠ Alle amatørtall er total; carry kan ikke gates for dette segmentet.\n');
console.log('handicap      total(målt)  → køllefart   carry    roll   roll%   snittfart');
console.log('─'.repeat(78));

const speeds = [];
for (const a of AMATOR_DRIVER) {
  const cs = speedForTotal(a.totalYd);
  const r = solveFlight({ clubSpeed: cs, faceAngle: 0, clubPath: 0,
                          attackAngle: -0.9, dynamicLoft: 12.5 });
  speeds.push({ ...a, cs, r });
  console.log(
    a.hcp.padEnd(13) + String(a.totalYd).padStart(8) + ' yd' +
    cs.toFixed(1).padStart(12) + ' mph' +
    r.carry.toFixed(1).padStart(9) + r.roll.toFixed(1).padStart(8) +
    ((r.roll / r.total) * 100).toFixed(1).padStart(7) + '%',
  );
}
console.log('─'.repeat(78));

/* Plausibilitetssjekk — den eneste porten som kan settes her. */
const cs = speeds.map(s => s.cs);
let mono = true;
for (let i = 1; i < cs.length; i++) if (cs[i] > cs[i-1]) mono = false;
console.log('\nPORT: er køllefartrekka monotont fallende med handicap?',
  mono ? 'JA' : 'NEI — modellen er inkonsistent med amatørdataene');
console.log('spenn:', cs[cs.length-1].toFixed(1), '…', cs[0].toFixed(1), 'mph');

/* Kryssjekk mot det ENE amatørtallet vi har utenfor distanse. */
const SMASH_HCP_14_5 = 1.44;   // Trackman Combine, kildeverifisert
const mid = speeds.find(s => s.hcp === '10.0-14.9');
console.log('\nKRYSSJEKK mot Trackman Combine smash for hcp ~14,5:');
console.log('  målt smash', SMASH_HCP_14_5, '| modellens smash ved utledet fart',
  mid.r.smash.toFixed(3),
  '| avvik', (((mid.r.smash / SMASH_HCP_14_5) - 1) * 100).toFixed(1) + '%');
console.log('\nDette er den ENESTE uavhengige kryssjekken som finnes for amatør.');
console.log('De øvrige åtte metrikkene har null amatørdekning (F14).');
