import { solveFlight } from '../src/solveFlight.js';
const YD = 0.9144;

const EDITIONS = {
  'Trackman 2023': {
    Driver:  {clubSpeed:115, attack:-0.9, ballSpeed:171, smash:1.49, launch:10.4, spin:2545, apex:35, land:39, carry:282},
    '7 Iron': {clubSpeed:92,  attack:-3.9, ballSpeed:123, smash:1.34, launch:16.1, spin:7124, apex:34, land:51, carry:176},
  },
  'Trackman eldre': {
    Driver:  {clubSpeed:113, attack:-1.3, ballSpeed:167, smash:1.48, launch:10.9, spin:2686, apex:32, land:38, carry:275},
    '7 Iron': {clubSpeed:90,  attack:-4.3, ballSpeed:120, smash:1.33, launch:16.3, spin:7097, apex:32, land:50, carry:172},
  },
};

// finn dynamicLoft som gir tourens ballfart, med motorens egen smash-modell
function fitLoft(clubSpeed, attack, targetBall) {
  let lo = 0, hi = 60;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const r = solveFlight({clubSpeed, faceAngle:0, clubPath:0, attackAngle:attack, dynamicLoft:mid});
    if (r.ballSpeed > targetBall) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

const pct = (a,b) => ((a-b)/b*100);
const f = (v,w=7) => (v>=0?'+':'') + v.toFixed(1).padStart(w);

for (const [ed, clubs] of Object.entries(EDITIONS)) {
  console.log(`\n${'='.repeat(64)}\n${ed}\n${'='.repeat(64)}`);
  for (const [name, t] of Object.entries(clubs)) {
    const loft = fitLoft(t.clubSpeed, t.attack, t.ballSpeed);
    const r = solveFlight({clubSpeed:t.clubSpeed, faceAngle:0, clubPath:0, attackAngle:t.attack, dynamicLoft:loft});
    console.log(`\n${name}  — implisert dynamisk loft ${loft.toFixed(2)}°`);
    console.log(`             tour      motor      avvik`);
    const rows = [
      ['ballfart',  t.ballSpeed, r.ballSpeed,  'pct'],
      ['smash',     t.smash,     r.smash,      'pct'],
      ['launch',    t.launch,    r.launchAngle,'abs'],
      ['spinn',     t.spin,      r.totalSpinRpm,'pct'],
      ['apex',      t.apex,      r.apex,       'pct'],
      ['land',      t.land,      r.landingAngle,'abs'],
      ['carry',     t.carry,     r.carry,      'pct'],
    ];
    for (const [k, tv, mv, mode] of rows) {
      const d = mode==='pct' ? pct(mv,tv) : (mv-tv);
      const unit = mode==='pct' ? ' %' : ' °';
      const flag = mode==='pct'
        ? (k==='carry' ? (Math.abs(d)<=2?'  OK':' FEIL') : k==='spinn' ? (Math.abs(d)<=8?'  OK':' FEIL') : k==='ballfart' ? (Math.abs(d)<=1?'  OK':' FEIL') : '')
        : (k==='launch' ? (Math.abs(d)<=0.5?'  OK':' FEIL') : k==='land' ? (Math.abs(d)<=1?'  OK':' FEIL') : '');
      console.log(`  ${k.padEnd(9)}${String(tv).padStart(6)}  ${(typeof mv==='number'?mv.toFixed(mode==='pct'&&k==='smash'?3:1):mv).toString().padStart(9)}  ${f(d)}${unit}${flag}`);
    }
  }
}
