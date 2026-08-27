/** Finn de faktiske tersklene i §8.5 ved å teste mot fixturens 1250 jerncaser. */
import { readFileSync } from 'node:fs';
const rows = JSON.parse(readFileSync(
  new URL('../../motor/export/studio-golden.json', import.meta.url))).cases
  .filter(r => r.out && r.in.clubMode === 'iron');

const R_B = 0.0213, SWEET_OLD = 0.0213;
// low point foran ballen, millimeter:  xLP = (10.5 - ballPositionCm)/100 m
const lpAhead = r => (10.5 - r.in.ballPositionCm) * 10;

console.log('Fixturens jernbånd langs de to aksene i §8.5\n');
console.log('band     n     clubZ (m)                low point foran ballen (mm)');
console.log('─'.repeat(78));
const by = {};
for (const r of rows) {
  const b = r.out.strikeBand;
  (by[b] = by[b] || []).push({ cz: r.out.contactHeight, lp: lpAhead(r), r });
}
for (const [b, v] of Object.entries(by).sort((a,c)=>c[1].length-a[1].length)) {
  const cz = v.map(x=>x.cz), lp = v.map(x=>x.lp);
  console.log(b.padEnd(8) + String(v.length).padStart(5) + '   [' +
    Math.min(...cz).toFixed(4) + ' .. ' + Math.max(...cz).toFixed(4) + ']        [' +
    Math.min(...lp).toFixed(0) + ' .. ' + Math.max(...lp).toFixed(0) + ']');
}
console.log('\nBallens topp over bakken (lie 0):', (2*R_B*1000).toFixed(1), 'mm');
console.log('Flatesenterets høyde = clubZ + sweet. Whiff når det er over balltoppen.');
console.log('  => clubZ >', (2*R_B - SWEET_OLD).toFixed(4), 'm =', ((2*R_B-SWEET_OLD)*1000).toFixed(1), 'mm\n');

// test kandidatregel
function candidate({cz, lp}) {
  if (cz < -0.025) return 'Duff';
  if (cz + SWEET_OLD > 2*R_B) return 'Whiff';
  if (cz < 0 || lp < 20) return 'Fat';
  if (lp > 150) return 'Thin';
  if (cz > R_B) return 'Thin';
  return 'Pure';
}
let hit=0; const miss={};
for (const r of rows) {
  const got = candidate({ cz: r.out.contactHeight, lp: lpAhead(r) });
  if (got === r.out.strikeBand) hit++;
  else { const k = r.out.strikeBand + ' → ' + got; miss[k] = (miss[k]||0)+1; }
}
console.log('KANDIDATREGEL (spec §8.5 ordrett):', hit + '/' + rows.length,
  '=', (100*hit/rows.length).toFixed(1) + '%');
if (hit < rows.length) {
  console.log('bom:');
  Object.entries(miss).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log('  '+String(v).padStart(5)+'  '+k));
}
