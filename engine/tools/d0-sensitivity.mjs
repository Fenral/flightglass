/**
 * Hvor mye av D0-portens røde resultat skyldes loftantagelsen?
 * Løs for den loften som gjør HVER metrikk eksakt riktig, per kølle.
 * Spriker de fire løsningene mye, er antagelsen problemet — ikke motoren.
 */
import { solveFlight } from '../src/solveFlight.js';
const TOUR = [
  ['Driver',115,-0.9,171,1.49,10.4,2545,282],['3-wood',110,-2.3,162,1.47,9.3,3663,249],
  ['5-wood',106,-2.5,156,1.47,9.7,4322,236],['Hybrid',102,-2.4,149,1.47,10.2,4587,231],
  ['3 Iron',100,-2.5,145,1.46,10.3,4404,218],['4 Iron',98,-2.9,140,1.44,10.8,4782,209],
  ['5 Iron',96,-3.4,135,1.41,11.9,5280,199],['6 Iron',94,-3.7,130,1.39,14.0,6204,188],
  ['7 Iron',92,-3.9,123,1.34,16.1,7124,176],['8 Iron',89,-4.2,118,1.33,17.8,8078,164],
  ['9 Iron',87,-4.3,112,1.29,20.0,8793,152],['PW',84,-4.7,104,1.24,23.7,9316,142],
];
const ASSUMED = {'Driver':12.5,'3-wood':14,'5-wood':17,'Hybrid':18,'3 Iron':19,'4 Iron':22,
  '5 Iron':25,'6 Iron':28,'7 Iron':31,'8 Iron':35,'9 Iron':39,'PW':43};

/** Binærsøk som selv finner retningen funksjonen er monoton i. */
function solveFor(cs,at,target,pick){
  const at0=x=>pick(solveFlight({clubSpeed:cs,faceAngle:0,clubPath:0,attackAngle:at,dynamicLoft:x}));
  const a=at0(0.01), b=at0(59.9);
  if((target-a)*(target-b)>0) return NaN;          // utenfor rekkevidde
  const rising = b>a;
  let lo=0.01, hi=59.9;
  for(let i=0;i<200;i++){const m=(lo+hi)/2;
    if((at0(m)<target)===rising) lo=m; else hi=m;}
  return (lo+hi)/2;
}
console.log('Hvilken dynamisk loft ville gjort hver metrikk eksakt riktig?\n');
console.log('kølle      antatt   fra ballfart   fra launch   fra spinn   fra carry   sprik');
console.log('─'.repeat(84));
let sums=0;
for(const [n,cs,at,tb,tsm,tla,tsp,tca] of TOUR){
  const fB=solveFor(cs,at,tb,r=>r.ballSpeed);
  const fL=solveFor(cs,at,tla,r=>r.launchAngle);
  const fS=solveFor(cs,at,tsp,r=>r.totalSpinRpm);
  const fC=solveFor(cs,at,tca,r=>r.carry);
  const all=[fB,fL,fS,fC].filter(v=>Number.isFinite(v)&&v>0.05&&v<59.8);
  const spread=all.length>1?Math.max(...all)-Math.min(...all):NaN;
  if(Number.isFinite(spread))sums+=spread;
  const f=v=>(Number.isFinite(v)&&v>0.05&&v<59.8?v.toFixed(1):'  —').padStart(13);
  console.log(n.padEnd(9)+ASSUMED[n].toFixed(1).padStart(7)+f(fB)+f(fL)+f(fS)+f(fC)+
    (Number.isFinite(spread)?spread.toFixed(1):' —').padStart(8)+'°');
}
console.log('─'.repeat(84));
console.log('\ngjennomsnittlig sprik mellom metrikkenes loftløsninger: '+(sums/12).toFixed(1)+'°');
console.log('\nTOLKNING:');
console.log('  Lite sprik  -> metrikkene er enige om loften. Antagelsen kan justeres til fasit.');
console.log('  Stort sprik -> ingen ENKELT loft kan gjøre alle riktige samtidig.');
console.log('                 Da er det modellen som er inkonsistent, ikke antagelsen.');
