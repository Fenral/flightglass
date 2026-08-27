/*
 * connections.js — Connections-modulen.
 *
 * Motoruavhengig (D44): alt her er ren grafstruktur fra graph-data.js.
 * Ingen tall, ingen deriverte, ingen fysikk — kartet eier struktur,
 * Ball Flight eier størrelse.
 *
 * Tilstandsmodellen:
 *   metric   — valgt metrikk (null = hviletilstand = velgeren, D68)
 *   focus    — fokusert node (kortet nederst); roten fokuseres ved valg
 *   expanded — input-noder med Studio-geometri utvidet (D69: progressivt)
 */
import GRAPH from './graph-data.js';

/* ── Grafoppslag ─────────────────────────────────────────────────────── */

const nodesById = new Map(GRAPH.nodes.map((n) => [n.id, n]));
const layerById = new Map(GRAPH.layers.map((l) => [l.id, l]));
const inEdges = new Map();
const outEdges = new Map();
for (const n of GRAPH.nodes) { inEdges.set(n.id, []); outEdges.set(n.id, []); }
for (const e of GRAPH.edges) { inEdges.get(e.to).push(e); outEdges.get(e.from).push(e); }

/* De fem leveringsinputene — kjedens terminus (D69). */
const INPUTS = new Set(['face', 'path', 'attack', 'loft', 'speed']);
/* Metrikkvelgeren tilbyr de deriverte lagene. */
const METRIC_LAYERS = ['separation', 'flight', 'landing'];

const layerOf = (id) => nodesById.get(id).layer;
const nameOf = (id) => nodesById.get(id).displayName;
const isMetric = (id) => METRIC_LAYERS.includes(layerOf(id));

/* ── Ordvalg (eneste stedet begrepene blir brukertekst) ──────────────── */

const STRENGTH_WORD = {
  primary: 'primary',
  contributing: 'contributing',
  contextual: 'contextual',
  variable: 'variable',
};
const edgeNote = (e) => {
  const parts = [STRENGTH_WORD[e.strength]];
  if (e.type === 'modeled') parts.push('modelled');
  if (e.type === 'coupled') parts.splice(0, parts.length, 'coupled', 'varies');
  if (e.condition === 'low-launch-only') parts.push('low launch only');
  return parts.join(' · ');
};

/* Styrke = tykkelse + luminans (D10), i mockens tre-styrke-grammatikk:
   full / 55 % / 30 % (DESIGN.md v3 bruker samme trinn for hårlinjer).
   Tekstbæreren er nodekortets liste. Type = mønster: heltrukket direct,
   stiplet modelled, prikket coupled. */
const STROKE = {
  primary:      { w: 2.5, c: 'var(--muted)', o: 1 },
  contributing: { w: 1.5, c: 'var(--muted)', o: 0.55 },
  contextual:   { w: 1.0, c: 'var(--muted)', o: 0.3 },
  variable:     { w: 1.5, c: 'var(--muted)', o: 0.55 },
};
const DASH = { direct: null, modeled: '5 5', coupled: '2 4' };

/* ── Kjeden: bakover fra metrikk til de fem inputene (D43 + D69) ─────── */

function chainFor(metricId) {
  const nodes = new Set([metricId]);
  const edges = [];
  const queue = [metricId];
  while (queue.length) {
    const id = queue.shift();
    if (INPUTS.has(id)) continue; // terminus — Geometry nås kun progressivt
    for (const e of inEdges.get(id)) {
      if (layerOf(e.from) === 'geometry') continue;
      edges.push(e);
      if (!nodes.has(e.from)) { nodes.add(e.from); queue.push(e.from); }
    }
  }
  return { nodes, edges };
}

/* Geometrilukningen for én input: alle geometry-forfedre + kantene.
   Den koblede kanten (e4, path→attack) håndteres som eget bånd. */
function geometryFor(inputId) {
  const nodes = new Set();
  const edges = [];
  const queue = [inputId];
  while (queue.length) {
    const id = queue.shift();
    for (const e of inEdges.get(id)) {
      if (layerOf(e.from) !== 'geometry') continue;
      edges.push(e);
      if (!nodes.has(e.from)) { nodes.add(e.from); queue.push(e.from); }
    }
  }
  return { nodes, edges };
}

/* Radtildeling: lengste vei fra roten (ikke-input), inputs i eget bånd
   nederst, geometri under der igjen. Årsak ligger alltid under virkning. */
function buildRows(metricId, expanded) {
  const chain = chainFor(metricId);
  const chainNodes = [...chain.nodes];
  const nonInput = chainNodes.filter((id) => !INPUTS.has(id));
  const inputRow = chainNodes.filter((id) => INPUTS.has(id));

  const depth = new Map(nonInput.map((id) => [id, 0]));
  for (let i = 0; i < nonInput.length; i++) {
    let changed = false;
    for (const e of chain.edges) {
      if (!depth.has(e.from) || !depth.has(e.to)) continue;
      const d = depth.get(e.to) + 1;
      if (d > depth.get(e.from)) { depth.set(e.from, d); changed = true; }
    }
    if (!changed) break;
  }
  const maxDepth = Math.max(...depth.values());
  const rows = [];
  for (let d = 0; d <= maxDepth; d++) {
    rows.push({ ids: nonInput.filter((id) => depth.get(id) === d), label: null });
  }
  rows.push({ ids: inputRow, label: 'Ball flight inputs' });

  /* Geometri (progressiv, D69) */
  const geoNodes = new Set();
  const geoEdges = [];
  const seenGeoEdge = new Set();
  for (const inp of expanded) {
    if (!inputRow.includes(inp)) continue;
    const g = geometryFor(inp);
    for (const id of g.nodes) geoNodes.add(id);
    for (const e of g.edges) {
      if (!seenGeoEdge.has(e.id)) { seenGeoEdge.add(e.id); geoEdges.push(e); }
    }
  }
  if (geoNodes.size) {
    const gd = new Map([...geoNodes].map((id) => [id, 1]));
    for (let i = 0; i < geoNodes.size; i++) {
      let changed = false;
      for (const e of geoEdges) {
        if (!gd.has(e.from) || !gd.has(e.to)) continue;
        const d = gd.get(e.to) + 1;
        if (d > gd.get(e.from)) { gd.set(e.from, d); changed = true; }
      }
      if (!changed) break;
    }
    const gMax = Math.max(...gd.values());
    for (let d = 1; d <= gMax; d++) {
      rows.push({
        ids: [...geoNodes].filter((id) => gd.get(id) === d),
        label: d === 1 ? 'Studio geometry' : null,
      });
    }
  }

  /* Barysenter-ordning: plasser hver rad etter snittposisjonen til
     virkningene den mater, så kantene krysser minst mulig. */
  const pos = new Map();
  rows.forEach((row, r) => {
    if (r > 0) {
      const allEdges = [...chain.edges, ...geoEdges];
      row.ids.sort((a, b) => bary(a, allEdges, pos) - bary(b, allEdges, pos));
    }
    row.ids.forEach((id, i) => pos.set(id, i - (row.ids.length - 1) / 2));
  });

  const edges = [...chain.edges, ...geoEdges];
  /* Den koblede kanten: vises når attack eller path er utvidet og begge
     brikkene finnes — den binder søsknene, ikke én av dem. */
  const visible = new Set(rows.flatMap((r) => r.ids));
  const tie = (expanded.has('attack') || expanded.has('path')) &&
              visible.has('attack') && visible.has('path')
    ? GRAPH.edges.find((e) => e.type === 'coupled')
    : null;

  return { rows, edges, tie, chainNodes: visible };
}

function bary(id, edges, pos) {
  const xs = edges.filter((e) => e.from === id && pos.has(e.to)).map((e) => pos.get(e.to));
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

/* ── Tilstand ────────────────────────────────────────────────────────── */

const state = { metric: null, focus: null, expanded: new Set() };

/* ── DOM ─────────────────────────────────────────────────────────────── */

const $ = (id) => document.getElementById(id);
const viewSelector = $('view-selector');
const viewChain = $('view-chain');
const metricGroups = $('metric-groups');
const metricPill = $('metric-pill');
const rowsEl = $('rows');
const svgEl = $('edge-svg');
const keyEl = $('edge-key');
const cardEl = $('node-card');

const SVG_NS = 'http://www.w3.org/2000/svg';

/* ── Velgeren (hviletilstanden, D68) ─────────────────────────────────── */

function buildSelector() {
  metricGroups.textContent = '';
  for (const layerId of METRIC_LAYERS) {
    const layer = layerById.get(layerId);
    const label = document.createElement('span');
    label.className = 't-label cx-group-label';
    label.textContent = layer.displayName;
    metricGroups.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'cx-metric-grid';
    for (const id of layer.nodeIds) {
      const btn = document.createElement('button');
      btn.className = 'cx-metric t-label';
      btn.textContent = nameOf(id);
      btn.addEventListener('click', () => selectMetric(id));
      grid.appendChild(btn);
    }
    metricGroups.appendChild(grid);
  }
}

/* ── Visningsbytte ───────────────────────────────────────────────────── */

function showView(el) {
  for (const v of [viewSelector, viewChain]) v.hidden = v !== el;
}

function selectMetric(id) {
  state.metric = id;
  state.focus = id; // roten starter fokusert — kortet lærer mekanikken
  state.expanded = new Set();
  history.replaceState(null, '', '#' + id); // replace: ingen stack (NAVIGASJON)
  renderChain();
  showView(viewChain);
}

function showSelector() {
  state.metric = null;
  state.focus = null;
  state.expanded = new Set();
  history.replaceState(null, '', location.pathname + location.search);
  showView(viewSelector);
}

/* ── Kjedevisningen ──────────────────────────────────────────────────── */

let current = null; // {rows, edges, tie, chainNodes}
const chipById = new Map();
const pathsByEdge = new Map();

function renderChain() {
  const metric = state.metric;
  metricPill.textContent = nameOf(metric);
  metricPill.setAttribute('aria-label', nameOf(metric) + ' — change metric');

  current = buildRows(metric, state.expanded);
  chipById.clear();
  rowsEl.textContent = '';

  for (const row of current.rows) {
    const wrap = document.createElement('div');
    wrap.className = row.label ? 'cx-band' : 'cx-row';
    if (row.label) {
      const lb = document.createElement('span');
      lb.className = 't-label cx-band-label';
      lb.textContent = row.label;
      wrap.appendChild(lb);
    }
    const rowEl = row.label ? document.createElement('div') : wrap;
    if (row.label) { rowEl.className = 'cx-row'; wrap.appendChild(rowEl); }

    for (const id of row.ids) {
      const chip = document.createElement('button');
      chip.className = 'cx-chip t-label';
      chip.textContent = nameOf(id);
      chip.setAttribute('aria-label', chipAria(id));
      chip.addEventListener('click', () => focusNode(id));
      chipById.set(id, chip);
      rowEl.appendChild(chip);
    }
    rowsEl.appendChild(wrap);
  }

  buildKey();
  renderCard(); // tegner også kantene (synkront — layout er klar her)
}

/* Tekstalternativet til diagrammet (akseptansekriterium 9). */
function chipAria(id) {
  const causes = inEdges.get(id)
    .filter((e) => e.type !== 'coupled')
    .map((e) => `${nameOf(e.from)} (${edgeNote(e)})`);
  if (INPUTS.has(id) && causes.length === 0) {
    return `${nameOf(id)} — a free input, set directly in Ball Flight`;
  }
  if (causes.length === 0) return nameOf(id);
  return `${nameOf(id)} — shaped by ${causes.join(', ')}`;
}

/* ── Kantene ─────────────────────────────────────────────────────────── */

function drawEdges() {
  const dia = $('diagram');
  const diaRect = dia.getBoundingClientRect();
  svgEl.setAttribute('viewBox', `0 0 ${dia.clientWidth} ${dia.clientHeight}`);
  svgEl.textContent = '';
  pathsByEdge.clear();

  const center = (id) => {
    const r = chipById.get(id).getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - diaRect.left,
      top: r.top - diaRect.top,
      bottom: r.bottom - diaRect.top,
    };
  };

  for (const e of current.edges) {
    if (!chipById.has(e.from) || !chipById.has(e.to)) continue;
    const from = center(e.from); // årsak — nederst
    const to = center(e.to);     // virkning — øverst
    const gap = from.top - to.bottom;
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d',
      `M ${from.x} ${from.top} C ${from.x} ${from.top - gap * 0.45}, ` +
      `${to.x} ${to.bottom + gap * 0.45}, ${to.x} ${to.bottom}`);
    styleEdge(p, e);
    svgEl.appendChild(p);
    pathsByEdge.set(e.id, p);
  }

  /* Den koblede kanten: prikket bue under input-brikkene + ordet.
     To retningsløse endepunkter — søsken, ikke årsak. */
  if (current.tie && chipById.has('attack') && chipById.has('path')) {
    const a = center('attack');
    const b = center('path');
    const y = Math.max(a.bottom, b.bottom);
    const drop = 16;
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d',
      `M ${a.x} ${a.bottom} C ${a.x} ${y + drop}, ${b.x} ${y + drop}, ${b.x} ${b.bottom}`);
    styleEdge(p, current.tie);
    svgEl.appendChild(p);
    pathsByEdge.set(current.tie.id, p);

    const t = document.createElementNS(SVG_NS, 'text');
    t.setAttribute('x', (a.x + b.x) / 2);
    t.setAttribute('y', y + drop + 4);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('class', 'cx-tie-label');
    t.textContent = 'COUPLED';
    svgEl.appendChild(t);
  }

  highlightFocus();
}

function styleEdge(p, e) {
  const s = STROKE[e.strength];
  p.setAttribute('class', 'cx-edge');
  p.setAttribute('fill', 'none');
  p.style.stroke = s.c;
  p.setAttribute('stroke-width', s.w);
  p.setAttribute('stroke-opacity', s.o);
  if (DASH[e.type]) p.setAttribute('stroke-dasharray', DASH[e.type]);
}

function highlightFocus() {
  for (const [edgeId, p] of pathsByEdge) {
    const e = GRAPH.edges.find((x) => x.id === edgeId);
    const hot = state.focus && (e.from === state.focus || e.to === state.focus);
    p.classList.toggle('is-hot', Boolean(hot));
  }
  for (const [id, chip] of chipById) {
    chip.classList.toggle('is-focused', id === state.focus);
  }
}

/* Nøkkelinjen — hele den synlige typelegenden: to ord. */
function buildKey() {
  keyEl.textContent = '';
  const item = (dash, word) => {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', 24); svg.setAttribute('height', 4);
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', 0); line.setAttribute('y1', 2);
    line.setAttribute('x2', 24); line.setAttribute('y2', 2);
    line.style.stroke = 'var(--muted)';
    line.setAttribute('stroke-width', 2);
    if (dash) line.setAttribute('stroke-dasharray', dash);
    svg.appendChild(line);
    const span = document.createElement('span');
    span.append(svg, ' ' + word);
    span.style.display = 'inline-flex';
    span.style.alignItems = 'center';
    span.style.gap = '6px';
    return span;
  };
  keyEl.append(item(null, 'Direct'), item('5 5', 'Modelled'));
}

/* ── Fokus og nodekortet ─────────────────────────────────────────────── */

function focusNode(id) {
  state.focus = state.focus === id ? null : id;
  renderCard();
  highlightFocus();
}

function renderCard() {
  const id = state.focus;
  if (!id) {
    cardEl.hidden = true;
    drawEdges2();
    return;
  }
  const node = nodesById.get(id);
  cardEl.hidden = false;
  cardEl.textContent = '';

  const head = el('div', 'cx-card-head');
  head.append(el('span', 't-display-lens cx-card-name', node.displayName));
  const close = el('button', 't-label cx-card-close', 'CLOSE');
  close.addEventListener('click', () => focusNode(id));
  head.append(close);
  cardEl.append(head);

  cardEl.append(el('span', 't-label cx-card-role', node.role));
  cardEl.append(el('p', 't-body cx-card-expl', node.explanation));

  /* SHAPED BY — tekstbæreren for styrke og type (D10) */
  const causes = inEdges.get(id).filter((e) => e.type !== 'coupled');
  const coupled = inEdges.get(id).filter((e) => e.type === 'coupled');
  if (causes.length || coupled.length) {
    cardEl.append(el('span', 't-label cx-card-section', 'SHAPED BY'));
    const ul = el('ul', 'cx-cause-list t-caption');
    for (const e of [...causes, ...coupled]) {
      const li = document.createElement('li');
      li.append(el('span', '', nameOf(e.from)));
      li.append(el('span', 'cx-cause-note', edgeNote(e)));
      ul.append(li);
    }
    cardEl.append(ul);
  } else if (INPUTS.has(id)) {
    cardEl.append(el('p', 't-caption cx-card-free',
      'A free input — set directly in Ball Flight.'));
  }

  /* Forover finnes kun som tekstlinje (D69) — aldri som modus. */
  const shapes = outEdges.get(id).filter((e) => e.type !== 'coupled');
  if (shapes.length) {
    cardEl.append(el('p', 't-caption cx-card-shapes',
      'Shapes: ' + shapes.map((e) => nameOf(e.to)).join(', ')));
  }

  const actions = el('div', 'cx-card-actions');
  if (isMetric(id) && id !== state.metric) {
    const trace = el('button', 't-label cx-action', 'TRACE ' + node.displayName.toUpperCase());
    trace.addEventListener('click', () => selectMetric(id));
    actions.append(trace);
  }
  const hasGeometry = inEdges.get(id).some((e) => layerOf(e.from) === 'geometry');
  if (INPUTS.has(id) && hasGeometry) {
    const on = state.expanded.has(id);
    const geo = el('button', 't-label cx-action',
      (on ? 'HIDE' : 'SHOW') + ' STUDIO GEOMETRY');
    geo.addEventListener('click', () => {
      if (on) state.expanded.delete(id); else state.expanded.add(id);
      renderChain();
    });
    actions.append(geo);
  }
  if (actions.childElementCount) cardEl.append(actions);

  drawEdges2();
}

/* Kortets høyde endrer diagramflaten — tegn kantene på nytt etterpå. */
function drawEdges2() { if (state.metric) drawEdges(); }

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

/* ── Oppstart ────────────────────────────────────────────────────────── */

buildSelector();
metricPill.addEventListener('click', showSelector);

const initial = location.hash.slice(1);
if (initial && nodesById.has(initial) && isMetric(initial)) {
  selectMetric(initial);
} else {
  showView(viewSelector);
}

/* Manuell hash-redigering (uten reload). Appen selv bruker replaceState,
   så dette er kun robusthet — ingen stack oppstår. */
window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (id && nodesById.has(id) && isMetric(id)) {
    if (id !== state.metric) selectMetric(id);
  } else if (!id && state.metric) {
    showSelector();
  }
});

/* Reflow: brikkeposisjoner endres med vindu og fontlasting. */
window.addEventListener('resize', () => { if (state.metric) drawEdges(); });
if (document.fonts?.ready) {
  document.fonts.ready.then(() => { if (state.metric) drawEdges(); });
}

/* D56/D101 — navngitt inngrep fra stroem E. Steg 6 er et LESESTEG: det aapner
   kartet paa Curve med roten fokusert (C-f gjoer det allerede) og viser kjeden
   grafen faktisk tegner (D104). Onboardingen trenger derfor bare aa velge
   metrikk og lese ut hvor diagrammet slutter og nodekortet begynner. */
window.__connections = {
  state,
  selectMetric,
  showSelector,
};

import('../onboarding/onboarding.js').then(async (ob) => {
  if (ob.currentStep() == null) return;
  const { connectionsHost } = await import('../onboarding/host-connections.js');
  ob.mountOnboarding(connectionsHost(window.__connections));
});
