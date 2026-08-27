> **KORREKSJONER 2026-08-25.** Spec-teksten under er ikke rettet — sporet skal
> være synlig.
>
> **Linsene er redusert fra tre til to** (D40): `TOP` → **DIRECTION**,
> `SIDE` → **HEIGHT**. `FLIGHT` er fjernet. D-plane-visningen lever videre som
> egen modul, men deler linsenavn med Ball Flight.
>
> **`spinCalibration` mates med 3D spin loft** (D36, F8). Dokumentet beskriver
> D-plane-geometrien korrekt, men motoren matet kalibreringssigmoiden med den
> *vertikale* spin loften — blind for face og path. Smash brukte allerede 3D.
> Verifisert 4315/4315 begge veier. Effekten er størst nettopp der D-plane
> forklarer noe: ved stor face-to-path, opptil 35,6 %.
>
> **Ballradius** er `0.021336 m`, ikke `0.021335` eller `0.0213`.

# D-plane

D-plane er retningslinsen i Ball Flight. Den gjør forholdet mellom Club Face,
Club Path, Attack Angle og Dynamic Loft synlig, og viser hvordan leveringen
former startretning, spinnakse, curve og sluttposisjon.

![D-plane i Top-visning](./assets/d-plane.png)

> Skjermbildet er en funksjonsreferanse. Det nye designsystemet kan endre
> komposisjon, farge og typografi. Motor, tegnkontrakt og kausal retning skal
> bevares.

## Viktigste arkitekturbeslutning

D-plane er **ikke** en separat physics engine.

```text
D-plane entry
    ↓
Ball Flight state
    ↓
selectOutcome
    ↓
solveFlight
```

Historisk deep link er `impact.html?surface=dplane`. Den åpner Ball Flight i:

- `Change`-modus;
- `Top`-visning;
- samme fem input og samme output som resten av Ball Flight.

En ny kodebase kan gi D-plane en egen menyinngang og route, men må ikke lage
`solveDPlane`, en ny inputmodell eller kopierte formler.

## Produktjobb

Brukeren skal kunne svare på:

> «Hvorfor startet ballen der, hvorfor kurvet den, og hvilken rolle hadde face,
> path, attack og loft?»

## Første frame

D-plane åpner med:

- target line;
- Club Face og Club Path synlig;
- Start/Launch Direction;
- live ballbane;
- Curve og final Side;
- Club Speed;
- referansetrace hvis en er festet.

Attack Angle og Dynamic Loft trenger ikke være synlige samtidig i første frame.
De kan nås gjennom Side/launch-plane-linsen. Alle fem input må likevel være
tilgjengelige uten å forlate den delte Ball Flight-state-en.

## De sentrale relasjonene

### Face og Path former Start Direction

```text
Start Direction =
  loft-dependent face weight × Face
  + remaining weight × Path
```

Face er normalt den sterkeste driveren, men vekten endres med Dynamic Loft.
UI-et skal derfor ikke vise en universell fast 75/25-prosent.

### Face-to-Path former kurveretningen

```text
FaceToPath = FaceAngle − ClubPath
```

For en høyrehendt golfer i denne tegnkontrakten:

- positivt gap tenderer mot Fade/Slice;
- negativt gap tenderer mot Draw/Hook;
- nær null gir en nær rett kurverespons.

Den viste Spin Axis kommer likevel fra den fulle 3D-vektoren `v × n`, ikke fra
en enkel 2D-gain på Face-to-Path.

### Attack og Loft bestemmer den vertikale separasjonen

```text
Signed vertical Spin Loft = Dynamic Loft − Attack Angle
```

Denne vertikale separasjonen påvirker blant annet sann 3D Spin Loft,
spin magnitude, Launch Angle og hvor sterkt samme face/path-gap kan vippe
spinnaksen. Derfor er spørsmålet «påvirker loft og attack draw/fade?» ikke et
rent ja/nei i fysikken:

- de setter normalt ikke venstre/høyre-retningen alene;
- de kan endre 3D-aksens tilt og dermed styrken på curve-responsen;
- Face og Path er fortsatt de primære retningsdriverne.

## Hva Top-visningen skal tegne

| Element | Betydning |
|---|---|
| Target line | Nullretningen alle vinkler måles mot. |
| Club Path-vector | Køllehodets horisontale retning ved impact. |
| Face-vector/normal | Hvor køllebladet peker ved impact. |
| Launch line | Ballens første retning etter impact. |
| Live trace | Modellens flygebane i plan. |
| Curve | Bend fra launch line, ikke fra target line. |
| Side | Sluttposisjon relativt til target line. |
| Pinned reference | Tidligere modellstate for før/etter-sammenligning. |

Piler, vinkler og labels må ligge i samme koordinatsystem. Ingen linje kan være
dekorativ hvis den ser ut som et målt fysisk signal.

## Tekst og tegn

For høyrehendt motorstate:

| Verdi | Positivt | Negativt |
|---|---|---|
| Face | Open / Right | Closed / Left |
| Path | In-to-out / Right | Out-to-in / Left |
| Launch Direction | Right | Left |
| Spin Axis | Right curve | Left curve |
| Curve | Right from launch line | Left from launch line |
| Side | Right of target | Left of target |

**Ny tilgjengelighetsforbedring i gjenoppbyggingen:** Tall skal ledsages av
`L/R/C` eller ord. Farge alene er ikke tilstrekkelig. Den gamle flaten bruker
bare fortegn på enkelte gradverdier.

## State og navigasjon

D-plane skal lese og skrive nøyaktig samme object som Ball Flight:

```js
{
  clubSpeed,
  faceAngle,
  clubPath,
  attackAngle,
  dynamicLoft
}
```

Følgende er kun view state:

```js
{
  mode: "change",
  lens: "top"
}
```

View state skal ikke inngå i motorens beregning eller cache key.

## Ikke lov å påstå

D-plane viser ikke:

- hvilken kroppsbevegelse som skapte Face eller Path;
- gear effect fra et off-centre driver-treff;
- dynamisk lie eller face strike;
- en faktisk målt TrackMan-flight;
- vær- eller ballspesifikk curve;
- at Backspin direkte driver Carry eller Landing i dagens hybridmotor.

## Akseptansekriterier

1. D-plane og Ball Flight er numerisk identiske for samme fem input.
2. Deep link åpner Change + Top med Face og Path synlig.
3. Bytte til Side viser Attack og Loft uten å miste state.
4. Start Direction, Curve og Side skilles visuelt og språklig.
5. Target line, face, path og launch line bruker samme koordinat- og
   fortegnssystem.
6. Kamera, zoom eller lens skal aldri endre fysikkresultatet.
7. Portrett fungerer ved 375 × 812, 390 × 844 og 430 × 932.
8. Reduced motion beholder vectors, sluttbane, labels og tall uten løpende
   traceranimasjon.
9. Det finnes ingen separat D-plane-solver i kodebasen.

## Kilder i gammel kodebase

- `impact.html?surface=dplane`
- `impact-outcome.js`
- `impact-flight.js`
- `flightglass-3d-spin-model.js`
- `scripts/impact-portrait-browser.test.mjs`
- `scripts/v1-home-hub-contract.test.mjs`

## Relatert

- [Motor og modell](./01-PHYSICS-AND-MECHANICS-ENGINE.md)
- [Ball Flight](./02-BALL-FLIGHT.md)
- [Ask Flightglass og Connections](./05-ASK-FLIGHTGLASS-AND-CONNECTIONS.md)
