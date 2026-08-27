#!/usr/bin/env node
/**
 * Bygger den selvforsynte artifact-versjonen av Studio-splittdemoen (D117).
 *
 *   node tools/artifact-build/build.mjs
 *
 * Kilden er `app/studio/split-demo.html` — den som kjører på dev-serveren.
 * Artifact-en skal være DEN SAMME sida, bare selvforsynt, så bygget gjør
 * nøyaktig tre inngrep:
 *
 *   1. `<link>` til tokens.css byttes med innholdet inlinet
 *   2. import-blokka byttes med modulbundelen + destrukturering fra `__M`
 *   3. ASSETS-stiene byttes med nedskalerte data-URI-er
 *
 * Artifact-verten eier `<!doctype>`, `<html>`, `<head>` og `<body>`, så de
 * strippes. Resultatet legges i `_artifacts/`, ALDRI i `app/` (D117): en
 * artifact inliner motoren med vilje, og fysikklinten skal aldri se den.
 *
 * Bygget stopper hvis differensialtesten mot den ekte motoren finner ett
 * eneste avvik, eller hvis det ligger igjen en referanse til noe annet enn
 * Google Fonts.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { bundle } from './bundle.mjs';
import { inlineAssets } from './png-inline.mjs';
import { verifyBundle } from './verify.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url)).replace(/[\\/]$/, '');
const SRC = `${ROOT}/app/studio/split-demo.html`;
const OUT = `${ROOT}/_artifacts/studio-split-demo.html`;

const ENTRIES = [
  'adapter/src/studioShape.js',
  'adapter/src/displayStudio.js',
  'adapter/src/format.js',
  'engine/src/studioSolve.js',
  'engine/src/contactModel.js',
];

const DESTRUCTURE = `
/* Modulene over har hvert sitt scope; fem navn kolliderer på tvers, så naiv
   sammenslåing ville gitt stille feil tall. Bundelen differensialtestes mot
   den ekte motoren ved hvert bygg — se tools/artifact-build/verify.mjs. */
const { studioSolve } = __M['engine/src/studioSolve.js'];
const { CLUB_GEOMETRY, LIE_PRESETS } = __M['engine/src/contactModel.js'];
const { faceOnArcPoints, arcWorldPoint, tangentWorld, planePoint, pinholeCamera, projectPoint }
  = __M['adapter/src/studioShape.js'];
const { formatLongitudinalCm, formatHeightCm, formatFaceOffsetMm, formatLieMm }
  = __M['adapter/src/displayStudio.js'];
const { formatAngle } = __M['adapter/src/format.js'];`;

const die = (msg) => { console.error(`\nBYGGET STOPPET: ${msg}`); process.exit(1); };

console.log('1/4  bundler motor + adapter');
const bundleSource = bundle(ROOT, ENTRIES);
console.log(`     ${(bundleSource.length / 1024).toFixed(0)} KB`);

console.log('2/4  differensialtest mot den ekte motoren');
const { cases, mismatches, first } = await verifyBundle(bundleSource, pathToFileURL(ROOT).href);
if (mismatches) die(`${mismatches} avvik av ${cases} caser — første: ${JSON.stringify(first)}`);
console.log(`     ${cases.toLocaleString('nb-NO')} caser · 0 avvik`);

console.log('3/4  skalerer og inliner materialplatene');
const { source: assetsSource, before, after } = inlineAssets(`${ROOT}/app/studio/assets`, console.log);
console.log(`     ${(before / 1024 / 1024).toFixed(2)} MB → ${(after / 1024 / 1024).toFixed(2)} MB`);

console.log('4/4  setter sammen sida');
let html = readFileSync(SRC, 'utf8');

/* skallet: artifact-verten eier det */
html = html.replace(/^[\s\S]*?<title>/, '<title>')
  .replace(/<\/head>\s*<body>/, '')
  .replace(/<\/body>\s*<\/html>\s*$/, '')
  /* kort, distinkt navn i galleriet — ikke en oppsummering */
  .replace(/<title>[^<]*<\/title>/, '<title>Studio-splitten</title>');

const swap = (re, replacement, what) => {
  if (!re.test(html)) die(`fant ikke ${what} i ${SRC} — er kilden endret?`);
  html = html.replace(re, replacement);
};

swap(/<link rel="stylesheet" href="\.\.\/tokens\.css">/,
  `<style>\n/* app/tokens.css, inlinet */\n${readFileSync(`${ROOT}/app/tokens.css`, 'utf8')}</style>`,
  'tokens.css-lenka');

swap(/import \{ studioSolve \}[\s\S]*?from '\.\.\/\.\.\/adapter\/src\/format\.js';/,
  bundleSource + DESTRUCTURE, 'import-blokka');

swap(/const ASSETS = \{[\s\S]*?\n\};/, assetsSource, 'ASSETS-blokka');

/* porten: ingenting utenfor sida, bortsett fra Google Fonts */
const external = [...html.matchAll(/(?:src|href)="(?!data:|#)([^"]+)"/g)].map((m) => m[1])
  .filter((u) => !/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(u));
if (external.length) die(`eksterne referanser igjen: ${external.join(', ')}`);
if (/\bimport\s|from\s+'\.\./.test(html)) die('relative moduler igjen');
if (/<!doctype|<html|<\/html>|<head>|<body>/i.test(html)) die('skall-tagger igjen');

mkdirSync(`${ROOT}/_artifacts`, { recursive: true });
writeFileSync(OUT, html);
const mb = Buffer.byteLength(html) / 1024 / 1024;
if (mb > 16) die(`${mb.toFixed(2)} MB overstiger artifact-taket på 16 MB`);
console.log(`\nFerdig: _artifacts/studio-split-demo.html — ${mb.toFixed(2)} MB`);
