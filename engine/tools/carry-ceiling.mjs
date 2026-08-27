import { solveFlight } from '../src/solveFlight.js';
const TOUR=[['Driver',115,-0.9,282],['3-wood',110,-2.3,249],['5-wood',106,-2.5,236],
['Hybrid',102,-2.4,231],['3 Iron',100,-2.5,218],['4 Iron',98,-2.9,209],['5 Iron',96,-3.4,199],
['6 Iron',94,-3.7,188],['7 Iron',92,-3.9,176],['8 Iron',89,-4.2,164],['9 Iron',87,-4.3,152],
['PW',84,-4.7,142]];
console.log('Modellens MAKSIMALE carry ved tourens køllefart og attack\n');
console.log('kølle      tour   modelltak   ved loft   avvik    når taket');
console.log('─'.repeat(66));
let below=0;
for(const [n,cs,at,tca] of TOUR){
  let best=-1,bl=0;
  for(let L=0;L<=60;L+=0.05){
    const c=solveFlight({clubSpeed:cs,faceAngle:0,clubPath:0,attackAngle:at,dynamicLoft:L}).carry;
    if(c>best){best=c;bl=L;}
  }
  const d=(best-tca)/tca*100;
  if(best<tca) below++;
  console.log(n.padEnd(9)+String(tca).padStart(6)+best.toFixed(1).padStart(12)+
    bl.toFixed(1).padStart(11)+'°'+((d>=0?'+':'')+d.toFixed(1)+'%').padStart(9)+
    (best>=tca?'   ja':'   NEI'));
}
console.log('─'.repeat(66));
console.log('\nkøller der modellen IKKE kan nå tourens carry uansett loft: '+below+' av 12');
