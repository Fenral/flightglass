/**
 * Differensialtest av bundelen mot den ekte motoren.
 *
 * Dette er ikke en formalitet: bundleren skriver om import/export-linjer, og
 * en feil der ville gitt tall som ser rimelige ut. Testen sammenligner mot en
 * uavhengig kilde — samme mønster som prosjektets egne porter — og bygget
 * stopper hvis ett eneste felt avviker.
 */

const FIELDS = Object.freeze([
  'attackAngle', 'clubPath', 'lowPointX', 'lowPointZ', 'effectiveLowPointX',
  'thetaAtImpact', 'clubHeightM', 'faceCentreOffsetMm', 'faceCentreOffsetRatio',
  'verticalFaceHeightMm', 'groundCrossingTheta0', 'turfBand', 'facePosition',
  'strikeRegime', 'hasTurfContact', 'strikeLead', 'sweetSpotHeightMm',
]);

/**
 * @param {string} bundleSource bundelen slik den legges inn i sida
 * @param {string} rootUrl file:-URL til prosjektroten
 * @returns {Promise<{cases: number, mismatches: number, first: object|null}>}
 */
export async function verifyBundle(bundleSource, rootUrl) {
  const { studioSolve: real } = await import(`${rootUrl}/engine/src/studioSolve.js`);
  const { CLUB_GEOMETRY: realClubs, LIE_PRESETS: realLies } =
    await import(`${rootUrl}/engine/src/contactModel.js`);

  // eslint-disable-next-line no-new-func -- bundelen kjøres slik sida kjører den
  const M = new Function(`${bundleSource}\nreturn __M;`)();
  const bundled = M['engine/src/studioSolve.js'].studioSolve;
  const bundledClubs = M['engine/src/contactModel.js'].CLUB_GEOMETRY;
  const shape = M['adapter/src/studioShape.js'];

  let cases = 0, mismatches = 0, first = null;
  for (const ck of Object.keys(realClubs)) {
    for (const lk of Object.keys(realLies)) {
      for (let plane = 30; plane <= 80; plane += 5) {
        for (let dir = -12; dir <= 12; dir += 4) {
          for (let low = -20; low <= 20; low += 5) {
            for (let arc = -5; arc <= 5; arc += 1.25) {
              const input = {
                swingPlane: plane, swingDirection: dir, ballPositionCm: low,
                arcHeightCm: arc, lieHeightMm: realLies[lk], dynamicLoftDeg: 26,
              };
              const a = real({ ...input, club: realClubs[ck] });
              const b = bundled({ ...input, club: bundledClubs[ck] });
              cases += 1;
              for (const f of FIELDS) {
                if (!Object.is(a[f], b[f])) {
                  mismatches += 1;
                  first ??= { field: f, club: ck, lie: lk, plane, dir, low, arc,
                    real: a[f], bundled: b[f] };
                  break;
                }
              }
              /* adapterens projeksjoner må også overleve omskrivingen */
              const pts = shape.faceOnArcPoints(b, 8, 0.5);
              if (!Number.isFinite(pts[0][0])) {
                mismatches += 1;
                first ??= { field: 'faceOnArcPoints', club: ck, lie: lk };
              }
            }
          }
        }
      }
    }
  }
  return { cases, mismatches, first };
}
