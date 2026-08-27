import { solveFlight } from '../src/solveFlight.js';
const BAG = [
  ['Driver',115,-0.9,171,2545],['3-wood',110,-2.3,162,3663],['5-wood',106,-2.5,156,4322],
  ['Hybrid',102,-2.4,149,4587],['3 Iron',100,-2.5,145,4404],['4 Iron',98,-2.9,140,4782],
  ['5 Iron',96,-3.4,135,5280],['6 Iron',94,-3.7,130,6204],['7 Iron',92,-3.9,123,7124],
  ['8 Iron',89,-4.2,118,8078],['9 Iron',87,-4.3,112,8793],['PW',84,-4.7,104,9316],
];
function fitLoft(cs,at,tb){let lo=0,hi=60;for(let i=0;i<200;i++){const m=(lo+hi)/2;
  const r=solveFlight({clubSpeed:cs,faceAngle:0,clubPath:0,attackAngle:at,dynamicLoft:m});
  if(r.ballSpeed>tb)lo=m;else hi=m;}return (lo+hi)/2;}

console.log('Hvilken kalibreringsfaktor ville hver kølle trengt?\n');
console.log('kølle     spinLoft   dagens cal   nødvendig cal   avvik    tour rpm   motor rpm');
console.log('─'.repeat(82));
const pts=[];
for(const [n,cs,at,tb,sp] of BAG){
  const loft=fitLoft(cs,at,tb);
  const r=solveFlight({clubSpeed:cs,faceAngle:0,clubPath:0,attackAngle:at,dynamicLoft:loft});
  const SL=Math.abs(loft-at);
  const calNow=r.spinCalibration;
  // spinn er lineær i cal, så nødvendig cal = calNow * (tour/motor)
  const calNeed=calNow*sp/r.totalSpinRpm;
  pts.push({n,SL,calNow,calNeed,sp,got:r.totalSpinRpm});
  console.log(n.padEnd(9)+SL.toFixed(1).padStart(7)+'°'+calNow.toFixed(4).padStart(13)+
    calNeed.toFixed(4).padStart(16)+((calNeed/calNow-1)*100>=0?'+':'')+
    ((calNeed/calNow-1)*100).toFixed(1).padStart(7)+'%'+
    String(sp).padStart(11)+r.totalSpinRpm.toFixed(0).padStart(12));
}
console.log('─'.repeat(82));
console.log('\nDagens sigmoid: cal = 0.81 + 0.32/(1+exp(-(SL-31.98)/2.14))');
console.log('  ved SL=13:', (0.81+0.32/(1+Math.exp(-(13-31.98)/2.14))).toFixed(4));
console.log('  ved SL=25:', (0.81+0.32/(1+Math.exp(-(25-31.98)/2.14))).toFixed(4));
console.log('  ved SL=32:', (0.81+0.32/(1+Math.exp(-(32-31.98)/2.14))).toFixed(4));
console.log('  ved SL=47:', (0.81+0.32/(1+Math.exp(-(47-31.98)/2.14))).toFixed(4));
console.log('\nNødvendig cal som funksjon av spinLoft — er den monoton?');
const sorted=[...pts].sort((a,b)=>a.SL-b.SL);
let mono=true;
for(let i=1;i<sorted.length;i++) if(sorted[i].calNeed<sorted[i-1].calNeed) mono=false;
sorted.forEach(p=>console.log('  SL '+p.SL.toFixed(1).padStart(5)+'°  ->  '+p.calNeed.toFixed(4)+'   '+p.n));
console.log('\nmonoton stigende:', mono?'JA':'NEI — sigmoid kan ikke passe');
