/**
 * ESM-bundler for artifact-bygget.
 *
 * Wrapper hver modul i sin egen IIFE og kobler importene gjennom et lite
 * register. Grunnen er målt, ikke prinsipiell: fem navn kolliderer på tvers av
 * modulene i kjeden — `clamp` og `lowPointShiftPerDegree` (studioContact mot
 * studioGeometry), `faceCentreOffsetMm` (studioContact mot contactModel),
 * `assertFinite` (tre adaptermoduler) og `magnitude` (displayStudio mot
 * format). Naiv sammenslåing ville latt siste definisjon vinne og gitt STILLE
 * feil tall.
 *
 * Ingen kode endres — kun import- og export-linjene oversettes.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname, relative, sep } from 'node:path';

const IMPORT_RE = /^import\s*\{([\s\S]*?)\}\s*from\s*'([^']+)';?[ \t]*$/gm;
const EXPORT_LIST_RE = /^export\s*\{([^}]*)\};?[ \t]*$/gm;
const EXPORT_DECL_RE = /^export\s+(const|let|function|class|async function)\s+/gm;
const EXPORT_NAME_RE = /^export\s+(?:const|let|function|class|async function)\s+([A-Za-z_$][\w$]*)/gm;
/* `export default X` / `export default {` → `const __default = …`, registrert
   som `default` i modulens returobjekt. Moduler UTEN default-eksport er helt
   uberørt, så eldre bygg gir bit-identisk resultat. */
const EXPORT_DEFAULT_RE = /^export\s+default\s+/gm;

/**
 * @param {string} root prosjektroten
 * @param {string[]} entries stier relativt roten
 * @returns {string} bundelen, som definerer `__M`
 */
export function bundle(root, entries) {
  const key = (f) => relative(root, f).split(sep).join('/');
  const seen = new Set();
  const order = [];

  const load = (file) => {
    const abs = resolve(file);
    if (seen.has(abs)) return;
    seen.add(abs);
    const src = readFileSync(abs, 'utf8');
    for (const m of src.matchAll(/from\s+'([^']+)'/g)) {
      if (m[1].startsWith('.')) load(resolve(dirname(abs), m[1]));
    }
    order.push({ abs, src });
  };
  for (const e of entries) load(resolve(root, e));

  const chunks = [];
  for (const { abs, src } of order) {
    const exported = new Set();
    let hasDefault = false;
    let body = src;

    /* import { a, b as c } from './x.js'  →  const { a, b: c } = __M['x']; */
    body = body.replace(IMPORT_RE, (_, names, spec) => {
      if (!spec.startsWith('.')) return '';
      const target = key(resolve(dirname(abs), spec));
      const binding = names.split(',').map((s) => s.trim()).filter(Boolean)
        .map((s) => {
          const as = s.split(/\s+as\s+/);
          return as.length === 2 ? `${as[0].trim()}: ${as[1].trim()}` : s;
        }).join(', ');
      return `const { ${binding} } = __M[${JSON.stringify(target)}];`;
    });

    /* export default … → const __default = … */
    body = body.replace(EXPORT_DEFAULT_RE, () => {
      hasDefault = true;
      return 'const __default = ';
    });

    /* export { A, B } → navnene registreres, linja fjernes */
    body = body.replace(EXPORT_LIST_RE, (_, names) => {
      names.split(',').map((s) => s.trim()).filter(Boolean).forEach((n) => exported.add(n));
      return '';
    });
    for (const m of src.matchAll(EXPORT_NAME_RE)) exported.add(m[1]);
    body = body.replace(EXPORT_DECL_RE, '$1 ');

    chunks.push(`/* ── ${key(abs)} ── */\n__M[${JSON.stringify(key(abs))}] = (() => {\n`
      + `${body}\nreturn { ${[...exported].join(', ')}${hasDefault ? (exported.size ? ', ' : '') + 'default: __default' : ''} };\n})();`);
  }

  return `/* Bundlet fra kilden av tools/artifact-build — ${order.length} moduler.\n`
    + `   Hver modul har eget scope; fem navn kolliderer på tvers. */\n`
    + `const __M = {};\n${chunks.join('\n\n')}\n`;
}
