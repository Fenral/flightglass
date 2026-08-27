/**
 * KONTAKTMODELL v2 — lie og køllegeometri som uavhengige akser.
 *
 * Erstatter den bundtede `clubMode`-modellen i `studioContact.js`.
 *
 * ── Hvorfor ────────────────────────────────────────────────────────────────
 * Den gamle modellen bandt to uavhengige ting til ett valg:
 *
 *   clubMode "iron"   ->  lift 0 m      + sweet 0.0213 m
 *   clubMode "driver" ->  lift 0.030 m  + sweet 0.033 m
 *
 * `lift` er BALLENS høyde over bakkeplanet — en egenskap ved underlaget.
 * `sweet` er SWEETSPOTENS høyde over sålen — en egenskap ved kølla.
 * De har ingenting med hverandre å gjøre, og buntingen gjorde tre reelle
 * situasjoner umulige å uttrykke: driver fra bakken, 3-wood fra pigg, jern
 * fra pigg. Se D17b.
 *
 * ── F11: jernets sweetspot var ballradiusen ────────────────────────────────
 * Verifisert over 1250 jerncaser med 1.42e-14 mm avvik:
 *
 *   offset = ((0 + 0.0213) − (clubZ + 0.0213)) × 1000 = −clubZ × 1000
 *
 * Ballradius og «sweetspot» var samme tall og kansellerte hverandre. Jernets
 * `faceCentreOffsetMm` målte aldri et treffpunkt — den målte køllehøyde over
 * bakken, negert. Målt sweetspot for 12 jernhoder er 17.7–19.2 mm, snitt 18.4
 * (US10918918 Tab. 6+7). Arvetallet 21.3 lå 2.1 mm over det høyeste av tolv.
 *
 * ── Måledefinisjoner som ikke må blandes ───────────────────────────────────
 *   sweetSpotHeightMm  VERTIKALT over bakkeplanet. Dette er det formelen bruker.
 *   faceHeightMm       for woods: vertikalt. For jern: LANGS flaten.
 *                      Konverter med cos(loft) før sammenligning.
 *   Hg vs Hs           Hg = CG over sålen (~25 mm driver). Hs = CG projisert
 *                      normalt på den loftede flaten (~34 mm driver). Formelen
 *                      trenger Hs.
 *
 * Kilder og konfidens per verdi: se `KOLLEGEOMETRI.md`.
 * Rene funksjoner. Ingen tilstand, ingen I/O.
 */

/** R&A/USGA: minste diameter 1.680 in = 42.672 mm eksakt. */
export const ballRadiusM = 0.021336;

/**
 * Ballens høyde over bakkeplanet, etter underlag. Millimeter.
 * Erstatter den hardkodede `lift`. Se D17.
 */
export const LIE_PRESETS = Object.freeze({
  hardpan: 0,      // matte, steingulv, tight lie — ballen hviler på planet
  tight: 3,
  fairway: 8,      // ballen ligger litt opp i gresset
  lightRough: 15,
  rough: 22,
  tee: 30,         // driverens gamle 0.030 m er dette punktet
  teeHigh: 42,
});

/**
 * Køllegeometri. `sweetSpotHeightMm` er vertikal høyde over sålen.
 * `faceHeightMm` og `faceConvention` hører sammen — se filhodet.
 *
 * `confidence`: `measured` = publisert måletall med riktig definisjon.
 *               `interpolated` = mellom to målte punkter.
 *               `assumed` = ingen kilde. Behandle som plassholder.
 */
export const CLUB_GEOMETRY = Object.freeze({
  driver:      { sweetSpotHeightMm: 34.0, faceHeightMm: 55.0, faceConvention: 'vertical', confidence: 'measured' },
  threeWood:   { sweetSpotHeightMm: 23.0, faceHeightMm: 37.7, faceConvention: 'vertical', confidence: 'interpolated' },
  hybrid:      { sweetSpotHeightMm: 21.0, faceHeightMm: 37.8, faceConvention: 'vertical', confidence: 'assumed' },
  longIron:    { sweetSpotHeightMm: 17.2, faceHeightMm: 43.0, faceConvention: 'alongFace', confidence: 'interpolated' },
  midIron:     { sweetSpotHeightMm: 18.4, faceHeightMm: 46.0, faceConvention: 'alongFace', confidence: 'measured' },
  shortIron:   { sweetSpotHeightMm: 19.6, faceHeightMm: 49.0, faceConvention: 'alongFace', confidence: 'interpolated' },
  wedge:       { sweetSpotHeightMm: 21.0, faceHeightMm: 51.0, faceConvention: 'alongFace', confidence: 'assumed' },
});

/**
 * Vertikal slagflatehøyde. Jernkilder måler LANGS flaten; for å sammenligne
 * med en vertikal offset må høyden projiseres ned med cos(loft).
 *
 * @param {{faceHeightMm: number, faceConvention: string}} club
 * @param {number} dynamicLoftDeg
 * @returns {number} millimeter, vertikalt
 */
export function verticalFaceHeightMm(club, dynamicLoftDeg) {
  if (club.faceConvention === 'vertical') return club.faceHeightMm;
  return club.faceHeightMm * Math.cos((dynamicLoftDeg * Math.PI) / 180);
}

/**
 * Treffpunktets høyde relativt sweetspoten.
 *
 *   offsetMm = (lieHeightMm + ballRadiusMm) − (clubHeightMm + sweetSpotHeightMm)
 *
 * Positivt = ballen møter flaten OVER sweetspoten.
 *
 * @param {object} input
 * @param {number} input.lieHeightMm      ballens høyde over bakkeplanet
 * @param {number} input.clubHeightMm     `clubZ` × 1000, flatens senter ved treff
 * @param {number} input.sweetSpotHeightMm
 * @returns {number} millimeter
 */
export function faceCentreOffsetMm({ lieHeightMm, clubHeightMm, sweetSpotHeightMm }) {
  return lieHeightMm + ballRadiusM * 1000 - (clubHeightMm + sweetSpotHeightMm);
}

/**
 * Fullt treffresultat, med fysisk grense.
 *
 * D3: treff utenfor slagflaten er en egen tilstand — ikke en ekstremverdi.
 * Den gamle modellen returnerte −121 mm på en ~55 mm flate uten å blunke.
 * 1177 av 2500 caser lå utenfor en fysisk flate.
 *
 * D24: to mål samtidig. Absolutt mm driver fysikken (gear effect skalerer med
 * faktisk avstand fra tyngdepunktet). Andel av flatehøyde er det et menneske
 * trenger — −13 mm er innenfor på en driver og nede ved nederste rille på et jern.
 *
 * @returns {{offsetMm: number, offsetRatio: number, onFace: boolean,
 *            verticalFaceHeightMm: number, halfFaceMm: number}}
 */
export function strikeContact({ lieHeightMm, clubHeightMm, club, dynamicLoftDeg }) {
  const offsetMm = faceCentreOffsetMm({
    lieHeightMm,
    clubHeightMm,
    sweetSpotHeightMm: club.sweetSpotHeightMm,
  });
  const vfh = verticalFaceHeightMm(club, dynamicLoftDeg);
  const halfFaceMm = vfh / 2;
  return {
    offsetMm,
    offsetRatio: offsetMm / halfFaceMm,
    onFace: Math.abs(offsetMm) <= halfFaceMm,
    verticalFaceHeightMm: vfh,
    halfFaceMm,
  };
}
