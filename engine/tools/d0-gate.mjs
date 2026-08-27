/**
 * D0-PORTEN — realismemåling mot Trackman 2023.
 *
 * D39: dynamisk loft er IKKE publisert av noen kilde. Enhver sammenligning
 * krever derfor en antagelse. Den deklareres her, eksplisitt, ett sted.
 *
 * D38: antagelsen fornuftssjekkes mot fysisk rekkefølge før den brukes.
 * Gir en loftrekke driver mer loft enn et 5-wood, er rekka feil — ikke motoren.
 */
import { solveFlight } from '../src/solveFlight.js';

/* ── DEKLARERT ANTAGELSE ────────────────────────────────────────────────
   Kilde: ANTAGELSE. Typisk levert dynamisk loft, utledet fra alminnelige
   statiske loft pluss vanlig leveringsmønster (jern avloftes med skaftlening,
   driver leveres nær statisk). INGEN KILDE PUBLISERER DETTE.
   Endres tallene her, endres hele D0-resultatet — det er poenget. */
const DYNAMIC_LOFT = {
  'Driver': 12.5, '3-wood': 14.0, '5-wood': 17.0, 'Hybrid': 18.0,
  '3 Iron': 19.0, '4 Iron': 22.0, '5 Iron': 25.0, '6 Iron': 28.0,
  '7 Iron': 31.0, '8 Iron': 35.0, '9 Iron': 39.0, 'PW': 43.0,
};
const LOFT_SOURCE = 'ANTAGELSE — ikke publisert av noen kilde (D39)';

/* Trackman 2023 PGA Tour. Kilde K1, se REALISME.md §1.1. */
const TOUR = [
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

/* D32: prosent for avstand, absolutt for vinkel og smash. */
const BANDS = {
  ballSpeed:{lim:1.0,pct:true}, smash:{lim:0.02,pct:false},
  launch:{lim:0.5,pct:false},   spin:{lim:8.0,pct:true},
  apex:{lim:5.0,pct:true},      land:{lim:1.0,pct:false},
  carry:{lim:5.0,pct:true},
};

// ── D38: fornuftssjekk ──────────────────────────────────────────────────
const order = TOUR.map(r=>r[0]);
let prev=-Infinity, ok=true, breach=null;
for (const n of order) {
  const L = DYNAMIC_LOFT[n];
  if (L <= prev) { ok=false; breach=breach||n; }
  prev = L;
}
console.log('D38 — fornuftssjekk av loftrekka');
console.log('  kilde:', LOFT_SOURCE);
console.log('  monotont stigende driver → PW:', ok ? 'JA' : `NEI — bryter ved ${breach}`);
if (!ok) { console.error('\nAVBRUTT: loftantagelsen er fysisk umulig. Fiks den før måling.'); process.exit(1); }
console.log('  ' + order.map(n=>`${n} ${DYNAMIC_LOFT[n]}°`).join(' · ') + '\n');

// ── måling ──────────────────────────────────────────────────────────────
const res={}; for (const k of Object.keys(BANDS)) res[k]={pass:0,tot:0,worst:0,worstClub:''};
console.log('D0 — motor mot Trackman 2023, gitt antagelsen over\n');
console.log('kølle      loft   ballfart   smash   launch     spinn      apex   landing     carry');
console.log('─'.repeat(88));
for (const [n,cs,at,tb,tsm,tla,tsp,tap,tld,tca] of TOUR) {
  const loft = DYNAMIC_LOFT[n];
  const r = solveFlight({clubSpeed:cs,faceAngle:0,clubPath:0,attackAngle:at,dynamicLoft:loft});
  const vals = {
    ballSpeed:[r.ballSpeed,tb], smash:[r.smash,tsm], launch:[r.launchAngle,tla],
    spin:[r.totalSpinRpm,tsp], apex:[r.apex,tap], land:[r.landingAngle,tld], carry:[r.carry,tca],
  };
  let line = n.padEnd(9) + loft.toFixed(1).padStart(6) + '°';
  for (const [k,[got,want]] of Object.entries(vals)) {
    const b=BANDS[k];
    const d = b.pct ? (got-want)/want*100 : (got-want);
    const pass = Math.abs(d) <= b.lim;
    res[k].tot++; if (pass) res[k].pass++;
    if (Math.abs(d) > Math.abs(res[k].worst)) { res[k].worst=d; res[k].worstClub=n; }
    line += ((d>=0?'+':'')+d.toFixed(b.pct?1:2)+(b.pct?'%':'')).padStart(9) + (pass?' ':'✗');
  }
  console.log(line);
}
console.log('─'.repeat(88));
console.log('\nPORT-RESULTAT (bånd fra D32):');
let allPass=true;
for (const [k,v] of Object.entries(res)) {
  const b=BANDS[k];
  const s = `${v.pass}/${v.tot}`;
  if (v.pass<v.tot) allPass=false;
  console.log('  '+k.padEnd(11)+s.padStart(6)+'   grense ±'+b.lim+(b.pct?'%':'')+
    '   verste '+(v.worst>=0?'+':'')+v.worst.toFixed(b.pct?1:2)+(b.pct?'%':'')+' ('+v.worstClub+')');
}
console.log('\n' + (allPass ? 'PORT GRØNN' : 'PORT RØD'));
console.log('\nMERK: resultatet gjelder KUN gitt loftantagelsen deklarert øverst.');
console.log('Endres den, endres alt. Det er D39 sitt poeng.');
