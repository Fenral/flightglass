const groups = Object.freeze([
  { id: 'geometry', label: 'Geometry', nodes: ['plane', 'direction', 'lowpoint', 'ballposition', 'archeight'] },
  { id: 'delivery', label: 'Delivery', nodes: ['attack', 'path', 'face', 'loft', 'speed', 'strike'] },
  { id: 'separation', label: 'Separation', nodes: ['spinloft', 'spinaxis', 'launchdir', 'launchangle', 'ballspeed'] },
  { id: 'flight', label: 'Flight', nodes: ['backspin', 'curve', 'apex', 'carry'] },
  { id: 'landing', label: 'Landing', nodes: ['landingangle', 'side', 'total'] },
]);

export const connectionsInfo = Object.freeze(Object.fromEntries(Object.entries({
  plane: { label: 'Swing Plane', role: 'Geometry input · Studio', note: 'The tilted surface that turns circular motion into delivery.' },
  direction: { label: 'Swing Direction', role: 'Geometry input · Studio', note: 'The direction the swing plane points through the target frame.' },
  lowpoint: { label: 'Low Point', role: 'Geometry input · Studio', note: 'Where the swing arc reaches its bottom relative to the ball.' },
  ballposition: { label: 'Ball Position', role: 'Geometry input · Studio', note: 'Places the ball earlier or later along the club’s arc.' },
  archeight: { label: 'Arc Height', role: 'Geometry input · Studio', note: 'Moves the arc vertically and changes where the club meets the ball.' },
  attack: { label: 'Attack Angle', role: 'Studio-derived · Range input', note: 'The clubhead’s vertical direction at impact.' },
  path: { label: 'Club Path', role: 'Studio-derived · Range input', note: 'The clubhead’s horizontal direction through impact.' },
  face: { label: 'Club Face', role: 'Range input · Delivery', note: 'Where the face points when the ball leaves the club.' },
  loft: { label: 'Dynamic Loft', role: 'Range input · Delivery', note: 'The loft delivered by the face at impact.' },
  speed: { label: 'Club Speed', role: 'Range input · Energy', note: 'The clubhead’s available energy before impact.' },
  strike: { label: 'Strike', role: 'Derived in Studio · Contact', note: 'Where and how cleanly the club meets the ball.' },
  spinloft: { label: 'Spin Loft', role: 'Derived · Separation', note: 'The gap between the club’s motion and delivered loft.' },
  spinaxis: { label: 'Spin Axis', role: 'Derived · Separation', note: 'The tilt created by the face and path relationship.' },
  launchdir: { label: 'Launch Direction', role: 'Derived · Separation', note: 'The ball’s starting direction immediately after impact.' },
  launchangle: { label: 'Launch Angle', role: 'Derived · Separation', note: 'The ball’s starting height direction after impact.' },
  ballspeed: { label: 'Ball Speed', role: 'Derived · Separation', note: 'The speed transferred to the ball at separation.' },
  backspin: { label: 'Backspin', role: 'Modeled · Flight', note: 'The spin that shapes lift, height and descent.' },
  curve: { label: 'Curve', role: 'Modeled · Flight', note: 'Sideways movement created during the airborne flight.' },
  apex: { label: 'Apex', role: 'Modeled · Flight', note: 'The highest point reached by the modeled flight.' },
  carry: { label: 'Carry', role: 'Modeled · Flight', note: 'The airborne distance to the modeled landing point.' },
  landingangle: { label: 'Landing Angle', role: 'Modeled · Landing', note: 'In this model, vertical Spin Loft is the primary descent input; treat that as modeled context.' },
  side: { label: 'Carry Side', role: 'Modeled · Landing', note: 'Where the ball finishes sideways at the carry point.' },
  total: { label: 'Total', role: 'Modeled · Landing', note: 'The modeled finish after carry and ground response.' },
}).map(([id, value]) => [id, Object.freeze(value)])));

const nodeColors = Object.freeze({
  plane: 'var(--q-plane)',
  direction: 'var(--q-path)',
  lowpoint: 'var(--q-attack)',
  ballposition: 'var(--q-ball)',
  attack: 'var(--q-attack)',
  path: 'var(--q-path)',
  face: 'var(--q-face)',
  loft: 'var(--q-loft)',
  strike: 'var(--q-strike)',
  launchangle: 'var(--q-launch)',
});

// Qualitative levels describe role prominence inside this model, not percentages.
// Coupled geometry is explicitly variable/unranked. Keeping all levels in edge
// metadata lets sensitivity data replace them later without changing the UI.
export const connectionsLinks = Object.freeze([
  ['ballposition', 'lowpoint', 'direct', 'primary'],
  ['lowpoint', 'attack', 'direct', 'primary'], ['direction', 'attack', 'direct', 'contributing'], ['plane', 'attack', 'direct', 'contextual'], ['path', 'attack', 'coupled', 'variable'],
  ['direction', 'path', 'direct', 'primary'], ['lowpoint', 'path', 'direct', 'contributing'], ['plane', 'path', 'direct', 'contextual'], ['lowpoint', 'strike', 'direct', 'primary'], ['archeight', 'strike', 'direct', 'contributing'],
  ['attack', 'spinloft', 'direct', 'primary'], ['loft', 'spinloft', 'direct', 'primary'], ['face', 'spinaxis', 'direct', 'primary'], ['path', 'spinaxis', 'direct', 'primary'], ['attack', 'spinaxis', 'direct', 'contextual'], ['loft', 'spinaxis', 'direct', 'contextual'],
  ['face', 'launchdir', 'direct', 'primary'], ['path', 'launchdir', 'direct', 'contributing'], ['loft', 'launchdir', 'direct', 'contextual'], ['attack', 'launchangle', 'direct', 'contributing'], ['loft', 'launchangle', 'direct', 'primary'],
  ['speed', 'ballspeed', 'direct', 'primary'], ['spinloft', 'ballspeed', 'direct', 'contributing'], ['spinloft', 'backspin', 'direct', 'primary'], ['speed', 'backspin', 'direct', 'contributing'],
  ['spinaxis', 'curve', 'modeled', 'primary'], ['launchangle', 'apex', 'modeled', 'primary'], ['ballspeed', 'apex', 'modeled', 'contributing'],
  ['launchangle', 'carry', 'modeled', 'contextual', 'low-launch-only'], ['ballspeed', 'carry', 'modeled', 'primary'],
  ['spinloft', 'landingangle', 'modeled', 'primary'], ['launchdir', 'side', 'modeled', 'primary'], ['curve', 'side', 'modeled', 'contributing'], ['carry', 'side', 'modeled', 'contextual'],
  ['carry', 'total', 'modeled', 'primary'], ['landingangle', 'total', 'modeled', 'contributing'],
].map(([from, to, kind, strength, condition], index) => Object.freeze({
  from,
  to,
  kind,
  strength,
  condition,
  id: `e${index}`,
})));

const attackBullets = Object.freeze({
  causes: Object.freeze([
    'Primary: Low Point places impact on the arc.',
    'Supports: Swing Direction shapes vertical delivery.',
    'Varies: Plane is contextual; Path stays coupled.',
  ]),
  effects: Object.freeze([
    'Primary: it changes the gap to delivered loft.',
    'Supports: it helps shape Launch Angle.',
    'Varies: Spin Axis depends on the wider delivery.',
  ]),
});

const strengthRank = Object.freeze({ variable: 0, contextual: 1, contributing: 2, primary: 3 });
const mountedRoots = new WeakMap();

function requireHook(root, name) {
  const element = root.querySelector(`[data-connections-${name}]`);
  if (!element) throw new Error(`Connections root is missing [data-connections-${name}]`);
  return element;
}

function normalizeMode(mode) {
  if (mode === 'causes' || mode === 'effects') return mode;
  throw new RangeError(`Unsupported Connections mode: ${mode}`);
}

export function mountConnectionsMap(root, {
  initialSelected = null,
  initialMode = 'causes',
  onSelectionChange = () => {},
} = {}) {
  if (!root || typeof root.querySelector !== 'function') {
    throw new TypeError('mountConnectionsMap requires a root element');
  }
  if (mountedRoots.has(root)) return mountedRoots.get(root);
  if (typeof onSelectionChange !== 'function') {
    throw new TypeError('onSelectionChange must be a function');
  }

  const documentRef = root.ownerDocument;
  const windowRef = documentRef.defaultView;
  const elements = {
    stage: requireHook(root, 'stage'),
    svg: requireHook(root, 'edges'),
    nodeHost: requireHook(root, 'nodes'),
    labelHost: requireHook(root, 'labels'),
    status: requireHook(root, 'status'),
    detail: requireHook(root, 'detail'),
    role: requireHook(root, 'role'),
    direction: requireHook(root, 'direction'),
    title: requireHook(root, 'title'),
    list: requireHook(root, 'list'),
    live: requireHook(root, 'live'),
    causes: requireHook(root, 'mode-causes'),
    effects: requireHook(root, 'mode-effects'),
    reset: requireHook(root, 'reset'),
  };

  let selected = initialSelected === null ? null : String(initialSelected);
  if (selected !== null && !connectionsInfo[selected]) {
    throw new RangeError(`Unknown Connections parameter: ${selected}`);
  }
  let mode = normalizeMode(initialMode);
  let routeEdges = new Set();
  let routeNodes = new Set();
  let routeNodeStrength = new Map();
  let liveTimer = 0;
  const nodeEls = new Map();

  elements.labelHost.replaceChildren();
  elements.nodeHost.replaceChildren();

  groups.forEach((group) => {
    const label = documentRef.createElement('div');
    label.className = 'layer-label';
    label.textContent = group.label;
    label.dataset.group = group.id;
    elements.labelHost.append(label);

    group.nodes.forEach((id) => {
      const button = documentRef.createElement('button');
      const text = documentRef.createElement('span');
      button.type = 'button';
      button.className = 'node sa-focus';
      button.dataset.id = id;
      button.dataset.group = group.id;
      button.style.setProperty('--node-color', nodeColors[id] || 'var(--secondary)');
      button.setAttribute('aria-label', `${connectionsInfo[id].label}, ${group.label}`);
      button.setAttribute('aria-pressed', 'false');
      text.textContent = connectionsInfo[id].label;
      button.append(text);
      button.addEventListener('click', () => select(id));
      elements.nodeHost.append(button);
      nodeEls.set(id, button);
    });
  });

  function point(id) {
    const element = nodeEls.get(id);
    return { x: element.offsetLeft, y: element.offsetTop };
  }

  function curve(a, b, offset = 0) {
    const deltaY = b.y - a.y;
    const bend = Math.max(18, Math.abs(deltaY) * 0.44);
    if (Math.abs(deltaY) < 8) {
      const lift = 20 + Math.abs(b.x - a.x) * 0.12;
      return `M ${a.x} ${a.y + offset} C ${a.x} ${a.y - lift + offset}, ${b.x} ${b.y - lift + offset}, ${b.x} ${b.y + offset}`;
    }
    return `M ${a.x + offset} ${a.y + 7} C ${a.x + offset} ${a.y + bend}, ${b.x + offset} ${b.y - bend}, ${b.x + offset} ${b.y - 7}`;
  }

  function addPath(link, className, pathData) {
    const path = documentRef.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('class', className);
    path.dataset.edge = link.id;
    path.dataset.strength = link.strength;
    elements.svg.append(path);
  }

  function drawEdges() {
    elements.svg.replaceChildren();
    connectionsLinks.forEach((link, index) => {
      const from = point(link.from);
      const to = point(link.to);
      const active = routeEdges.has(link.id);
      const faded = Boolean(selected) && !active;
      const strengthClass = `strength-${link.strength}`;
      if (link.kind === 'coupled') {
        addPath(link, `edge coupled ${strengthClass} ${active ? 'active' : ''} ${faded ? 'faded' : ''}`, curve(from, to, -1.7));
        addPath(link, `edge coupled ${strengthClass} ${active ? 'active' : ''} ${faded ? 'faded' : ''}`, curve(from, to, 1.7));
      } else {
        addPath(link, `edge ${link.kind} ${strengthClass} ${active ? 'active' : ''} ${faded ? 'faded' : ''}`, curve(from, to));
      }
      const ambient = !selected && index % 6 === 1;
      addPath(link, `signal ${link.kind} ${strengthClass} ${active ? 'active' : ''} ${ambient ? 'ambient' : ''}`, curve(from, to));
    });
  }

  function layout() {
    const width = elements.stage.clientWidth;
    const height = elements.stage.clientHeight;
    elements.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    elements.svg.setAttribute('width', width);
    elements.svg.setAttribute('height', height);
    const top = 24;
    const bottom = 25;
    const rowGap = (height - top - bottom) / (groups.length - 1);
    groups.forEach((group, groupIndex) => {
      const y = top + groupIndex * rowGap;
      const label = elements.labelHost.querySelector(`[data-group="${group.id}"]`);
      label.style.top = `${y}px`;
      const left = 76;
      const right = width - 30;
      const span = right - left;
      group.nodes.forEach((id, index) => {
        const count = group.nodes.length;
        const x = count === 1 ? left + span / 2 : left + (span * index / (count - 1));
        const element = nodeEls.get(id);
        const visualWidth = Math.max(44, Math.min(62, span / Math.max(count - 1, 1) - 2));
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        element.style.width = `${visualWidth}px`;
        element.style.setProperty('--label-w', `${Math.max(48, visualWidth + 7)}px`);
      });
    });
    drawEdges();
  }

  function connectionsFor(id, direction) {
    return connectionsLinks
      .filter((link) => (link.kind === 'coupled'
        ? link.from === id || link.to === id
        : direction === 'causes' ? link.to === id : link.from === id))
      .map((link) => ({
        link,
        next: link.kind === 'coupled'
          ? (link.from === id ? link.to : link.from)
          : (direction === 'causes' ? link.from : link.to),
      }))
      .sort((left, right) => strengthRank[right.link.strength] - strengthRank[left.link.strength]);
  }

  function buildRoute(id, direction) {
    const nodes = new Set([id]);
    const edges = new Set();
    const nodeStrength = new Map();
    const queue = [{ id, depth: 0 }];
    while (queue.length && nodes.size < 7) {
      const item = queue.shift();
      if (item.depth >= 2) continue;
      const candidates = connectionsFor(item.id, direction);
      for (const { link, next } of candidates) {
        if (nodes.size >= 7 && !nodes.has(next)) break;
        edges.add(link.id);
        const previous = nodeStrength.get(next);
        if (!previous || strengthRank[link.strength] > strengthRank[previous]) {
          nodeStrength.set(next, link.strength);
        }
        if (!nodes.has(next)) {
          nodes.add(next);
          queue.push({ id: next, depth: item.depth + 1 });
        }
      }
    }
    return { nodes, edges, nodeStrength };
  }

  function strengthSummary(id, direction) {
    const candidates = connectionsFor(id, direction);
    if (!candidates.length) return 'This is a starting condition in the current model.';
    const words = { primary: 'Primary', contributing: 'Supports', contextual: 'Varies', variable: 'Varies' };
    const grouped = [];
    for (const { link, next } of candidates) {
      const word = words[link.strength];
      let group = grouped.find((item) => item.word === word);
      if (!group) {
        group = { word, names: [] };
        grouped.push(group);
      }
      group.names.push(`${connectionsInfo[next].label}${link.condition === 'low-launch-only' ? ' when launch is low' : ''}`);
    }
    return `${grouped.slice(0, 2)
      .map((group) => `${group.word}: ${group.names.slice(0, 2).join(' and ')}`)
      .join('. ')}.`;
  }

  function bulletsFor(id) {
    if (id === 'attack') return attackBullets[mode];
    const semantic = mode === 'causes'
      ? 'Follow the lit current backward to see what shapes it.'
      : 'Follow the lit current forward to see what it shapes.';
    return [connectionsInfo[id].note, strengthSummary(id, mode), semantic];
  }

  function renderBullets(items) {
    elements.list.replaceChildren(...items.map((item) => {
      const listItem = documentRef.createElement('li');
      listItem.textContent = item;
      return listItem;
    }));
  }

  function getState() {
    return Object.freeze({
      id: selected,
      info: selected ? connectionsInfo[selected] : null,
      mode,
      selected: Boolean(selected),
    });
  }

  function update() {
    if (selected) {
      const route = buildRoute(selected, mode);
      routeNodes = route.nodes;
      routeEdges = route.edges;
      routeNodeStrength = route.nodeStrength;
    } else {
      routeNodes = new Set();
      routeEdges = new Set();
      routeNodeStrength = new Map();
    }

    nodeEls.forEach((element, id) => {
      element.className = 'node sa-focus';
      element.setAttribute('aria-pressed', String(id === selected));
      if (!selected) element.classList.add('idle');
      else if (id === selected) element.classList.add('selected');
      else if (routeNodes.has(id)) {
        element.classList.add('linked');
        element.classList.add(`strength-${routeNodeStrength.get(id) || 'contextual'}`);
      } else element.classList.add('unrelated');
    });

    groups.forEach((group) => {
      const label = elements.labelHost.querySelector(`[data-group="${group.id}"]`);
      label.classList.toggle('route', !selected || group.nodes.some((id) => routeNodes.has(id)));
    });
    elements.causes.setAttribute('aria-pressed', String(mode === 'causes'));
    elements.effects.setAttribute('aria-pressed', String(mode === 'effects'));
    elements.status.textContent = selected ? `${routeNodes.size} connected` : 'Full system';

    if (selected) {
      elements.detail.classList.remove('idle-card');
      elements.role.textContent = connectionsInfo[selected].role;
      elements.title.textContent = connectionsInfo[selected].label;
      elements.direction.textContent = mode === 'causes' ? 'What shapes it' : 'What it shapes';
      renderBullets(bulletsFor(selected));
    } else {
      elements.detail.classList.add('idle-card');
      elements.role.textContent = 'Complete system';
      elements.title.textContent = 'Everything is connected';
      elements.direction.textContent = 'Tap any node';
      renderBullets([
        'Every verified parameter stays in place.',
        'Tap one to isolate a cause or effect chain.',
        'Line styles separate direct, coupled and modeled links.',
      ]);
    }

    windowRef.clearTimeout(liveTimer);
    liveTimer = windowRef.setTimeout(() => {
      elements.live.textContent = selected
        ? `${connectionsInfo[selected].label}. ${mode === 'causes' ? 'What shapes it' : 'What it shapes'}. ${bulletsFor(selected).join(' ')}`
        : 'Full parameter system. Tap any node to inspect its relationships.';
    }, 800);
    drawEdges();
    onSelectionChange(getState());
  }

  function select(id) {
    if (id === null || id === undefined || id === '') selected = null;
    else {
      const next = String(id);
      if (!connectionsInfo[next]) throw new RangeError(`Unknown Connections parameter: ${next}`);
      selected = next;
    }
    update();
    return getState();
  }

  function setMode(nextMode) {
    mode = normalizeMode(nextMode);
    update();
    return getState();
  }

  function reset() {
    return select(null);
  }

  elements.causes.addEventListener('click', () => setMode('causes'));
  elements.effects.addEventListener('click', () => setMode('effects'));
  elements.reset.addEventListener('click', reset);
  documentRef.addEventListener('visibilitychange', () => {
    root.classList.toggle('is-paused', documentRef.hidden);
  });

  const controller = Object.freeze({ reset, setMode, select, getState });
  mountedRoots.set(root, controller);

  const ResizeObserverCtor = windowRef.ResizeObserver;
  if (ResizeObserverCtor) new ResizeObserverCtor(layout).observe(elements.stage);
  else windowRef.addEventListener('resize', layout);
  layout();
  update();
  return controller;
}
