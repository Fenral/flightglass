/**
 * Integritetstest for Connections-grafen.
 *
 * D44: grafen er rent generell og motoruavhengig. Da er strukturen alt den har —
 * og strukturen må derfor være etterprøvbar. En graf som bare måles mot seg selv
 * kan bære en feilpekende kant i årevis, slik e30 gjorde.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const g = JSON.parse(
  readFileSync(new URL('../../connections-graph-v2.json', import.meta.url)),
);

const LAYER_ORDER = ['geometry', 'delivery', 'separation', 'flight', 'landing'];
const nodeById = new Map(g.nodes.map((n) => [n.id, n]));

test('hver kant peker paa noder som finnes', () => {
  for (const e of g.edges) {
    assert.ok(nodeById.has(e.from), `${e.id}: ukjent from-node ${e.from}`);
    assert.ok(nodeById.has(e.to), `${e.id}: ukjent to-node ${e.to}`);
  }
});

test('kanter gaar aldri bakover i lagrekkefoelgen', () => {
  for (const e of g.edges) {
    const a = LAYER_ORDER.indexOf(nodeById.get(e.from).layer);
    const b = LAYER_ORDER.indexOf(nodeById.get(e.to).layer);
    assert.ok(a <= b,
      `${e.id}: ${e.from} (${LAYER_ORDER[a]}) -> ${e.to} (${LAYER_ORDER[b]}) gaar bakover`);
  }
});

test('ingen node er foreldreloes — alt henger sammen', () => {
  const touched = new Set();
  for (const e of g.edges) { touched.add(e.from); touched.add(e.to); }
  const orphans = g.nodes.filter((n) => !touched.has(n.id)).map((n) => n.id);
  assert.deepEqual(orphans, [], `noder uten kanter: ${orphans.join(', ')}`);
});

test('kant-id-er er unike', () => {
  const ids = g.edges.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, 'duplikate kant-id-er');
});

test('e30 peker paa den VERTIKALE spin loften, ikke 3-D', () => {
  const e30 = g.edges.find((e) => e.id === 'e30');
  assert.equal(e30.from, 'verticalspinloft',
    'e30 er tilbake paa 3-D-noden — landingsmodellen leser abs(signedVerticalSpinLoftDeg)');
  assert.equal(e30.to, 'landingangle');
});

test('de to spin loft-nodene er skilt og forklarer forskjellen', () => {
  const three = nodeById.get('spinloft');
  const vert = nodeById.get('verticalspinloft');
  assert.ok(three && vert, 'begge spin loft-noder maa finnes');
  assert.match(three.displayName, /3-D/);
  assert.match(vert.explanation, /different quantity|blind/i,
    'den vertikale maa forklare at den er en ANNEN stoerrelse, ikke en forenkling');
});

test('gjelden er lukket med spor, ikke bare slettet', () => {
  assert.deepEqual(g._knownDebt, [], 'gjeld gjenstaar');
  assert.ok(Array.isArray(g._changeLog) && g._changeLog.length > 0,
    'gjeld fjernet uten changeLog — sporet mangler');
  assert.match(g._changeLog[0].change, /e30/);
  assert.ok(g._changeLog[0].note, 'avviket mot dagens kode maa staa eksplisitt');
});

test('hver node har lag, visningsnavn og forklaring', () => {
  for (const n of g.nodes) {
    assert.ok(LAYER_ORDER.includes(n.layer), `${n.id}: ukjent lag ${n.layer}`);
    assert.ok(n.displayName, `${n.id}: mangler displayName`);
    assert.ok(n.explanation, `${n.id}: mangler explanation`);
  }
});
