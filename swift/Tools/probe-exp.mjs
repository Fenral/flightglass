/**
 * Bekrefter at V8s Math.exp er fdlibm/msun `__ieee754_exp`.
 *
 * Samme metode som hypot-proben: implementer algoritmen, kjor den mot Node
 * over et bredt sveip, og se om det er null avvik. Er det det, kan Swift
 * reprodusere den uten a gjette.
 */

const buf = new ArrayBuffer(8);
const f64 = new Float64Array(buf);
const u32 = new Uint32Array(buf);

function highWord(x) { f64[0] = x; return u32[1]; }
function fromWords(hi, lo) { u32[1] = hi; u32[0] = lo; return f64[0]; }

const one = 1.0;
const halF = [0.5, -0.5];
const o_threshold = 7.09782712893383973096e+02;
const u_threshold = -7.45133219101941108420e+02;
const ln2HI = [6.93147180369123816490e-01, -6.93147180369123816490e-01];
const ln2LO = [1.90821492927058770002e-10, -1.90821492927058770002e-10];
const invln2 = 1.44269504088896338700e+00;
const P1 = 1.66666666666666019037e-01;
const P2 = -2.77777777770155933842e-03;
const P3 = 6.61375632143793436117e-05;
const P4 = -1.65339022054652515390e-06;
const P5 = 4.13813679705723846039e-08;
const twom1000 = 9.33263618503218878990e-302;  // 2^-1000
const huge = 1.0e+300;
const twop1023 = 8.98846567431158e+307; // 0x1p1023

function fdlibmExp(x) {
  let y, hi = 0, lo = 0, c, t, twopk;
  let k = 0;

  let hx = highWord(x) >>> 0;
  const xsb = (hx >>> 31) & 1;
  hx &= 0x7fffffff;

  if (hx >= 0x40862E42) {
    if (hx >= 0x7ff00000) {
      f64[0] = x;
      const lx = u32[0];
      if (((hx & 0xfffff) | lx) !== 0) return x + x;   // NaN
      return xsb === 0 ? x : 0.0;                       // +-inf
    }
    if (x > o_threshold) return huge * huge;            // overflow
    if (x < u_threshold) return twom1000 * twom1000;    // underflow
  }

  if (hx > 0x3fd62e42) {              // |x| > 0.5 ln2
    if (hx < 0x3FF0A2B2) {            // and |x| < 1.5 ln2
      hi = x - ln2HI[xsb];
      lo = ln2LO[xsb];
      k = 1 - xsb - xsb;
    } else {
      k = Math.trunc(invln2 * x + halF[xsb]);
      t = k;
      hi = x - t * ln2HI[0];
      lo = t * ln2LO[0];
    }
    x = hi - lo;
  } else if (hx < 0x3e300000) {       // |x| < 2**-28
    if (huge + x > one) return one + x;
  } else {
    k = 0;
  }

  t = x * x;
  if (k >= -1021) {
    twopk = fromWords((0x3ff00000 + (k << 20)) >>> 0, 0);
  } else {
    twopk = fromWords((0x3ff00000 + ((k + 1000) << 20)) >>> 0, 0);
  }
  c = x - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));

  if (k === 0) return one - ((x * c) / (c - 2.0) - x);
  y = one - ((lo - (x * c) / (2.0 - c)) - hi);

  if (k >= -1021) {
    if (k === 1024) return y * 2.0 * twop1023;
    return y * twopk;
  }
  return y * twopk * twom1000;
}

/* ── Sveip ───────────────────────────────────────────────────────────────── */

let seed = 0x13579bdf;
function rnd() {
  seed ^= seed << 13; seed >>>= 0;
  seed ^= seed >>> 17;
  seed ^= seed << 5;  seed >>>= 0;
  return seed / 4294967296;
}

function sweep(name, gen, n) {
  let bad = 0, firstBad = null;
  for (let i = 0; i < n; i++) {
    const x = gen(i);
    const a = Math.exp(x);
    const b = fdlibmExp(x);
    if (!Object.is(a, b)) {
      bad++;
      if (!firstBad) firstBad = { x, expected: a, got: b };
    }
  }
  const mark = bad === 0 ? 'OK  ' : 'AVVIK';
  console.log(`${mark} ${name.padEnd(38)} ${bad}/${n}`);
  if (firstBad) {
    console.log(`      forste: x=${firstBad.x} Math.exp=${firstBad.expected} fdlibm=${firstBad.got}`);
  }
  return bad;
}

let total = 0;

// Motorens faktiske omrader.
// spinMagnitude: exp(-(vsl - 31.98) / 2.14), vsl i [0, 65] -> ca [-15, 16]
total += sweep('motorens sigmoid-omrade [-16, 16]', () => (rnd() - 0.5) * 32, 300000);
// longitudinalLegacy: exp(-vsl / 10.9), vsl >= 0 -> (-inf, 0]
total += sweep('landingsleddet [-8, 0]', () => -rnd() * 8, 200000);
// rk4: exp((Re - 85000) / 9000), Re i [20000, 300000] -> ca [-7, 24]
total += sweep('dragbroen [-8, 25]', () => -8 + rnd() * 33, 200000);

// Brede sveip, inkludert grenene.
total += sweep('smaa |x| < 2^-28', () => (rnd() - 0.5) * 1e-9, 100000);
total += sweep('0.5ln2 < |x| < 1.5ln2', () => (rnd() - 0.5) * 2.0, 200000);
total += sweep('stort omrade [-700, 700]', () => (rnd() - 0.5) * 1400, 300000);
total += sweep('naer overflow [709, 710]', () => 709 + rnd(), 50000);
total += sweep('naer underflow [-746, -744]', () => -746 + rnd() * 2, 50000);
total += sweep('subnormalt resultat [-745, -708]', () => -745 + rnd() * 37, 100000);

// Kantverdier.
const edges = [
  0, -0, 1, -1, 0.5, -0.5, Math.LN2, -Math.LN2, 1e-300, -1e-300,
  709.782712893384, 709.7827128933841, -745.1332191019411, -745.1332191019412,
  -708, -709, 710, -746, 1e308, -1e308,
  Infinity, -Infinity, NaN, Number.MIN_VALUE, -Number.MIN_VALUE,
  Number.EPSILON, 5e-324, 2 ** -28, 2 ** -29, 2 ** -27,
];
let edgeBad = 0;
for (const x of edges) {
  const a = Math.exp(x);
  const b = fdlibmExp(x);
  const same = Object.is(a, b) || (Number.isNaN(a) && Number.isNaN(b));
  if (!same) {
    edgeBad++;
    console.log(`AVVIK kant x=${x}: Math.exp=${a} fdlibm=${b}`);
  }
}
console.log(`${edgeBad === 0 ? 'OK  ' : 'AVVIK'} kantverdier                           ${edgeBad}/${edges.length}`);
total += edgeBad;

console.log('');
console.log(total === 0
  ? 'KONKLUSJON: V8s Math.exp ER fdlibm __ieee754_exp. Kan porteres eksakt.'
  : `KONKLUSJON: ${total} avvik — algoritmen stemmer IKKE.`);
