import { solveFlight } from '../src/solveFlight.js';
import { readFileSync } from 'node:fs';
const cal = SL => 0.81 + 0.32/(1+Math.exp(-(SL-31.98)/2.14));

const rows = JSON.parse(readFileSync(
  new URL('../../motor/export/flight-golden.json', import.meta.url))).cases.filter(r=>r.out);

let changed=0, sum=0, mx=0, mxCase=null;
const buckets={'0-2%':0,'2-5%':0,'5-10%':0,'10-20%':0,'>20%':0};
for (const r of rows) {
  const o=r.out;
  if (o.totalSpinRpm<=0) continue;
  const vert=Math.abs(o.signedVerticalSpinLoftDeg);
  const d3=o.spinLoft3DDeg;
  if (Math.abs(d3-vert)<1e-12) continue;
  const c2=cal(vert), c3=cal(d3);
  const d=(c3/c2-1)*100;
  changed++; sum+=Math.abs(d);
  if (Math.abs(d)>Math.abs(mx)) { mx=d; mxCase=r; }
  const a=Math.abs(d);
  if(a<2)buckets['0-2%']++; else if(a<5)buckets['2-5%']++;
  else if(a<10)buckets['5-10%']++; else if(a<20)buckets['10-20%']++; else buckets['>20%']++;
}
console.log('Hva ville skjedd om kalibreringen ble matet med 3D i stedet for vertikal?\n');
console.log('caser der 3D != vertikal:', changed, 'av', rows.length,
  '=', (100*changed/rows.length).toFixed(1)+'%');
console.log('gjennomsnittlig endring i spinn:', (sum/changed).toFixed(2)+'%');
console.log('største endring:', mx.toFixed(1)+'%');
if(mxCase) console.log('  ved', JSON.stringify(mxCase.in),
  '\n  vertikal', Math.abs(mxCase.out.signedVerticalSpinLoftDeg).toFixed(2)+'°',
  '-> 3D', mxCase.out.spinLoft3DDeg.toFixed(2)+'°');
console.log('\nfordeling:');
for(const [k,v] of Object.entries(buckets))
  console.log('  '+k.padEnd(8)+String(v).padStart(5)+'  '+(100*v/changed).toFixed(1)+'%');

// realistisk band spesifikt
const real=rows.filter(r=>r.group==='grid.realistic-band'&&r.out.totalSpinRpm>0);
let rs=0,rn=0;
for(const r of real){
  const v=Math.abs(r.out.signedVerticalSpinLoftDeg), d3=r.out.spinLoft3DDeg;
  if(Math.abs(d3-v)<1e-12) continue;
  rs+=Math.abs(cal(d3)/cal(v)-1)*100; rn++;
}
console.log('\nrealistisk band: '+rn+' caser, snittendring '+(rs/rn).toFixed(2)+'%');
