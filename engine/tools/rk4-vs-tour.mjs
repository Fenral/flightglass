import { solveFlight } from '../src/solveFlight.js';
const BAG = [
  ['Driver',115,-0.9,171,10.4,2545,282],['3-wood',110,-2.3,162,9.3,3663,249],
  ['5-wood',106,-2.5,156,9.7,4322,236],['Hybrid',102,-2.4,149,10.2,4587,231],
  ['3 Iron',100,-2.5,145,10.3,4404,218],['4 Iron',98,-2.9,140,10.8,4782,209],
  ['5 Iron',96,-3.4,135,11.9,5280,199],['6 Iron',94,-3.7,130,14.0,6204,188],
  ['7 Iron',92,-3.9,123,16.1,7124,176],['8 Iron',89,-4.2,118,17.8,8078,164],
  ['9 Iron',87,-4.3,112,20.0,8793,152],['PW',84,-4.7,104,23.7,9316,142],
];
function fitLoft(cs,at,tb){let lo=0,hi=60;for(let i=0;i<200;i++){const m=(lo+hi)/2;
  const r=solveFlight({clubSpeed:cs,faceAngle:0,clubPath:0,attackAngle:at,dynamicLoft:m});
  if(r.ballSpeed>tb)lo=m;else hi=m;}return (lo+hi)/2;}
const pc=(a,b)=>(a-b)/b*100;
console.log('Hvem er nærmest tour-carry: empirisk fit eller RK4?\n');
console.log('kølle      tour   empirisk        RK4     empirisk   RK4');
console.log('─'.repeat(64));
let we=0,wr=0,se=0,sr=0;
for(const [n,cs,at,tb,la,sp,ca] of BAG){
  const loft=fitLoft(cs,at,tb);
  const r=solveFlight({clubSpeed:cs,faceAngle:0,clubPath:0,attackAngle:at,dynamicLoft:loft});
  const de=pc(r.carry,ca), dr=pc(r.curveFlightCarryYd,ca);
  se+=Math.abs(de); sr+=Math.abs(dr);
  if(Math.abs(de)<Math.abs(dr)) we++; else wr++;
  const f=(v)=>((v>=0?'+':'')+v.toFixed(1)+'%').padStart(9);
  console.log(n.padEnd(9)+String(ca).padStart(6)+r.carry.toFixed(0).padStart(10)+
    r.curveFlightCarryYd.toFixed(0).padStart(11)+f(de)+f(dr)+
    (Math.abs(de)<Math.abs(dr)?'   ← empirisk':'   ← RK4'));
}
console.log('─'.repeat(64));
console.log('\nempirisk nærmest på '+we+' av 12 køller | RK4 nærmest på '+wr);
console.log('gjennomsnittlig absoluttfeil:  empirisk '+(se/12).toFixed(2)+'%   RK4 '+(sr/12).toFixed(2)+'%');
