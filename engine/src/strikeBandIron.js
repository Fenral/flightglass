/**
 * §8.5 — `strikeBand` for `clubMode: "iron"`.
 *
 * BASELINE. Reproduserer dagens motor eksakt mot `motor/export/studio-golden.json`:
 * 1250 av 1250 iron-caser, null feilklassifiseringer, og de numeriske
 * mellomregningene bit-eksakte (avvik 0). Ingenting her er ryddet, forbedret
 * eller modernisert.
 *
 * OMFANG — LES DENNE FØR DU UTVIDER FILEN:
 * Bare jern. Driver-bandene `Low` og `High` (FUNN F1) er UDOKUMENTERTE og
 * hører til en senere, versjonert fase. De skal ikke implementeres her, ikke
 * engang som en gren som kaster. Sender du en driver-input inn i
 * `solveStrikeBandIron` får du en RangeError, ikke en gjetning.
 *
 * For jern er `out.strikeBand` og `out.strikeQuality.band` identiske i alle
 * 1250 caser (FUNN F7: de to klassifisererne er bare uenige for driver, 82 %).
 * Denne modulen produserer derfor begge feltene for jern. Den produserer IKKE
 * `strikeQuality` som objekt — det er et presentasjonsobjekt (FUNN F6) og har
 * ingenting i en motorgrense å gjøre.
 *
 * README-ens modultabell planlegger `src/studio-strike.js` for §8.5. Denne
 * filen er jern-halvdelen av den. Når driverfasen kommer, slås de sammen der;
 * ikke dupliser jernreglene inn i en ny fil.
 *
 * ── SPEC §8.5, ORDRETT ────────────────────────────────────────────────────
 *
 *   | Band  | Hovedregel                                                    |
 *   |-------|---------------------------------------------------------------|
 *   | Duff  | Køllen ligger mer enn 25 mm under bakken ved ballen.           |
 *   | Fat   | Køllen er under bakken, eller low point ligger bak ballen i    |
 *   |       | treffsonen.                                                   |
 *   | Pure  | Kontakt under/ved ballens sentrum og low point 20–150 mm foran |
 *   |       | ballen.                                                       |
 *   | Thin  | For høy eller for grunn kontakt, men køllen treffer fortsatt   |
 *   |       | ballsonen.                                                    |
 *   | Whiff | Køllen passerer over ballsonen.                                |
 *
 * Spec-en gir ingen tall for «ballens sentrum» eller «ballsonen». De er fittet
 * mot fixturen. Se TERSKLER under for hva fixturen faktisk pinner og hva den
 * ikke kan avgjøre.
 *
 * ── TERSKLER UTLEDET FRA FIXTUREN ────────────────────────────────────────
 *
 * Alle sammenligninger går på `contactHeight` (= `clubBallContact.clubZ`, meter
 * over bakken ved ballen) og `effectiveLowPointX` (meter, `+` = low point foran
 * ballen). `offsetRatio = (contactHeight − 0.0213) / 0.0213`, altså `0` ved
 * ballsentrum og `−1` ved bakken.
 *
 *   Duff   `contactHeight < −0.025`
 *          Pinnet: Duff maks `−0.02507000825130299`,
 *                  Fat  min  `−0.024970169073658954`. Terskelen ligger i gapet
 *                  og spec-en oppgir 25 mm eksplisitt. `constants.duffDepthM`.
 *
 *   Fat    `contactHeight < 0`  (køllen under bakken)
 *          Pinnet av `tip`-teksten i fixturen, ikke bare av tallene: alle 280
 *          casene med `−0.025 <= clubZ < 0` har «club takes turf before the
 *          ball», og alle 22 med `clubZ >= 0` har «low point behind the ball».
 *          `clubZ < 0` ⟺ `offsetRatio < −1`; de to er eksakt like.
 *
 *   Fat    `effectiveLowPointX < 0` når `offsetRatio <= 0` (low point bak ballen)
 *          ⚠ IKKE PINNET — se AMBIGUITET 1.
 *
 *   Pure   `offsetRatio <= 0` OG `0.02 <= effectiveLowPointX <= 0.15`
 *          Pinnet: Pure spenner `effectiveLowPointX` `0.040779…`–`0.149221…`,
 *          nærmeste Thin over vinduet er `0.153089…`. `constants.lowPointAheadMinM`
 *          / `lowPointAheadMaxM` (`_meta.constants` har de samme to tallene).
 *
 *   Whiff  `offsetRatio > 0.4`
 *          Pinnet: Thin maks `0.39681452923688304`,
 *                  Whiff min `0.4031094374492235`. `0.4` er den eneste runde
 *                  verdien i gapet. Tilsvarer `clubZ > 1.4 × 0.0213 ≈ 0.02982`.
 *          ⚠ Denne konstanten finnes IKKE i `src/constants.js` og ikke i spec-en.
 *            Den bor derfor i denne filen, som `whiffOffsetRatio`. Se der.
 *
 *   Thin   alt annet innenfor ballsonen. To undergrener i fixturens `tip`:
 *          `offsetRatio > 0` («catches the top of the ball», bladed) og
 *          `offsetRatio <= 0` med low point utenfor Pure-vinduet («shallow
 *          strike»). Begge gir samme band; skillet er ren UI-kopi og gjengis
 *          ikke her.
 *
 * ── TO TING FIXTUREN IKKE KAN AVGJØRE ────────────────────────────────────
 *
 *  1. Fat-grensen «low point bak ballen» er enten `< 0` eller `< 0.02`
 *     (`lowPointAheadMinM`). Ingen av de 1250 jern-casene har
 *     `effectiveLowPointX` i `[0, 0.02)` SAMTIDIG med kontakt i
 *     `0 <= clubZ <= 0.0213`: Fat-siden stopper på `−0.073179…`, Pure-siden
 *     starter på `0.040779…`. Gapet er tomt. Valget her er `< 0` fordi spec §8.5
 *     sier «low point ligger bak ballen» — bak = negativ — og fordi fixturens
 *     egen tekst for nettopp de 22 casene er «low point behind the ball».
 *     Med `< 0.02` ville de 30 casene i `[0, 0.02)` som i dag treffer
 *     `clubZ < 0`-grenen fortsatt bli Fat; forskjellen dukker først opp for
 *     input rutenettet ikke har (arcHeightCm ≈ 0.2–2.3 cm med low point
 *     0–20 mm foran ballen). Da blir det Thin her og Fat med den andre
 *     lesningen. Endres dette, er det en versjonert fysikkendring.
 *
 *  2. Strenge vs. ikke-strenge grenser (`< 0` vs `<= 0`, `<= 0.15` vs `< 0.15`,
 *     `< −0.025` vs `<= −0.025`). Ingen case ligger eksakt på noen terskel.
 *     Formene under følger spec-ordlyden: «mer enn 25 mm under» → strengt,
 *     «under/ved ballens sentrum» → inklusivt, «20–150 mm» → inklusivt.
 *
 * ── HVOR TALLENE KOMMER FRA ──────────────────────────────────────────────
 *
 * Denne modulen regner ikke ut treffgeometri selv. `src/studioContact.js` eier
 * §8.1–8.3 og GAPS §7 og er bit-eksakt mot fixturen; `ironStrikeGeometry` under
 * er bare jern-sammenstillingen av de primitivene. Ryker en ULP der, ryker den
 * her — det er meningen. Ikke skriv formlene av hit.
 *
 * Ingen I/O. Ingen skjult tilstand. Ingen farger, UI-strenger eller
 * presentasjonsdata — bandnavnene er motorens egne enum-verdier slik de står i
 * `out.strikeBand`, ikke brukervendt kopi.
 */

import {
  duffDepthM,
  lowPointAheadMaxM,
  lowPointAheadMinM,
  studioBallRadius,
} from './constants.js';
import {
  clubBallContact,
  contactHeight,
  effectiveLowPointX,
  lowPointX,
  lowPointZ,
  swingPlaneRad,
  thetaAtImpact,
} from './studioContact.js';

/**
 * Terskelen mellom Thin og Whiff, i `offsetRatio`.
 *
 * ⚠ LIGGER HER, IKKE I `constants.js`. Grunnen: spec §8.5 tallfester bare
 * Duff-dybden (25 mm) og Pure-vinduet (20–150 mm). «Ballsonen» er udokumentert,
 * og `constants.js` sier eksplisitt at de øvrige båndterskler «må fittes mot
 * studio-golden.json». Dette er den fittede verdien for jern. Flyttes til
 * `constants.js` først når driverfasen har vist om den deles.
 *
 * Fixturen pinner den til `(0.39681452923688304, 0.4031094374492235]`.
 * `offsetRatio > 0.4` ⟺ `clubZ > 1.4 × ballradius ≈ 0.02982 m`, altså kølla
 * passerer over ballen med litt over 40 % av en ballradius klaring.
 */
export const whiffOffsetRatio = 0.4;

/**
 * Motorens fem jern-bandnavn, ordrett slik de står i `out.strikeBand`.
 * Enum-verdier, ikke UI-tekst: fixturens brukervendte kopi ligger i
 * `strikeQuality.tip` og er bevisst ikke med her (FUNN F6).
 *
 * Driver-bandene `Low` og `High` er ikke med. De er udokumenterte (FUNN F1) og
 * hører til en senere fase.
 */
export const ironStrikeBands = Object.freeze({
  duff: 'Duff',
  fat: 'Fat',
  pure: 'Pure',
  thin: 'Thin',
  whiff: 'Whiff',
});

/**
 * Treffgeometrien §8.1–8.3 + GAPS §7, jern-varianten, satt sammen av
 * primitivene i `src/studioContact.js`.
 *
 * Ingen formel er skrevet av hit. Rekkefølgen er den samme som i
 * `solveStudioContact`, og resultatet er bit-eksakt mot fixturen i alle 1250
 * jern-caser (`lowPointX`, `lowPointZ`, `effectiveLowPointX`, `thetaAtImpact`,
 * `contactHeight`, `offset`, `offsetRatio` — avvik 0 på alle sju).
 *
 * Funksjonen finnes fordi klassifisereren trenger to av de sju tallene, og
 * `solveStudioContact` returnerer verken `effectiveLowPointX` eller
 * `thetaAtImpact` (de tilhører `studio-geometry`). Den er en sammenstilling,
 * ikke en ny modell. `clubMode` er låst til `iron`.
 *
 * ⚠ ULP-fellene (Studio-grupperingen `(deg * Math.PI) / 180`, unntaket i
 * `perDegree`, og cm → meter som divisjon med 100) er dokumentert og testet i
 * `studioContact.js`. De gjelder fortsatt — de bor bare ikke her.
 *
 * @param {{swingPlane: number, swingDirection: number, ballPositionCm: number,
 *          arcHeightCm: number}} input grader og centimeter, som i fixturens `in`
 * @returns {{lowPointX: number, lowPointZ: number, effectiveLowPointX: number,
 *            thetaAtImpact: number, contactHeight: number, offset: number,
 *            offsetRatio: number}} meter, radianer og et dimensjonsløst forhold
 */
export function ironStrikeGeometry({
  swingPlane,
  swingDirection,
  ballPositionCm,
  arcHeightCm,
}) {
  const planeRadians = swingPlaneRad(swingPlane);

  // §8.1 — rå low point, ball-relativt. 10.5 cm foran ballen ved ballPosition 0.
  const xLowPoint = lowPointX(ballPositionCm);
  const zLowPoint = lowPointZ(arcHeightCm, 'iron');

  // §8.2 — Swing Direction flytter low point horisontalt, mindre jo brattere plane.
  const xEffective = effectiveLowPointX(xLowPoint, swingDirection, planeRadians);

  // §8.3 — treffparameteren på buen.
  const theta = thetaAtImpact(xEffective);

  // GAPS §7 — sålehøyden ved ballen, og ballrelativt avvik.
  const clubZ = contactHeight(zLowPoint, theta, planeRadians);
  const { offset, offsetRatio } = clubBallContact(clubZ, theta);

  return {
    lowPointX: xLowPoint,
    lowPointZ: zLowPoint,
    effectiveLowPointX: xEffective,
    thetaAtImpact: theta,
    contactHeight: clubZ,
    offset,
    offsetRatio,
  };
}

/**
 * Klassifisereren fra §8.5. Ren funksjon av to tall.
 *
 * Rekkefølgen på grenene er spec-tabellens: Duff → Fat → Pure → Thin → Whiff.
 * Områdene er disjunkte, så rekkefølgen endrer ingen verdi i fixturen; den er
 * valgt slik for at koden skal kunne leses mot tabellen linje for linje.
 *
 * Parameternavnene har suffikset `Metres` for å ikke skygge for de importerte
 * `contactHeight` og `effectiveLowPointX` fra `studioContact.js`.
 *
 * @param {number} contactHeightMetres meter over bakken ved ballen
 *   (`out.contactHeight` = `out.clubBallContact.clubZ`)
 * @param {number} effectiveLowPointXMetres meter, `+` = low point foran ballen
 *   (`out.effectiveLowPointX`)
 * @returns {'Duff'|'Fat'|'Pure'|'Thin'|'Whiff'} fixturens `out.strikeBand`
 *   (og, for jern, `out.strikeQuality.band` — de er alltid like)
 */
export function strikeBandIron(contactHeightMetres, effectiveLowPointXMetres) {
  // `0` ved ballsentrum, `−1` ved bakken. Samme uttrykk som
  // `studioContact.clubBallContact`, men uten θ: klassifisereren skal kunne
  // kalles med to tall og ingenting mer. Fixturen: `clubBallContact.offsetRatio`.
  const offsetRatio = (contactHeightMetres - studioBallRadius) / studioBallRadius;

  // Duff — mer enn 25 mm under bakken.
  if (contactHeightMetres < -duffDepthM) return ironStrikeBands.duff;

  // Fat, gren 1 — kølla er under bakken (⟺ offsetRatio < −1).
  if (contactHeightMetres < 0) return ironStrikeBands.fat;

  // Kontakt under/ved ballens sentrum: her, og bare her, teller low point.
  if (offsetRatio <= 0) {
    // Fat, gren 2 — low point bak ballen. Se AMBIGUITET 1 i filhodet:
    // `< 0` og `< lowPointAheadMinM` er ikke til å skille fra fixturen.
    if (effectiveLowPointXMetres < 0) return ironStrikeBands.fat;

    // Pure — low point 20–150 mm foran ballen.
    if (
      effectiveLowPointXMetres >= lowPointAheadMinM &&
      effectiveLowPointXMetres <= lowPointAheadMaxM
    ) {
      return ironStrikeBands.pure;
    }

    // Thin — grunn kontakt, low point utenfor vinduet.
    return ironStrikeBands.thin;
  }

  // Whiff — kølla passerer over ballsonen.
  if (offsetRatio > whiffOffsetRatio) return ironStrikeBands.whiff;

  // Thin — over ballsentrum, men fortsatt i ballsonen (bladed).
  return ironStrikeBands.thin;
}

/**
 * §8.5 samlet, fra rå Studio-input. Ren funksjon.
 *
 * `clubMode` er valgfri i signaturen, men KASTER hvis den er noe annet enn
 * `"iron"`. Det er en omfangsvakt, ikke ny fysikk: driver kjører et helt annet
 * klassifiseringssystem (`Pure`/`Low`/`High`/`Duff`, FUNN F1) som er
 * udokumentert og bevisst ikke portert. Å returnere et jern-band for en
 * driver-input ville vært et stille feilsvar i 82 % av tilfellene (FUNN F7).
 * Andre ukjente nøkler ignoreres, slik at kalleren kan sende hele shot state
 * uendret.
 *
 * @param {{swingPlane: number, swingDirection: number, ballPositionCm: number,
 *          arcHeightCm: number, clubMode?: string}} input
 * @returns {{strikeBand: 'Duff'|'Fat'|'Pure'|'Thin'|'Whiff'}}
 * @throws {RangeError} hvis `clubMode` er satt til noe annet enn `"iron"`
 */
export function solveStrikeBandIron(input) {
  if (input.clubMode !== undefined && input.clubMode !== 'iron') {
    throw new RangeError(
      `strikeBandIron dekker bare clubMode "iron", fikk "${input.clubMode}". ` +
        'Driver-bandene Low/High er udokumenterte og hører til en senere fase.',
    );
  }

  const geometry = ironStrikeGeometry(input);

  return {
    strikeBand: strikeBandIron(
      geometry.contactHeight,
      geometry.effectiveLowPointX,
    ),
  };
}
