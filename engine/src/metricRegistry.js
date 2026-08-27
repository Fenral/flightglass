/**
 * METRIKKREGISTER v2 — hvilke metrikker Ask faktisk kan tegne.
 *
 * `ask-catalog.json` hadde 19 støttede metrikker og fem gjeldsposter i
 * `_knownDebt`: spørsmål som refererte metrikker uten renderer.
 *
 * ── Tre av fem er nå løst ──────────────────────────────────────────────────
 * `studioSolve.js` produserer alle fire Studio-metrikkene som manglet:
 *
 *   lowPoint       ← lowPointX, lowPointWorld, effectiveLowPointX
 *   contactHeight  ← clubHeightM
 *   entry          ← groundEntry
 *   exit           ← groundExit
 *
 * ── To er ekte gjeld, og skal forbli det ───────────────────────────────────
 * `altitude`, `temperature`, `windSpeed`, `windDirection` er eksplisitt
 * utelukket av spec §10 fra fem-input-produktet. De skal IKKE legges til her
 * for å få en gjeldspost til å forsvinne. Spørsmålene som bruker dem har
 * `gapClass: "external-data"` og `truthTier: "heuristic-estimate"` eller
 * `"unsupported"` — altså er de allerede riktig merket som ubesvarbare.
 *
 * En gjeldspost som lukkes ved å utvide registeret uten å utvide modellen,
 * er ikke lukket. Den er skjult.
 *
 * ── Enheter ────────────────────────────────────────────────────────────────
 * `unit` er den INTERNE enheten. Visningslaget konverterer etter brukerens
 * valg (D27) og runder etter D28. Registeret vet ingenting om visning.
 */

/** Metrikker Ask kunne tegne før. Uendret. */
export const FLIGHT_METRICS = Object.freeze({
  faceAngle: { label: 'Face angle', source: 'input', unit: 'deg', plane: 'direction' },
  clubPath: { label: 'Club path', source: 'input', unit: 'deg', plane: 'direction' },
  attackAngle: { label: 'Attack angle', source: 'input', unit: 'deg', plane: 'height' },
  dynamicLoft: { label: 'Dynamic loft', source: 'input', unit: 'deg', plane: 'height' },
  clubSpeed: { label: 'Club speed', source: 'input', unit: 'mph', plane: 'both' },

  startDirection: { label: 'Launch direction', source: 'engine', unit: 'deg', plane: 'direction' },
  spinAxis: { label: 'Spin axis', source: 'engine', unit: 'deg', plane: 'direction' },
  curve: { label: 'Curve', source: 'engine', unit: 'yard', plane: 'direction' },
  side: { label: 'Side', source: 'engine', unit: 'yard', plane: 'direction' },

  launchAngle: { label: 'Launch angle', source: 'engine', unit: 'deg', plane: 'height' },
  spinLoft: { label: 'Spin loft', source: 'engine', unit: 'deg', plane: 'height' },
  landingAngle: { label: 'Landing angle', source: 'engine', unit: 'deg', plane: 'height' },
  backspin: { label: 'Backspin', source: 'engine', unit: 'rpm', plane: 'height' },
  smash: { label: 'Smash factor', source: 'engine', unit: 'ratio', plane: 'height' },
  apex: { label: 'Apex', source: 'engine', unit: 'yard', plane: 'height' },
  carry: { label: 'Carry', source: 'engine', unit: 'yard', plane: 'height' },
  total: { label: 'Total', source: 'engine', unit: 'yard', plane: 'height' },

  ballSpeed: { label: 'Ball speed', source: 'engine', unit: 'mph', plane: 'both' },
});

/**
 * NYE — løser tre av fem gjeldsposter. Alle fra `studioSolve.js`.
 * `plane: 'studio'` fordi de hører til Impact Studio, ikke til DIRECTION/HEIGHT.
 */
export const STUDIO_METRICS = Object.freeze({
  lowPoint: {
    label: 'Low point', source: 'studio', unit: 'metre', plane: 'studio',
    field: 'effectiveLowPointX',
    closes: 'fat-contact, thin-contact, low-point',
  },
  contactHeight: {
    label: 'Contact height', source: 'studio', unit: 'metre', plane: 'studio',
    field: 'clubHeightM',
    closes: 'thin-contact',
  },
  entry: {
    label: 'Ground entry', source: 'studio', unit: 'point3d', plane: 'studio',
    field: 'groundEntry',
    closes: 'low-point',
    nullable: true,
  },
  exit: {
    label: 'Ground exit', source: 'studio', unit: 'point3d', plane: 'studio',
    field: 'groundExit',
    closes: 'low-point',
    nullable: true,
  },
  faceCentreOffset: {
    label: 'Strike offset', source: 'studio', unit: 'mm', plane: 'studio',
    field: 'faceCentreOffsetMm',
  },
  lieHeight: {
    label: 'Lie height', source: 'input', unit: 'mm', plane: 'studio',
    field: 'lieHeightMm',
  },
});

/**
 * Metrikker som er UTELUKKET av spec §10 og skal forbli det.
 * De står her for at fraværet skal være et valg, ikke en forglemmelse.
 */
export const EXCLUDED_METRICS = Object.freeze({
  altitude: 'spec §10 — ikke i fem-input-produktet',
  temperature: 'spec §10 — ikke i fem-input-produktet',
  windSpeed: 'spec §10 — ikke i fem-input-produktet',
  windDirection: 'spec §10 — ikke i fem-input-produktet',
});

export const SUPPORTED = Object.freeze({ ...FLIGHT_METRICS, ...STUDIO_METRICS });

/**
 * Kan Ask tegne denne metrikken?
 * @returns {{supported: boolean, reason?: string}}
 */
export function metricSupport(metricId) {
  if (metricId in SUPPORTED) return { supported: true };
  if (metricId in EXCLUDED_METRICS) {
    return { supported: false, reason: EXCLUDED_METRICS[metricId] };
  }
  return { supported: false, reason: 'ukjent metrikk' };
}

/**
 * Hvilke av katalogens gjeldsposter er faktisk lukket nå?
 * @param {Array<{questionId: string, unsupportedMetricIds: string[]}>} knownDebt
 */
export function auditDebt(knownDebt) {
  return knownDebt.map((d) => {
    const still = d.unsupportedMetricIds.filter((m) => !(m in SUPPORTED));
    return {
      questionId: d.questionId,
      was: d.unsupportedMetricIds,
      stillUnsupported: still,
      closed: still.length === 0,
      reason: still.map((m) => EXCLUDED_METRICS[m] ?? 'ukjent').join('; ') || null,
    };
  });
}
