// Publisert (Trackman 2023): clubSpeed, attack, spin
const D={n:'Driver', cs:115, at:-0.9, spin:2545};
const W={n:'5-wood', cs:106, at:-2.5, spin:4322};

console.log('Spinnforholdet 5-wood / driver =', (W.spin/D.spin).toFixed(3),
            ' (driver har', ((1-D.spin/W.spin)*100).toFixed(1)+'% mindre)\n');

// Modellen: spin ~ clubSpeed * sin(spinLoft)
const pred=(c,SL)=>c*Math.sin(SL*Math.PI/180);

console.log('Hva slags dynamisk loft skal til for at modellen forklarer forholdet?\n');
console.log('driver dyn   5w dyn   driver SL   5w SL   forutsagt forhold   faktisk   gap');
console.log('─'.repeat(80));
// scenarier: fra min inversjon, til typiske reelle verdier
const CASES=[
  [15.3,13.7,'min inversjon (fra motorens launch-modell)'],
  [13.0,17.0,'typisk reell levering'],
  [12.0,18.0,'typisk reell, ytterkant'],
  [14.0,16.0,'konservativ'],
  [11.0,19.0,'aggressiv'],
];
for(const [dd,wd,label] of CASES){
  const dSL=dd-D.at, wSL=wd-W.at;
  const ratio=pred(W.cs,wSL)/pred(D.cs,dSL);
  const gap=(W.spin/D.spin)/ratio;
  console.log(dd.toFixed(1).padStart(10)+wd.toFixed(1).padStart(9)+
    dSL.toFixed(1).padStart(12)+wSL.toFixed(1).padStart(8)+
    ratio.toFixed(3).padStart(20)+(W.spin/D.spin).toFixed(3).padStart(10)+
    ((gap-1)*100>=0?'+':'')+((gap-1)*100).toFixed(1).padStart(6)+'%   '+label);
}
console.log('─'.repeat(80));
// Hvilken loftkombinasjon gjør modellen EKSAKT riktig?
console.log('\nHvilke dynamiske loft ville gjort modellen eksakt riktig?');
for(const dd of [10,11,12,13,14,15]){
  const dSL=dd-D.at;
  // finn wSL som gir riktig forhold
  const target=pred(D.cs,dSL)*(W.spin/D.spin);
  const wSL=Math.asin(target/W.cs)*180/Math.PI;
  console.log('  driver dyn '+dd.toFixed(1)+'°  ->  5-wood dyn '+(wSL+W.at).toFixed(1)+
    '°  (SL '+wSL.toFixed(1)+'°)');
}
