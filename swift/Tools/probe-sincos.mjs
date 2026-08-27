/**
 * Bekrefter at V8s Math.sin og Math.cos er fdlibm.
 *
 * Disse to deler den tyngste delen av D86: argumentreduksjonen
 * `__ieee754_rem_pio2`, som trekker x ned i [-pi/4, pi/4] og forteller hvilken
 * kvadrant vi havnet i. Kjernene `__kernel_sin` og `__kernel_cos` er polynomer.
 *
 * Reduksjonen har fire grener. Denne proben dekker de tre forste:
 *   1. |x| <= pi/4          ingen reduksjon
 *   2. |x| <  3pi/4         n = +-1, lukket form
 *   3. |x| <= 2^19*(pi/2)   medium, opptil tre presisjonsrunder
 *   4. storre               krever __kernel_rem_pio2 med to-over-pi-tabellen
 *
 * Gren 4 er IKKE implementert. Motoren nar den aldri: alle argumenter er
 * vinkler i radianer fra grader i [-360, 360], altsa |x| < 7. Terskelen for
 * gren 4 er ~823549. Proben verifiserer at grensen faktisk ligger der.
 */

const buf = new ArrayBuffer(8);
const f64 = new Float64Array(buf);
const u32 = new Uint32Array(buf);
const i32 = new Int32Array(buf);

function hiWord(x) { f64[0] = x; return i32[1]; }
function fromHi(hi) { i32[1] = hi; u32[0] = 0; return f64[0]; }

const half = 5.00000000000000000000e-01;
const one = 1.0;

const invpio2 = 6.36619772367581382433e-01;
const pio2_1  = 1.57079632673412561417e+00;
const pio2_1t = 6.07710050650619224932e-11;
const pio2_2  = 6.07710050630396597660e-11;
const pio2_2t = 2.02226624879595063154e-21;
const pio2_3  = 2.02226624871116645580e-21;
const pio2_3t = 8.47842766036889956997e-32;

const S1 = -1.66666666666666324348e-01;
const S2 =  8.33333333332248946124e-03;
const S3 = -1.98412698298579493134e-04;
const S4 =  2.75573137070700676789e-06;
const S5 = -2.50507602534068634195e-08;
const S6 =  1.58969099521155010221e-10;

const C1 =  4.16666666666666019037e-02;
const C2 = -1.38888888888741095749e-03;
const C3 =  2.48015872894767294178e-05;
const C4 = -2.75573143513906633035e-07;
const C5 =  2.08757232129817482790e-09;
const C6 = -1.13596475577881948265e-11;

/* ── __kernel_sin ────────────────────────────────────────────────────────── */

function kernelSin(x, y, iy) {
  const ix = hiWord(x) & 0x7fffffff;
  if (ix < 0x3e400000) {           // |x| < 2^-27
    if (Math.trunc(x) === 0) return x;
  }
  const z = x * x;
  const v = z * x;
  const r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)));
  if (iy === 0) return x + v * (S1 + z * r);
  return x - ((z * (half * y - v * r) - y) - v * S1);
}

/* ── __kernel_cos ────────────────────────────────────────────────────────── */

function kernelCos(x, y) {
  const ix = hiWord(x) & 0x7fffffff;
  if (ix < 0x3e400000) {           // |x| < 2^-27
    if (Math.trunc(x) === 0) return one;
  }
  const z = x * x;
  const r = z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))));
  if (ix < 0x3FD33333) {           // |x| < 0.3
    return one - (0.5 * z - (z * r - x * y));
  }
  let qx;
  if (ix > 0x3fe90000) {           // x > 0.78125
    qx = 0.28125;
  } else {
    qx = fromHi(ix - 0x00200000);  // x/4
  }
  const hz = 0.5 * z - qx;
  const a = one - qx;
  return a - (hz - (z * r - x * y));
}

/* ── __ieee754_rem_pio2 ──────────────────────────────────────────────────── */

/** Returnerer n; skriver de to restleddene i `y`. */
function remPio2(x, y) {
  const hx = hiWord(x);
  const ix = hx & 0x7fffffff;

  if (ix <= 0x3fe921fb) {          // |x| ~<= pi/4
    y[0] = x; y[1] = 0; return 0;
  }

  if (ix < 0x4002d97c) {           // |x| < 3pi/4, n = +-1
    if (hx > 0) {
      let z = x - pio2_1;
      if (ix !== 0x3ff921fb) {
        y[0] = z - pio2_1t;
        y[1] = (z - y[0]) - pio2_1t;
      } else {
        z -= pio2_2;
        y[0] = z - pio2_2t;
        y[1] = (z - y[0]) - pio2_2t;
      }
      return 1;
    }
    let z = x + pio2_1;
    if (ix !== 0x3ff921fb) {
      y[0] = z + pio2_1t;
      y[1] = (z - y[0]) + pio2_1t;
    } else {
      z += pio2_2;
      y[0] = z + pio2_2t;
      y[1] = (z - y[0]) + pio2_2t;
    }
    return -1;
  }

  if (ix <= 0x413921fb) {          // |x| ~<= 2^19*(pi/2), medium
    let t = Math.abs(x);
    let n = Math.trunc(t * invpio2 + half);
    const fn = n;
    let r = t - fn * pio2_1;
    let w = fn * pio2_1t;          // 1. runde, god til 85 bit
    const j = ix >> 20;
    y[0] = r - w;
    let high = hiWord(y[0]);
    let i = j - ((high >> 20) & 0x7ff);
    if (i > 16) {                  // 2. runde, god til 118 bit
      t = r;
      w = fn * pio2_2;
      r = t - w;
      w = fn * pio2_2t - ((t - r) - w);
      y[0] = r - w;
      high = hiWord(y[0]);
      i = j - ((high >> 20) & 0x7ff);
      if (i > 49) {                // 3. runde, 151 bit
        t = r;
        w = fn * pio2_3;
        r = t - w;
        w = fn * pio2_3t - ((t - r) - w);
        y[0] = r - w;
      }
    }
    y[1] = (r - y[0]) - w;
    if (hx < 0) { y[0] = -y[0]; y[1] = -y[1]; return -n; }
    return n;
  }

  // Gren 4 — store argumenter. Ikke implementert; motoren nar den aldri.
  throw new RangeError(`remPio2: |x| for stor (${x}) — gren 4 ikke implementert`);
}

/* ── sin / cos ───────────────────────────────────────────────────────────── */

const yBuf = [0, 0];

function fdSin(x) {
  const ix = hiWord(x) & 0x7fffffff;
  if (ix <= 0x3fe921fb) return kernelSin(x, 0, 0);
  if (ix >= 0x7ff00000) return x - x;
  const n = remPio2(x, yBuf);
  switch (n & 3) {
    case 0:  return  kernelSin(yBuf[0], yBuf[1], 1);
    case 1:  return  kernelCos(yBuf[0], yBuf[1]);
    case 2:  return -kernelSin(yBuf[0], yBuf[1], 1);
    default: return -kernelCos(yBuf[0], yBuf[1]);
  }
}

function fdCos(x) {
  const ix = hiWord(x) & 0x7fffffff;
  if (ix <= 0x3fe921fb) return kernelCos(x, 0);
  if (ix >= 0x7ff00000) return x - x;
  const n = remPio2(x, yBuf);
  switch (n & 3) {
    case 0:  return  kernelCos(yBuf[0], yBuf[1]);
    case 1:  return -kernelSin(yBuf[0], yBuf[1], 1);
    case 2:  return -kernelCos(yBuf[0], yBuf[1]);
    default: return  kernelSin(yBuf[0], yBuf[1], 1);
  }
}

/* ── Sveip ───────────────────────────────────────────────────────────────── */

let seed = 0x0ddba11;
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

function sweep(label, gen, n) {
  let badSin = 0, badCos = 0, first = null;
  for (let i = 0; i < n; i++) {
    const x = gen(i);
    const s = Math.sin(x), c = Math.cos(x);
    const fs = fdSin(x), fc = fdCos(x);
    if (!Object.is(s, fs)) { badSin++; if (!first) first = ['sin', x, s, fs]; }
    if (!Object.is(c, fc)) { badCos++; if (!first) first = ['cos', x, c, fc]; }
  }
  const ok = badSin === 0 && badCos === 0;
  console.log(`${ok ? 'OK  ' : 'AVVIK'} ${label.padEnd(34)} sin ${badSin}/${n}  cos ${badCos}/${n}`);
  if (first) console.log(`      ${first[0]}(${first[1]}): V8=${first[2]} fdlibm=${first[3]}`);
  return badSin + badCos;
}

let total = 0;
const D2R = Math.PI / 180;

// Motorens faktiske omrader: vinkler i grader konvertert til radianer.
total += sweep('grader [-15,15] -> rad', () => (rnd() * 30 - 15) * D2R, 60000);
total += sweep('grader [0,50] loft -> rad', () => (rnd() * 50) * D2R, 40000);
total += sweep('grader [0,90] plane -> rad', () => (rnd() * 90) * D2R, 40000);
total += sweep('grader [-360,360] -> rad', () => (rnd() * 720 - 360) * D2R, 60000);
total += sweep('theta [-1.6,1.6]', () => rnd() * 3.2 - 1.6, 60000);

// Grenene i reduksjonen.
total += sweep('gren 1: |x| <= pi/4', () => (rnd() - 0.5) * (Math.PI / 2), 60000);
total += sweep('gren 2: pi/4 < |x| < 3pi/4', () => {
  const m = Math.PI / 4 + rnd() * (Math.PI / 2);
  return rnd() < 0.5 ? m : -m;
}, 60000);
total += sweep('gren 3: |x| i [3pi/4, 1000]', () => {
  const m = 2.36 + rnd() * 998;
  return rnd() < 0.5 ? m : -m;
}, 80000);
total += sweep('gren 3 stor: |x| i [1e3, 8e5]', () => {
  const m = 1e3 + rnd() * 7.99e5;
  return rnd() < 0.5 ? m : -m;
}, 60000);

// Tette nabolag rundt kvadrantgrensene, der grenene bytter.
for (const [name, c] of [['pi/4', Math.PI / 4], ['pi/2', Math.PI / 2],
                         ['3pi/4', 3 * Math.PI / 4], ['pi', Math.PI],
                         ['2pi', 2 * Math.PI], ['0.3', 0.3], ['0.78125', 0.78125]]) {
  total += sweep(`ULP rundt ${name}`, (i) => nextAfter(c, i - 400), 801);
  total += sweep(`ULP rundt -${name}`, (i) => nextAfter(-c, i - 400), 801);
}

// Pene verdier.
total += sweep('heltall [-1000,1000]', (i) => i - 1000, 2001);
total += sweep('k/64 i [-100,100]', (i) => (i - 6400) / 64, 12801);

console.log('');
console.log(total === 0
  ? 'KONKLUSJON: V8s Math.sin og Math.cos ER fdlibm. Kan porteres eksakt.'
  : `KONKLUSJON: ${total} avvik.`);

// Grensen for gren 4 — verifiser at den ligger der vi tror.
const branch4 = 0x413921fb;
f64[0] = 0; i32[1] = branch4; u32[0] = 0xffffffff;
console.log(`gren 4 starter over |x| ~ ${f64[0]}  (motoren bruker |x| < 7)`);
