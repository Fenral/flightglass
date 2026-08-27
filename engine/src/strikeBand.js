/**
 * STRIKE BAND v2 — én klassifiserer, regimekorrekt vokabular.
 *
 * ── Hva som var galt i den gamle motoren ───────────────────────────────────
 * TO klassifiserere som var uenige i 82,3 % av driver-casene (FUNN F7).
 * `strikeBand` sa `Low`, `strikeQuality.band` sa `Whiff` — 544 ganger.
 * `strikeQuality` bar dessuten hex-farger og UI-strenger ut gjennom
 * motorgrensen (FUNN F6). Den er slettet, ikke portert.
 *
 * ── Hva som var galt i MIN egen første v2 ──────────────────────────────────
 * Jeg klassifiserte på treffpunkt-offset alene, og fikk fortegnet bakvendt:
 * 320 caser gikk `Whiff → Pure` i diffen. En whiff er at kølla passerer OVER
 * ballen, altså høy køllehøyde og NEGATIV offset — ikke positiv.
 *
 * Spec §8.5 klassifiserer på TRE akser, ikke én: køllehøyde, low point
 * foran/bak ballen, og om kølla er nedadgående. Fixturen bekreftet det:
 * `Pure` er det eneste båndet med smalt `effectiveLowPointX`-intervall
 * ([0.0408, 0.1492] m) og det eneste med alltid negativ `thetaAtImpact`.
 *
 * ── Reproduksjon ───────────────────────────────────────────────────────────
 * Regelen treffer **1239 av 1250** jerncaser = **99,12 %**.
 * De 11 gjenværende er 4 `Thin→Fat` og 7 `Fat→Thin` på grensen mellom de to.
 * Grensen lar seg ikke utlede av fixturen alene, og originalkoden er utenfor
 * prosjektgrensen (D13). Restfeilen er pinnet i test, ikke skjult.
 *
 * ── Vokabularet er regime-spesifikt, ikke kølle-spesifikt ──────────────────
 * En kølle slått fra bakken har turf-interaksjon: Fat, Thin, Duff, Whiff
 * beskriver forholdet mellom kølle, ball og gress.
 *
 * En kølle slått fra pigg har ingen turf å treffe. Turf-vokabularet var alltid
 * feil språk der; det som betyr noe er hvor på slagflaten ballen treffes.
 *
 * Regimet velges derfor av UNDERLAGET, ikke av køllemerket: driver fra bakken
 * får turf-vokabular, jern fra pigg får flate-vokabular. Se D17b.
 *
 * Rene funksjoner. Ingen presentasjonsdata i retur.
 */

/** R&A: minste diameter 42.672 mm. Studios arvetall var 0.0213 (36 µm lavt). */
const BALL_RADIUS_M = 0.021336;

/** Fixturens ballradius, beholdt der en terskel er utledet FRA fixturen. */
const LEGACY_BALL_RADIUS_M = 0.0213;

export const THRESHOLDS = Object.freeze({
  turf: Object.freeze({
    /** Spec §8.5: kølla graver mer enn 25 mm under bakken ved ballen. */
    duffDepthM: -0.025,
    /**
     * Utledet fra fixturen: eksakt 1.4 × ballradius.
     * Observert grense lå i (0.029752, 0.029886); 1.4 × 0.0213 = 0.029820.
     */
    whiffClubHeightM: 1.4 * LEGACY_BALL_RADIUS_M,
    /** Spec §8.5: «low point 20–150 mm foran ballen». Bekreftet mot fixturen. */
    pureLowPointMinM: 0.020,
    pureLowPointMaxM: 0.150,
    /** Fixturens Pure-tak på køllehøyde. */
    pureClubHeightMaxM: 0.016,
    /** Spec §8.5: «low point ligger bak ballen i treffsonen» → Fat. */
    fatLowPointM: -0.10,
  }),
  face: Object.freeze({
    /** Fixturens rene gap: Pure [-7.77, 7.93], Low ≤ -8.08, High ≥ 8.02. */
    centreBandMm: 8,
  }),
});

/**
 * Underlaget avgjør vokabularet. Er ballen 20 mm eller mer over bakkeplanet,
 * er den luftbåren og turf er ute av spill.
 *
 * @param {{lieHeightMm: number}} input
 * @returns {'turf'|'teed'}
 */
export function contactRegime({ lieHeightMm }) {
  return lieHeightMm >= 20 ? 'teed' : 'turf';
}

/**
 * TURF-vokabular, spec §8.5. Tre akser.
 *
 * @param {object} input
 * @param {number} input.clubHeightM        køllehøyde ved ballen, meter
 * @param {number} input.effectiveLowPointM low point foran (+) eller bak (−) ballen
 * @param {number} input.thetaAtImpact      radianer; negativ = nedadgående
 * @returns {'Duff'|'Fat'|'Pure'|'Thin'|'Whiff'}
 */
export function turfBand({ clubHeightM, effectiveLowPointM, thetaAtImpact }) {
  const T = THRESHOLDS.turf;
  if (clubHeightM < T.duffDepthM) return 'Duff';
  if (clubHeightM > T.whiffClubHeightM) return 'Whiff';
  if (clubHeightM < 0 || effectiveLowPointM < T.fatLowPointM) return 'Fat';
  if (
    effectiveLowPointM >= T.pureLowPointMinM &&
    effectiveLowPointM <= T.pureLowPointMaxM &&
    thetaAtImpact < 0 &&
    clubHeightM <= T.pureClubHeightMaxM
  ) {
    return 'Pure';
  }
  return 'Thin';
}

/**
 * TEED-vokabular: ingen turf i spill, kun vertikalt treffpunkt på flaten.
 * `OffFace` er en egen tilstand, ikke en ekstremverdi på en skala.
 *
 * @param {{offsetMm: number, halfFaceMm: number}} input
 * @returns {'OffFace'|'Low'|'Centre'|'High'}
 */
export function teedBand({ offsetMm, halfFaceMm }) {
  if (Math.abs(offsetMm) > halfFaceMm) return 'OffFace';
  if (offsetMm < -THRESHOLDS.face.centreBandMm) return 'Low';
  if (offsetMm > THRESHOLDS.face.centreBandMm) return 'High';
  return 'Centre';
}

/**
 * Én inngang. **Begge svar returneres alltid** — de er ulike spørsmål.
 *
 * `turfBand` svarer: hvordan møtte kølla bakken og ballen?
 * `facePosition` svarer: hvor på slagflaten traff ballen?
 *
 * En driver fra bakken kan ha perfekt turf-interaksjon og likevel treffe
 * 16,6 mm under sweetspoten — og det siste er hele historien for det slaget.
 * Å velge ett av svarene er å skjule det andre.
 *
 * Det var U1: «PURE» og «NO TURF CONTACT» så ut som en selvmotsigelse fordi
 * bare det ene ble vist, uten den tredje opplysningen som forener dem —
 * underlaget. Nå returneres alle tre.
 *
 * `regime` sier hvilket svar som skal LEDE i grensesnittet, ikke hvilket som
 * beregnes. Se D3b: ingen skjermtilstand får vise turfkontakt uten underlag.
 *
 * @returns {{turfBand: string|null, facePosition: string, regime: 'turf'|'teed',
 *            hasTurfContact: boolean, lead: string}}
 */
export function strikeBand({
  lieHeightMm,
  clubHeightM,
  effectiveLowPointM,
  thetaAtImpact,
  offsetMm,
  halfFaceMm,
}) {
  const regime = contactRegime({ lieHeightMm });

  /* Turf er i spill så lenge ballen ikke er luftbåren. */
  const hasTurfContact = regime === 'turf';
  const turf = hasTurfContact
    ? turfBand({ clubHeightM, effectiveLowPointM, thetaAtImpact })
    : null;

  /* Flateposisjonen gjelder alltid — kølla treffer en flate uansett underlag. */
  const facePosition = teedBand({ offsetMm, halfFaceMm });

  return {
    turfBand: turf,
    facePosition,
    regime,
    hasTurfContact,
    lead: hasTurfContact ? turf : facePosition,
  };
}

export { BALL_RADIUS_M };
