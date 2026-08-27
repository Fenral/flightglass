/**
 * Bekrefter at V8s Math.tan er fdlibm.
 *
 * Adapterens funksjon: traceShape bruker tan(launchAngle·π/180) og
 * tan(landingAngle·π/180); studioShape bruker tan(fov/2). Alle argumenter er
 * altsa smaa vinkler i radianer — |x| < 1.6.
 *
 * tan deler __ieee754_rem_pio2 med sin/cos (alt verifisert) og har sin egen
 * kjerne __kernel_tan. Odde kvadrant gir -1/tan.
 */

const buf = new ArrayBuffer(8);
const f64 = new Float64Array(buf);
const u32 = new Uint32Array(buf);
const i32 = new Int32Array(buf);

const hiWord = x => { f64[0] = x; return i32[1]; };
const setLow0 = x => { f64[0] = x; u32[0] = 0; return f64[0]; };

const one = 1.0;
const pio4  = 7.85398163397448278999e-01;
const pio4lo = 3.06161699786838301793e-17;
const T = [
  3.33333333333334091986e-01,  1.33333333333201242699e-01,
  5.39682539762260521377e-02,  2.18694882948595424599e-02,
  8.86323982359930005737e-03,  3.59207910759131235356e-03,
  1.45620945432529025516e-03,  5.88041240820264096874e-04,
  2.46463134818469906812e-04,  7.81794442939557092300e-05,
  7.14072491382608190305e-05, -1.85586374855275456654e-05,
  2.59073051863633712884e-05,
];

/** __kernel_tan(x, y, iy): iy=1 -> tan, iy=-1 -> -1/tan */
function kernelTan(x, y, iy) {
  let z, r, v, w, s;
  const hx = hiWord(x);
  const ix = hx & 0x7fffffff;

  if (ix < 0x3e300000) {                     // |x| < 2^-28
    if (Math.trunc(x) === 0) {
      if (((ix | u32Low(x)) | (iy + 1)) === 0) {
        return one / Math.abs(x);
      }
      if (iy === 1) return x;
      // -1/(x+y), med presisjonsbevarende splitting
      w = x + y;
      z = setLow0(w);
      v = y - (z - x);
      let t = -one / w;
      let tt = setLow0(t);
      s = one + tt * z;
      return tt + t * (s + tt * v);
    }
  }

  if (ix >= 0x3FE59428) {                    // |x| >= 0.6744
    if (hx < 0) { x = -x; y = -y; }
    z = pio4 - x;
    w = pio4lo - y;
    x = z + w;
    y = 0.0;
  }

  z = x * x;
  w = z * z;
  r = T[1] + w * (T[3] + w * (T[5] + w * (T[7] + w * (T[9] + w * T[11]))));
  v = z * (T[2] + w * (T[4] + w * (T[6] + w * (T[8] + w * (T[10] + w * T[12])))));
  s = z * x;
  r = y + z * (s * (r + v) + y);
  r += T[0] * s;
  w = x + r;

  if (ix >= 0x3FE59428) {
    v = iy;
    return (1 - ((hx >> 30) & 2)) * (v - 2.0 * (x - (w * w / (w + v) - r)));
  }
  if (iy === 1) return w;

  // -1/(x+r), presisjonsbevart
  z = setLow0(w);
  v = r - (z - x);
  let t = -one / w;
  let tt = setLow0(t);
  s = one + tt * z;
  return tt + t * (s + tt * v);
}

function u32Low(x) { f64[0] = x; return u32[0]; }

// rem_pio2 — samme som i sin/cos-proben (verifisert der).
const invpio2 = 6.36619772367581382433e-01;
const pio2_1  = 1.57079632673412561417e+00;
const pio2_1t = 6.07710050650619224932e-11;
const pio2_2  = 6.07710050630396597660e-11;
const pio2_2t = 2.02226624879595063154e-21;
const pio2_3  = 2.02226624871116645580e-21;
const pio2_3t = 8.47842766036889956997e-32;
const half = 0.5;

function remPio2(x, y) {
  const hx = hiWord(x);
  const ix = hx & 0x7fffffff;
  if (ix <= 0x3fe921fb) { y[0] = x; y[1] = 0; return 0; }
  if (ix < 0x4002d97c) {
    if (hx > 0) {
      let z = x - pio2_1;
      if (ix !== 0x3ff921fb) { y[0] = z - pio2_1t; y[1] = (z - y[0]) - pio2_1t; }
      else { z -= pio2_2; y[0] = z - pio2_2t; y[1] = (z - y[0]) - pio2_2t; }
      return 1;
    }
    let z = x + pio2_1;
    if (ix !== 0x3ff921fb) { y[0] = z + pio2_1t; y[1] = (z - y[0]) + pio2_1t; }
    else { z += pio2_2; y[0] = z + pio2_2t; y[1] = (z - y[0]) + pio2_2t; }
    return -1;
  }
  if (ix <= 0x413921fb) {
    let t = Math.abs(x);
    const n = Math.trunc(t * invpio2 + half);
    const fn = n;
    let r = t - fn * pio2_1;
    let w = fn * pio2_1t;
    const j = ix >> 20;
    y[0] = r - w;
    let high = hiWord(y[0]);
    let i = j - ((high >> 20) & 0x7ff);
    if (i > 16) {
      t = r; w = fn * pio2_2; r = t - w;
      w = fn * pio2_2t - ((t - r) - w);
      y[0] = r - w;
      high = hiWord(y[0]);
      i = j - ((high >> 20) & 0x7ff);
      if (i > 49) {
        t = r; w = fn * pio2_3; r = t - w;
        w = fn * pio2_3t - ((t - r) - w);
        y[0] = r - w;
      }
    }
    y[1] = (r - y[0]) - w;
    if (hx < 0) { y[0] = -y[0]; y[1] = -y[1]; return -n; }
    return n;
  }
  throw new RangeError('gren 4');
}

const yy = [0, 0];
function fdTan(x) {
  const ix = hiWord(x) & 0x7fffffff;
  if (ix <= 0x3fe921fb) return kernelTan(x, 0.0, 1);
  if (ix >= 0x7ff00000) return x - x;
  const n = remPio2(x, yy);
  return kernelTan(yy[0], yy[1], 1 - ((n & 1) << 1));  // like n: tan, odde: -1/tan
}

/* ── Sveip ───────────────────────────────────────────────────────────────── */

let seed = 0x7a4a4;
function rnd() {
  seed ^= seed << 13; seed >>>= 0;
  seed ^= seed >>> 17;
  seed ^= seed << 5;  seed >>>= 0;
  return seed / 4294967296;
}
function nextAfter(x, n) {
  f64[0] = x;
  const bi = new BigUint64Array(buf);
  bi[0] += BigInt(n);
  return f64[0];
}

let total = 0;
function sweep(label, gen, n) {
  let bad = 0, first = null;
  for (let i = 0; i < n; i++) {
    const x = gen(i);
    const a = Math.tan(x), b = fdTan(x);
    const same = Object.is(a, b) || (Number.isNaN(a) && Number.isNaN(b));
    if (!same) { bad++; if (!first) first = [x, a, b]; }
  }
  console.log(`${bad === 0 ? 'OK  ' : 'AVVIK'} ${label.padEnd(34)} ${bad}/${n}`);
  if (first) console.log(`      tan(${first[0]}): V8=${first[1]} fdlibm=${first[2]}`);
  return bad;
}

const D2R = Math.PI / 180;
// Adapterens faktiske bruk: launch/landing i [-5, 65] grader, fov/2 < 0.35 rad.
total += sweep('adapter: grader [-5,65] -> rad', () => (rnd() * 70 - 5) * D2R, 60000);
total += sweep('adapter: fov/2 [0.1, 0.4]', () => 0.1 + rnd() * 0.3, 30000);
total += sweep('|x| <= pi/4', () => (rnd() - 0.5) * (Math.PI / 2), 60000);
total += sweep('kernel-grense 0.6744..pi/4+', () => {
  const m = 0.6744 + rnd() * 0.12;
  return rnd() < 0.5 ? m : -m;
}, 40000);
total += sweep('pi/4 < |x| < 3pi/4 (odde kvadrant)', () => {
  const m = Math.PI / 4 + rnd() * (Math.PI / 2);
  return rnd() < 0.5 ? m : -m;
}, 60000);
total += sweep('|x| i [3pi/4, 1000]', () => {
  const m = 2.36 + rnd() * 998;
  return rnd() < 0.5 ? m : -m;
}, 60000);
total += sweep('sma |x| < 2^-28', () => (rnd() - 0.5) * 1e-9, 20000);
for (const c of [0.6744, Math.PI / 4, Math.PI / 2, Math.PI, 0]) {
  total += sweep(`ULP rundt ${c.toFixed(4)}`, i => nextAfter(c, i - 400), 801);
  total += sweep(`ULP rundt -${c.toFixed(4)}`, i => nextAfter(-c, i - 400), 801);
}
total += sweep('heltall [-1000,1000]', i => i - 1000, 2001);

const edges = [0, -0, Infinity, -Infinity, NaN, Math.PI / 2, -Math.PI / 2];
let e = 0;
for (const x of edges) {
  const a = Math.tan(x), b = fdTan(x);
  const same = Object.is(a, b) || (Number.isNaN(a) && Number.isNaN(b));
  if (!same) { e++; console.log(`AVVIK tan(${x}): V8=${a} fdlibm=${b}`); }
}
console.log(`${e === 0 ? 'OK  ' : 'AVVIK'} kantverdier                        ${e}/${edges.length}`);
total += e;

console.log('');
console.log(total === 0
  ? 'KONKLUSJON: V8s Math.tan ER fdlibm. Kan porteres eksakt.'
  : `KONKLUSJON: ${total} avvik.`);
