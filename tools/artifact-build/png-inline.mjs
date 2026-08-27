/**
 * Minimal PNG-skalerer for artifact-bygget. Node har ingen bildebehandling
 * innebygd, og platene må ned i størrelse for at en selvforsynt side skal
 * være rimelig å laste på mobil.
 *
 * Dekker nøyaktig den klassen filene våre er: 8 bit, ikke-interlaced,
 * fargetype 2 (RGB) eller 6 (RGBA). Alt annet kaster — en skalerer som
 * gjetter på et format den ikke kjenner, lager stille feil.
 *
 * Nedskaleringen er arealmiddel (box filter), som er riktig for nedskalering:
 * hver målpiksel er gjennomsnittet av kildepikslene den dekker, så ingen
 * detalj forsvinner ved punktsampling. Alfa premultipliseres under snittet,
 * ellers blør gjennomsiktige piksler farge inn i kantene.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync, deflateSync } from 'node:zlib';

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/* ── CRC32, som PNG-spesifikasjonen definerer den ───────────────────────── */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

/* ── dekoding ───────────────────────────────────────────────────────────── */
function decode(file) {
  const b = readFileSync(file);
  if (!b.subarray(0, 8).equals(SIG)) throw new Error(`${file}: ikke en PNG`);
  const width = b.readUInt32BE(16), height = b.readUInt32BE(20);
  const depth = b[24], colourType = b[25], interlace = b[28];
  if (depth !== 8) throw new Error(`${file}: bitdybde ${depth} støttes ikke`);
  if (colourType !== 2 && colourType !== 6) throw new Error(`${file}: fargetype ${colourType} støttes ikke`);
  if (interlace !== 0) throw new Error(`${file}: interlaced støttes ikke`);

  const parts = [];
  let off = 8;
  while (off < b.length) {
    const len = b.readUInt32BE(off);
    const type = b.toString('ascii', off + 4, off + 8);
    if (type === 'IDAT') parts.push(b.subarray(off + 8, off + 8 + len));
    off += 12 + len;
    if (type === 'IEND') break;
  }
  const raw = inflateSync(Buffer.concat(parts));

  const ch = colourType === 6 ? 4 : 3;
  const stride = width * ch;
  const out = Buffer.alloc(height * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = out.subarray(y * stride, (y + 1) * stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0;
      const bb = prev[i];
      const c = i >= ch ? prev[i - ch] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += bb;
      else if (filter === 3) v += (a + bb) >> 1;
      else if (filter === 4) {
        const p = a + bb - c, pa = Math.abs(p - a), pb = Math.abs(p - bb), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? bb : c;
      } else if (filter !== 0) throw new Error(`${file}: ukjent filter ${filter} på rad ${y}`);
      cur[i] = v & 0xff;
    }
    prev = cur;
  }
  return { width, height, channels: ch, data: out };
}

/* ── nedskalering med arealmiddel ───────────────────────────────────────── */
function resize(img, tw, th) {
  const { width: sw, height: sh, channels: ch, data } = img;
  const out = Buffer.alloc(tw * th * ch);
  const alpha = ch === 4;
  for (let y = 0; y < th; y++) {
    const y0 = Math.floor((y * sh) / th), y1 = Math.max(y0 + 1, Math.floor(((y + 1) * sh) / th));
    for (let x = 0; x < tw; x++) {
      const x0 = Math.floor((x * sw) / tw), x1 = Math.max(x0 + 1, Math.floor(((x + 1) * sw) / tw));
      let r = 0, g = 0, bl = 0, a = 0, n = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * sw + sx) * ch;
          if (alpha) {
            const w = data[i + 3] / 255;      // premultiplisert snitt
            r += data[i] * w; g += data[i + 1] * w; bl += data[i + 2] * w; a += data[i + 3];
          } else { r += data[i]; g += data[i + 1]; bl += data[i + 2]; }
          n++;
        }
      }
      const o = (y * tw + x) * ch;
      if (alpha) {
        const am = a / n, wsum = am / 255 * n || 1;
        out[o] = Math.round(r / wsum); out[o + 1] = Math.round(g / wsum);
        out[o + 2] = Math.round(bl / wsum); out[o + 3] = Math.round(am);
      } else {
        out[o] = Math.round(r / n); out[o + 1] = Math.round(g / n); out[o + 2] = Math.round(bl / n);
      }
    }
  }
  return { width: tw, height: th, channels: ch, data: out };
}

/* ── koding, med filtervalg per rad ─────────────────────────────────────── */
function encode(img) {
  const { width, height, channels: ch, data } = img;
  const stride = width * ch;
  const raw = Buffer.alloc(height * (stride + 1));
  const cand = Buffer.alloc(stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const cur = data.subarray(y * stride, (y + 1) * stride);
    let bestF = 0, bestScore = Infinity, best = null;
    for (let f = 0; f <= 4; f++) {
      let score = 0;
      for (let i = 0; i < stride; i++) {
        const a = i >= ch ? cur[i - ch] : 0, bb = prev[i], c = i >= ch ? prev[i - ch] : 0;
        let v;
        if (f === 0) v = cur[i];
        else if (f === 1) v = cur[i] - a;
        else if (f === 2) v = cur[i] - bb;
        else if (f === 3) v = cur[i] - ((a + bb) >> 1);
        else {
          const p = a + bb - c, pa = Math.abs(p - a), pb = Math.abs(p - bb), pc = Math.abs(p - c);
          v = cur[i] - (pa <= pb && pa <= pc ? a : pb <= pc ? bb : c);
        }
        cand[i] = v & 0xff;
        score += cand[i] < 128 ? cand[i] : 256 - cand[i];   // minste-sum-heuristikken
      }
      if (score < bestScore) { bestScore = score; bestF = f; best = Buffer.from(cand); }
    }
    raw[y * (stride + 1)] = bestF;
    best.copy(raw, y * (stride + 1) + 1);
    prev = cur;
  }

  const chunk = (type, body) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(body.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), body]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = ch === 4 ? 6 : 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([SIG, chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/* ── API ────────────────────────────────────────────────────────────────── */

/** Hvor mye hver plate skal ned. Målt behov: største køllehode i matrisen er
 *  172 px, største ball 72 px, og turf spenner scenebredden (maks 910 px) —
 *  så 256 / 1024 gir god margin uten å bære full oppløsning. */
export const PLAN = Object.freeze([
  ['skyFace',    'sky-face.png',    1024],
  ['bgDtl',      'bg-dtl.png',      1024],
  ['turf',       'turf.png',        1024],
  ['ball',       'ball.png',         256],
  ['tee',        'tee.png',          256],
  ['ironHead',   'iron-head.png',    256],
  ['driverHead', 'driver-head.png',  256],
]);

/**
 * Skalerer platene og returnerer kildeteksten til en `ASSETS`-blokk med
 * data-URI-er.
 * @param {string} srcDir katalogen platene ligger i
 * @param {(s: string) => void} [log]
 * @returns {{source: string, before: number, after: number}}
 */
export function inlineAssets(srcDir, log = () => {}) {
  const entries = [];
  let before = 0, after = 0;
  for (const [key, file, maxDim] of PLAN) {
    const img = decode(`${srcDir}/${file}`);
    const srcBytes = readFileSync(`${srcDir}/${file}`).length;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const tw = Math.max(1, Math.round(img.width * scale));
    const th = Math.max(1, Math.round(img.height * scale));
    const png = encode(scale < 1 ? resize(img, tw, th) : img);
    before += srcBytes; after += png.length;
    log(`  ${key.padEnd(11)} ${img.width}×${img.height} → ${tw}×${th}  `
      + `${(srcBytes / 1024).toFixed(0)}KB → ${(png.length / 1024).toFixed(0)}KB`);
    entries.push(`  ${key}: 'data:image/png;base64,${png.toString('base64')}',`);
  }
  const NL = String.fromCharCode(10);
  return { source: 'const ASSETS = {' + NL + entries.join(NL) + NL + '};',
    before, after };
}
