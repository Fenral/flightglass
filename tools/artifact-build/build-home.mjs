#!/usr/bin/env node
/**
 * Bygger den selvforsynte artifact-versjonen av Home-mockene (D117).
 *
 *   node tools/artifact-build/build-home.mjs
 *
 * Kilden er `app/home/home-demo.html` — den som kjører på dev-serveren.
 * Artifact-en skal være DEN SAMME sida, bare selvforsynt, så bygget gjør
 * nøyaktig tre inngrep:
 *
 *   1. `<link>` til tokens.css byttes med innholdet inlinet
 *   2. import-blokka byttes med modulbundelen + destrukturering fra `__M`
 *   3. `fetch()` av ask-catalog.json byttes med katalogen inlinet
 *
 * Artifact-verten eier `<!doctype>`, `<html>`, `<head>` og `<body>`, så de
 * strippes. Resultatet legges i `_artifacts/`, ALDRI i `app/` (D117).
 *
 * Ingen materialplater å inline — Home-mocken tegner ingen scene, så
 * `png-inline.mjs` er ikke i bruk her. Til gjengjeld er graf- og
 * spørsmålsdataene ekte, og motorkjeden differensialtestes ved hvert bygg.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { bundle } from './bundle.mjs';
import { verifyHomeBundle } from './verify-home.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url)).replace(/[\\/]$/, '');
const SRC = `${ROOT}/app/home/home-demo.html`;
const OUT = `${ROOT}/_artifacts/home-demo.html`;

const ENTRIES = [
  'app/connections/graph-data.js',
  'app/ball-flight/impact-outcome.js',
  'adapter/src/displayFlight.js',
  'app/shared/sa-haptics.js',
];

/* graph-data.js og sa-haptics.js eksporterer default — støtten for det er ny i
   bundle.mjs, og verify-home.mjs sjekker eksplisitt at grafen kom hel gjennom. */
const DESTRUCTURE = `
/* Hver modul har eget scope; navn kolliderer på tvers av motor og adapter, så
   naiv sammenslåing ville gitt stille feil tall. Bundelen differensialtestes
   mot den ekte motoren ved hvert bygg — se tools/artifact-build/verify-home.mjs. */
const GRAPH = __M['app/connections/graph-data.js'].default;
const { selectOutcome, UNIT_SYSTEM } = __M['app/ball-flight/impact-outcome.js'];
const { displayValue } = __M['adapter/src/displayFlight.js'];
const haptics = __M['app/shared/sa-haptics.js'].default;`;

const die = (msg) => { console.error(`\nBYGGET STOPPET: ${msg}`); process.exit(1); };

console.log('1/4  bundler motor + adapter + graf');
const bundleSource = bundle(ROOT, ENTRIES);
console.log(`     ${(bundleSource.length / 1024).toFixed(0)} KB`);

console.log('2/4  differensialtest mot den ekte motoren');
const { cases, mismatches, first, graph } =
  await verifyHomeBundle(bundleSource, pathToFileURL(ROOT).href);
if (graph !== 'ok') die(`grafen kom ikke hel gjennom bundleren: ${graph}`);
if (mismatches) die(`${mismatches} avvik av ${cases} caser — første: ${JSON.stringify(first)}`);
console.log(`     ${cases.toLocaleString('nb-NO')} caser · 0 avvik · graf ok`);

console.log('3/4  inliner spørsmålskatalogen');
const catalog = readFileSync(`${ROOT}/motor/export/ask-catalog.json`, 'utf8');
console.log(`     ${(catalog.length / 1024).toFixed(0)} KB`);

console.log('4/4  setter sammen sida');
let html = readFileSync(SRC, 'utf8');

/* skallet: artifact-verten eier det */
html = html.replace(/^[\s\S]*?<title>/, '<title>')
  .replace(/<\/head>\s*<body>/, '')
  .replace(/<\/body>\s*<\/html>\s*$/, '')
  /* kort, distinkt navn i galleriet — ikke en oppsummering */
  .replace(/<title>[^<]*<\/title>/, '<title>Tre Home-mocks</title>');

const swap = (re, replacement, what) => {
  if (!re.test(html)) die(`fant ikke ${what} i ${SRC} — er kilden endret?`);
  html = html.replace(re, replacement);
};

swap(/<link rel="stylesheet" href="\.\.\/tokens\.css">/,
  `<style>\n/* app/tokens.css, inlinet */\n${readFileSync(`${ROOT}/app/tokens.css`, 'utf8')}</style>`,
  'tokens.css-lenka');

swap(/import GRAPH from[\s\S]*?from '\.\.\/shared\/sa-haptics\.js';/,
  bundleSource + DESTRUCTURE, 'import-blokka');

/* fetch() finnes ikke i en selvforsynt fil — katalogen legges inn som verdi */
swap(/let ASK = null;[\s\S]*?catch \(e\) \{[^}]*\}/,
  `/* motor/export/ask-catalog.json, inlinet av bygget */\nconst ASK = ${catalog};`,
  'ASK-fetch-blokka');

/* porten: ingenting utenfor sida, bortsett fra Google Fonts */
const external = [...html.matchAll(/(?:src|href)="(?!data:|#)([^"]+)"/g)].map((m) => m[1])
  .filter((u) => !/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(u));
if (external.length) die(`eksterne referanser igjen: ${external.join(', ')}`);

/* Kodeportene kjøres mot en KOPI uten kommentarer. Grunnen er målt: bundelen
   drar med seg `graph-data.js` sin egen kommentar «…der fetch() er blokkert»,
   og en rå tekstsøk-port stoppet bygget på prosa. Kopien brukes bare til å
   dømme — artifacten skrives med kommentarene i behold, som er riktig: de
   forklarer hvorfor koden ser ut som den gjør. */
const probe = html
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');   /* skåner https:// */

if (/\bimport\s|from\s+'\.\./.test(probe)) die('relative moduler igjen');
if (/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(probe)) {
  die('nettverkskall igjen — artifacten skal være selvforsynt');
}
if (/<!doctype|<html|<\/html>|<head>|<body>/i.test(html)) die('skall-tagger igjen');

mkdirSync(`${ROOT}/_artifacts`, { recursive: true });
writeFileSync(OUT, html);
const mb = Buffer.byteLength(html) / 1024 / 1024;
if (mb > 16) die(`${mb.toFixed(2)} MB overstiger artifact-taket på 16 MB`);
console.log(`\nFerdig: _artifacts/home-demo.html — ${mb.toFixed(2)} MB`);
