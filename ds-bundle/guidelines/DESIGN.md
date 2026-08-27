---
version: alpha
name: Flight Glass
description: Instrumentpanel for golfballflukt. Dyp dusk-lilla grunn, glassplater, semantiske parameterfarger med målt kontrast. Mockenes visuelle språk, systematisert.
colors:
  primary: "#FF8A4D"
  primary-soft: "#3D2417"
  on-primary: "#1C0E05"
  secondary: "#9D8BFF"
  neutral: "#07060C"
  surface: "#110D1C"
  plate: "#0D0A18"
  line: "#241E33"
  line-soft: "#181226"
  ink: "#F5F2FF"
  muted: "#A79FC7"
  ghost: "#A7A0C4"
  face: "#FF5C6B"
  path: "#5BC8F5"
  attack: "#F470B8"
  loft: "#B9A0FF"
  plane: "#9C8DF5"
  strike: "#E3B05C"
  depth: "#C98AE6"
  good: "#58E6A8"
  bad: "#FF7B8A"
  celebrate: "#FF5CE1"
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 34px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.01em
  display-lens:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: 0.12em
  data-lg:
    fontFamily: IBM Plex Mono
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.2
  data-md:
    fontFamily: IBM Plex Mono
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.25
  label:
    fontFamily: Geist
    fontSize: 10px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0.1em
  body:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.55
  caption:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: 0px
  control: 12px
  card: 16px
  lens: 20px
  pill: 999px
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
  scene:
    backgroundColor: "{colors.surface}"
  plate:
    backgroundColor: "{colors.plate}"
    rounded: "{rounded.card}"
    padding: "{spacing.lg}"
  divider:
    backgroundColor: "{colors.line}"
  accent-slab:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.display}"
    rounded: "{rounded.none}"
    padding: "{spacing.xl}"
  readout:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    typography: "{typography.data-lg}"
  readout-label:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  chip-active:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "{spacing.sm}"
  chip-held:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ghost}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "{spacing.sm}"
  lens-pill:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.lens}"
  home-circle:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    size: 44px
  pin-button:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "{spacing.sm}"
  coachmark:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "{spacing.lg}"
  status-bad:
    backgroundColor: "{colors.bad}"
    textColor: "{colors.neutral}"
    typography: "{typography.data-md}"
    rounded: "{rounded.control}"
    padding: "{spacing.sm}"
  body-text:
    textColor: "{colors.muted}"
    typography: "{typography.body}"
  grid-dots:
    backgroundColor: "{colors.line-soft}"
  status-good:
    backgroundColor: "{colors.good}"
    textColor: "{colors.neutral}"
    typography: "{typography.data-md}"
    rounded: "{rounded.control}"
    padding: "{spacing.sm}"
  milestone:
    backgroundColor: "{colors.celebrate}"
    textColor: "{colors.neutral}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "{spacing.sm}"
  param-face:
    backgroundColor: "{colors.face}"
  param-path:
    backgroundColor: "{colors.path}"
  param-attack:
    backgroundColor: "{colors.attack}"
  param-loft:
    backgroundColor: "{colors.loft}"
  param-plane:
    backgroundColor: "{colors.plane}"
  param-strike:
    backgroundColor: "{colors.strike}"
  param-depth:
    backgroundColor: "{colors.depth}"
---

# Flight Glass — designsystem v3

> **v3 = mockenes visuelle språk, systematisert (D82).** Det oransje/kull-systemet
> (v2) er parkert som utforsket alternativ i `_source/DESIGN-v2-oransje-parkert.md`.
> Reglene v2 bygde — tallformat, hierarki, tilstander, bevegelse — er ARVET hit;
> kun malingen er byttet.

## Overview

Flight Glass er et måleinstrument, ikke en app med et diagram i. Brukeren kan
fagbegrepene og bruker verktøyet for å kjenne størrelsesordener: hvor mye er én grad?

Den visuelle identiteten er mockenes: **dyp dusk-lilla grunn, glassplater,
og en semantisk parameterpalett** der hver leveringsparameter eier sin kulør —
valgt mot hverandre med målt kontrast. OKLCH-verdiene og kontrastmålene ligger
i `_source/mocks/shared/sa-p3.css` og er kilden ved tvil.

Enkelttema, mørkt. Lys modus er utenfor scope — som valg, ikke glemsel.

## Colors

**Grunnene:** `neutral` (#07060C — nesten svart med lilla stikk) er lerretet,
`surface` scener, `plate` glassplatene som bærer avlesninger. Alle dype og kjølige.

**Kraften:** `primary` (#FF8A4D, mockens `--accent`) er handlingsfargen —
CTA-er, aktiv tilstand, hårlinjer i tre styrker (full, 55 %, 30 %).
`secondary` (#9D8BFF) er den kjølige motvekten for progresjon og lab-elementer.

**Parameterpaletten** — hver parameter eier sin kulør, konsekvent i hele appen:

| Parameter | Token | Hex |
|---|---|---|
| Club Face | `face` | #FF5C6B |
| Club Path | `path` | #5BC8F5 |
| Attack Angle | `attack` | #F470B8 |
| Dynamic Loft | `loft` | #B9A0FF |
| Swing Plane | `plane` | #9C8DF5 |
| Strike | `strike` | #E3B05C |
| Strike depth | `depth` | #C98AE6 |

**Hierarkiregelen over dem (arvet fra v2, omformulert):** den AKTIVE parameteren
vises i full kulør; holdte parametre vises avmettet — tekst i `ghost`, kulør kun
som liten prikk. **Maks én parameter leder per skjerm.** Uten denne regelen
roper alle sju likt; det er både målt og sett.

**Semantikk (D84):** `good` og `bad` — to nivåer, ikke tre. Gul er pensjonert
som signalfarge; `strike`-gull betyr KUN treffbånd. Feiltilstander (Duff, Whiff,
no-flight, off-face) bruker `bad`. `celebrate` er forbeholdt milepæler.

**Forbud:** rød/grønn er aldri en retningsakse. Naken hex i komponentkode er
forbudt — alt går via tokens. Tailwind-restene i enkelte mockfiler
(#fbbf24, #f87171) er kjent gjeld (F6) og skal IKKE tokeniseres inn.

## Typography

Tre roller (D83):

- **Geist** — UI: etiketter, brødtekst, knapper.
- **Space Grotesk** — display: titler, linsenavn, slag-identitet.
- **IBM Plex Mono** — ALLE tall. Monospace gir tabulære siffer strukturelt;
  et tall som hopper når slideren dras finnes ikke i denne fonten.

### Informasjonsnivåer (arvet)

Ett svar per panel. Nivået bæres av størrelse OG farge, aldri bare én:

| Nivå | Typografi | Farge |
|---|---|---|
| Svar | `data-lg` / display | `ink` |
| Støtte | `data-md` | `ink` ved 80 % |
| Meta | `caption` / `label` | `muted` |
| Inaktiv | `label` | `ghost` |

Meta er aldri større enn caption. Proveniensmerker (ASSUMED, INTERPOLATED)
er små chips i meta-nivået — aldri ord i svarlinjen.

### Tallformatering (arvet uendret)

| Metrikk | Desimaler | Eksempel |
|---|---|---|
| Vinkler | 1 | `16.3°` |
| Avstander | 1 | `173.5 m` |
| Spinn | 0, tynt mellomrom | `3 173 rpm` |
| Ball/club speed | 1 | `130.6 mph` |
| Smash | 3 | `1.451` |
| mm-verdier | 1 | `16.6 mm` |
| cm-input | 1 | `10.5 cm` |

Avstander bærer bokstav (`16.3 m L`), vinkler fortegn (`−16.3°`), foran/bak
bærer ord (`10.5 cm ahead`). Aldri to bærere på samme verdi.

### Språk

Hele UI-et på engelsk. Fagbegreper som i launch monitor-litteraturen,
aldri forkortet. Ingen emoji, noe sted.

## Layout & Spacing

Portrett telefon; Impact Studio i landskap. `landscape` er en
orienteringsbetingelse — bredde over høyde, minimum 568 × 320 (D59) —
aldri en breddeterskel. Spacing på 4-punkts skala.

**Scenen og avlesningene deler aldri piksler.** Faste avlesninger i reservert
sone; scenefestede etiketter løses med kandidatankere og hysterese
(120 ms inn, 300 ms tilbake), aldri flytende.

Enheter velges av brukeren (D27); konvertering skjer i visningslaget,
aldri i fysikken.

## Elevation & Depth

Dybde er MATERIALE, ikke skygge: `neutral` bakerst, `surface` for scener,
`plate` for avlesninger — i praksis en glassplate (rgba-variant med blur).
Glassplater får 1 px indre lyskant (`rgba(255,255,255,.06)`) — refraksjon,
ikke ramme.

**Glød er skopet (D85):** inne i banescener er banene hårstreker og
deltaflaten scenens ENESTE myke element — målt: 34 px bloom drukner en
1,8 px flate, uansett palett. Utenfor scenen er materialglød fri:
hårlinjer, plater, aksenter — slik mocken bruker den.

## Bevegelse (arvet)

**Det som svarer på en slider, animeres ikke.** Tracer, deltaflate og
verditall følger fingeren i sanntid.

| Token | Verdi | Brukes til |
|---|---|---|
| `instant` | 0ms | alt slider-koblet |
| `fast` | 90ms | trykkrespons |
| `base` | 160ms | linsebytte, paneler |
| `slow` | 260ms | pin festes, deltaflate fødes |
| `ease` | cubic-bezier(.2,.8,.2,1) | mockens egen kurve — beholdt |

Reduced motion setter overganger til `instant`; all informasjon består.

## Ikonografi (arvet)

Strek 1.5 px ved 24 px, størrelser 16/20/24, aldri fyll, arver tekstfarge.
Der et ord er presist, slår ordet ikonet. Intet ikon står alene som eneste
bærer av en handling.

## Datavisualisering (arvet, ommalt)

**Deltaflaten:** gradient langs downrange-aksen — `primary` ved 10 % opasitet
nær ballen → 86 % ved nedslaget. Glød med stdDeviation = 2 % av scenens
korteste side, på flaten alene. Måletrinn hver 25 % av carry, tegnet over
flaten og under banene.

**Baner:** levende 1.6 px varm hvit; referanse 1.4 px `primary` 55 % stiplet
`4 4`; ghosts `primary` 30 %. Ingen casing eller bloom på noen av dem
(D85-scenen).

**Parameterstråler i scener** (face/path/attack-annotasjoner) bruker
parameterens egen kulør — på 55 %-trinnet når parameteren ikke er den aktive.

**Prikkrutenett:** `line-soft`, statisk, en linjal — ikke en tekstur.

## Shapes

`control` 12 · `card` 16 · `lens` 20 · `pill` 999. `none` er en beslutning:
identitetsbærende `primary`-flater går ut i kanten uten radius.

## Components

Tokens i frontmatter. Bærende mønstre:

**Plate** — glassplaten; avlesningenes hjem. **Accent-slab** — slag-identitet
i display-caps. **Chip-active / chip-held** — parametervelger: aktiv får
`primary-soft`-grunn og parameterens kulør; holdte får `ghost`-tekst med
kulørprikk. **Lens-pill · home-circle · pin-button · coachmark** — arvet fra
v2 med v3-tokens; coachmarkens plasseringsregel gjelder uendret
(okkuperer den delen av skjermen steget ikke bruker). **Status-bad / status-good** —
utfallssemantikk, aldri retning. **Milestone** — `celebrate`, kun milepæler.
**Param-\*** — parameterens kulørprikk/stråle; én swatch-komponent per
parameter, så fargen alltid konsumeres via token og aldri som naken hex.

### Interaksjonstilstander (arvet)

rest / hover / active / pressed / disabled per komponent. **Fokus er en egen
akse:** 2 px `secondary`-ring med 2 px avstand, synlig i alle tilstander.
Berøringsflate minimum 44 × 44 px.

## Tilstander utenfor normalen (arvet)

**`inDomain = false`:** scenen viser treffet, ikke flukten; ett kort svar på
hvorfor; sliderne forblir levende. **Utenfor køllekonvolutten:** binært merke
med tekst som sier hvilket par som er utenfor — aldri blokkering.
**Off-face:** egen tilstand i `bad`, aldri en ekstremverdi på en skala.
**Beregner > 100 ms:** forrige verdi dempes til ny lander — aldri skjelett,
aldri spinner. **Første oppstart:** standardslaget (D60) — aldri nulltilstand.

Modellgrense-setningen, én global, aldri per verdi:

> **Modelled shot — not a measurement. Strike is assumed centred.**

## Do's and Don'ts

**Aktiv parameter leder; alt annet viker.** Én leder per skjerm.

**Naken hex er forbudt.** Tokens overalt — også i prototyper.

**Gul betyr kun strike.** Feil er `bad`. Ingen av dem er retning.

**Scenen: hårstreker + én myk flate. Utenfor scenen: materialglød fri.** (D85)

**Meta roper aldri.** Caption-størrelse, `muted`, chips for forbehold.

**Forfalsk aldri sideveis målestokk i hovedvisningen.** Forstørrelse hører
til et eget merket innfelt.

**Ingen lys modus. Ingen emoji. Ingen rå Tailwind-farger fra mockrestene.**
