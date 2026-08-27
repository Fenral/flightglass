/**
 * ONBOARDING · COPY — all tekst brukeren ser, ett sted.
 *
 * STATUS: GODKJENT ORDRETT AV EIER (D105). Teksten ble levert som samlet batch
 * per D103-porten og godkjent uendret. Endres her, aldri i `steps.js` — og
 * ikke uten et nytt vedtak: hvert ord under er eierens, ikke strømmens.
 *
 * REGELEN SOM STYRER FORMEN (00-FELLES + D28/D29): tall er ALDRI literaler.
 * `9.2 m` blir `10.1 yd` når brukeren har valgt yards (D57), så hver tallbærende
 * setning tar ferdig formaterte strenger fra adapterens `displayValue` og setter
 * dem inn. Godkjenn setningen, ikke sifrene.
 *
 * Ett poeng per steg (E-brevet). Ingen emoji. Fagbegrep uforkortet.
 */

export const UNITS_SCREEN = Object.freeze({
  title: 'Distances in',
  options: Object.freeze([
    Object.freeze({ system: 'meters', label: 'METERS' }),
    Object.freeze({ system: 'yards', label: 'YARDS' }),
  ]),
  support: 'Speeds are always mph.',
  /* D11/D53: modellgrensen skal ha landet FØR første tall. Enhetsskjermen er
     den eneste tall-frie flaten før steg 1, så den bærer setningen (D103). */
  boundary: 'Modelled shot — not a measurement. Strike is assumed centred.',
});

export const CHROME = Object.freeze({
  skip: 'SKIP',
  next: 'NEXT',
  /* S4, foreslått: siste steg trenger et sluttord. NEXT ville løyet. */
  done: 'DONE',
  counter: (n, total) => `${n} of ${total}`,
});

/**
 * Én funksjon per steg. Får ferdig formaterte strenger, returnerer linja.
 * Ingen av dem regner; ingen av dem kjenner enheter.
 */
export const STEPS = Object.freeze({
  /* Steg 1 — face mot en holdt path. Poenget er at nullkurve ikke er null side. */
  1: Object.freeze({
    resting: () => 'Path is held at +3.0°. Drag Club Face up through it.',
    resolved: ({ sideAtPath, curveBefore, sideBefore }) =>
      `Face at path is zero curve — and ${sideAtPath}. `
      + `Two degrees back, the ball curved ${curveBefore} and landed ${sideBefore}.`,
  }),

  /* Steg 2 — eneste steg uten tallendring. Sier hva de to planene kan tegne. */
  2: Object.freeze({
    resting: () =>
      'DIRECTION draws the shot from above — start line, curve, side. '
      + 'HEIGHT draws it from the side — launch, apex, carry. Switch to HEIGHT.',
  }),

  /* Steg 3 — byttet: mer loft kjøper høyde og bratthet, koster carry. */
  3: Object.freeze({
    resting: () => 'Drag Dynamic Loft from 18° to 30°.',
    resolved: ({ apexGain, landingGain, carryCost }) =>
      `Twelve degrees of loft added ${apexGain} of apex and ${landingGain} of landing angle `
      + `— and cost ${carryCost} of carry.`,
  }),

  /* Steg 4 — én input, to utfall, koblet. */
  4: Object.freeze({
    resting: () =>
      'Drag Ball Position. Attack angle and club path move together — one input, two outcomes.',
    resolved: ({ lowPoint }) =>
      `Low point is now ${lowPoint} the ball. `
      + 'Attack turned positive and club path turned negative in the same move.',
  }),

  /* Steg 5 — fem bånd fra én slider; Pure uten bakkekryssing (U1/D3b). */
  5: Object.freeze({
    resting: () => 'Drag Arc Height through all five bands.',
    resolved: ({ lie }) =>
      'Pure — and no ground crossing at all. The club reaches strike height without '
      + `reaching the ground: the ball is sitting ${lie} up in the grass.`,
  }),

  /* Steg 6 — lesesteg (D101). Kjeden er grafens egen (D104). */
  6: Object.freeze({
    resting: () =>
      'Curve comes from spin axis. Spin axis comes from club face, club path, '
      + 'attack angle and dynamic loft. This map holds the structure; '
      + 'Ball Flight holds the sizes.',
  }),
});
