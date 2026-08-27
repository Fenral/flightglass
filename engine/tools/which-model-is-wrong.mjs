/**
 * D38 anvendt: hvilken modell er feil — spinn eller launch?
 *
 * Ingen kilde publiserer dynamisk loft. Men vi VET at loftrekka må være
 * monotont stigende fra driver til PW, og ligge i plausible områder.
 *
 * Inverterer vi loft fra hver metrikk for seg, får vi tre kandidatrekker.
 * Den rekka som er fysisk umulig, kommer fra modellen som er feil.
 */
import { solveFlight } from '../src/solveFlight.js';

const TOUR = [
  ['Driver',115,-0.9,171,10.4,2545],['3-wood',110,-2.3,162, 9.3,3663],
  ['5-wood',106,-2.5,156, 9.7,4322],['Hybrid',102,-2.4,149,10.2,4587],
  ['3 Iron',100,-2.5,145,10.3,4404],['4 Iron', 98,-2.9,140,10.8,4782],
  ['5 Iron', 96,-3.4,135,11.9,5280],['6 Iron', 94,-3.7,130,14.0,6204],
  ['7 Iron', 92,-3.9,123,16.1,7124],['8 Iron', 89,-4.2,118,17.8,8078],
  ['9 Iron', 87,-4.3,112,20.0,8793],['PW',     84,-4.7,104,23.7,9316],
];

function solveFor(cs, at, target, pick) {
  const f = x => pick(solveFlight({clubSpeed:cs,faceAngle:0,clubPath:0,attackAngle:at,dynamicLoft:x}));
  const a = f(0.01), b = f(59.9);
  if ((target-a)*(target-b) > 0) return NaN;
  const rising = b > a;
  let lo = 0.01, hi = 59.9;
  for (let i=0;i<200;i++){ const m=(lo+hi)/2; if ((f(m)<target)===rising) lo=m; else hi=m; }
  return (lo+hi)/2;
}

const series = { ballfart:[], launch:[], spinn:[] };
for (const [n,cs,at,tb,tla,tsp] of TOUR) {
  series.ballfart.push([n, solveFor(cs,at,tb,  r=>r.ballSpeed)]);
  series.launch  .push([n, solveFor(cs,at,tla, r=>r.launchAngle)]);
  series.spinn   .push([n, solveFor(cs,at,tsp, r=>r.totalSpinRpm)]);
}

console.log('Tre kandidatrekker for dynamisk loft, hver invertert fra sin metrikk\n');
for (const [name, s] of Object.entries(series)) {
  const vals = s.filter(([,v])=>Number.isFinite(v));
  let breaks = 0, worstDip = 0, where = '';
  for (let i=1;i<vals.length;i++){
    const d = vals[i][1] - vals[i-1][1];
    if (d < 0) { breaks++; if (d < worstDip) { worstDip = d; where = `${vals[i-1][0]}→${vals[i][0]}`; } }
  }
  const lo = Math.min(...vals.map(v=>v[1])), hi = Math.max(...vals.map(v=>v[1]));
  console.log(`── fra ${name.toUpperCase()} ──`);
  console.log('   ' + vals.map(([n,v])=>v.toFixed(1)).join('  '));
  console.log(`   monotonibrudd: ${breaks}` +
    (breaks ? `   verste fall: ${worstDip.toFixed(1)}° ved ${where}` : '   ← fysisk mulig rekke'));
  console.log(`   spenn: ${lo.toFixed(1)}° … ${hi.toFixed(1)}°`);
  // plausibilitet: driver 9-16, PW 40-48
  const drv = vals.find(v=>v[0]==='Driver')?.[1];
  const pw  = vals.find(v=>v[0]==='PW')?.[1];
  const plaus = [];
  if (drv!=null) plaus.push(`driver ${drv.toFixed(1)}° ${(drv>=9&&drv<=16)?'ok':'USANNSYNLIG'}`);
  if (pw!=null)  plaus.push(`PW ${pw.toFixed(1)}° ${(pw>=38&&pw<=50)?'ok':'USANNSYNLIG'}`);
  console.log('   ' + plaus.join('   ') + '\n');
}
console.log('TOLKNING: rekka med monotonibrudd og usannsynlige ytterpunkter');
console.log('kommer fra modellen som er feil. Ikke fra loftantagelsen — den');
console.log('inngår ikke her; hver rekke er utledet, ikke antatt.');
