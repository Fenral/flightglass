> **KORREKSJONER 2026-08-25.** Impact Studio er vesentlig endret. Spec-teksten
> under er ikke rettet — sporet skal være synlig.
>
> **`clubMode` er avviklet.** Den bandt tre uavhengige beslutninger sammen:
>
> | Var | Er nå | Tilhører |
> |---|---|---|
> | `lift` (0 / 0.030 m) | `lieHeightMm`, 0–45 | **underlaget** |
> | `sweet` (0.0213 / 0.033 m) | `sweetSpotHeightMm` per køllekategori | **kølla** |
> | `zClub` (−0,2 / +1,8 cm) | *fjernet* — buens bunn er svingens | **piggen, en tredje gang** |
>
> Konsekvens: tre tilstander som var umulige å uttrykke er nå gyldige —
> **driver fra bakken**, **3-wood fra pigg**, **jern fra pigg**.
>
> **Driverpresentasjonen** er ikke lenger en mock stand-in med eget vokabular.
> Regimet velges av **underlaget**, ikke av køllemerket: en driver fra bakken får
> turf-vokabular fordi det *er* turf i spill; et jern fra pigg får flatevokabular.
>
> **Slagflaten har en fysisk grense.** `faceCentreOffsetMm` kan aldri overskride
> `faceHeightMm / 2`. I den gamle modellen lå **1 198 av 2 500 caser** utenfor en
> fysisk flate, umerket — inkludert `−121,15 mm` på en 55 mm flate.
>
> **Treffpunkt rapporteres i to mål** (D24): absolutt mm fra sweetspot for fysikken,
> og andel av slagflatehøyden for lesbarheten.
>
> Ny produksjonssti: `engine/src/studioSolve.js`. `deriveImpact.js` beholdes som
> pinnet v1-baseline. Full diff: `D7-DIFF.md`.

# Impact Studio

Impact Studio er et interaktivt landskapsinstrument for å forstå buegeometrien
rundt impact: hvor køllen er på buen, hvor low point ligger, om bakken treffes
før eller etter ballen, og hvilken Attack Angle og Club Path geometrien gir.

![Impact Studio i Face On](./assets/impact-studio.png)

> Skjermbildet er en funksjonsreferanse. Det nye designsystemet kan endre all
> visuell styling, men ikke informasjonshierarkiet eller motorgrensene.

## Produktjobb

Brukeren skal kunne svare på:

> «Hvordan endrer bue, plan, retning og ballplassering treffet, low point,
> Attack Angle og Club Path?»

Studio skal forklare geometri. Det skal ikke beregne eller antyde Carry, spin
eller ballflukt.

## Plattform og orientering

- Telefon i landskap.
- Historisk route: `impact-studio.html`.
- Jern er ærlig V1-standard.
- Én tydelig Home-kontroll øverst til venstre.
- Ingen permanent bunnmeny.

## Input

| Input | Standard jern | Område | Steg |
|---|---:|---:|---:|
| Swing Plane | `60°` | 30–80° | 0.5° |
| Swing Direction | `0°` | −12–+12° | 0.1° |
| Ball Position | `0 cm` | −20–+20 cm | 0.1 cm |
| Arc Height | `0 cm` | −5–+5 cm | 0.1 cm |

Driver-knappen setter i dagens app et 50° plane-preset. Selve driverkontakten er
merket som en mock stand-in og skal ikke porteres som validert fysikk.

## Avledet output

| Output | Forklaring |
|---|---|
| Attack Angle | Tangentens vertikale retning ved impact. |
| Club Path | Tangentens horisontale retning ved impact. |
| Low Point | Buens laveste punkt relativt til ballen. |
| Entry / Exit | Modellert kryssing av bakkeplanet. |
| Strike band | Pure, Thin, Fat, Duff eller Whiff. |
| Face-centre offset | Kontaktens vertikale avvik i millimeter. |

Attack og Path er resultater her. De må ikke presenteres som frie Studio-input.

## Tre visninger

### Face On

Hovedvisningen for:

- ball og bakken;
- bue og low point;
- ground entry/exit;
- Attack Angle;
- ballposisjon og Arc Height;
- ghost club ved kontakt eller turf entry.

Low Point-prikken og selve svingbuen skal være synlig hele tiden. Midlertidige
forklaringschips eller piler kan aldri dekke dem.

### Down the Line

Viser:

- Swing Plane som et tydelig plan/glass;
- Swing Direction;
- Club Path;
- buen i et DTL-perspektiv;
- samme geometriske state som Face On.

View-knappen skal vise destinasjonen: i Face On står det `DTL`; i DTL står det
`FO`. En kort, raskt uttonende bekreftelse kan vises etter byttet.

### Strike / Contact Zone

En alltid tilgjengelig minivisning kan ekspanderes til kontaktinspeksjon. Den
skal vise:

- ball, kølle og bakke i relevant skala;
- arc gjennom kontaktområdet;
- Entry, Low og Exit når de finnes;
- strike band og offset i millimeter;
- tydelig `NO TURF CONTACT` når buen ikke krysser bakken.

Strike er en inspeksjonsvisning av samme geometri, ikke et nytt inputpanel eller
en separat motor.

## Ghost club

Ghost club viser hvor køllen er ved den hendelsen som forklarer utfallet:

- hvis køllen når ballen før bakken, vis treffposisjonen;
- hvis køllen treffer bakken før ballen, flytt ghost club til `Entry`;
- ghosten skal være sekundær og aldri konkurrere med live kølle eller low point.

## Low Point-instrumentet

Low Point skal være et måleinstrument, ikke en dekorativ ring:

- markøren ligger fysisk på buen;
- en kort leader kan knytte den til en lesbar label over buen;
- avstand foran/bak ballen skal ha fortegn og enhet;
- markøren må kunne leses mot både tracer, bakke og turf;
- ingen transient Attack/Low Point-chip kan dekke markør, ball eller bue.

## Motorgrense

Studio eier en stiv, sirkulær bue i ett plan. Den viser hva denne geometrien
ville gi ved impact. Den vet ikke:

- hvilken kropp- eller køllebevegelse som skapte buen;
- shaft dynamics, face closure eller faktisk clubhead deformation;
- ballens launch, spin, carry eller curve;
- faktisk turfrespons, divot eller underlag;
- validert driverkontakt i dagens stand-in-modus.

Studio må derfor aldri vise Ball Speed, Backspin, Carry eller en flight tracer.

## State-kontrakt

En ren Studio-state kan se slik ut:

```js
{
  clubMode: "iron",
  view: "face",
  radiusM: 1.2,
  swingPlaneDeg: 60,
  swingDirectionDeg: 0,
  ballPositionCm: 0,
  arcHeightCm: 0,
  strikeExpanded: false
}
```

Motoren skal motta normalisert geometri, ikke DOM-verdier eller pixelmål.
Kamera og paneltilstand skal ikke endre avledet Attack, Path eller kontakt.

## Interaksjonsregler

1. Velg én av de fire parameterne.
2. Bruk én felles slider med synlig min, maks, null/reference og nåverdi.
3. Oppdater bue, marker, derived values og Strike-preview live.
4. Vis en kort vektor/label etter endring, men la grunngeometrien stå synlig.
5. Reset gjenoppretter det dokumenterte jern-eksemplet.

## Akseptansekriterier

1. Face On, DTL og Strike leser samme state og samme geometrimotor.
2. Attack og Path endres live uten at kameraet endrer tallene.
3. Low Point og bue er alltid synlige.
4. Ghost club flyttes til ground Entry ved turf-first state.
5. Strike-preview er alltid tilgjengelig og ekspanderer uten å lage ny fysikk.
6. Ingen ballflight-, spin- eller carryclaim finnes i Studio.
7. Driver merkes eksplisitt som ikke validert eller fjernes inntil egen modell
   finnes.
8. Landskap fungerer ved minst 568 × 320, 812 × 375 og 932 × 430.
9. Slider, chips og view-kontroller er minst 44 px og har accessible names.
10. Reduced motion viser samme sluttgeometri uten ambient loops eller flashes.

## Kilder i gammel kodebase

- `impact-studio.html`
- `swing-parameters-and-impact.js`
- `scripts/impact-studio-browser.test.mjs`
- `scripts/academy-attack-at-impact-model.test.mjs`
- `scripts/academy-plane-coupling-model.test.mjs`
- `scripts/academy-contact-height-model.test.mjs`

## Relatert

- [Motor og modell](./01-PHYSICS-AND-MECHANICS-ENGINE.md)
- [Ball Flight](./02-BALL-FLIGHT.md)
- [Ask Flightglass og Connections](./05-ASK-FLIGHTGLASS-AND-CONNECTIONS.md)
