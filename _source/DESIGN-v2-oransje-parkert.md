---
version: alpha
name: Flight Glass
description: Instrumentpanel for golfballflukt. Kjølig kull som grunn, oransje som masse. Bygget på temperaturkontrast, ikke temperaturvask.
colors:
  primary: "#F75105"
  primary-hi: "#F78E21"
  on-primary: "#180800"
  neutral: "#0A0B0D"
  coal-1: "#22242B"
  coal-2: "#2F323A"
  coal-3: "#3A3E48"
  line: "#282C34"
  line-soft: "#1D2027"
  grey: "#5D5C5B"
  muted: "#8E939C"
  text: "#D2D5DA"
  text-hi: "#F2F3F5"
  trace: "#FFE3D0"
  warn: "#E0514A"
typography:
  display-slab:
    fontFamily: Archivo
    fontSize: 38px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.06em
    fontVariation: "'wdth' 125"
  display-lens:
    fontFamily: Archivo
    fontSize: 23px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: 0.14em
    fontVariation: "'wdth' 125"
  value-lg:
    fontFamily: Archivo
    fontSize: 17px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.01em
    fontFeature: "'tnum' 1"
  value-md:
    fontFamily: Archivo
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.25
    fontFeature: "'tnum' 1"
  label:
    fontFamily: Archivo
    fontSize: 10px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0.11em
  body:
    fontFamily: Archivo
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.55
  caption:
    fontFamily: Archivo
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: 0px
  full: 999px
  sm: 4px
  md: 8px
  lg: 11px
  phone: 22px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
components:
  canvas:
    backgroundColor: "{colors.neutral}"
  panel:
    backgroundColor: "{colors.coal-1}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  panel-raised:
    backgroundColor: "{colors.coal-2}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  divider:
    backgroundColor: "{colors.line}"
  grid-dots:
    backgroundColor: "{colors.line-soft}"
  slab:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.display-slab}"
    rounded: "{rounded.none}"
    padding: "{spacing.xl}"
  delta-field:
    backgroundColor: "{colors.primary}"
  trace-live:
    backgroundColor: "{colors.trace}"
  trace-reference:
    backgroundColor: "{colors.primary}"
  measure:
    textColor: "{colors.primary-hi}"
    typography: "{typography.caption}"
  slider-track:
    backgroundColor: "{colors.coal-3}"
    rounded: "{rounded.sm}"
  slider-fill-active:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.sm}"
  slider-fill-held:
    backgroundColor: "{colors.grey}"
    rounded: "{rounded.sm}"
  label-active:
    backgroundColor: "{colors.coal-1}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
  label-held:
    backgroundColor: "{colors.coal-1}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  readout:
    backgroundColor: "{colors.coal-1}"
    textColor: "{colors.text-hi}"
    typography: "{typography.value-lg}"
  readout-label:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  body-text:
    textColor: "{colors.text}"
    typography: "{typography.body}"
  home-circle:
    backgroundColor: "{colors.coal-2}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    size: 44px
  lens-pill:
    backgroundColor: "{colors.coal-2}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
  chip:
    backgroundColor: "{colors.coal-1}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  pin-button:
    backgroundColor: "{colors.coal-2}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  fixed-zone:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.text-hi}"
    typography: "{typography.value-lg}"
  ghost-trace:
    backgroundColor: "{colors.primary}"
  coachmark:
    backgroundColor: "{colors.coal-2}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  status-warn:
    backgroundColor: "{colors.warn}"
    textColor: "{colors.neutral}"
    typography: "{typography.value-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
---

# Flight Glass

## Overview

Flight Glass er et måleinstrument, ikke en app med et diagram i. Brukeren kan
fagbegrepene — spin axis, angle of attack, face-to-path — og bruker verktøyet for å
kjenne størrelsesordener: hvor mye er én grad?

Den visuelle identiteten hviler på ett funn, målt og ikke antatt. Referansen som
satte retningen (Halo Labs Phoenix) bruker **3,0 % mettet oransje mot 2,7 % varm
vask**; resten er kjølig kull. Da seks alternative retninger ble bygget og målt,
kjørte den varmeste **10,2 % mettet mot 27,9 % vask** — og oransjen ble *svakere*.

Oransjens tyngde er en differanse, ikke en mengde. Flatene må være kalde for at
oransjen skal kunne være varm.

## Colors

Grunnen er kjølig kull med blåstukket undertone. `neutral` er lerretet, `coal-1` og
`coal-2` er flater, `coal-3` er spor og kanter som må ses. Ingen av dem har varm
tint, og det er ikke en smakspreferanse — det er mekanismen som gjør `primary` tung.

`primary` (#F75105) betyr **aktiv**: det du tar på, det som endrer seg, arealet
mellom forrige og nåværende bane. `primary-hi` (#F78E21) er gradienttopp, målelinjer
og retningsetiketter. `on-primary` (#180800) er den eneste tekstfargen som brukes
oppå mettet oransje.

`grey` (#5D5C5B) er inaktiv — Phoenix' binære semantikk. En parameter som holdes
konstant er grå, aldri svakt oransje. Blir «av» litt varm, mister «på» sin betydning.

`trace` (#FFE3D0) er den levende ballbanen: varm hvit, hårtynn. Referansebanen
tegnes i `primary` med redusert opasitet og stiplet strek, ikke i en egen kulør.

`warn` (#E0514A) er reservert for Duff, Whiff, no-flight og off-face. Den er den
eneste fargen utenfor oransjefamilien, og den brukes aldri til retning.

### Oransje-stigen

Oransje har tre trinn, og trinnet er informasjon:

| Trinn | Opasitet | Eier |
|---|---|---|
| **Full** | 100 % | Maks **to elementer per skjerm:** den aktive kontrollen (chip + slider + flytende verdi regnes som ett) og lead-svaret (slab / strike-lead). |
| **Sekundær** | 55 % | Pin/referanse, sceneannotasjoner, målebrakketer. |
| **Spor** | 30 % | Ghosts, historikk. |

Konkurrerer flere kandidater om full styrke, **vinner den aktive kontrollen** —
resten demoteres til 55 %. `primary-hi` er for tynne målelinjer og
retningsetiketter, aldri for store flater.

Dette er grunnen til at «oransje er kontrast, ikke mengde» holder i praksis:
regelen om temperatur sier hvor mye oransje skjermen tåler totalt; stigen sier
hvem av kandidatene som får være varmest.

Det finnes **ingen kald motpol**. Et blått eller fiolett referansespor ble prøvd og
forkastet: en andre kulør stjeler tilbake den temperaturkontrasten hele systemet
hviler på. Av samme grunn er **per-parameter-farger avvist** — hver input kan ikke
eie sin egen hue, for da er ingenting igjen som skiller aktiv fra holdt.

## Typography

Archivo i to bredder. `display-slab` og `display-lens` kjører `wdth 125` med økt
letter-spacing — det brede, sperrede caps-grepet som bærer seksjonstitler. Alt
annet kjører normalbredde.

Alle verditokens bruker `tnum`. Uten tabulære sifre hopper tallene sidelengs når en
slider dras, og et instrument som rykker leser som upresist uansett hvor riktig
matematikken er.

`label` er 10 px med 0.11em sperring. Det er nedre grense — mindre enn dette og
kontrasten mot `coal-1` slutter å holde.

### Informasjonsnivåer

Hvert panel har nøyaktig **ett svar**. Alt annet er støtte, meta eller inaktivt —
og nivået bæres av både størrelse og farge, aldri bare én av dem:

| Nivå | Hva | Typografi | Farge |
|---|---|---|---|
| **Svar** | det ene tallet/ordet panelet finnes for | `value-lg` eller display | `text-hi` (`on-primary` på slab) |
| **Støtte** | sekundærverdier | `value-md` | `text` |
| **Meta** | kølle, underlag, proveniens, enhetsforbehold | `caption` eller `label` | `muted` |
| **Inaktiv** | holdt parameter | `label` | `grey` |

**Meta er aldri større enn `caption`.** «MID-IRON · ROUGH · DYNAMIC LOFT 31.0°»
er meta — den identifiserer konteksten, den er ikke funnet. Settes den i samme
grad som svaret, roper konteksten like høyt som konklusjonen.

**Proveniensmerker (`ASSUMED`, `INTERPOLATED`) er små chips i meta-nivået** —
aldri ord inne i svarlinjen. De skal kunne ses, ikke leses først.

### Tallformatering

Avrunding er en presisjonspåstand. Motoren returnerer `spinAxis:
-16.26454982658155`; fire desimaler ville påstått en presisjon modellen ikke har,
og null desimaler ville skjult effekten av én grad. Tabellen er normativ.

| Metrikk | Desimaler | Eksempel |
|---|---|---|
| Alle vinkler — launch, attack, path, face, spin axis, land | 1 | `16.3°` |
| Alle avstander — carry, total, apex, side, curve | 1 | `173.5 m` |
| Spin — backspin, total spin | 0, tusenskille | `3 173 rpm` |
| Ball speed, club speed | 1 | `130.6 mph` |
| Smash factor | 3 | `1.451` |
| Face-to-path | 1 | `−6.0°` |
| Millimeterverdier — treffpunkt, lie | 1 | `16.6 mm` |
| Centimeter-input — ball position, arc height | 1 | `10.5 cm` |

Smash er eneste metrikk der tredje desimal bærer mening. Tusenskille er tynt
mellomrom (U+2009), aldri komma eller punktum — begge er desimalskilletegn et sted.

### Fortegn og retning

**Avstander bærer bokstav. Vinkler bærer fortegn.** Det matcher hvordan spillere
snakker: «16 meter venstre», men «spin axis minus 16».

| Type | Format | Eksempel |
|---|---|---|
| Sideveis avstand | verdi, enhet, bokstav | `16.3 m L` · `4.1 m R` · `0.0 m C` |
| Vinkel med retning | fortegn, verdi, enhet | `−16.3°` · `+5.0°` |
| Vinkel uten retning | verdi, enhet | `14.5°` |
| Foran/bak-avstand | verdi, enhet, ord | `10.5 cm after` · `1.5 cm before` |

**Foran/bak bærer ord, aldri nakent fortegn** (D67). `L`/`R`/`C` er en
lateralakse og passer ikke aksen langs banen; `before`/`after` er samme
prinsipp — retning som tekst, ikke som tegn — på riktig akse. Ordene er
bransjebegrepet (TrackMan rapporterer low point som B/A); eieravgjort
2026-08-25 da et utkast sa «ahead/behind».

Bokstaven er `L`, `R` eller `C` — aldri oversatt, aldri erstattet av en pil, og
aldri utelatt fordi fargen «viser det». Det er beslutning D10.

Ingen verdi bærer både fortegn og bokstav. `−16.3 m L` er redundant og leses som
to påstander om samme ting.

### Språk

Hele grensesnittet er på engelsk — fagbegrep, knapper, forklaringer og
Ask-spørsmål. Fagbegrepene skrives som de står i launch monitor-litteraturen:
Spin Axis, Carry, Attack Angle, Face-to-Path, Smash Factor. De oversettes ikke,
og de forkortes ikke.

## Layout & Spacing

Portrett telefon for Ball Flight og D-plane. Landskap for Impact Studio; den
trenger bredden og kravet er akseptert, ikke arvet.

Enhetssystem velges av brukeren i onboarding og endres i Innstillinger (D27).
Motoren regner internt i yards og mph uansett; konverteringen skjer i visningslaget
og aldri i fysikken. Hver avlesning må derfor kunne rendre begge systemer uten at
kolonnebredden hopper — `tnum` alene holder ikke når `173.5 m` blir `189.8 yd`.

Spacing er en 4-punkts skala. Avlesninger ligger i to kolonner gruppert som
Direction, Launch & spin, Distance — etikett over verdi, aldri side om side.

**Scenen og avlesningene deler aldri piksler.** Kolliderer et tall med banen eller
med en gridetikett, er det en feil — ikke en tetthetsavveining.

To lag med ulike regler:

**Faste avlesninger** — carry, side, delta-setningen — ligger i en reservert sone.
Banen kan aldri tegnes inn i den. Sonen er statisk; skaleres scenen, skaleres sonen.

**Scenefestede etiketter** — Apex, Launch, Land, måletrinn — følger et punkt og må
flytte seg. De løses dynamisk, men **aldri flytende**:

1. Hver etikett har 4–6 kandidatankere i fast prioritetsrekkefølge (over, under,
   venstre, høyre, med lederlinje).
2. En løser velger første kandidat uten kollisjon mot bane, gridetikett eller annen
   etikett. Ingen mellomposisjoner — etiketten hopper mellom ankere.
3. **Hysterese er obligatorisk.** En etikett bytter anker først når kollisjonen har
   vart over 120 ms *og* overlappen overstiger 4 px. Den vender tilbake først når
   opprinnelig anker har vært klart i 300 ms.
4. Finnes ingen kollisjonsfri kandidat, faller etiketten til lederlinje mot
   scenekanten før den overlapper noe.

Uten hysterese danser tallene mens slideren dras — altså nøyaktig når de leses.
Det er verre enn overlapp.

Reduced motion beholder løseren, men uten overgang: ankere snapper.

Baneområdet får prikkrutenett i `line-soft` som romlig referanse. Rutenettet er
statisk og skalerer aldri med zoom; det er en linjal, ikke en tekstur.

### Brytepunkter

Tre, ikke fem. Instrumentet er en telefonapp, og et brytepunkt uten en skjerm
bak seg er gjettverk.

| Navn | Betingelse | Gjelder |
|---|---|---|
| `compact` | portrett, `< 400 px` | Telefon i portrett. Ball Flight, D-plane, Connections, Ask. |
| `regular` | portrett, `≥ 400 px` | Større telefon, nettbrett i portrett. Samme layout, mer rom. |
| `landscape` | **bredde > høyde**, min `568 × 320` | **Impact Studio krever denne.** |

**`landscape` er en orienteringsbetingelse, ikke en breddeterskel.** Det er en
rettelse: et tidligere utkast satte `wide ≥ 840 px`, som ville blokkert alle tre
størrelsene `03-IMPACT-STUDIO.md` akseptansekriterium 8 selv krever —
`568 × 320`, `812 × 375` og `932 × 430`. En iPhone SE i landskap er 667 px bred.
Terskelen ville sendt en bruker som *allerede hadde rotert* beskjed om å rotere.

Studio trenger **bredde over høyde** for å vise low point, entry og exit samtidig.
En telefon i landskap oppfyller det. Et nettbrett i portrett gjør det ikke, selv
med 800 px bredde.

Under `568 × 320` viser Studio en oppfordring om å rotere, ikke en sammenklemt
versjon.

Mellom `compact` og `regular` endres ingenting strukturelt. Scenen vokser,
avlesningene beholder to kolonner, sliderne beholder høyden. **En layout som
omorganiserer seg mellom to telefonstørrelser er en layout brukeren må lære to ganger.**

## Elevation & Depth

Instrumentet har ingen slagskygger. Dybde kommer fra flatefarge: `neutral` bak,
`coal-1` for kort, `coal-2` for hevet panel.

**Nøyaktig ett element på skjermen er mykt: deltaflaten.** Dette er systemets
strengeste regel og den ble verifisert seks ganger. Legges glød på selve banene,
blir arealet mellom dem svelget — målt til `stroke-width 34` bloom mot en flate som
er `1.8 px` bred ved 50 m. Inversjonen er hele løsningen: banene er hårstreker,
flaten gløder.

## Bevegelse

Instrumentet har én regel over alle andre: **det som svarer på en slider, animeres
ikke.** Ballbanen, deltaflaten og de 13 avlesningene følger fingeren i sanntid.
Legger man 160 ms overgang på en tracer, kommer den etter fingeren, og instrumentet
føles tregt selv om motoren svarer på under ett millisekund.

Animasjon er derfor forbeholdt det som *skifter*, ikke det som *måles*:

| Token | Verdi | Brukes til |
|---|---|---|
| `instant` | `0ms` | Alt som er koblet til en slider. Tracer, deltaflate, verditall. |
| `fast` | `90ms` | Trykkrespons — knapper, brikker, linsevelger. |
| `base` | `160ms` | Linsebytte DIRECTION ↔ HEIGHT. Panel som åpnes. |
| `slow` | `260ms` | Pin som festes. Deltaflaten som fødes første gang. |
| `easeOut` | `cubic-bezier(0.2, 0, 0, 1)` | Alt som kommer inn eller reagerer på trykk. |
| `easeInOut` | `cubic-bezier(0.4, 0, 0.2, 1)` | Kun linsebytte, der noe forlater mens noe ankommer. |
| `hysteresisEnter` | `120ms` | Terskel før etikett bytter anker (D18). |
| `hysteresisReturn` | `300ms` | Terskel før den vender tilbake (D18). |

**Disse ligger i prosa, ikke i frontmatter, med vilje.** `design.md`-skjemaet
kjenner ikke `motion` som tokengruppe, og en gruppe skjemaet ikke kjenner blir
stille ignorert av eksportører. Verdier som ser maskinlesbare ut uten å være det
er verre enn verdier som ærlig står i tekst. Tabellen over er normativ.

De to hysterese-verdiene er ikke overganger — de er terskler for når en
scenefestet etikett bytter anker. De står her fordi de er tidsverdier og skal
revideres sammen med resten.

**Reduced motion** setter `fast`, `base` og `slow` til `instant`. Alt informasjonsbærende
består: deltaflaten tegnes, ankerløseren kjører, tallene oppdateres. Bare selve
overgangen forsvinner.

## Ikonografi

Instrumentet har svært få ikoner, og det er med vilje. Der et ord er presist,
brukes ordet — `PIN`, `TOP`, `HEIGHT` leser raskere enn noe symbol, og de kan
ikke misforstås.

| | |
|---|---|
| Strektykkelse | `1.5 px` ved 24 px størrelse, skalerer proporsjonalt |
| Størrelser | `16` `20` `24` px. Ingen andre. |
| Hjørner | Skarpe. Ingen avrunding på strekender. |
| Fyll | Aldri. Kun strek. |
| Farge | Arver tekstfargen den står ved siden av |

Ingen ikon står alene som eneste bærer av en handling. Har det ikke plass til
en etikett ved siden av, har det ikke plass i instrumentet.

**Ingen emoji, noe sted.** Ikke i UI, ikke i Ask-svar, ikke i tomme tilstander.

## Datavisualisering

Alt i dette avsnittet er normativt. Ligger det i prosa uten tall, lager to
utviklere to ulike instrumenter.

### Deltaflaten

Gradienten går langs **downrange-aksen**, ikke vertikalt på skjermen. Den er
svakest ved ballen og sterkest ved nedslaget, fordi det er der endringen er størst.

| Stopp | Posisjon | Farge | Opasitet |
|---|---|---|---|
| start | `0 %` av carry | `primary` | `0.10` |
| midt | `60 %` | `primary` | `0.52` |
| ende | `100 %` | `primary-hi` | `0.86` |

Glød: gaussisk uskarphet med `stdDeviation` = **2 % av scenens korteste side**,
lagt på flaten alene. Skalerer med scenen, så den ser lik ut på alle skjermer.
Ett merge-lag, ikke to — dobbel merge gir en halo som leser som en andre flate.

### Måletrinn

Vannrette streker tvers over deltaflaten ved faste downrange-intervaller.
De gjør flaten **målbar** i stedet for bare synlig.

- Intervall: hver `25 %` av carry — fire trinn, ikke flere
- Strek: `1 px` `primary-hi` ved `0.45` opasitet
- Etikett kun på ytterste trinn, i `measure`-komponenten
- Trinnene tegnes **over** flaten og **under** banene

### Baner

| | Bredde | Farge | Mønster |
|---|---|---|---|
| Levende | `1.6 px` | `trace` | heltrukket |
| Referanse | `1.4 px` | `primary` ved `0.55` | `4 4` stiplet |
| Launch line | `1.0 px` | `primary` ved `0.40` | `2 4` stiplet |
| Target line | `1.0 px` | `coal-3` | `3 5` stiplet |

Ingen av dem har casing, ytterkant eller bloom. **Deltaflaten er det eneste myke
elementet på skjermen** — se Elevation & Depth.

### Prikkrutenett

`line-soft`, radius `0.8 px`, avstand `16 px`. Statisk: det skalerer aldri med
zoom eller med scenens innhold. Det er en linjal, ikke en tekstur.

### Landingsmarkør

Levende: fylt sirkel `r = 4 px` i `trace`.
Referanse: åpen sirkel `r = 2.6 px`, `1.2 px` strek i `primary` ved `0.55`.
Målelinjen mellom dem er `1.3 px` `primary-hi` med verdien over.

## Shapes

Radius signaliserer rolle. `phone` (22px) er rammen, `lg` (11px) er paneler,
`md` og `sm` er brikker og etiketter.

`none` er ikke fravær av radius — det er en beslutning. Identitetsbærende oransje
flater går helt ut i kanten uten avrunding. En avrundet slab leser som en knapp;
en radiusløs leser som selve flaten.

## Components

**Slab** — fullbredde, radiusløs, mettet gradient fra `primary` til `primary-hi` med
`on-primary` display-caps. Bærer slagets identitet: DRAW, FADE, PUSH SLICE. Dette
er hovedmassen av oransje på skjermen.

**Delta-field** — arealet mellom referansebanen og den nåværende. Gradientfyll fra
`primary` ved ~10 % opasitet nær ballen til `primary-hi` ved ~86 % ved nedslaget.
Det eneste elementet med glød. Flaten krysses av vannrette **måletrinn** ved faste
downrange-intervaller, slik at bredden kan leses som en verdi og ikke bare anes.
Flaten er smal ved ballen og vid ved nedslaget uten at noen tegner den slik: det er
fysikken som viser at små leveringsendringer vokser med avstand.

**Trace-live / trace-reference** — 1.6 px `trace`, og 1.4 px stiplet `primary` ved
redusert opasitet. Ingen bloom, ingen casing, ingen ytterkant.

**Measure** — målelinjer, brakketer og deltaetiketter i `primary-hi`.

**Slider-track / slider-fill-active / slider-fill-held** — én aktiv fylling i
`primary` med full masse, fire holdt i `grey`, alle på `coal-3`-spor. Etikettene
(`label-active`, `label-held`) står på panelet, ikke på sporet. Minimum 44 × 44 px
berøringsflate, tastaturalternativ, synlig fokus.

**Readout / readout-label** — etikett i `muted`, verdi i `text-hi` med `tnum`,
retningsbokstav i `primary-hi`. Enhet alltid synlig.

**Panel / panel-raised** — `coal-1` og `coal-2` med `divider` som skille.

**Status-warn** — Duff, Whiff, no-flight, off-face. Aldri retning.

**Home-circle** — navigasjonens eneste permanente chrome (NAVIGASJON.md):
én flytende sirkel, 44 × 44 px, øverst til venstre, med ordet `HOME`. Går alltid
til Home; det finnes ingen tilbake-stack.

**Lens-pill** — bytter DIRECTION ↔ HEIGHT. Aktiv halvdel i `primary` med
`on-primary` tekst.

**Chip** — parametervelger i inputpanelet. Viser navn + verdi; den aktive
parameterens verdi flyter over slideren i `primary` (Apple Photos-mønsteret:
velgeren er tynn, verdien flyter).

**Pin-button** — fester referansen. Nytt trykk re-fester; ingen unpin.

**Fixed-zone** — den reserverte sonen for faste avlesninger (Layout-regelen).
Viser Carry i begge linser, Side kun i DIRECTION — et sideveis tall vises aldri
i planet som ikke kan tegne det.

**Ghost-trace** — referanse 2 og 3: `primary` ved `0.30` opasitet, stiplet `4 4`,
aldri fyll, aldri markører. Nyeste pin driver deltaflaten; fjerde pin fjerner
eldste. Prioritet under pin (`0.55`) og live.

### Normativ UX-tekst

Formater som er låst, ikke eksempler:

- **Delta-setningen:** `Δ vs pin: −0.7 m carry · → 10.2 m more curve`.
  Pilen er kurvens retning (`→` høyre, `←` venstre); more/less er endringen i
  kurvestørrelse. Linseavhengig: DIRECTION = Δcarry + Δcurve, HEIGHT = Δcarry + Δapex.
- **No-flight:** slab erstattes av `status-warn` «NO FLIGHT», med forklaringen
  «No flight — spin loft is zero or negative: the face is delivered at or below
  the club's direction of travel, so the ball gets no lift.»
- **Konvoluttmerket (D23):** `OUTSIDE CLUB ENVELOPE: 129 MPH × 40.0°` i
  `primary-hi` ved stepperen — teksten sier hvilket par som er utenfor.
- **Modellgrense-setningen** står som én grå caption-linje nederst under
  tallisten i Ball Flight.
- **Readout-etiketter forkortes ikke:** `LAUNCH DIRECTION`, aldri «Launch Dir».

**Coachmark** — veiledningsboksen som forklarer ett poeng mens brukeren gjør noe.
Brukes i onboarding og i eventuell senere hjelp. `coal-2` framfor `coal-1`, så den
løfter seg fra panelene rundt uten å bli en modal.

**Coachmarken er aldri oransje.** Oransje betyr aktiv — det brukeren skal ta på.
Coachmarken er ikke det; den aktive slideren er. Bryter man dette, konkurrerer
veiledningen med handlingen den ber om.

### Coachmarkens plassering

En regel, ikke en tabell:

> **Coachmarken okkuperer den delen av skjermen som det aktuelle steget ikke bruker.**

Den skal aldri dekke elementet den forklarer, og aldri kontrollen brukeren skal
røre. Praktisk konsekvens per scenetype:

| Handlingen skjer | Coachmark |
|---|---|
| Lateralt spenn i banen (DIRECTION) | nederst, rett over inputpanelet |
| Buens apex (HEIGHT) | nederst til siden, aldri over apex |
| Linsevelgeren, øverst | under, med peker opp |
| Avlesninger og bue i landskap | sidestilt — landskap har horisontal plass |
| Bakkelinjen, entry og exit | øvre område, som er tomt der |

Er det ikke plass uten å dekke noe, er steget for tett. Del det, ikke flytt boksen
oppå scenen.

### Interaksjonstilstander

Hver interaktiv komponent har fem tilstander. Ingen av dem bæres av farge alene.

| Tilstand | Slider | Linsevelger | Pin-knapp |
|---|---|---|---|
| **rest** | `grey` fylling, `muted` etikett | `coal-2` flate | `coal-2` |
| **hover** | fylling +8 % luminans | flate → `coal-3` | flate → `coal-3` |
| **active** | `primary` fylling, `primary` etikett | `primary` flate, `on-primary` tekst | `primary` |
| **pressed** | fylling −12 % luminans, knott vokser 1 px | flate −12 % | flate −12 % |
| **disabled** | `coal-3` fylling, `muted` 50 % | `coal-3`, ingen tekstkontrast under 3:1 | — |

**Fokus er en egen akse, ikke en tilstand.** Tastaturfokus tegnes som en 2 px ring
i `primary-hi` med 2 px avstand, og den vises i alle fem tilstandene over. Den
forsvinner aldri fordi et element også er aktivt.

Berøringsflate er minimum 44 × 44 px selv når det synlige elementet er mindre.
En 3 px slider-skinne har 44 px treffsone.

## Tilstander utenfor normalen

Fire tilstander som ikke er feil, men som heller ikke er et vanlig slag. For et
instrument er de ikke kantcaser — de er halve opplevelsen, og de må designes
like presist som normaltilstanden.

### Utenfor domenet — `inDomain = false`

Motoren returnerer `reason = "spin-loft"` når `signedVerticalSpinLoftDeg ≤ 0`.
Fysisk: kølla har mindre loft enn angrepsvinkelen, og ballen får ingen løft.

Scenen viser **treffet, ikke flukten.** D-plane-geometrien står, ballbanen
tegnes ikke, og de flukt-avhengige avlesningene erstattes av ett kort svar på
hvorfor. Ikke en feilmelding — en forklaring. Sliderne forblir levende, for det
er ved å dra dem tilbake at brukeren lærer hvor grensen går.

### Utenfor køllekonvolutten — D23

`clubSpeed` og `dynamicLoft` i en kombinasjon ingen ekte kølle har.
**Blokkeres ikke.** Ett binært merke ved køllefart-stepperen, i `primary-hi`,
med teksten som sier hva som er utenfor — ikke et varselikon. Alle tall vises
som vanlig. Dette er ikke en feil, det er en modellgrense, og forskjellen skal
være synlig i formen.

### Utenfor slagflaten — `off-face`

Treffpunktet ligger utenfor `faceHeightMm / 2`. Egen tilstand i `warn`, ikke en
ekstremverdi på en skala. Slagflaten tegnes fortsatt, treffpunktet tegnes utenfor
den, og avstanden er lesbar. Den gamle motoren returnerte `−121 mm` på en 55 mm
flate og lot det passere som et tall.

### Beregner

Under 100 ms: ingenting. Instrumentet skal føles direkte.
Over 100 ms: forrige verdi blir stående i `muted` til den nye lander. **Aldri
skjelett, aldri spinner, aldri tom plass.** Et tall som blinker bort og kommer
tilbake leser som ustabilt; et tall som dempes leser som at det oppdateres.

### Første oppstart

Ingen tom tilstand, og **ikke et nulltilstandsslag**. Appen åpner på
`02-BALL-FLIGHT.md` sitt standardslag:

```
Club Speed 90 · Face +2.0° · Path 0.0° · Attack +3.0° · Dynamic Loft 24.0°
```

Det gir `Push Fade`, `10.1 m` side, `5.4 m` curve. **Med synlig utslag på begge
akser.**

Et tidligere utkast sa «et nøytralt slag». Det var feil ordvalg: `face 0` gir
`Straight` med `0,0 m` side og `0,0 m` curve — altså ingenting å se på den aksen
appen handler mest om. Et instrument uten utslag er ikke et instrument, og et
instrument som åpner på null lærer brukeren ingenting i det første sekundet.

## Do's and Don'ts

**Hold flatene kalde.** Ingen varm brun, ingen lilla vask, ingen oransje tint på
paneler. Jo mer du vasker, jo mindre oransje får du.

**Gi oransje masse, ikke strek.** Slab, aktiv slider, deltaflate. En 2 px oransje
linje er ikke tilstedeværelse.

**La bare deltaflaten gløde.** Ingen bloom på baner, tekst, ikoner eller kanter.

**Forfalsk aldri sideveis målestokk i hovedvisningen.** 5× sideskala gjør et slag
på 5.18° til 24.4° på skjermen — for en bruker som kjenner Trackman leser det som
en kraftig hook, ikke en draw. Trengs forstørrelse, legg den i et eget merket
innfelt instrument.

**Vis aldri et tall i en visning som ikke kan tegne det.** Sideveis avvik hører til
TOP. Apex og landingsvinkel hører til SIDE. Et tall uten visuell referent på samme
skjerm er støy.

**Farge er aldri eneste bærer.** Retning har fortegn *og* L/R/C. Styrke har
tykkelse, luminans og tekst. Dette gjelder også når oransjen dominerer.

**Inaktivt er grått.** Aldri dempet oransje, og aldri parameterens egen kulør.

**Rød og grønn er aldri en retningsakse.** Åtte prosent av menn kan ikke skille dem,
og målgruppen skjevfordeler.

**To signaler fra samme geometri må forenes før de vises.** «PURE» og «NO TURF
CONTACT» samtidig er ikke to opplysninger, det er en selvmotsigelse leseren må rydde
opp i selv.

**Vis én global setning om modellgrensen** — ikke firetrinns sannhetsmerker på
hver verdi. Setningen er:

> **Modelled shot — not a measurement. Strike is assumed centred.**

Andre halvdel er ikke en detalj. Modellen forutsetter at ballen treffes i
slagflatens midte (D52), og treffpunktet påvirker **ikke** ballflukten. Impact
Studio kan derfor si at du traff 16,6 mm lavt mens Ball Flight viser uendret
kurve — det er en deklarert søm (D53), ikke en feil. En bruker som kan begrepene
vil legge merke til den, og da skal svaret stå der framfor å måtte gjettes.

**Appikonet er deltaflaten, ikke en golfball.** Merket er den utsvepte formen
mellom to baner — smal ved ballen, vid ved nedslaget — i `primary` mot `neutral`.
En golfball eller en køllehode ville sagt «golf»; flaten sier hva denne appen
faktisk gjør. Ingen tekst i ikonet.

**Reduced motion beholder alle tall, etiketter og deltaflaten statisk.** Bare
overgangen forsvinner, aldri informasjonen.
