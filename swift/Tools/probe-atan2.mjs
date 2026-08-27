/**
 * Bekrefter at V8s Math.atan2 (og Math.atan) er fdlibm.
 *
 * Dette er funksjonen som faktisk koster noe: `spinAxis` og `spinLoft3DDeg`
 * ble malt til 2 ULP fra fixturen med plattformens atan2, og bare 4095 av
 * 5028 caser var bit-eksakte.
 */

const buf = new ArrayBuffer(8);
const f64 = new Float64Array(buf);
const u32 = new Uint32Array(buf);
const i32 = new Int32Array(buf);

const hiWord = x => { f64[0] = x; return i32[1]; };
const loWord = x => { f64[0] = x; return u32[0]; };

const one = 1.0, huge = 1.0e300, tiny = 1.0e-300, zero = 0.0;
const pi_o_4 = 7.8539816339744827900e-01;
const pi_o_2 = 1.5707963267948965580e+00;
const pi     = 3.1415926535897931160e+00;
const pi_lo  = 1.2246467991473531772e-16;

const atanhi = [
  4.63647609000806093515e-01,
  7.85398163397448278999e-01,
  9.82793723247329054082e-01,
  1.57079632679489655800e+00,
];
const atanlo = [
  2.26987774529616870924e-17,
  3.06161699786838301793e-17,
  1.39033110312309984516e-17,
  6.12323399573676603587e-17,
];
const aT = [
  3.33333333333329318027e-01, -1.99999999998764832476e-01,
  1.42857142725034663711e-01, -1.11111104054623557880e-01,
  9.09088713343650656196e-02, -7.69187620504482999495e-02,
  6.66107313738753120669e-02, -5.83357013379057348645e-02,
  4.97687799461593236017e-02, -3.65315727442169155270e-02,
  1.62858201153657823623e-02,
];

function fdAtan(x) {
  const hx = hiWord(x);
  const ix = hx & 0x7fffffff;
  let id;

  if (ix >= 0x44100000) {                 // |x| >= 2^66
    const low = loWord(x);
    if (ix > 0x7ff00000 || (ix === 0x7ff00000 && low !== 0)) return x + x;  // NaN
    return hx > 0 ? atanhi[3] + atanlo[3] : -atanhi[3] - atanlo[3];
  }

  if (ix < 0x3fdc0000) {                  // |x| < 0.4375
    if (ix < 0x3e400000) {                // |x| < 2^-27
      if (huge + x > one) return x;
    }
    id = -1;
  } else {
    x = Math.abs(x);
    if (ix < 0x3ff30000) {                // |x| < 1.1875
      if (ix < 0x3fe60000) {              // 7/16 <= |x| < 11/16
        id = 0; x = (2.0 * x - one) / (2.0 + x);
      } else {                            // 11/16 <= |x| < 19/16
        id = 1; x = (x - one) / (x + one);
      }
    } else {
      if (ix < 0x40038000) {              // |x| < 2.4375
        id = 2; x = (x - 1.5) / (one + 1.5 * x);
      } else {                            // 2.4375 <= |x| < 2^66
        id = 3; x = -1.0 / x;
      }
    }
  }

  const z = x * x;
  const w = z * z;
  const s1 = z * (aT[0] + w * (aT[2] + w * (aT[4] + w * (aT[6] + w * (aT[8] + w * aT[10])))));
  const s2 = w * (aT[1] + w * (aT[3] + w * (aT[5] + w * (aT[7] + w * aT[9]))));
  if (id < 0) return x - x * (s1 + s2);
  const r = atanhi[id] - ((x * (s1 + s2) - atanlo[id]) - x);
  return hx < 0 ? -r : r;
}

function fdAtan2(y, x) {
  const hx = hiWord(x), lx = loWord(x);
  const hy = hiWord(y), ly = loWord(y);
  const ix = hx & 0x7fffffff;
  const iy = hy & 0x7fffffff;

  // NaN i enten x eller y
  const lxNZ = (lx | (-lx >>> 0)) >>> 31;
  const lyNZ = (ly | (-ly >>> 0)) >>> 31;
  if (((ix | lxNZ) > 0x7ff00000) || ((iy | lyNZ) > 0x7ff00000)) return x + y;

  if (((hx - 0x3ff00000) | lx) === 0) return fdAtan(y);   // x = 1.0

  const m = ((hy >> 31) & 1) | ((hx >> 30) & 2);          // 2*sign(x) + sign(y)

  if ((iy | ly) === 0) {                                   // y = 0
    switch (m) {
      case 0: case 1: return y;
      case 2: return pi + tiny;
      case 3: return -pi - tiny;
    }
  }
  if ((ix | lx) === 0) return hy < 0 ? -pi_o_2 - tiny : pi_o_2 + tiny;  // x = 0

  if (ix === 0x7ff00000) {                                 // x er INF
    if (iy === 0x7ff00000) {
      switch (m) {
        case 0: return pi_o_4 + tiny;
        case 1: return -pi_o_4 - tiny;
        case 2: return 3.0 * pi_o_4 + tiny;
        case 3: return -3.0 * pi_o_4 - tiny;
      }
    }
    switch (m) {
      case 0: return zero;
      case 1: return -zero;
      case 2: return pi + tiny;
      case 3: return -pi - tiny;
    }
  }
  if (iy === 0x7ff00000) return hy < 0 ? -pi_o_2 - tiny : pi_o_2 + tiny;  // y er INF

  let z;
  let mm = m;
  const k = (iy - ix) >> 20;
  if (k > 60) {                       // |y/x| > 2^60
    z = pi_o_2 + 0.5 * pi_lo;
    mm &= 1;
  } else if (hx < 0 && k < -60) {
    z = 0.0;                          // 0 > |y|/x > -2^-60
  } else {
    z = fdAtan(Math.abs(y / x));
  }

  switch (mm) {
    case 0: return z;
    case 1: return -z;
    case 2: return pi - (z - pi_lo);
    default: return (z - pi_lo) - pi;
  }
}

/* ── Sveip ───────────────────────────────────────────────────────────────── */

let seed = 0xa7a72;
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

function sweepAtan(label, gen, n) {
  let bad = 0, first = null;
  for (let i = 0; i < n; i++) {
    const x = gen(i);
    const a = Math.atan(x), b = fdAtan(x);
    if (!Object.is(a, b)) { bad++; if (!first) first = [x, a, b]; }
  }
  console.log(`${bad === 0 ? 'OK  ' : 'AVVIK'} atan  ${label.padEnd(32)} ${bad}/${n}`);
  if (first) console.log(`      x=${first[0]} V8=${first[1]} fdlibm=${first[2]}`);
  return bad;
}

function sweepAtan2(label, gen, n) {
  let bad = 0, first = null;
  for (let i = 0; i < n; i++) {
    const [y, x] = gen(i);
    const a = Math.atan2(y, x), b = fdAtan2(y, x);
    if (!Object.is(a, b)) { bad++; if (!first) first = [y, x, a, b]; }
  }
  console.log(`${bad === 0 ? 'OK  ' : 'AVVIK'} atan2 ${label.padEnd(32)} ${bad}/${n}`);
  if (first) console.log(`      y=${first[0]} x=${first[1]} V8=${first[2]} fdlibm=${first[3]}`);
  return bad;
}

// atan: alle fire reduksjonsgrenene
total += sweepAtan('|x| < 0.4375', () => (rnd() - 0.5) * 0.875, 60000);
total += sweepAtan('7/16..11/16', () => 0.4375 + rnd() * 0.25, 40000);
total += sweepAtan('11/16..19/16', () => 0.6875 + rnd() * 0.5, 40000);
total += sweepAtan('19/16..2.4375', () => 1.1875 + rnd() * 1.25, 40000);
total += sweepAtan('2.4375..1e6', () => 2.4375 + rnd() * 1e6, 40000);
total += sweepAtan('sma |x| < 2^-27', () => (rnd() - 0.5) * 1e-9, 20000);
total += sweepAtan('negative speil', () => -(rnd() * 5), 40000);
for (const c of [0.4375, 0.6875, 1.1875, 2.4375, 1.0, 0.5, 1.5]) {
  total += sweepAtan(`ULP rundt ${c}`, i => nextAfter(c, i - 300), 601);
  total += sweepAtan(`ULP rundt -${c}`, i => nextAfter(-c, i - 300), 601);
}

// atan2: motorens faktiske bruk
//   spinLoft3DDeg  atan2(|v x n|, v . n)   -> y i [0,1], x i [-1,1]
//   spinAxis       atan2(axis.z, hypot(axis.x, axis.y))
//   studioGeometry atan2(vertical, hypot(...)) og atan2(perp, parallel)
total += sweepAtan2('motor: y i [0,1], x i [-1,1]',
  () => [rnd(), rnd() * 2 - 1], 80000);
total += sweepAtan2('motor: begge sma',
  () => [(rnd() - 0.5) * 1e-8, rnd()], 40000);
total += sweepAtan2('generelt [-10,10]^2',
  () => [(rnd() - 0.5) * 20, (rnd() - 0.5) * 20], 80000);
total += sweepAtan2('ekstreme forhold',
  () => [(rnd() - 0.5) * 1e20, (rnd() - 0.5) * 1e-20], 40000);
total += sweepAtan2('x = 1.0 eksakt', () => [(rnd() - 0.5) * 4, 1.0], 20000);
total += sweepAtan2('y = 0', () => [rnd() < 0.5 ? 0 : -0, (rnd() - 0.5) * 4], 10000);
total += sweepAtan2('x = 0', () => [(rnd() - 0.5) * 4, rnd() < 0.5 ? 0 : -0], 10000);

// Kantverdier for atan2
const inf = Infinity;
const edges2 = [
  [0, 1], [-0, 1], [0, -1], [-0, -1], [1, 0], [-1, 0], [0, 0], [-0, -0],
  [inf, inf], [-inf, inf], [inf, -inf], [-inf, -inf],
  [1, inf], [-1, inf], [1, -inf], [-1, -inf], [inf, 1], [-inf, 1],
  [NaN, 1], [1, NaN], [NaN, NaN], [1, 1], [-1, -1], [1e300, 1e-300],
];
let e2 = 0;
for (const [y, x] of edges2) {
  const a = Math.atan2(y, x), b = fdAtan2(y, x);
  const same = Object.is(a, b) || (Number.isNaN(a) && Number.isNaN(b));
  if (!same) { e2++; console.log(`AVVIK atan2(${y}, ${x}): V8=${a} fdlibm=${b}`); }
}
console.log(`${e2 === 0 ? 'OK  ' : 'AVVIK'} atan2 kantverdier                      ${e2}/${edges2.length}`);
total += e2;

console.log('');
console.log(total === 0
  ? 'KONKLUSJON: V8s Math.atan og Math.atan2 ER fdlibm. Kan porteres eksakt.'
  : `KONKLUSJON: ${total} avvik.`);
