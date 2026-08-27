/**
 * Rettet launch-modell, fittet mot BALLFART-inverterte loft.
 *
 * Ikke-sirkulært: loft utledes fra smash-modellen (§5.5), launch testes mot §5.3.
 * To uavhengige modeller. Ballfartrekka er verifisert monoton og plausibel
 * (driver 12,5° … PW 42,7°) — se F13.
 *
 * Klassisk form:  launch = k(L) x L + (1 - k(L)) x A
 * der k er andelen av dynamisk loft som overlever til utgangsvinkel.
 * k faller med loft: mer loft gir skrårere treff og mer tap.
 */
import { solveFlight } from '../src/solveFlight.js';

const TOUR = [
  ['Driver',115,-0.9,171,10.4],['3-wood',110,-2.3,162, 9.3],
  ['5-wood',106,-2.5,156, 9.7],['Hybrid',102,-2.4,149,10.2],
  ['3 Iron',100,-2.5,145,10.3],['4 Iron', 98,-2.9,140,10.8],
  ['5 Iron', 96,-3.4,135,11.9],['6 Iron', 94,-3.7,130,14.0],
  ['7 Iron', 92,-3.9,123,16.1],['8 Iron', 89,-4.2,118,17.8],
  ['9 Iron', 87,-4.3,112,20.0],['PW',     84,-4.7,104,23.7],
];

function loftFromBallSpeed(cs, at, tb) {
  let lo=0.01, hi=59.9;
  for (let i=0;i<200;i++){
    const m=(lo+hi)/2;
    const v=solveFlight({clubSpeed:cs,faceAngle:0,clubPath:0,attackAngle:at,dynamicLoft:m}).ballSpeed;
    if (v > tb) lo=m; else hi=m;
  }
  return (lo+hi)/2;
}

console.log('k = (launch - A) / (L - A)   — andelen av loft som overlever\n');
console.log('kølle       loft(ballfart)   attack   launch    k');
console.log('─'.repeat(58));
const pts = [];
for (const [n,cs,at,tb,tla] of TOUR) {
  const L = loftFromBallSpeed(cs,at,tb);
  const k = (tla - at) / (L - at);
  pts.push({ n, L, k });
  console.log(n.padEnd(11)+L.toFixed(2).padStart(10)+'°'+at.toFixed(1).padStart(9)+'°'+
    tla.toFixed(1).padStart(9)+'°'+k.toFixed(4).padStart(9));
}

// lineær regresjon k = a + b*L
const N=pts.length;
const sx=pts.reduce((s,p)=>s+p.L,0), sy=pts.reduce((s,p)=>s+p.k,0);
const sxx=pts.reduce((s,p)=>s+p.L*p.L,0), sxy=pts.reduce((s,p)=>s+p.L*p.k,0);
const b=(N*sxy-sx*sy)/(N*sxx-sx*sx), a=(sy-b*sx)/N;
console.log('\nLINEÆR FIT:  k(L) = ' + a.toFixed(6) + ' + ' + b.toFixed(6) + ' × L');

let maxErr=0, sumErr=0;
console.log('\nkølle       launch tour   modell   avvik');
console.log('─'.repeat(50));
for (const [i,[n,cs,at,tb,tla]] of TOUR.entries()) {
  const {L}=pts[i];
  const k=a+b*L;
  const got=k*L+(1-k)*at;
  const e=got-tla; sumErr+=Math.abs(e); maxErr=Math.max(maxErr,Math.abs(e));
  console.log(n.padEnd(11)+tla.toFixed(1).padStart(10)+'°'+got.toFixed(2).padStart(9)+'°'+
    ((e>=0?'+':'')+e.toFixed(2)+'°').padStart(9)+(Math.abs(e)<=0.5?'  ok':'  ✗'));
}
console.log('─'.repeat(50));
console.log('snittavvik: '+(sumErr/N).toFixed(3)+'°   maks: '+maxErr.toFixed(3)+'°   bånd ±0,5°');

console.log('\nFØLSOMHET d(launch)/d(loft) = k + L×b·(1) ≈ ' );
for (const L of [12.5,20,31,43]) {
  const slope = (a + b*L) + L*b - b*(-3);  // d/dL [kL + (1-k)A], k=a+bL
  console.log('   loft '+String(L).padStart(4)+'°  →  '+slope.toFixed(3)+'   (gammel modell: '+
    (-0.1693792957175766+2*0.012024703872880052*L).toFixed(3)+')');
}
