/**
 * `deriveImpact` — den offentlige Impact Studio-funksjonen (spec §8, §11.3).
 *
 * BASELINE. Ingen fysikk i denne filen. Ren sammensetning av tre moduler, i
 * denne rekkefølgen:
 *
 *   §8.1–8.4  studioGeometry  → lowPointX, lowPointZ, effectiveLowPointX,
 *                               thetaAtImpact, attackAngle, clubPath
 *   GAPS §7–9 studioContact   → contactHeight, groundCrossingTheta0,
 *                               groundEntry, groundExit, faceCentreOffsetMm,
 *                               clubBallContact
 *                               (+ planeBasis, lowPointWorld og impactPoint via
 *                                de eksporterte hjelperne, se under)
 *   §8.5      strikeBandIron  → strikeBand, KUN for `clubMode: "iron"`
 *
 * Studio beregner aldri spinn, carry eller ballflukt (spec §11.3). Ingen
 * farger, UI-strenger eller presentasjonsdata i returobjektet (FUNN F6).
 *
 * ── DEKNING MOT `studio-golden.json` ──────────────────────────────────────
 * Fixturens `out` har 20 felt. Denne funksjonen produserer 16 av dem for jern
 * og 15 for driver. De fire (fem for driver) som IKKE produseres, og hvorfor:
 *
 *   `shaftPivot`      ingen modul eier den. Verken spec §8 eller ENGINE-GAPS
 *   `tangentAtImpact` tallfester dem; de er tegneflatens hjelpegeometri
 *   `planePolygon`    (`impact-studio.html`). Å utlede dem her ville vært ny
 *                     fysikk skrevet i et komposisjonslag. Utelatt bevisst.
 *
 *   `strikeQuality`   presentasjonsobjektet. FUNN F6: det bærer det gamle
 *                     designsystemet som data — `color`, `textColor`, `tip`,
 *                     `pct`, `barPos`. Motoren skal ikke returnere noen av dem.
 *                     De tre motoreide feltene i det (`band`, `offsetRatio`,
 *                     `clubZ`) finnes allerede her som `strikeBand`,
 *                     `clubBallContact.offsetRatio` og `contactHeight`; for
 *                     jern er `strikeQuality.band === strikeBand` i alle 1250
 *                     caser. Objektet gjengis ikke som eget felt.
 *
 *   `strikeBand`      mangler for `clubMode: "driver"`. Driverbåndene
 *   (driver)          (`Pure`/`Low`/`High`/`Duff`) er en udokumentert stand-in
 *                     som er uenig med `strikeQuality.band` i 1029 av 1250
 *                     driver-caser (FUNN F1/F7). Nøkkelen UTELATES da — den
 *                     settes ikke til `null`. `Object.hasOwn(result,
 *                     'strikeBand')` er dermed et entydig «dekket / ikke
 *                     dekket»-signal, i stedet for et stille feilsvar.
 *
 * ── INPUTKONTRAKT ─────────────────────────────────────────────────────────
 * Samme innstramming som `solveFlight` (spec §3): bare endelige tall inn,
 * ingen parsing, ingen koersjon, ingen defaults. `clubMode` må være `"iron"`
 * eller `"driver"`. Ingen av de fire tallene klampes.
 *
 * Ukjente nøkler ignoreres, slik at en kaller kan sende hele sin swing state
 * uendret.
 */

import { solveStudioGeometry } from './studioGeometry.js';
import {
  arcPoint,
  effectiveLowPointX,
  lowPointX,
  lowPointZ,
  planeBasis,
  planeYawRad,
  solveStudioContact,
  swingPlaneRad,
  thetaAtImpact,
  lowPointWorld,
} from './studioContact.js';
import { solveStrikeBandIron } from './strikeBandIron.js';

/* ─────────────────────────────────────────────────────────────────────────
 * Inputkontrakt
 * ───────────────────────────────────────────────────────────────────────── */

/** Rekkefølgen feltene sjekkes i. Deterministisk feilmelding. */
const requiredNumbers = Object.freeze([
  'swingPlane',
  'swingDirection',
  'ballPositionCm',
  'arcHeightCm',
]);

/** De to modusene fixturen har. `iron` er validert; `driver` er en stand-in. */
const clubModes = Object.freeze(['iron', 'driver']);

/**
 * @param {object} swing
 * @throws {TypeError} når et av de fire tallene ikke er endelig, eller
 *   `clubMode` ikke er `"iron"`/`"driver"`
 */
function assertFiniteSwing(swing) {
  if (swing === null || typeof swing !== 'object') {
    throw new TypeError(
      'deriveImpact krever et objekt med swingPlane, swingDirection, ' +
        'ballPositionCm, arcHeightCm og clubMode.',
    );
  }

  for (const field of requiredNumbers) {
    const value = swing[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError(
        `deriveImpact: ${field} må være et endelig tall, fikk ${String(value)}. ` +
          'Parsing og koersjon hører hjemme i et adapterlag (spec §3).',
      );
    }
  }

  if (!clubModes.includes(swing.clubMode)) {
    throw new TypeError(
      `deriveImpact: clubMode må være "iron" eller "driver", fikk ` +
        `${JSON.stringify(swing.clubMode)}.`,
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Funksjonen
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Hele Impact Studio-kjeden i ett deterministisk, rent kall.
 *
 * @param {{swingPlane: number, swingDirection: number, ballPositionCm: number,
 *          arcHeightCm: number, clubMode: 'iron'|'driver'}} swing
 *   grader, grader, centimeter, centimeter, køllemodus — feltnavn som i
 *   `studio-golden.json` sine `in`-objekter.
 * @returns {{attackAngle: number, clubPath: number, lowPointX: number,
 *            lowPointZ: number, effectiveLowPointX: number,
 *            lowPointWorld: {x: number, y: number, z: number},
 *            planeBasis: {u: object, m: object}, thetaAtImpact: number,
 *            impactPoint: {x: number, y: number, z: number},
 *            contactHeight: number, groundCrossingTheta0: number|null,
 *            groundEntry: object|null, groundExit: object|null,
 *            strikeBand?: 'Duff'|'Fat'|'Pure'|'Thin'|'Whiff',
 *            faceCentreOffsetMm: number, clubBallContact: object}}
 *   Nøkkelrekkefølgen følger `_meta.returnedFields` i studio-golden.json for
 *   de feltene som produseres. `strikeBand` finnes kun for `"iron"`.
 * @throws {TypeError} brudd på inputkontrakten
 */
export function deriveImpact(swing) {
  assertFiniteSwing(swing);

  const { swingPlane, swingDirection, ballPositionCm, arcHeightCm, clubMode } =
    swing;

  /* §8.1–8.4 — buegeometrien og de avledede leveranseverdiene. */
  const geometry = solveStudioGeometry({
    swingPlane,
    swingDirection,
    ballPositionCm,
    arcHeightCm,
    clubMode,
  });

  /* ENGINE-GAPS §7–9 — kontakthøyde, ballrelativt avvik og bakkekryssingene. */
  const contact = solveStudioContact({
    swingPlane,
    swingDirection,
    ballPositionCm,
    arcHeightCm,
    clubMode,
  });

  /* `planeBasis`, `lowPointWorld` og `impactPoint` er fixturefelt som ingen av
   * de tre modulenes `solve*`-funksjoner returnerer — `studioContact` regner
   * dem ut underveis for GAPS §8 og eksporterer byggeklossene, men holder dem
   * ute av sitt eget returobjekt. Kallene under er derfor REN GJENBRUK av
   * modulens egne funksjoner, ikke en formel skrevet av på nytt. Alle tre er
   * bit-eksakte mot fixturen i alle 2500 caser.
   *
   * `impactPoint` er buepunktet ved treffparameteren: `arcPoint` er den samme
   * funksjonen GAPS §8 bruker for groundEntry/Exit, kalt med θ = θ_impact. */
  const planeRadians = swingPlaneRad(swingPlane);
  const yawRadians = planeYawRad(swingDirection);

  const xEffective = effectiveLowPointX(
    lowPointX(ballPositionCm),
    swingDirection,
    planeRadians,
  );
  const theta = thetaAtImpact(xEffective);
  const basis = planeBasis(yawRadians, planeRadians);
  const lowPoint = lowPointWorld(
    xEffective,
    lowPointZ(arcHeightCm, clubMode),
    theta,
    yawRadians,
    planeRadians,
  );

  /* §8.5 — treffbåndet. KUN jern; se dekningsnotatet i filhodet. */
  const strike =
    clubMode === 'iron'
      ? solveStrikeBandIron({
          swingPlane,
          swingDirection,
          ballPositionCm,
          arcHeightCm,
          clubMode,
        })
      : null;

  /* ── Sammenstilling. Nøkkelrekkefølge som `_meta.returnedFields`. ─────── */
  const result = {
    attackAngle: geometry.attackAngle,
    clubPath: geometry.clubPath,

    lowPointX: geometry.lowPointX,
    lowPointZ: geometry.lowPointZ,
    effectiveLowPointX: geometry.effectiveLowPointX,
    lowPointWorld: lowPoint,
    planeBasis: basis,
    thetaAtImpact: geometry.thetaAtImpact,
    impactPoint: arcPoint(lowPoint, basis, theta),

    contactHeight: contact.contactHeight,
    groundCrossingTheta0: contact.groundCrossingTheta0,
    groundEntry: contact.groundEntry,
    groundExit: contact.groundExit,
  };

  // Nøkkelen finnes bare når et bånd faktisk er beregnet.
  if (strike !== null) result.strikeBand = strike.strikeBand;

  result.faceCentreOffsetMm = contact.faceCentreOffsetMm;
  result.clubBallContact = contact.clubBallContact;

  return result;
}

export default deriveImpact;
