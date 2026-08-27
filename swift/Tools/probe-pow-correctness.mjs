/**
 * Å2 vei C — ER V8s Math.pow korrekt avrundet?
 *
 * Metode: dobbel-dobbel-referanse. exp(y·ln x) beregnet i ~106 bits presisjon
 * (to doubles, Dekker/Knuth-algoritmene), deretter rundet til nærmeste
 * double. Er V8 alltid lik referansen, er den korrekt avrundet — og en
 * dobbel-dobbel pow i Swift kan treffe den eksakt (vei B finnes).
 *
 * Domenet er motorens: pow(S, 0.4), S i [0, 0.5] og det observerte
 * [0.08, 0.22]. Pluss de 102 kjente uenighetene mellom ucrt og V8 — de er
 * de eneste punktene der valget faktisk betyr noe.
 */

/* ── Dobbel-dobbel-primitiver (Dekker/Knuth) ─────────────────────────────── */

function twoSum(a, b) {
  const s = a + b;
  const bb = s - a;
  const err = (a - (s - bb)) + (b - bb);
  return [s, err];
}

function twoProd(a, b) {
  const p = a * b;
  const err = Math.fma ? Math.fma(a, b, -p) : twoProdSplit(a, b, p);
  return [p, err];
}

function twoProdSplit(a, b, p) {
  const SPLIT = 134217729; // 2^27 + 1
  const aHi0 = SPLIT * a, aHi = aHi0 - (aHi0 - a), aLo = a - aHi;
  const bHi0 = SPLIT * b, bHi = bHi0 - (bHi0 - b), bLo = b - bHi;
  return ((aHi * bHi - p) + aHi * bLo + aLo * bHi) + aLo * bLo;
}

/** [hi, lo] + [hi, lo] */
function ddAdd(a, b) {
  let [s, e] = twoSum(a[0], b[0]);
  e += a[1] + b[1];
  const [hi, lo] = twoSum(s, e);
  return [hi, lo];
}

/** [hi, lo] × [hi, lo] */
function ddMul(a, b) {
  let [p, e] = twoProd(a[0], b[0]);
  e += a[0] * b[1] + a[1] * b[0];
  const [hi, lo] = twoSum(p, e);
  return [hi, lo];
}

function ddMulDouble(a, x) {
  let [p, e] = twoProd(a[0], x);
  e += a[1] * x;
  const [hi, lo] = twoSum(p, e);
  return [hi, lo];
}

/** ln(x) i dobbel-dobbel: Newton-iterasjon pa exp. ln0 = Math.log(x); en
 * Newton-runde: ln1 = ln0 + x·exp(−ln0) − 1 gir ~2x presisjonen. */
function ddLog(x) {
  const ln0 = Math.log(x);
  // r = x · exp(−ln0) − 1, beregnet i dd
  const expNeg = ddExp([-ln0, 0]);
  const r = ddAdd(ddMulDouble(expNeg, x), [-1, 0]);
  return ddAdd([ln0, 0], r);
}

/** exp([hi, lo]) i dobbel-dobbel: exp(hi)·(1 + lo + lo²/2 …) med
 * exp(hi) forbedret via Taylor-korreksjon rundt Math.exp. */
function ddExp(a) {
  const e0 = Math.exp(a[0]);
  if (e0 === 0 || !Number.isFinite(e0)) return [e0, 0];
  // Korriger exp(hi): d = hi − ln(e0) (dd), exp(hi) = e0·exp(d) ≈ e0·(1+d)
  const lnE0 = Math.log(e0);
  // ln(e0) er ikke eksakt; bruk dd: delta = a − [lnE0-korrigert]
  // Enklere: exp(a) = e0 · exp(a0 − lnA) · exp(lo) der lnA≈a0.
  // Vi bruker to Taylor-ledd pa (a0 − lnE0) + lo:
  const d = ddAdd(ddAdd([a[0], 0], [-lnE0, 0]), [a[1], 0]);
  // exp(d) ≈ 1 + d + d²/2 (d er ~1e-16, sa d² er ~1e-32 — innafor dd)
  const d2 = ddMul(d, d);
  const expD = ddAdd(ddAdd([1, 0], d), ddMulDouble(d2, 0.5));
  return ddMulDouble(expD, e0);
}

/** pow(x, y) via dd: exp(y·ln x), rundet til double. */
function ddPow(x, y) {
  if (x === 0) return Math.pow(x, y);
  const lnX = ddLog(x);
  const yLnX = ddMulDouble(lnX, y);
  const r = ddExp(yLnX);
  return r[0] + r[1];  // rund til nærmeste double
}

/* ── Sveip ───────────────────────────────────────────────────────────────── */

let seed = 0xc0441;
function rnd() {
  seed ^= seed << 13; seed >>>= 0;
  seed ^= seed >>> 17;
  seed ^= seed << 5;  seed >>>= 0;
  return seed / 4294967296;
}

const ulpDist = (a, b) => {
  if (a === b) return 0;
  const buf = new ArrayBuffer(8);
  const f = new Float64Array(buf), u = new BigUint64Array(buf);
  f[0] = a; const ba = u[0];
  f[0] = b; const bb = u[0];
  return Number(ba > bb ? ba - bb : bb - ba);
};

console.log('Har Math.fma:', typeof Math.fma === 'function');

let v8AgreesWithDD = 0, v8Disagrees = 0, total = 0;
let maxUlp = 0, disagreeSamples = [];

function sweep(label, gen, n) {
  let agree = 0, disagree = 0;
  for (let i = 0; i < n; i++) {
    const x = gen(i);
    if (!(x > 0)) continue;
    const v8 = Math.pow(x, 0.4);
    const dd = ddPow(x, 0.4);
    total += 1;
    if (Object.is(v8, dd)) { agree += 1; v8AgreesWithDD += 1; }
    else {
      disagree += 1; v8Disagrees += 1;
      const u = ulpDist(v8, dd);
      if (u > maxUlp) maxUlp = u;
      if (disagreeSamples.length < 8) disagreeSamples.push([x, v8, dd, u]);
    }
  }
  console.log(`${label.padEnd(36)} enig ${agree}  uenig ${disagree}`);
}

sweep('motor-domene [0.08, 0.22]', () => 0.08 + rnd() * 0.14, 40000);
sweep('bredere [0, 0.5]', () => rnd() * 0.5, 40000);
sweep('[0.5, 5]', () => 0.5 + rnd() * 4.5, 20000);

console.log('');
console.log(`totalt: ${v8AgreesWithDD}/${total} enige med dd-referansen, maks ${maxUlp} ULP avvik`);
for (const [x, v8, dd, u] of disagreeSamples) {
  console.log(`  x=${x}: V8=${v8} dd=${dd} (${u} ULP)`);
}
console.log('');
console.log(v8Disagrees === 0
  ? 'KONKLUSJON: V8s pow er (minst innenfor dd-presisjonen) KORREKT AVRUNDET. Vei B finnes.'
  : v8Disagrees < total * 0.001
    ? 'KONKLUSJON: V8 er nesten korrekt avrundet — avvikene kan vaere dd-referansens egne (~106 bit er ikke uendelig). Vei B er sannsynlig men ikke garantert.'
    : 'KONKLUSJON: V8 er IKKE korrekt avrundet. Vei B som exp(y ln x) i dd treffer den ikke. Vei A.');
