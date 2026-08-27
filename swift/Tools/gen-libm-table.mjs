/**
 * Genererer verifikasjonstabeller for de transcendentale funksjonene (D86).
 *
 * For hver funksjon skrives en binaerfil med par av (input-bits, output-bits)
 * som little-endian UInt64. Swift-testen leser filen og krever BIT-EKSAKT
 * likhet. Ingen toleranse: disse funksjonene skal reprodusere V8 nøyaktig,
 * ellers er hele poenget med D86 borte.
 *
 * Verdiene dekker tre ting, i den rekkefolgen de betyr noe:
 *   1. motorens FAKTISKE verdiomrader, utledet fra kallstedene
 *   2. brede sveip som treffer alle grener i algoritmen
 *   3. kantverdier og «pene» tall (heltall, k/16, k/64) der en algoritme
 *      lettest divergerer
 *
 * Determinisme: fast PRNG-fro. Samme tabell hver kjoring, pa enhver maskin.
 *
 * Kjoring:  node swift/Tools/gen-libm-table.mjs [funksjonsnavn ...]
 *           (uten argument: alle som er definert)
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, '..', 'Tests', 'Fixtures', 'libm');

/* ── Deterministisk PRNG ─────────────────────────────────────────────────── */

function makeRnd(seed) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

/* ── Sveipbyggere ────────────────────────────────────────────────────────── */

function uniform(rnd, lo, hi, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(lo + (hi - lo) * rnd());
  return out;
}

function integers(lo, hi) {
  const out = [];
  for (let i = lo; i <= hi; i++) out.push(i);
  return out;
}

function fractions(lo, hi, denominator) {
  const out = [];
  for (let i = lo * denominator; i <= hi * denominator; i++) out.push(i / denominator);
  return out;
}

/** Tette ULP-nabolag rundt verdier der algoritmer lettest divergerer. */
function ulpNeighbourhood(centre, radius) {
  const buf = new ArrayBuffer(8);
  const f64 = new Float64Array(buf);
  const bi = new BigUint64Array(buf);
  const out = [];
  for (let i = -radius; i <= radius; i++) {
    f64[0] = centre;
    bi[0] += BigInt(i);
    out.push(f64[0]);
  }
  return out;
}

/* ── Funksjonsdefinisjoner ───────────────────────────────────────────────── */

const FUNCTIONS = {
  exp: {
    fn: Math.exp,
    arity: 1,
    /** Motorens kallsteder:
     *   spinMagnitude      exp(-(vsl - 31.98) / 2.14)      -> ca [-16, 16]
     *   longitudinalLegacy exp(-vsl / 10.9)                -> (-inf, 0]
     *   rk4Integrator      exp((Re - 85000) / 9000)        -> ca [-8, 25]
     */
    values() {
      const rnd = makeRnd(0x13579bdf);
      return [
        ...uniform(rnd, -16, 16, 40000),
        ...uniform(rnd, -8, 0, 20000),
        ...uniform(rnd, -8, 25, 20000),
        ...uniform(rnd, -1e-9, 1e-9, 5000),
        ...uniform(rnd, -1, 1, 20000),
        ...uniform(rnd, -700, 700, 20000),
        ...uniform(rnd, 709, 710, 5000),
        ...uniform(rnd, -746, -744, 5000),
        ...uniform(rnd, -745, -708, 10000),
        ...integers(-745, 709),
        ...fractions(-64, 64, 16),
        ...fractions(-16, 16, 1000),
        ...ulpNeighbourhood(1.0, 300),
        ...ulpNeighbourhood(0.0, 50),
        ...ulpNeighbourhood(Math.LN2, 200),
        0, -0, 1, -1, 0.5, -0.5,
        709.782712893384, -745.1332191019411, -708, -709, 710, -746,
        2 ** -28, 2 ** -29, 2 ** -27, Number.MIN_VALUE, -Number.MIN_VALUE,
      ];
    },
  },
};

/** sin og cos deler sveip: samme argumentreduksjon, samme grenser. */
function trigValues(seed) {
  const rnd = makeRnd(seed);
  const D2R = Math.PI / 180;
  const both = (m) => [m, -m];
  const out = [
    // Motorens faktiske vinkelomrader (grader -> radianer).
    ...uniform(rnd, -15 * D2R, 15 * D2R, 20000),
    ...uniform(rnd, 0, 50 * D2R, 15000),
    ...uniform(rnd, 0, 90 * D2R, 15000),
    ...uniform(rnd, -360 * D2R, 360 * D2R, 20000),
    ...uniform(rnd, -1.6, 1.6, 20000),
    // Grenene i reduksjonen.
    ...uniform(rnd, -Math.PI / 4, Math.PI / 4, 15000),
    ...uniform(rnd, Math.PI / 4, 3 * Math.PI / 4, 10000),
    ...uniform(rnd, -3 * Math.PI / 4, -Math.PI / 4, 10000),
    ...uniform(rnd, -1000, 1000, 20000),
    ...uniform(rnd, -8e5, 8e5, 15000),
    ...integers(-1000, 1000),
    ...fractions(-100, 100, 64),
  ];
  // Kvadrantgrenser og kjernenes bytteflater.
  for (const c of [Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI,
                   2 * Math.PI, 0.3, 0.78125, 0]) {
    for (const s of both(c)) out.push(...ulpNeighbourhood(s, 300));
  }
  return out;
}

FUNCTIONS.sin = { fn: Math.sin, arity: 1, values: () => trigValues(0x0ddba11) };
FUNCTIONS.cos = { fn: Math.cos, arity: 1, values: () => trigValues(0x0ddba11) };

FUNCTIONS.atan = {
  fn: Math.atan,
  arity: 1,
  values() {
    const rnd = makeRnd(0xa7a72);
    const out = [
      ...uniform(rnd, -0.4375, 0.4375, 25000),
      ...uniform(rnd, 0.4375, 0.6875, 15000),
      ...uniform(rnd, -0.6875, -0.4375, 15000),
      ...uniform(rnd, 0.6875, 1.1875, 15000),
      ...uniform(rnd, -1.1875, -0.6875, 15000),
      ...uniform(rnd, 1.1875, 2.4375, 15000),
      ...uniform(rnd, -2.4375, -1.1875, 15000),
      ...uniform(rnd, 2.4375, 1e6, 20000),
      ...uniform(rnd, -1e6, -2.4375, 20000),
      ...uniform(rnd, -1e-9, 1e-9, 10000),
      ...integers(-500, 500),
      ...fractions(-20, 20, 64),
    ];
    // Grenseovergangene mellom de fire reduksjonsgrenene.
    for (const c of [0.4375, 0.6875, 1.1875, 2.4375, 0.5, 1.0, 1.5, 0]) {
      out.push(...ulpNeighbourhood(c, 300), ...ulpNeighbourhood(-c, 300));
    }
    return out;
  },
};

/** atan2 er toargument: tabellen er tripler (y, x, resultat). */
FUNCTIONS.atan2 = {
  fn: Math.atan2,
  arity: 2,
  values() {
    const rnd = makeRnd(0x2a7a2);
    const out = [];
    // Motorens faktiske bruk:
    //   spinLoft3DDeg   atan2(|v x n|, v . n)      y i [0,1], x i [-1,1]
    //   spinAxis        atan2(axis.z, hypot(x, y))
    //   studioGeometry  atan2(vertical, hypot(..)) og atan2(perp, parallel)
    for (let i = 0; i < 40000; i++) out.push([rnd(), rnd() * 2 - 1]);
    for (let i = 0; i < 20000; i++) out.push([(rnd() - 0.5) * 1e-8, rnd()]);
    for (let i = 0; i < 40000; i++) out.push([(rnd() - 0.5) * 20, (rnd() - 0.5) * 20]);
    for (let i = 0; i < 20000; i++) out.push([(rnd() - 0.5) * 1e20, (rnd() - 0.5) * 1e-20]);
    for (let i = 0; i < 10000; i++) out.push([(rnd() - 0.5) * 4, 1.0]);
    // Kanter: alle fortegnskombinasjoner av null og endelige.
    for (const y of [0, -0, 1, -1, 1e300, -1e300]) {
      for (const x of [0, -0, 1, -1, 1e-300, -1e-300, 1e300, -1e300]) out.push([y, x]);
    }
    return out;
  },
};

/** asin og acos deler domene [-1, 1] og samme rasjonale approksimasjon. */
function arcValues(seed) {
  const rnd = makeRnd(seed);
  const out = [
    // Studios faktiske domene: asin(clamp(..., -0.999, 0.999)), spec §8.3.
    ...uniform(rnd, -0.999, 0.999, 40000),
    ...uniform(rnd, -0.5, 0.5, 30000),
    ...uniform(rnd, 0.5, 0.975, 20000),
    ...uniform(rnd, -0.975, -0.5, 20000),
    ...uniform(rnd, 0.975, 0.99999, 20000),
    ...uniform(rnd, -0.99999, -0.975, 20000),
    ...uniform(rnd, -1e-9, 1e-9, 10000),
    ...uniform(rnd, -1e-18, 1e-18, 10000),
    ...fractions(-1, 1, 1024),
  ];
  for (const c of [0.5, 0.975, 0.999, 1.0, 0]) {
    out.push(...ulpNeighbourhood(c, 400), ...ulpNeighbourhood(-c, 400));
  }
  // Utenfor domenet gir NaN; de testes separat i Swift, ikke i tabellen.
  return out.filter(v => Math.abs(v) <= 1);
}

FUNCTIONS.asin = { fn: Math.asin, arity: 1, values: () => arcValues(0xa514ac) };
FUNCTIONS.acos = { fn: Math.acos, arity: 1, values: () => arcValues(0xa514ac) };

/** pow er toargument. Motoren bruker den KUN som pow(max(0, S), 0.4). */
FUNCTIONS.pow = {
  fn: Math.pow,
  arity: 2,
  values() {
    const rnd = makeRnd(0x9011);
    const out = [];
    // rk4Integrator: Math.pow(Math.max(0, spinParameter), liftCoefficientExponent)
    // spinParameter er observert i [0.09, 0.20] iflg. aerodynamicDiagnostics,
    // men kan i prinsippet ga fra 0 og oppover. Eksponenten er alltid 0.4.
    for (let i = 0; i < 60000; i++) out.push([rnd() * 0.5, 0.4]);
    for (let i = 0; i < 30000; i++) out.push([0.08 + rnd() * 0.14, 0.4]);
    for (let i = 0; i < 20000; i++) out.push([rnd() * 5, 0.4]);
    for (let i = 0; i < 10000; i++) out.push([rnd() * 1e-6, 0.4]);
    for (let i = 0; i <= 2000; i++) out.push([i / 2000, 0.4]);
    // Kanter i den faktiske bruken.
    for (const b of [0, 1, 0.5, 1e-300, 1e300]) out.push([b, 0.4]);
    // Bredere, i tilfelle eksponenten endrer seg senere.
    for (let i = 0; i < 20000; i++) out.push([rnd() * 10, rnd() * 4 - 2]);
    return out;
  },
};

FUNCTIONS.tan = {
  fn: Math.tan,
  arity: 1,
  values() {
    const rnd = makeRnd(0x7a4a4);
    const D2R = Math.PI / 180;
    const out = [
      // Adapterens faktiske bruk.
      ...uniform(rnd, -5 * D2R, 65 * D2R, 40000),
      ...uniform(rnd, 0.1, 0.4, 20000),
      // Grenene.
      ...uniform(rnd, -Math.PI / 4, Math.PI / 4, 30000),
      ...uniform(rnd, 0.6744, 0.7944, 20000),
      ...uniform(rnd, -0.7944, -0.6744, 20000),
      ...uniform(rnd, Math.PI / 4, 3 * Math.PI / 4, 20000),
      ...uniform(rnd, -3 * Math.PI / 4, -Math.PI / 4, 20000),
      ...uniform(rnd, -1000, 1000, 20000),
      ...uniform(rnd, -1e-9, 1e-9, 10000),
      ...integers(-1000, 1000),
    ];
    for (const c of [0.6744, Math.PI / 4, Math.PI / 2, Math.PI, 0]) {
      out.push(...ulpNeighbourhood(c, 400), ...ulpNeighbourhood(-c, 400));
    }
    return out;
  },
};

/* ── Skriving ────────────────────────────────────────────────────────────── */

function writeBinaryTable(name) {
  const spec = FUNCTIONS[name];
  const pairs = spec.values();
  const buffer = Buffer.alloc(pairs.length * 24);
  let offset = 0;
  for (const [a, b] of pairs) {
    const r = spec.fn(a, b);
    buffer.writeBigUInt64LE(bitsOf(a), offset); offset += 8;
    buffer.writeBigUInt64LE(bitsOf(b), offset); offset += 8;
    buffer.writeBigUInt64LE(bitsOf(r), offset); offset += 8;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  const file = join(OUT_DIR, `${name}.bin`);
  writeFileSync(file, buffer);
  console.log(
    `${name.padEnd(8)} ${String(pairs.length).padStart(8)} tripler  `
    + `${(buffer.length / 1024).toFixed(0)} KB  -> ${file}`,
  );
}

function writeTable(name) {
  const spec = FUNCTIONS[name];
  if (!spec) throw new Error(`Ukjent funksjon: ${name}`);
  if (spec.arity === 2) return writeBinaryTable(name);

  // Dedupliser pa bitmonster, ikke pa verdi: -0 og +0 er ulike input.
  const seen = new Set();
  const inputs = [];
  for (const v of spec.values()) {
    if (!Number.isFinite(v)) continue;   // ikke-endelige testes separat i Swift
    const key = bitsOf(v).toString();
    if (seen.has(key)) continue;
    seen.add(key);
    inputs.push(v);
  }

  const buffer = Buffer.alloc(inputs.length * 16);
  let offset = 0;
  for (const x of inputs) {
    const y = spec.fn(x);
    buffer.writeBigUInt64LE(bitsOf(x), offset); offset += 8;
    buffer.writeBigUInt64LE(bitsOf(y), offset); offset += 8;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const file = join(OUT_DIR, `${name}.bin`);
  writeFileSync(file, buffer);

  console.log(
    `${name.padEnd(8)} ${String(inputs.length).padStart(8)} par  `
    + `${(buffer.length / 1024).toFixed(0)} KB  -> ${file}`,
  );
}

const bitsBuf = new ArrayBuffer(8);
const bitsF64 = new Float64Array(bitsBuf);
const bitsU64 = new BigUint64Array(bitsBuf);
function bitsOf(x) { bitsF64[0] = x; return bitsU64[0]; }

const requested = process.argv.slice(2);
const names = requested.length ? requested : Object.keys(FUNCTIONS);
console.log(`node ${process.version}`);
for (const name of names) writeTable(name);
