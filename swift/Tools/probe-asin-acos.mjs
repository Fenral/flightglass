/**
 * Bekrefter at V8s Math.asin og Math.acos er fdlibm.
 *
 * Studios to: `thetaAtImpact` bruker asin, `groundCrossingTheta0` bruker acos.
 * Begge deler samme rasjonale approksimasjon R(x^2) = p/q, men rekonstruerer
 * resultatet ulikt i hver gren.
 */

const buf = new ArrayBuffer(8);
const f64 = new Float64Array(buf);
const u32 = new Uint32Array(buf);
const i32 = new Int32Array(buf);

const hiWord = x => { f64[0] = x; return i32[1]; };
const loWord = x => { f64[0] = x; return u32[0]; };
const zeroLow = x => { f64[0] = x; u32[0] = 0; return f64[0]; };

const one = 1.0, huge = 1.0e300;
const pio2_hi = 1.57079632679489655800e+00;
const pio2_lo = 6.12323399573676603587e-17;
const pio4_hi = 7.85398163397448278999e-01;
const pi      = 3.14159265358979311600e+00;

const pS0 =  1.66666666666666657415e-01;
const pS1 = -3.25565818622400915405e-01;
const pS2 =  2.01212532134862925881e-01;
const pS3 = -4.00555345006794114027e-02;
const pS4 =  7.91534994289814532176e-04;
const pS5 =  3.47933107596021167570e-05;
const qS1 = -2.40339491173441421878e+00;
const qS2 =  2.02094576023350569471e+00;
const qS3 = -6.88283971605453293030e-01;
const qS4 =  7.70381505559019352791e-02;

const polyP = t => t * (pS0 + t * (pS1 + t * (pS2 + t * (pS3 + t * (pS4 + t * pS5)))));
const polyQ = t => one + t * (qS1 + t * (qS2 + t * (qS3 + t * qS4)));

function fdAsin(x) {
  const hx = hiWord(x);
  const ix = hx & 0x7fffffff;

  if (ix >= 0x3ff00000) {                   // |x| >= 1
    const lx = loWord(x);
    if (((ix - 0x3ff00000) | lx) === 0) return x * pio2_hi + x * pio2_lo;  // asin(+-1)
    return (x - x) / (x - x);               // NaN
  }

  if (ix < 0x3fe00000) {                    // |x| < 0.5
    if (ix < 0x3e500000) {                  // |x| < 2^-26
      if (huge + x > one) return x;
    }
    const t = x * x;
    const w = polyP(t) / polyQ(t);
    return x + x * w;
  }

  // 1 > |x| >= 0.5
  let w = one - Math.abs(x);
  let t = w * 0.5;
  const p = polyP(t);
  const q = polyQ(t);
  const s = Math.sqrt(t);
  if (ix >= 0x3FEF3333) {                   // |x| > 0.975
    w = p / q;
    t = pio2_hi - (2.0 * (s + s * w) - pio2_lo);
  } else {
    w = zeroLow(s);
    const c = (t - w * w) / (s + w);
    const r = p / q;
    const p2 = 2.0 * s * r - (pio2_lo - 2.0 * c);
    const q2 = pio4_hi - 2.0 * w;
    t = pio4_hi - (p2 - q2);
  }
  return hx > 0 ? t : -t;
}

function fdAcos(x) {
  const hx = hiWord(x);
  const ix = hx & 0x7fffffff;

  if (ix >= 0x3ff00000) {                   // |x| >= 1
    const lx = loWord(x);
    if (((ix - 0x3ff00000) | lx) === 0) {
      return hx > 0 ? 0.0 : pi + 2.0 * pio2_lo;
    }
    return (x - x) / (x - x);               // NaN
  }

  if (ix < 0x3fe00000) {                    // |x| < 0.5
    if (ix <= 0x3c600000) return pio2_hi + pio2_lo;   // |x| < 2^-57
    const z = x * x;
    const r = polyP(z) / polyQ(z);
    return pio2_hi - (x - (pio2_lo - x * r));
  }

  if (hx < 0) {                             // x < -0.5
    const z = (one + x) * 0.5;
    const s = Math.sqrt(z);
    const r = polyP(z) / polyQ(z);
    const w = r * s - pio2_lo;
    return pi - 2.0 * (s + w);
  }

  // x > 0.5
  const z = (one - x) * 0.5;
  const s = Math.sqrt(z);
  const df = zeroLow(s);
  const c = (z - df * df) / (s + df);
  const r = polyP(z) / polyQ(z);
  const w = r * s + c;
  return 2.0 * (df + w);
}

/* ── Sveip ───────────────────────────────────────────────────────────────── */

let seed = 0xa514ac;
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
  let ba = 0, bc = 0, first = null;
  for (let i = 0; i < n; i++) {
    const x = gen(i);
    const a1 = Math.asin(x), b1 = fdAsin(x);
    const a2 = Math.acos(x), b2 = fdAcos(x);
    if (!Object.is(a1, b1)) { ba++; if (!first) first = ['asin', x, a1, b1]; }
    if (!Object.is(a2, b2)) { bc++; if (!first) first = ['acos', x, a2, b2]; }
  }
  const ok = ba === 0 && bc === 0;
  console.log(`${ok ? 'OK  ' : 'AVVIK'} ${label.padEnd(32)} asin ${ba}/${n}  acos ${bc}/${n}`);
  if (first) console.log(`      ${first[0]}(${first[1]}): V8=${first[2]} fdlibm=${first[3]}`);
  return ba + bc;
}

// Studios faktiske omrade: asin(clamp(-effectiveLowPointX/radius, -0.999, 0.999))
total += sweep('studio: [-0.999, 0.999]', () => (rnd() * 2 - 1) * 0.999, 80000);
total += sweep('|x| < 0.5', () => (rnd() - 0.5), 60000);
total += sweep('0.5 <= |x| < 0.975', () => {
  const m = 0.5 + rnd() * 0.475;
  return rnd() < 0.5 ? m : -m;
}, 60000);
total += sweep('0.975 <= |x| < 1', () => {
  const m = 0.975 + rnd() * 0.02499;
  return rnd() < 0.5 ? m : -m;
}, 60000);
total += sweep('sma |x| < 2^-26', () => (rnd() - 0.5) * 1e-9, 20000);
total += sweep('sma |x| < 2^-57', () => (rnd() - 0.5) * 1e-18, 20000);

for (const c of [0.5, 0.975, 1.0, 0.999, 0.0]) {
  total += sweep(`ULP rundt ${c}`, i => nextAfter(c, i - 400), 801);
  total += sweep(`ULP rundt -${c}`, i => nextAfter(-c, i - 400), 801);
}
total += sweep('k/1024 i [-1,1]', i => (i - 1024) / 1024, 2049);

// Kantverdier
const edges = [0, -0, 1, -1, 1.0000000000000002, -1.0000000000000002, 2, -2, NaN];
let e = 0;
for (const x of edges) {
  for (const [nm, v8, fd] of [['asin', Math.asin(x), fdAsin(x)],
                              ['acos', Math.acos(x), fdAcos(x)]]) {
    const same = Object.is(v8, fd) || (Number.isNaN(v8) && Number.isNaN(fd));
    if (!same) { e++; console.log(`AVVIK ${nm}(${x}): V8=${v8} fdlibm=${fd}`); }
  }
}
console.log(`${e === 0 ? 'OK  ' : 'AVVIK'} kantverdier                      ${e}/${edges.length * 2}`);
total += e;

console.log('');
console.log(total === 0
  ? 'KONKLUSJON: V8s Math.asin og Math.acos ER fdlibm. Kan porteres eksakt.'
  : `KONKLUSJON: ${total} avvik.`);
