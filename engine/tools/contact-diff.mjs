/**
 * D7 — versjonert fysikkendring, kvantifisert.
 * Sammenligner gammel kontaktmodell (fixturen) mot contactModel.js v2,
 * uten å endre noe. Rapporten er beslutningsgrunnlaget, ikke selve endringen.
 */
import { readFileSync } from 'node:fs';
import { strikeContact, CLUB_GEOMETRY, LIE_PRESETS } from '../src/contactModel.js';
import { strikeBand } from '../src/strikeBand.js';

const rows = JSON.parse(readFileSync(
  new URL('../../motor/export/studio-golden.json', import.meta.url))).cases.filter(r => r.out);

/* Gammel modell: clubMode bandt lie og køllegeometri sammen. */
const OLD = { iron: { lie: 0, sweet: 21.3 }, driver: { lie: 30, sweet: 33.0 } };
/* Ny: samme situasjon uttrykt med separate akser. */
const NEW = { iron: { lie: LIE_PRESETS.hardpan, club: CLUB_GEOMETRY.midIron },
              driver:{ lie: LIE_PRESETS.tee,     club: CLUB_GEOMETRY.driver } };

let n=0, sumAbs=0, maxAbs=0, worst=null;
const bandChange = {}, offFaceNew = { iron:0, driver:0 }, offFaceOldImpossible = { iron:0, driver:0 };

for (const r of rows) {
  const mode = r.in.clubMode;
  const cz = r.out.contactHeight;               // meter
  const oldOff = r.out.faceCentreOffsetMm;
  const cfg = NEW[mode];
  const c = strikeContact({
    lieHeightMm: cfg.lie, clubHeightMm: cz * 1000,
    club: cfg.club, dynamicLoftDeg: mode === 'driver' ? 12.5 : 31,
  });
  const d = c.offsetMm - oldOff;
  n++; sumAbs += Math.abs(d);
  if (Math.abs(d) > Math.abs(maxAbs)) { maxAbs = d; worst = { r, oldOff, newOff: c.offsetMm }; }

  if (!c.onFace) offFaceNew[mode]++;
  if (Math.abs(oldOff) > c.halfFaceMm) offFaceOldImpossible[mode]++;

  const nb = strikeBand({
    lieHeightMm: cfg.lie, clubHeightM: cz,
    effectiveLowPointM: r.out.effectiveLowPointX,
    thetaAtImpact: r.out.thetaAtImpact,
    offsetMm: c.offsetMm, halfFaceMm: c.halfFaceMm,
  }).band;
  const key = `${r.out.strikeBand} → ${nb}`;
  bandChange[key] = (bandChange[key] || 0) + 1;
}

console.log('D7 — DIFF: gammel kontaktmodell mot contactModel v2\n');
console.log('caser:', n);
console.log('gjennomsnittlig |Δoffset|:', (sumAbs/n).toFixed(3), 'mm');
console.log('største Δoffset          :', maxAbs.toFixed(2), 'mm');
if (worst) console.log('  ved', JSON.stringify(worst.r.in),
  '\n  gammel', worst.oldOff.toFixed(2), '→ ny', worst.newOff.toFixed(2), 'mm');

console.log('\n── FYSISK UMULIGE VERDIER ──────────────────────────────');
console.log('gammel modell, offset utenfor halve slagflaten:');
console.log('  jern  ', offFaceOldImpossible.iron, '/1250');
console.log('  driver', offFaceOldImpossible.driver, '/1250');
console.log('  totalt', offFaceOldImpossible.iron + offFaceOldImpossible.driver, '/2500  ← ingen av dem var merket');
console.log('\nny modell, samme caser klassifisert som OffFace:');
console.log('  jern  ', offFaceNew.iron, '/1250');
console.log('  driver', offFaceNew.driver, '/1250');
console.log('  totalt', offFaceNew.iron + offFaceNew.driver, '/2500  ← alle eksplisitt merket');

console.log('\n── BÅNDOVERGANGER ──────────────────────────────────────');
const sorted = Object.entries(bandChange).sort((a,b)=>b[1]-a[1]);
let same=0;
for (const [k,v] of sorted) { const [a,b] = k.split(' → '); if (a===b) same+=v; }
console.log('uendret band:', same, '/', n, '=', (100*same/n).toFixed(1)+'%');
console.log('\nde ti største endringene:');
sorted.filter(([k])=>{const[a,b]=k.split(' → ');return a!==b;}).slice(0,10)
  .forEach(([k,v])=>console.log('  '+String(v).padStart(5)+'  '+k));
