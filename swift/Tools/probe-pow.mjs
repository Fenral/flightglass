/**
 * Bekrefter at V8s Math.pow er fdlibm __ieee754_pow.
 *
 * Den storste av de atte. Den har sin egen interne log (via en 2/(3ln2)-basis
 * med hoy/lav-splitting) og sin egen exp — den kaller ikke bibliotekets.
 *
 * Motoren bruker den pa EN mate: pow(max(0, spinParameter), 0.4), to
 * kallsteder i RK4. Malt tidligere: plattformens pow avviker fra V8 i 102 av
 * 47 531 caser i nettopp det domenet, maks 1 ULP. De mater inn i en
 * integrasjon over ~600 steg, sa de akkumulerer.
 */

const buf = new ArrayBuffer(8);
const f64 = new Float64Array(buf);
const u32 = new Uint32Array(buf);
const i32 = new Int32Array(buf);

const hiWord = x => { f64[0] = x; return i32[1]; };
const loWord = x => { f64[0] = x; return u32[0]; };
const setLow0 = x => { f64[0] = x; u32[0] = 0; return f64[0]; };
const setHigh = (x, hi) => { f64[0] = x; i32[1] = hi | 0; return f64[0]; };
const fromHi = hi => { i32[1] = hi | 0; u32[0] = 0; return f64[0]; };

const bp   = [1.0, 1.5];
const dp_h = [0.0, 5.84962487220764160156e-01];
const dp_l = [0.0, 1.35003920212974897128e-08];

const zero = 0.0, one = 1.0, two = 2.0;
const two53 = 9007199254740992.0;
const huge = 1.0e300, tiny = 1.0e-300;

const L1 = 5.99999999999994648725e-01;
const L2 = 4.28571428578550184252e-01;
const L3 = 3.33333329818377432918e-01;
const L4 = 2.72728123808534006489e-01;
const L5 = 2.30660745775561754067e-01;
const L6 = 2.06975017800338417784e-01;

const P1 =  1.66666666666666019037e-01;
const P2 = -2.77777777770155933842e-03;
const P3 =  6.61375632143793436117e-05;
const P4 = -1.65339022054652515390e-06;
const P5 =  4.13813679705723846039e-08;

const lg2   =  6.93147180559945286227e-01;
const lg2_h =  6.93147182464599609375e-01;
const lg2_l = -1.90465429995776804525e-09;
const ovt   =  8.0085662595372944372e-17;
const cp    =  9.61796693925975554329e-01;
const cp_h  =  9.61796700954437255859e-01;
const cp_l  = -7.02846165095275826516e-09;
const ivln2   = 1.44269504088896338700e+00;
const ivln2_h = 1.44269502162933349609e+00;
const ivln2_l = 1.92596299112661746887e-08;

function scalbn(x, n) {
  // Tilstrekkelig for domenet her; fdlibms fulle scalbn trengs ikke fordi
  // subnormalt resultat aldri oppstar for pow(base i [0,10], 0.4).
  return x * Math.pow(2, n);
}

function fdPow(x, y) {
  let z, ax, z_h, z_l, p_h, p_l;
  let y1, t1, t2, r, s, t, u, v, w;
  let i, j, k, yisint, n;

  let hx = hiWord(x), lx = loWord(x);
  let hy = hiWord(y), ly = loWord(y);
  let ix = hx & 0x7fffffff, iy = hy & 0x7fffffff;

  if ((iy | ly) === 0) return one;                       // x**0 = 1
  // MERK: V8 (13.6, node 24) har IKKE fdlibms tidlige 1**y-snarvei — den
  // ryker mot ES-semantikken (pow(1, NaN) og pow(+-1, +-inf) er NaN i JS).

  if (ix > 0x7ff00000 || (ix === 0x7ff00000 && lx !== 0) ||
      iy > 0x7ff00000 || (iy === 0x7ff00000 && ly !== 0)) {
    return (x + 0.0) + (y + 0.0);                         // NaN
  }

  // Er y et oddetall-heltall nar x < 0?
  yisint = 0;
  if (hx < 0) {
    if (iy >= 0x43400000) yisint = 2;
    else if (iy >= 0x3ff00000) {
      k = (iy >> 20) - 0x3ff;
      if (k > 20) {
        j = ly >>> (52 - k);
        if (((j << (52 - k)) >>> 0) === ly) yisint = 2 - (j & 1);
      } else if (ly === 0) {
        j = iy >> (20 - k);
        if ((j << (20 - k)) === iy) yisint = 2 - (j & 1);
      }
    }
  }

  if (ly === 0) {
    if (iy === 0x7ff00000) {                              // y er +-inf
      if (((ix - 0x3ff00000) | lx) === 0) return y - y;    // (+-1)**+-inf = NaN (ES)
      if (ix >= 0x3ff00000) return hy >= 0 ? y : zero;
      return hy < 0 ? -y : zero;
    }
    if (iy === 0x3ff00000) return hy < 0 ? one / x : x;    // y = +-1
    if (hy === 0x40000000) return x * x;                   // y = 2
    if (hy === 0x3fe00000) { if (hx >= 0) return Math.sqrt(x); }  // y = 0.5
  }

  ax = Math.abs(x);

  if (lx === 0) {
    if (ix === 0x7ff00000 || ix === 0 || ix === 0x3ff00000) {
      z = ax;
      if (hy < 0) z = one / z;
      if (hx < 0) {
        if (((ix - 0x3ff00000) | yisint) === 0) z = (z - z) / (z - z);
        else if (yisint === 1) z = -z;
      }
      return z;
    }
  }

  n = (hx >> 31) + 1;
  if ((n | yisint) === 0) return (x - x) / (x - x);        // (x<0)**(ikke-heltall)

  s = one;
  if ((n | (yisint - 1)) === 0) s = -one;                  // (-x)**(oddetall)

  if (iy > 0x41e00000) {                                   // |y| > 2^31
    if (iy > 0x43f00000) {
      if (ix <= 0x3fefffff) return hy < 0 ? huge * huge : tiny * tiny;
      if (ix >= 0x3ff00000) return hy > 0 ? huge * huge : tiny * tiny;
    }
    if (ix < 0x3fefffff) return hy < 0 ? s * huge * huge : s * tiny * tiny;
    if (ix > 0x3ff00000) return hy > 0 ? s * huge * huge : s * tiny * tiny;
    t = ax - one;
    w = (t * t) * (0.5 - t * (0.3333333333333333333333 - t * 0.25));
    u = ivln2_h * t;
    v = t * ivln2_l - w * ivln2;
    t1 = setLow0(u + v);
    t2 = v - (t1 - u);
  } else {
    let ss, s2, s_h, s_l, t_h, t_l;
    n = 0;
    if (ix < 0x00100000) { ax *= two53; n -= 53; ix = hiWord(ax); }
    n += (ix >> 20) - 0x3ff;
    j = ix & 0x000fffff;
    ix = j | 0x3ff00000;
    if (j <= 0x3988E) k = 0;
    else if (j < 0xBB67A) k = 1;
    else { k = 0; n += 1; ix -= 0x00100000; }
    ax = setHigh(ax, ix);

    u = ax - bp[k];
    v = one / (ax + bp[k]);
    ss = u * v;
    s_h = setLow0(ss);
    t_h = fromHi((((ix >> 1) | 0x20000000) + 0x00080000 + (k << 18)) | 0);
    t_l = ax - (t_h - bp[k]);
    s_l = v * ((u - s_h * t_h) - s_h * t_l);

    s2 = ss * ss;
    r = s2 * s2 * (L1 + s2 * (L2 + s2 * (L3 + s2 * (L4 + s2 * (L5 + s2 * L6)))));
    r += s_l * (s_h + ss);
    s2 = s_h * s_h;
    t_h = setLow0(3.0 + s2 + r);
    t_l = r - ((t_h - 3.0) - s2);

    u = s_h * t_h;
    v = s_l * t_h + t_l * ss;
    p_h = setLow0(u + v);
    p_l = v - (p_h - u);
    z_h = cp_h * p_h;
    z_l = cp_l * p_h + p_l * cp + dp_l[k];
    t = n;
    t1 = setLow0(((z_h + z_l) + dp_h[k]) + t);
    t2 = z_l - (((t1 - t) - dp_h[k]) - z_h);
  }

  y1 = setLow0(y);
  p_l = (y - y1) * t1 + y * t2;
  p_h = y1 * t1;
  z = p_l + p_h;
  j = hiWord(z); i = loWord(z);

  if (j >= 0x40900000) {                                   // z >= 1024
    if (((j - 0x40900000) | i) !== 0) return s * huge * huge;
    if (p_l + ovt > z - p_h) return s * huge * huge;
  } else if ((j & 0x7fffffff) >= 0x4090cc00) {             // z <= -1075
    const jj = j >>> 0;
    if (((((jj - 0xc090cc00) >>> 0) | i) >>> 0) !== 0) return s * tiny * tiny;
    if (p_l <= z - p_h) return s * tiny * tiny;
  }

  // 2**(p_h + p_l)
  i = j & 0x7fffffff;
  k = (i >> 20) - 0x3ff;
  n = 0;
  if (i > 0x3fe00000) {                                    // |z| > 0.5
    n = (j + (0x00100000 >> (k + 1))) | 0;
    k = ((n & 0x7fffffff) >> 20) - 0x3ff;
    t = fromHi(n & ~(0x000fffff >> k));
    n = ((n & 0x000fffff) | 0x00100000) >> (20 - k);
    if (j < 0) n = -n;
    p_h -= t;
  }
  t = setLow0(p_l + p_h);
  u = t * lg2_h;
  v = (p_l - (t - p_h)) * lg2 + t * lg2_l;
  z = u + v;
  w = v - (z - u);
  t = z * z;
  t1 = z - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
  // V8-varianten: divider z*t1 paa HELE uttrykket (t1 - 2) - (w + z*w).
  // Klassisk fdlibm gjoer (z*t1)/(t1-2) - (w+z*w) — 1 ULP unna, og det var
  // hele den jevne 1-ULP-stroemmen i foerste maling.
  r = (z * t1) / ((t1 - two) - (w + z * w));
  z = one - (r - z);
  j = hiWord(z);
  j = (j + (n << 20)) | 0;
  if ((j >> 20) <= 0) z = scalbn(z, n);
  else z = setHigh(z, j);
  return s * z;
}

/* ── Sveip ───────────────────────────────────────────────────────────────── */

let seed = 0x90111;
function rnd() {
  seed ^= seed << 13; seed >>>= 0;
  seed ^= seed >>> 17;
  seed ^= seed << 5;  seed >>>= 0;
  return seed / 4294967296;
}

let total = 0;
function sweep(label, gen, n) {
  let bad = 0, first = null;
  for (let i = 0; i < n; i++) {
    const [x, y] = gen(i);
    const a = Math.pow(x, y), b = fdPow(x, y);
    const same = Object.is(a, b) || (Number.isNaN(a) && Number.isNaN(b));
    if (!same) { bad++; if (!first) first = [x, y, a, b]; }
  }
  console.log(`${bad === 0 ? 'OK  ' : 'AVVIK'} ${label.padEnd(34)} ${bad}/${n}`);
  if (first) console.log(`      pow(${first[0]}, ${first[1]}): V8=${first[2]} fdlibm=${first[3]}`);
  return bad;
}

// Motorens faktiske bruk: eksponent alltid 0.4.
total += sweep('motor: pow(S, 0.4), S i [0,0.5]', () => [rnd() * 0.5, 0.4], 80000);
total += sweep('motor: S i observert [0.08,0.22]', () => [0.08 + rnd() * 0.14, 0.4], 60000);
total += sweep('pow(S, 0.4), S i [0,5]', () => [rnd() * 5, 0.4], 60000);
total += sweep('pow(S, 0.4), S sma', () => [rnd() * 1e-6, 0.4], 20000);

// Bredere, i tilfelle eksponenten endres senere.
total += sweep('generelt: base [0,10], eksp [-2,2]',
  () => [rnd() * 10, rnd() * 4 - 2], 80000);
total += sweep('negativ base, heltallseksp',
  () => [-(rnd() * 10), Math.floor(rnd() * 10) - 5], 40000);
total += sweep('negativ base, ikke-heltall',
  () => [-(rnd() * 10), rnd() * 4 - 2], 20000);
total += sweep('store eksponenter', () => [0.5 + rnd(), rnd() * 200 - 100], 40000);

// Kantverdier.
const inf = Infinity;
const edges = [
  [0, 0], [0, 1], [0, -1], [-0, 0], [-0, 1], [-0, -1], [-0, 3], [-0, 2],
  [1, inf], [-1, inf], [-1, -inf], [2, inf], [0.5, inf], [2, -inf],
  [inf, 1], [inf, -1], [-inf, 1], [-inf, 2], [-inf, 3],
  [NaN, 1], [1, NaN], [NaN, 0], [-2, 0.5], [-2, 2], [-2, 3],
  [1e300, 2], [1e-300, 2], [0.4421326136216521, 0.4],
];
let e = 0;
for (const [x, y] of edges) {
  const a = Math.pow(x, y), b = fdPow(x, y);
  const same = Object.is(a, b) || (Number.isNaN(a) && Number.isNaN(b));
  if (!same) { e++; console.log(`AVVIK pow(${x}, ${y}): V8=${a} fdlibm=${b}`); }
}
console.log(`${e === 0 ? 'OK  ' : 'AVVIK'} kantverdier                        ${e}/${edges.length}`);
total += e;

console.log('');
console.log(total === 0
  ? 'KONKLUSJON: V8s Math.pow ER fdlibm __ieee754_pow. Kan porteres eksakt.'
  : `KONKLUSJON: ${total} avvik.`);
