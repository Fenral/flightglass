import { solveFlight } from '../src/solveFlight.js';
const YD = 0.9144;
// Trackman 2023 PGA Tour — hele baggen
const BAG = [
  ['Driver',115,-0.9,171,1.49,10.4,2545,35,39,282],
  ['3-wood',110,-2.3,162,1.47, 9.3,3663,32,44,249],
  ['5-wood',106,-2.5,156,1.47, 9.7,4322,33,48,236],
  ['Hybrid',102,-2.4,149,1.47,10.2,4587,31,49,231],
  ['3 Iron',100,-2.5,145,1.46,10.3,4404,30,48,218],
  ['4 Iron', 98,-2.9,140,1.44,10.8,4782,31,49,209],
  ['5 Iron', 96,-3.4,135,1.41,11.9,5280,33,50,199],
  ['6 Iron', 94,-3.7,130,1.39,14.0,6204,32,50,188],
  ['7 Iron', 92,-3.9,123,1.34,16.1,7124,34,51,176],
  ['8 Iron', 89,-4.2,118,1.33,17.8,8078,33,51,164],
  ['9 Iron', 87,-4.3,112,1.29,20.0,8793,32,52,152],
  ['PW',     84,-4.7,104,1.24,23.7,9316,32,52,142],
];
function fitLoft(cs, at, tb){let lo=0,hi=60;for(let i=0;i<200;i++){const m=(lo+hi)/2;
  const r=solveFlight({clubSpeed:cs,faceAngle:0,clubPath:0,attackAngle:at,dynamicLoft:m});
  if(r.ballSpeed>tb)lo=m;else hi=m;}return (lo+hi)/2;}
const pc=(a,b)=>(a-b)/b*100;

console.log('Trackman 2023 PGA Tour — hele baggen mot motoren\n');
console.log('kølle     loft    launch      spinn      carry     apex     landing   5% carry');
console.log('─'.repeat(84));
const stat={launch:[],spin:[],carry:[],apex:[],land:[]};
for(const [n,cs,at,tb,sm,la,sp,ap,ld,ca] of BAG){
  const loft=fitLoft(cs,at,tb);
  const r=solveFlight({clubSpeed:cs,faceAngle:0,clubPath:0,attackAngle:at,dynamicLoft:loft});
  const dL=r.launchAngle-la, dS=pc(r.totalSpinRpm,sp), dC=pc(r.carry,ca),
        dA=pc(r.apex,ap), dLd=r.landingAngle-ld;
  stat.launch.push(dL);stat.spin.push(dS);stat.carry.push(dC);stat.apex.push(dA);stat.land.push(dLd);
  const m5=(ca*YD*0.05).toFixed(1);
  const f=(v,u,ok)=>((v>=0?'+':'')+v.toFixed(1)+u).padStart(8)+(ok?' ':'✗');
  console.log(n.padEnd(9)+loft.toFixed(1).padStart(5)+'°'+
    f(dL,'°',Math.abs(dL)<=0.5)+f(dS,'%',Math.abs(dS)<=5)+f(dC,'%',Math.abs(dC)<=5)+
    f(dA,'%',Math.abs(dA)<=5)+f(dLd,'°',Math.abs(dLd)<=1)+('±'+m5+' m').padStart(11));
}
console.log('─'.repeat(84));
const S=a=>{const m=a.reduce((x,y)=>x+y,0)/a.length;
  return {snitt:m,maks:Math.max(...a.map(Math.abs))};};
console.log('\nOPPSUMMERT (12 køller):');
for(const [k,a] of Object.entries(stat)){const s=S(a);
  const u=(k==='launch'||k==='land')?'°':'%';
  console.log('  '+k.padEnd(8)+'snitt '+(s.snitt>=0?'+':'')+s.snitt.toFixed(2)+u+
    '   største avvik '+s.maks.toFixed(2)+u);}
console.log('\nBESTÅTT-TELLING:');
for(const [k,a] of Object.entries(stat)){
  const lim=(k==='launch')?0.5:(k==='land')?1.0:5.0;
  const ok=a.filter(v=>Math.abs(v)<=lim).length;
  console.log('  '+k.padEnd(8)+ok+'/12  ved grense '+lim+((k==='launch'||k==='land')?'°':'%'));}
