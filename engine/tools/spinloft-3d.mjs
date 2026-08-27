import { solveFlight } from '../src/solveFlight.js';
const base={clubSpeed:92, attackAngle:-3.9, dynamicLoft:31.6};
console.log('7-jern-levering, kun face-to-path varierer\n');
console.log('face  path  f2p   vertSL   3D SL   diff    cal      spinn   endring');
console.log('─'.repeat(74));
let ref=null;
for(const [f,p] of [[0,0],[2,0],[4,0],[-4,0],[0,4],[4,-4],[-6,2],[8,-2],[10,-5]]){
  const r=solveFlight({...base, faceAngle:f, clubPath:p});
  const vert=Math.abs(r.signedVerticalSpinLoftDeg);
  const d3=r.spinLoft3DDeg;
  if(ref===null) ref=r.totalSpinRpm;
  console.log(String(f).padStart(4)+String(p).padStart(6)+String(f-p).padStart(6)+
    vert.toFixed(2).padStart(9)+d3.toFixed(2).padStart(8)+(d3-vert).toFixed(2).padStart(7)+
    r.spinCalibration.toFixed(4).padStart(9)+r.totalSpinRpm.toFixed(0).padStart(9)+
    ((r.totalSpinRpm/ref-1)*100>=0?'+':'')+((r.totalSpinRpm/ref-1)*100).toFixed(1).padStart(7)+'%');
}
