import { solveFlight } from '../src/solveFlight.js';
const BAG = [
  ['Driver',115,-0.9,171,10.4,2545],['3-wood',110,-2.3,162,9.3,3663],
  ['5-wood',106,-2.5,156,9.7,4322],['Hybrid',102,-2.4,149,10.2,4587],
  ['3 Iron',100,-2.5,145,10.3,4404],['4 Iron',98,-2.9,140,10.8,4782],
  ['5 Iron',96,-3.4,135,11.9,5280],['6 Iron',94,-3.7,130,14.0,6204],
  ['7 Iron',92,-3.9,123,16.1,7124],['8 Iron',89,-4.2,118,17.8,8078],
  ['9 Iron',87,-4.3,112,20.0,8793],['PW',84,-4.7,104,23.7,9316],
];
// inverter loft fra LAUNCH i stedet for fra smash
function fitLoftFromLaunch(cs,at,targetLaunch){
  let lo=0,hi=60;
  for(let i=0;i<200;i++){const m=(lo+hi)/2;
    const r=solveFlight({clubSpeed:cs,faceAngle:0,clubPath:0,attackAngle:at,dynamicLoft:m});
    if(r.launchAngle<targetLaunch)lo=m;else hi=m;}
  return (lo+hi)/2;
}
console.log('Loft invertert fra LAUNCH (ikke smash)\n');
console.log('kølle      loft  spinLoft   tour rpm  motor rpm   avvik   nødv. cal   ballfart-avvik');
console.log('─'.repeat(90));
const pts=[];
for(const [n,cs,at,tb,la,sp] of BAG){
  const loft=fitLoftFromLaunch(cs,at,la);
  const r=solveFlight({clubSpeed:cs,faceAngle:0,clubPath:0,attackAngle:at,dynamicLoft:loft});
  const SL=Math.abs(loft-at);
  const need=r.spinCalibration*sp/r.totalSpinRpm;
  const dB=(r.ballSpeed-tb)/tb*100;
  pts.push({n,SL,loft,need,sp,got:r.totalSpinRpm,dB});
  console.log(n.padEnd(9)+loft.toFixed(1).padStart(6)+'°'+SL.toFixed(1).padStart(8)+'°'+
    String(sp).padStart(11)+r.totalSpinRpm.toFixed(0).padStart(11)+
    ((r.totalSpinRpm/sp-1)*100>=0?'+':'')+((r.totalSpinRpm/sp-1)*100).toFixed(1).padStart(7)+'%'+
    need.toFixed(4).padStart(12)+((dB>=0?'+':'')+dB.toFixed(1)+'%').padStart(15));
}
console.log('─'.repeat(90));
const sorted=[...pts].sort((a,b)=>a.SL-b.SL);
let mono=true, worst=null;
for(let i=1;i<sorted.length;i++) if(sorted[i].need<sorted[i-1].need){mono=false;
  if(!worst) worst=[sorted[i-1],sorted[i]];}
console.log('\nNødvendig cal sortert på spinLoft:');
sorted.forEach(p=>console.log('  SL '+p.SL.toFixed(1).padStart(5)+'°  ->  '+p.need.toFixed(4)+'   '+p.n));
console.log('\nmonoton stigende:', mono?'JA — en funksjon av spinLoft KAN passe':'NEI');
if(worst) console.log('  bryter ved:', worst[0].n, worst[0].need.toFixed(4), '->', worst[1].n, worst[1].need.toFixed(4));
const dBs=pts.map(p=>Math.abs(p.dB));
console.log('\nBallfart-konsekvens av denne inversjonen: snitt '+
  (dBs.reduce((a,b)=>a+b,0)/dBs.length).toFixed(2)+'%  maks '+Math.max(...dBs).toFixed(2)+'%');
