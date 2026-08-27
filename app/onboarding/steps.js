/**
 * ONBOARDING · STEPS — de seks stegene som data (D56).
 *
 * Hvert steg er én deklarasjon: hvilken ekte skjerm det bor i, hvilken tilstand
 * det skriver, hva som eventuelt slipper brukeren videre, hvor coachmarken får
 * stå, og hvilken linje som vises. Ingen av dem tegner noe selv.
 *
 * ── PLASSERING (D100) ──────────────────────────────────────────────────────
 * `place()` returnerer ALDRI hardkodede piksler. Den måler vertene sine egne
 * elementer i det øyeblikket steget monteres og legger boksen i det som er
 * ledig. Det er regelen fra DESIGN.md v3 anvendt mekanisk — «coachmarken
 * okkuperer den delen av skjermen som det aktuelle steget ikke bruker» — og
 * grunnen til at den er en funksjon og ikke et tall: brevets tabell var målt
 * mot en komposisjon som er forkastet, og en ny tabell ville råtnet likedan.
 *
 * Målingene som ligger bak valgene (375×812 portrett, 812×375 landskap) står i
 * leveransenotatet med avviksliste mot brevets tabell.
 *
 * ── TILSTANDSSKRIVING (D99) ────────────────────────────────────────────────
 * `script` settes ØYEBLIKKELIG ved stegbytte, uten animert glidning. Steg 3
 * stiller face tilbake til 0.0 uten at coachmarken omtaler det.
 */

import { STEPS as COPY } from './copy.js';

export const TOTAL = 6;

/* Basis for steg 1–3 (E-brevet, verifisert mot motoren). */
const FLIGHT_BASIS = Object.freeze({ speed: 95, attack: -3.0, dynLoft: 26, path: 3.0 });

/* Basis for steg 4–5. `dynamicLoftDeg` er D65 sin mid-iron-konstant, og den er
   IKKE valgfri: uten den regner ikke motoren vertikal slagflatehøyde, og
   steg 5 sitt flatesvar blir et annet. Verifisert. */
const STUDIO_BASIS = Object.freeze({
  plane: 60, dir: 0, club: 'midIron', lie: 'fairway', dynamicLoftDeg: 31,
});

/** Boks over et element, med peker ned. Brukes der handlingen ligger lavt. */
function above(rect, gap = 12) {
  return { left: null, bottom: window.innerHeight - rect.top + gap, pointer: 'down' };
}

/** Boks i en ledig sone mellom to opptatte kanter. */
function between(topEdge, bottomEdge, gap = 12) {
  return { top: topEdge + gap, maxHeight: bottomEdge - topEdge - gap * 2, pointer: null };
}

/**
 * STUDIO-SONEN (D107) — den ledige flaten i landskap, målt hver gang.
 *
 * Rettelse etter G-1/G-2 (D114). Den gamle utgaven ga `place()` bare to
 * kanter — `inset.right` og `rail.left` — og tok for gitt at det fantes plass
 * mellom dem. To målte brudd viste at antagelsen ikke holder:
 *
 *   G-1  Insetten kan MAKSIMERES, og da spenner den nesten hele scenen
 *        (x 19–913 av 932). «Venstrekanten» ble da 913 mot railens 861:
 *        sonen både kollapset og snudde, og boksen havnet 101 px utenfor.
 *   G-2  Ved 568×320 er båndet 218 px bredt, teksten brøt til 194 px høyde,
 *        og uten en toppvakt vokste boksen opp i toppstripen og dekket
 *        CLUB PATH-verdien — nøyaktig det D107 forbyr.
 *
 * Derfor returnerer denne en HEL sone med fire kanter, og lar
 * `applyPlacement` klemme boksen inn i den. To ekstra regler faller ut av
 * målingene: er båndet mellom inset og rail for smalt til å bære tekst,
 * bruker vi hele bredden og legger oss i stedet UNDER railen; og toppstripen
 * er alltid en hard kant, aldri en anbefaling.
 */
/* Smaleste bånd som fortsatt bærer en lesbar linje. Målt: ved 568×320 er
   sonen mellom inset og rail 194 px, og den ER brukbar. En høyere terskel
   (jeg prøvde 260) forkastet den og tvang boksen ut i full bredde — der den
   la seg over insetten, som bærer LIE og er selve D3b-kravet i steg 5. */
const MIN_BAND = 160;

function studioZone(host) {
  const inset = host.rect('inset');
  const rail = host.rect('rail');
  const controls = host.rect('controls');
  const top = host.rect('topStrip');
  const gap = 12;

  /* Bakkelinjen er gulvet, ikke kontrollraden. Low point-markøren ligger PÅ
     den (målt: y 251 uendret gjennom hele ballposisjon-vandringen ved
     932×430), og det er nettopp den bevegelsen steg 4 ber brukeren se. Lå
     boksen bare «over kontrollene», dekket den markøren i hver eneste
     posisjon — G-2 sitt andre punkt. Sonen stopper derfor OVER markøren når
     scenen har tegnet; har den ikke det ennå, faller vi tilbake til
     kontrollraden. */
  const marker = host.rect('lowPointMarker');
  const bottom = marker ? marker.top - gap : controls.top - gap;
  let left = inset.right + gap;
  let right = rail.left - gap;
  let topEdge = top.bottom + gap;

  /* Er sonen mellom inset og rail borte eller for smal — typisk når insetten
     er maksimert, eller på den minste D59-flaten — legger vi oss under railen
     og bruker bredden fra insetten og ut. */
  /* Er båndet mellom inset og rail borte eller ubrukelig smalt — typisk om
     insetten skulle bli maksimert — legger vi oss under railen og bruker
     bredden fra insetten og ut. Insetten slippes ALDRI som venstrekant:
     den bærer LIE, og D3b krever at underlaget er synlig når turfstatus er
     det. Heller en lav boks som ruller enn en bred som skjuler svaret. */
  if (right - left < MIN_BAND) {
    left = inset.right + gap;
    right = window.innerWidth - gap;
    topEdge = Math.max(topEdge, rail.bottom + gap);
  }

  return { zone: { left, right, top: topEdge, bottom }, pointer: null };
}

export const STEPS = Object.freeze([
  /* ── 1 · DIRECTION: path holdt på +3, dra face ─────────────────────────── */
  Object.freeze({
    n: 1,
    screen: 'ball-flight',
    script: Object.freeze({ ...FLIGHT_BASIS, face: -1.0 }),
    enter: (host) => { host.setLens('DIRECTION'); host.setActiveParam('face'); },
    /* Brevets låste port: videre først når de har passert +3, altså sett kurven
       bli null og siden bli størst. Det ER leksjonen. */
    gate: (host) => host.progress.faceCrossedPath === true,
    watch: (host) => { if (host.read('face') >= FLIGHT_BASIS.path) host.progress.faceCrossedPath = true; },
    /* Handlingen bruker scenens laterale spenn og inputkortet. Ledig: scenens
       nedre del, rett over kortet. Brevets tabell holder her. */
    place: (host) => above(host.rect('inputPanel')),
    text: (host, refs) => (host.progress.faceCrossedPath
      ? COPY[1].resolved(refs.step1)
      : COPY[1].resting()),
  }),

  /* ── 2 · lær å bytte perspektiv ────────────────────────────────────────── */
  Object.freeze({
    n: 2,
    screen: 'ball-flight',
    script: null,                       // eneste steg uten tallendring
    /* D105: steg 2 har INGEN NEXT. Linsebyttet ER svaret, samme prinsipp som
       enhetsskjermens ett trykk — en knapp ved siden av ville tilbudt en vei
       videre som hopper over handlingen steget ber om. */
    chrome: Object.freeze({ next: false }),
    /* Velgeren bor i «change»-modus. Steget peker på den, så den må finnes. */
    enter: (host) => host.ensureLensVisible(),
    gate: (host) => host.readLens() === 'HEIGHT',
    watch: () => {},
    /* AVVIK fra brevet, målt: linsevelgeren ligger IKKE øverst — den bor i
       inputkortet (y 490 av 812), med sliderne under seg helt til bunnen.
       «Under, med peker opp» finnes det ikke plass til. Boksen står derfor
       OVER velgeren og peker NED. Samme regel, motsatt side. */
    place: (host) => above(host.rect('lensSwitch')),
    text: () => COPY[2].resting(),
  }),

  /* ── 3 · HEIGHT: dra dynamic loft ──────────────────────────────────────── */
  Object.freeze({
    n: 3,
    screen: 'ball-flight',
    /* face tilbake til 0.0 (D99). Uten det stemmer ikke carry-tabellen:
       brevets tall forutsetter face-to-path −3, ikke 0. Verifisert. */
    script: Object.freeze({ ...FLIGHT_BASIS, face: 0.0, dynLoft: 18 }),
    enter: (host) => { host.setLens('HEIGHT'); host.setActiveParam('dynLoft'); },
    gate: null,
    watch: (host) => {
      const v = host.read('dynLoft');
      if (v <= 18.5) host.progress.sawLow = true;
      if (v >= 29.5) host.progress.sawHigh = true;
    },
    /* Apex ligger 75–82 % downrange — altså til HØYRE (målt). Brevets
       «nederst til siden, aldri over apex» holder, med siden avgjort: venstre. */
    place: (host) => ({ ...above(host.rect('inputPanel')), align: 'left', width: 0.62 }),
    text: (host, refs) => (host.progress.sawLow && host.progress.sawHigh
      ? COPY[3].resolved(refs.step3)
      : COPY[3].resting()),
  }),

  /* ── 4 · Studio: flytt low point ───────────────────────────────────────── */
  Object.freeze({
    n: 4,
    screen: 'studio',
    script: Object.freeze({ ...STUDIO_BASIS, low: 0, arc: 0 }),
    enter: (host) => host.setActiveParam('low'),
    gate: null,
    watch: (host) => { if (host.read('low') >= 12) host.progress.reachedForward = true; },
    /* AVVIK fra brevet, målt: «sidestilt» finnes ikke. Venstre side av scenen
       er strike-insetten, høyre er orb-railen. Eneste ledige flate er
       midtbåndet — og der tegnes buen. Boksen legges i midtbåndets NEDRE kant,
       over chips-raden, så low point-markøren og begge kortene står fri.
       D107/D114: sonen måles hver gang og toppstripen er en hard kant. */
    place: studioZone,
    text: (host, refs) => (host.progress.reachedForward
      ? COPY[4].resolved(refs.step4())
      : COPY[4].resting()),
  }),

  /* ── 5 · Studio CONTACT: flytt arc height ──────────────────────────────── */
  Object.freeze({
    n: 5,
    screen: 'studio',
    script: Object.freeze({ ...STUDIO_BASIS, low: 0, arc: -3 }),
    /* D3b: underlaget MÅ være synlig når turfstatus vises — og det ER det:
       den KOMPAKTE insetten bærer allerede «MID-IRON · FAIRWAY 8 mm»
       (STUDIO.md B2-g; maksimert modus legger kun til ASSUMED-loftcaptionen).
       D114/G-1: insetten maksimeres derfor IKKE lenger. Målt spente den
       maksimerte insetten x 19–913 av 932 px og etterlot null ledig flate —
       steget kunne ikke både maksimere og bære en coachmark. Kompakt gir
       D3b uten å spise sonen. */
    enter: (host) => { host.setActiveParam('arc'); },
    gate: null,
    watch: (host) => { host.progress.bands ??= new Set(); host.progress.bands.add(host.read('turfBand')); },
    /* AVVIK fra brevet, målt: «øvre område, som er tomt her» er den mest
       opptatte sonen — full toppstripe (HOME · ATTACK · PATH · RESET) og
       insetten rett under. Samme sone som steg 4. */
    place: studioZone,
    text: (host, refs) => (host.read('turfBand') === 'Pure'
      ? COPY[5].resolved(refs.step5())
      : COPY[5].resting()),
  }),

  /* ── 6 · Connections: lesesteg (D101), grafens egen kjede (D104) ────────── */
  Object.freeze({
    n: 6,
    screen: 'connections',
    script: null,
    enter: (host) => host.setMetric('curve'),
    gate: null,
    watch: () => {},
    /* AVVIK fra brevet, målt: «nederst» er nodekortet, som står åpent fordi
       roten starter fokusert (C-f/D101). Ledig felt er mellom nøkkellinjen og
       kortet — altså midt på skjermen. */
    place: (host) => between(host.rect('edgeKey').bottom, host.rect('nodeCard').top),
    text: () => COPY[6].resting(),
  }),
]);

export { FLIGHT_BASIS, STUDIO_BASIS };
