> **KORREKSJONER 2026-08-25.** Dette dokumentet beskriver motoren slik den var.
> Følgende er endret ved låste beslutninger. Spec-teksten under er ikke rettet —
> sporet skal være synlig.
>
> | § | Endring | Ref |
> |---|---|---|
> | §5.4 | `spinCalibration` skal mates med **3D spin loft**, ikke vertikal. §5.5 (smash) brukte allerede 3D — verifisert 4315/4315 begge veier. | D36, F8 |
> | §5.6 | Det empiriske carry-fittet **beholdes**. RK4 skal ikke overta lengden: empirisk 1,04 % snittfeil mot RK4 7,52 % over 12 tourkøller. | D34 |
> | §5.7 | `dragCompatibilityScale = 1.275116456035` er et **7-jern-anker**. Krysser null ved 6-/7-jern, bommer monotont derfra. | F12 |
> | §5.4 | Spinntaket heves `9000 → 13000` rpm. Maks rå spinn innenfor køllekonvolutten er 11 764. | D22 |
> | §8.1 | `lowPointZ` skal **ikke** ha køllekorreksjon. `zClub` kodet piggen en tredje gang. | `studioSolve.js` |
> | §8.5 | Klassifiseringen bruker **tre akser**: køllehøyde, effektiv low point, og om kølla er nedadgående. Whiff-terskelen er `1.4 × ballradius`. | D5 |
> | §8.5 | **Begge svar returneres alltid** — turf-interaksjon og flateposisjon er ulike spørsmål. | U1, D3b |
> | §10 | `lieHeightMm`, `sweetSpotHeightMm` og `faceHeightMm` er nå navngitte input, ikke skjult i `clubMode`. | D17, D17b |
> | — | Ballradius er `0.021336 m` (R&A: diameter 42,672 mm eksakt), ikke `0.021335` eller `0.0213`. | `KOLLEGEOMETRI.md` |
>
> **F11:** jernets `sweetSpotAboveSole = 0.0213` var **ballradiusen limt inn**.
> De kansellerte hverandre i formelen, så `faceCentreOffsetMm` for jern målte
> aldri et treffpunkt — den målte køllehøyde over bakken, negert. Verifisert med
> 1.42e-14 mm avvik over 1250 caser. Målt verdi er **18,4 mm**.

# Motor for fysikk og mechanics

Denne filen er gjenoppbyggingskontrakten for Flightglass-motoren. Den beskriver
det dagens produkt faktisk beregner. Den er ikke en påstand om at modellen
dekker all golfballfysikk eller alle svingbevegelser.

## 1. Modellarkitektur

Flightglass har to motorer med ulike oppgaver:

```text
STUDIO GEOMETRY
Swing Plane + Swing Direction + Ball Position + Arc Height
                             ↓
         Low Point + impact tangent + contact height
                             ↓
                 Attack Angle + Club Path

BALL FLIGHT / D-PLANE
Club Speed + Face + Path + Attack + Dynamic Loft
                             ↓
                separation geometry and spin
                             ↓
       launch + curve + carry + landing outcomes
```

Attack Angle og Club Path er derfor kontekstavhengige:

- I **Impact Studio** er de avledet fra den valgte svingbuen.
- I **Ball Flight/D-plane** er de fem leveringsinput brukeren kan endre direkte.

De to motorene skal aldri kobles med en skjult inversjon som later som én unik
svinggeometri kan utledes fra et ønsket ballutfall.

## 2. Sannhetsnivåer

Alle nye outputfelt skal ha ett av disse nivåene:

| Nivå | Betydning | Eksempel |
|---|---|---|
| **Sourced** | En kjent relasjon som modellen har kodet eksplisitt. | Startretning er face-dominert og loft-avhengig. |
| **Calculated** | Direkte beregnet fra modellens geometri eller integrasjon. | 3D Spin Loft, Spin Axis og lateral curve. |
| **Modelled estimate** | Kalibrert eller empirisk fit, ikke en måling. | Launch Angle, Ball Speed, Carry, Apex og Landing Angle. |
| **Not modelled** | Motoren har ikke nødvendige input eller validering. | Treffpunkt på slagflaten, vind, balltype og personlig optimalverdi. |

UI-et må gjøre disse forskjellene synlige. Et estimat skal aldri presenteres som
en målt eller personlig sannhet.

## 3. Ball Flight-input

Motorens offentlige kall er konseptuelt:

```js
solveFlight({
  clubSpeed,
  faceAngle,
  clubPath,
  attackAngle,
  dynamicLoft,
})
```

| Felt | Enhet | Fortegn for høyrehendt golfer | Gjeldende UI-område |
|---|---|---|---:|
| `clubSpeed` | mph | Ikke-negativ | 30–150 |
| `faceAngle` | grader | `+` åpent/høyre, `−` lukket/venstre | −15–+15 |
| `clubPath` | grader | `+` in-to-out/høyre, `−` out-to-in/venstre | −15–+15 |
| `attackAngle` | grader | `+` opp, `−` ned | −15–+15 |
| `dynamicLoft` | grader | Levert loft ved treff | 0–50 |

Den gamle JavaScript-adapteren koerker manglende verdier, `null`, tom tekst og
numeriske strenger før beregningen; bare ikke-endelige verdier og negativ
`clubSpeed` feiler. Gjenoppbyggingen strammer inn den offentlige solver-
kontrakten: `solveFlight` skal bare motta endelige tall, mens eventuell parsing
for bakoverkompatibilitet skal skje i et separat adapterlag. UI-et kan ha egne
slidergrenser, men må ikke endre motorens matematiske resultat etterpå.

## 4. Koordinater og fortegn

Den tredimensjonale motoren bruker et høyrehendt system:

```text
x = golferens høyre
y = mållinjen
z = opp
```

For en høyrehendt golfer betyr positive verdier:

- `startDirection > 0`: ballen starter høyre.
- `spinAxis > 0`: aksen gir høyrekurve.
- `curve > 0`: ballen bøyer høyre fra sin launch-linje.
- `offline > 0`: ballen avslutter høyre for mållinjen.

Venstrehendt visning er en presentasjonsoppgave. Selve motorens tegnkontrakt må
forbli stabil.

## 5. Beregningskjeden for Ball Flight

### 5.1 Startretning

Face-vekten avhenger av Dynamic Loft:

```text
faceWeight = clamp(0.90 − 0.005 × DynamicLoft, 0.60, 0.88)

StartDirection =
  faceWeight × FaceAngle
  + (1 − faceWeight) × ClubPath
```

Dette gir mer face-dominans ved lavt loft og mindre ved høyt loft. Det er ikke
en konstant «75/25-regel» for alle køller.

### 5.2 Eksakt sentrert D-plane-geometri

Motoren bygger en normert køllehastighetsvektor `v` og en face-normal `n`:

```text
v = (cos A · sin P, cos A · cos P, sin A)
n = (cos L · sin F, cos L · cos F, sin L)
```

der `A` er Attack, `P` Path, `L` Dynamic Loft og `F` Face, alle konvertert
fra grader til radianer før trigonometrien.

```text
SpinLoft3D = atan2(|v × n|, v · n) × 180/π
axis       = normalize(v × n)
SpinAxis   = −atan2(axis.z, hypot(axis.x, axis.y)) × 180/π
```

Den offentlige `spinAxis`-verdien er denne signerte tilt-vinkelen i grader,
ikke selve tredimensjonale aksevektoren.

`signedVerticalSpinLoft = DynamicLoft − AttackAngle` beholdes separat fordi
den prinsipale 3D-vinkelen alltid er ikke-negativ.

### 5.3 Launch Angle

Launch Angle er et modellert fit:

```text
interceptBlend = clamp(DynamicLoft / 10, 0, 1)

LaunchAngle =
  10.391891433573875 × interceptBlend
  − 0.1693792957175766 × DynamicLoft
  + 0.012024703872880052 × DynamicLoft²
  + 0.25 × AttackAngle
```

Interceptet fases ut under 10° loft for å unngå et kunstig positivt launch ved
0° loft.

### 5.4 Spin og spinnakse

Spinretningen kommer fra den eksakte 3D-aksen. Total spin beregnes med en
idealisert «rolling at separation»-modell basert på:

- sann 3D Spin Loft;
- køllehastighet;
- golfballens masse `0.04593 kg`;
- radius `0.021335 m`;
- ballens treghetsfaktor `0.4`;
- antatt køllehodemasse `0.200 kg`;
- en synlig, loft-avhengig kalibreringskurve.

Den eksakte shippingberegningen er:

```text
verticalSpinLoft = abs(DynamicLoft − AttackAngle)

spinCalibration =
  0.81 + 0.32 / (1 + exp(−(verticalSpinLoft − 31.98) / 2.14))

tangentialClubSpeedMps =
  ClubSpeed × 0.44704 × sin(SpinLoft3D × π/180)

denominator =
  BallRadius × (1 + InertiaFactor × (1 + BallMass / ClubHeadMass))

spinRadPerSecond =
  spinCalibration × tangentialClubSpeedMps / denominator

totalSpinRpm = clamp(spinRadPerSecond × 60 / (2π), 0, 9000)
```

Hvis 3D-aksen ikke er definert, eller Ball Speed er null, settes total spin til
null. Ellers plasseres denne størrelsen på den eksakte 3D-spinnaksen.

Total spin har ingen kunstig minimumsverdi, men har et sanity ceiling på
`9000 rpm`. Signert backspin og høyre/venstre curve-spin er projeksjoner av den
samme spinnvektoren. Den offentlige `backspin`-verdien er absoluttverdien av
`signedBackspinRpm`; de er ikke uavhengige årsaksinput.

Motoren forutsetter sentrert treff. Den valgfrie gear-effect-hjelperen brukes
ikke av shipping `solveFlight`.

### 5.5 Smash og Ball Speed

```text
smashEfficiency = clamp(
  1.544034400161688
  − 0.0033788247838473073 × SpinLoft
  − 0.00006496570484201677 × SpinLoft²,
  1.15,
  1.52
)

BallSpeed = ClubSpeed × smashEfficiency
```

Dette er et estimat. Det inkluderer ikke faktisk treffpunkt, COR for valgt
kølle, ballmodell eller en individuell køllekalibrering.

### 5.6 Carry, Apex, Landing Angle og Total

Longitudinell flukt er en kompakt modell kalibrert mot et begrenset offentlig
TrackMan-bag-datasett:

```text
carrySpeedFit =
  0.9205937574433162 × BallSpeed
  + 0.004072298666112809 × BallSpeed²

launchEfficiency = sqrt(clamp(max(0, LaunchAngle) / 10, 0, 1))
Carry = carrySpeedFit × launchEfficiency
```

Apex, Landing Angle og Total beregnes slik:

```text
apexBase =
  0.1300557732 × BallSpeed × launchEfficiency

apexLaunch =
  0.0079993922 × BallSpeed × max(0, LaunchAngle) × launchEfficiency

Apex = apexBase + apexLaunch

verticalSpinLoft = abs(DynamicLoft − AttackAngle)
landingModel = 52.8 − 41.5 × exp(−verticalSpinLoft / 10.9)
LandingAngle = hasFlight ? clamp(landingModel, 32, 60) : 0

rollFraction = Carry > 0
  ? clamp(0.04 − (LandingAngle − 45) × 0.0015, 0.012, 0.055)
  : 0

Total = Carry × (1 + rollFraction)
```

Carry, Apex, Landing Angle og Total er modellestimater. De er ikke resultatet
av en full longitudinal ball-/bane-/underlagsmodell.

### 5.7 Aerodynamisk curve

Lateral curve beregnes med en deterministisk RK4-integrasjon av:

- gravitasjon `9.80665 m/s²`;
- standard lufttetthet `1.225 kg/m³`;
- null vind;
- drag og Magnus-løft;
- 4 prosent spinntap per sekund;
- en historisk Pro-V1-klasse-koeffisientbro.

Konstantene er:

```text
Ball mass            = 0.04593 kg
Ball radius          = 0.021335 m
Air density          = 1.225 kg/m³
Kinematic viscosity  = 1.46 × 10⁻⁵ m²/s
Gravity              = 9.80665 m/s²
Wind                 = (0, 0, 0) m/s
Spin decay           = 0.04 per second
RK4 step             = 0.01 s
Maximum flight time  = 30 s
```

Ved hvert integrasjonssteg:

```text
airVelocity   = velocity − wind
speed         = |airVelocity|
spinParameter = BallRadius × |omega perpendicular to airVelocity| / speed
Reynolds      = speed × 2 × BallRadius / KinematicViscosity

Cl = 0.4072 × max(0, spinParameter)^0.4

CdBridge =
  0.2016141765
  + 0.0463816544 / (1 + exp((Reynolds − 85000) / 9000))
  + 0.06 × spinParameter / (0.15 + spinParameter)

Cd = CdBridge × 1.275116456035
dynamicPressureArea = 0.5 × AirDensity × π × BallRadius² × speed²
dragForce = −dynamicPressureArea × Cd × unit(airVelocity)
liftForce = dynamicPressureArea × Cl × unit(omega × airVelocity)
acceleration = (dragForce + liftForce) / BallMass + gravity
d|omega|/dt = −0.04 × |omega|
```

Koeffisientbroens deklarerte gyldighetsområde er Reynolds `70 000–210 000`
og spin parameter `0.08–0.20`. Solveren returnerer diagnostikk når banen går
utenfor området; den laterale verdien er da en eksplisitt ekstrapolasjon.

RK4 kjører til første kryssing av bakken. Treffpunktet interpoleres lineært
mellom siste positive og første negative høyde. Hvis bakken ikke nås innen 30
sekunder, skal solveren feile.

Moderne, navngitte ballkoeffisienter er ikke offentlige. Koeffisientbroen er
derfor eksplisitt ikke en nøyaktig modell av dagens Pro V1 eller Pro V1x.

RK4-solven eier den laterale bøyen. Den terminale laterale/downrange-ratioen
projiseres over på den empiriske Carry-distansen når rå downrange er minst
`1 m`. Dette er kompatibilitetslim, ikke en ballkoeffisient. Faktoren
`1.275116456035` er en fast 7-jern-kompatibilitetskalibrering for curve-solven,
ikke en fysisk egenskap ved golfballen.

### 5.8 Sluttposisjon

```text
Offline = Carry × sin(StartDirection × π/180) + Curve
```

Dermed kan et rent push/pull ha sideavvik selv når `Curve = 0`.

Dette er også en dokumentert ekstremvinkelbegrensning: den launch-line-relative
curve-komponenten roteres ikke med et ekstra `cos(StartDirection)`-ledd når den
legges til target-relative Side. Feilen er liten i det normale sliderområdet,
men den nye motoren skal beholde golden cases eller gjøre en eksplisitt,
versjonert fysikkendring — ikke «rydde» formelen inne i UI-et.

## 6. Ball Flight-output

| UI-verdi | Motorfelt | Enhet i motor | Truth |
|---|---|---|---|
| Launch Direction | `startDirection` | grader | Sourced blend |
| Spin Axis | `spinAxis` | grader | Calculated 3D geometry |
| Curve | `curve` | yards | Calculated lateral flight + carry projection |
| Side | `offline` | yards | Modelled composition |
| Launch Angle | `launchAngle` | grader | Modelled estimate |
| Spin Loft | `spinLoft` | grader | Calculated 3D geometry |
| Backspin | `backspin` | rpm | Absoluttverdi av calculated signed projection, calibrated magnitude |
| Landing Angle | `landingAngle` | grader | Modelled estimate |
| Smash | `smash` | ratio | Modelled estimate |
| Ball Speed | `ballSpeed` | mph | Modelled estimate |
| Carry | `carry` | yards | Modelled estimate |
| Total | `total` | yards | Modelled estimate |
| Apex | `apex` | yards | Modelled estimate |

UI-adapteren konverterer Carry, Total, Apex, Curve og Side én gang fra yards
til meter med `0.9144`. Ingen renderer skal konvertere på nytt.

## 7. Tegnet bane

Den synlige banen bruker normaliserte samplepunkter:

```text
x = downrangeFraction × CarryMetres
y = lateralFraction × SideMetres
z = heightFraction × ApexMetres
```

Høydeprofilen i rendererens samplefunksjon er illustrativ og topper ved omtrent
52 prosent av carry. Den er ikke den samme som RK4-integrasjonens fulle
longitudinelle bane. Exact numeric readouts kommer fra motoroutput, ikke fra
pixelposisjoner.

## 8. Impact Studio-motor

Studio bruker en stiv, sirkulær bue i et plan. Verdensaksene er:

```text
+X = target
+Y = bort fra Face On-kamera
+Z = opp
```

### 8.1 Input

| Felt | Betydning |
|---|---|
| Swing Plane | Helningen på bueplanet. |
| Swing Direction | Retningen planet peker gjennom målsystemet. |
| Ball Position | Ballens posisjon relativt til buens low point. |
| Arc Height | Vertikal forskyvning av buen/low point. |
| Radius | Buens radius; standardmotoren bruker `1.20 m`. |

Dagens Studio-UI mapper de brukervennlige cm-kontrollene til motorstate slik:

```text
LowPointX = (10.5 − BallPositionCm) / 100

Iron LowPointZ  = (ArcHeightCm − 0.2) / 100
Driver LowPointZ = (ArcHeightCm + 1.8) / 100
```

Disse offsetene er del av dagens visualiserte eksempel, ikke universelle
kølledata. Driveroffseten tilhører den uvaliderte stand-in-modusen.

### 8.2 Effektivt low point

Swing Direction flytter det effektive low point forskjellig avhengig av Swing
Plane:

```text
perDegree = Radius × cos(SwingPlane × π/180) × π / 180

EffectiveLowPointX =
  LowPointX − SwingDirection × perDegree
```

En flatere plane gir større horisontal forskyvning per grad enn en brattere
plane.

### 8.3 Treffparameter på buen

```text
thetaAtImpact = asin(
  clamp(−EffectiveLowPointX / Radius, −0.999, 0.999)
)
```

Tangenten i denne posisjonen gir leveringen ved treff.

### 8.4 Avledet Attack og Path

For `theta = thetaAtImpact` i radianer og
`phi = SwingPlane × π/180`:

```text
horizontalParallel      = cos(theta)
horizontalPerpendicular = −sin(theta) × cos(phi)
vertical                = sin(theta) × sin(phi)

AttackAngle = atan2(
  vertical,
  hypot(horizontalParallel, horizontalPerpendicular)
) × 180/π

ClubPath = SwingDirection + (
  atan2(horizontalPerpendicular, horizontalParallel) × 180/π
)
```

Dette er geometriske resultater, ikke en diagnose av kroppen eller køllens
virkelige bevegelse.

### 8.5 Kontakt og strike

Studio beregner køllehøyden ved ballen fra low point, radius, treffparameter og
Swing Plane. Denne høyden sammenlignes med ballradius `0.0213 m` og low point
foran/bak ballen.

Gjeldende jernklassifisering:

| Band | Hovedregel |
|---|---|
| Duff | Køllen ligger mer enn 25 mm under bakken ved ballen. |
| Fat | Køllen er under bakken, eller low point ligger bak ballen i treffsonen. |
| Pure | Kontakt under/ved ballens sentrum og low point 20–150 mm foran ballen. |
| Thin | For høy eller for grunn kontakt, men køllen treffer fortsatt ballsonen. |
| Whiff | Køllen passerer over ballsonen. |

`105 mm` foran ballen er modellens midtpunkt for ideelt jern-low-point.
Driverpresentasjonen i dagens Studio er en **mock stand-in** og skal ikke
markedsføres som validert driverfysikk i en ny kodebase.

## 9. Golden cases

Disse fire casene kan brukes som første portingstest. Sammenlign med toleranse,
ikke avrundet UI-tekst.

| Case | Input: speed / face / path / attack / loft | Nøkkeloutput |
|---|---|---|
| Neutral iron | `90 / 0 / 0 / −4 / 24` | Start `0°`; Launch `12.2530°`; Axis `0°`; Carry `164.9421 m`; Backspin `4834.54 rpm`; Straight. |
| D-plane default | `90 / +2 / 0 / +3 / 24` | Start `+1.56°`; Axis `+5.0765°`; Curve `5.3610 m R`; Side `10.0510 m R`; Carry `172.2727 m`. |
| Push draw | `90 / +2 / +5 / −3 / 24` | Start `+2.66°`; Axis `−6.0044°`; Curve `6.5801 m L`; Side `1.1183 m R`; Push Draw. |
| No flight | `90 / 0 / 0 / 0 / 0` | Launch, carry, curve, apex, landing og spin `0`; `inDomain = false`. |

## 10. Ikke modellert

Motoren kjenner ikke:

- faktisk treffpunkt, bulge/roll eller gear effect i shipping flight;
- lie angle, turf, fukt, grooves eller valgt ballmodell;
- vær, vind, høyde over havet eller temperatur i fem-input-produktet;
- kropp, køllebevegelse før/etter impact eller personlig svingårsak;
- faktisk launch-monitor-data eller video;
- en universell optimal launch-/spinnverdi for en spiller.

Nye modeller for disse områdene må ha egne navngitte input, kilder, tester og
truth-labels. De skal ikke skjules inne i dagens fem-input-solve.

## 11. Portingkrav

1. Én ren, deterministisk `solveFlight` skal eie alle 13 flight-utfall.
2. D-plane og Ball Flight skal kalle samme motor og dele samme shot state.
3. Studio skal ikke beregne spinn, carry eller ballflukt.
4. Golden cases, nulltilstander, ugyldige tall og boundary clamps skal testes.
5. Renderere skal kun lese output; de skal ikke legge til fysikk eller egne
   konverteringer.

## 12. Kilder i gammel kodebase

- `impact-flight.js`
- `flightglass-3d-spin-model.js`
- `impact-outcome.js`
- `swing-parameters-and-impact.js`
- `scripts/impact-flight-3d-spin.test.mjs`
- `scripts/impact-flight-calculated-spin.test.mjs`
- `scripts/impact-flight-domain-coherence.test.mjs`
- `scripts/flightglass-3d-spin-model.test.mjs`
- `scripts/academy-attack-at-impact-model.test.mjs`
- `scripts/academy-plane-coupling-model.test.mjs`
- `scripts/academy-contact-height-model.test.mjs`
