# Oppdrag E — Onboarding og splash

**Les `00-FELLES.md` først.** Avhenger av A (navigasjon) og B (Studio-layout),
fordi onboardingen kjører **inne i de ekte skjermene**, ikke i egne kopier.

---

## Prinsippet

Brukeren **gjør**, leser ikke. Seks steg som beveger seg gjennom hele appen og
ender i årsakskartet. Hvert steg er en ekte handling i en ekte skjerm med ekte
motortall.

Det finnes ingen illustrasjoner av appen. Det finnes bare appen.

## De seks stegene

Alle tall under er **regnet ut med motoren**, ikke oppfunnet. Basis for steg 1–3
er `clubSpeed 95 · attack −3 · dynamicLoft 26`. For steg 4–5:
`swingPlane 60 · swingDirection 0 · lie fairway · mid-iron`.

---

### Steg 1 — DIRECTION: path låst på +3, dra face angle

Brukeren drar **kun** face. Path står fast på `+3.0°` og er synlig holdt i `grey`.

| face | face-to-path | curve | **side** | shape |
|---:|---:|---|---|---|
| `−1.0°` | `−4.0°` | 10.1 m L | 10.3 m L | Draw |
| `+1.0°` | `−2.0°` | 5.1 m L | **0.6 m L** | Draw |
| `+3.0°` | `0.0°` | **0.0 m C** | **9.2 m R** | Push |
| `+5.0°` | `+2.0°` | 5.1 m R | 19.0 m R | Push Fade |

**Dette er appens beste enkeltøyeblikk, og det er ekte.** Ved `face +1` krummer
ballen 5,1 m til venstre og lander 0,6 m fra målet. Ved `face +3` krummer den
**ikke i det hele tatt** — og lander 9,2 m til høyre.

Ballen som krummer mest lander nærmest. Ballen som går rett lander lengst unna.

**Infoboksen skal si det**, kort. Ikke forklare face-to-path som begrep —
brukeren kan det. Si hva som nettopp skjedde.

**Slipp brukeren videre først når de har passert `+3`**, altså sett kurven bli
null og siden bli størst. Det er hele leksjonen.

---

### Steg 2 — Lær å bytte perspektiv

Brukeren bytter fra **DIRECTION** til **HEIGHT**.

Eneste steg uten tallendring. Infoboksen peker på linsevelgeren og sier hva de to
planene kan tegne — retning i det ene, høyde i det andre. Ikke mer.

**Kritisk for infoboksplassering:** den skal peke på velgeren uten å dekke den.

---

### Steg 3 — HEIGHT: dra dynamic loft

| loft | launch | apex | **carry** | landing |
|---:|---:|---|---|---:|
| `18°` | 10.5° | 26.8 m | **185.4 m** | 46.8° |
| `22°` | 11.7° | 27.6 m | 180.9 m | 48.6° |
| `26°` | 13.4° | 28.6 m | 176.2 m | 49.9° |
| `30°` | 15.4° | 29.9 m | **171.1 m** | 50.8° |

Byttet er synlig: mer loft gir høyere bue og brattere landing, men **kortere
carry**. 12 grader koster 14 meter.

**Ikke gå over 30°.** Ved 34° og 38° treffer spinnet modellens tak på 9000 rpm
(kjent grense, `motor/FUNN.md` F5). Onboardingen skal ikke demonstrere en clamp.

---

### Steg 4 — Studio: flytt low point, se attack og club path endres

| ballPos | low point | attack | club path |
|---:|---:|---:|---:|
| `−8 cm` | 18.5 cm | `−7.67°` | `+4.46°` |
| `−4 cm` | 14.5 cm | `−6.01°` | `+3.48°` |
| `0 cm` | 10.5 cm | `−4.35°` | `+2.51°` |
| `+8 cm` | 2.5 cm | `−1.03°` | `+0.60°` |
| `+12 cm` | **−1.5 cm** | **`+0.62°`** | **`−0.36°`** |

**Én input, to utfall, koblet.** Brukeren drar én ting og ser to tall bevege seg
sammen — det er hele grunnen til at Studio finnes.

Ved `+12 cm` skjer noe verdt å stoppe ved: low point havner **bak** ballen,
attack snur til positiv og club path snur til negativ samtidig. Det er «ballen
for langt fram» vist som geometri framfor som råd.

---

### Steg 5 — Studio CONTACT: flytt arc height

| arcH | clubZ | entry | exit | offset | turf | flate |
|---:|---:|---|---|---:|---|---|
| `−3 cm` | −26.0mm | −18.1 cm | 39.1 cm | +37.0mm | **Duff** | OffFace |
| `−1.5 cm` | −11.0mm | −9.8 cm | 30.8 cm | +22.0mm | **Fat** | OffFace |
| `0 cm` | 4.0mm | — | — | +7.0mm | **Pure** | Centre |
| `+1.5 cm` | 19.0mm | — | — | −8.0mm | **Thin** | Low |
| `+3 cm` | 34.0mm | — | — | −23.0mm | **Whiff** | OffFace |

**Fem bånd fra én slider.** Og legg merke til at `Pure` har **ingen
bakkekryssing** — entry og exit er tomme.

Det er ikke en feil. Kølla når treffhøyde uten å nå bakken, og ballen ligger
8 mm opp i gresset. **Underlaget må være synlig i dette steget** (D3b), ellers
ser «Pure» og «ingen turfkontakt» ut som en selvmotsigelse.

Dette er utfordring U1, og onboardingen er stedet den forklares én gang for alle.

---

### Steg 6 — Connections: vis ett eksempel

Bruk kjeden brukeren nettopp har bygget forståelse for:

```
Curve ← Spin Axis ← Face-to-Path ← Face  og  Path
```

Det knytter steg 1 til kartet. Brukeren dro i face, så kurven endre seg, og ser
nå **hvorfor** — som struktur.

Connections er motoruavhengig (D44), så steget viser sammenhengen, ikke tall.
Størrelsene bor i Ball Flight.

---

## Infoboksen

**Krav fra bruker: strategisk posisjon, aldri til sjenanse for det som vises.**

Regelen er enkel og gjelder alle seks steg:

> **Infoboksen okkuperer den delen av skjermen som det aktuelle steget ikke bruker.**

Konkret per steg:

| Steg | Handlingen skjer | Infoboks |
|---|---|---|
| 1 | lateralt spenn, midt og øvre del av scenen | **nederst**, rett over inputpanelet |
| 2 | linsevelgeren, øverst | **under**, med peker opp |
| 3 | buens apex, øvre midt | **nederst til siden**, aldri over apex |
| 4 | attack/path-avlesningene og buen | **sidestilt** — landskap har horisontal plass |
| 5 | bakkelinjen, entry/exit, ballen | **øvre område**, som er tomt her |
| 6 | kjeden, midt | **nederst** |

Boksen er **`coachmark`-komponenten i `DESIGN.md`** — `coal-2`, `lg` radius,
`body`-typografi. Plasseringsregelen og tabellen over står nå der, ikke bare her.
Følg `DESIGN.md`; dette brevet gjentar den kun for lesbarhet.

## Det som gjelder alle steg

- **Ekte skjermer, ekte motortall.** Ingen mockup-versjon av appen i onboardingen.
- **Sliderne er levende hele veien.** Brukeren kan dra fritt, ikke bare til
  et forhåndsbestemt punkt.
- **Hopp over er tillatt** på hvert steg, og gir fornuftig standardtilstand.
- **Ett poeng per steg.** Aldri to.
- Modellgrense-setningen skal ha landet **før første tall**:
  *«Modelled shot — not a measurement. Strike is assumed centred.»*

## Splash

Appikonet er **deltaflaten**, ikke en golfball (`DESIGN.md`, Do's and Don'ts).
Den utsvepte formen — smal ved ballen, vid ved nedslaget.

Splash bør være den formen som fødes, i `primary` mot `neutral`. Det er samme
bevegelse brukeren møter i steg 1, og den binder ikonet til produktet.

Ingen tekst i splash.

## Enhetsvalget

**Ett obligatorisk spørsmål, og det kommer før steg 1** — alle tall i de seks
stegene vises i valgt enhet, så det må stå først.

D27: brukeren velger, og kan endre det senere i Innstillinger. Motoren regner
internt i yards og mph uansett; konverteringen skjer i visningslaget.

Hold det til ett trykk. Det er ikke en profil, det er en preferanse.

## Spiller/trener er droppet

Rollespørsmålet er **ute** (D55). Onboardingen spør ikke hvem brukeren er.

Det er riktig av en grunn verdt å skrive ned: et spørsmål som ikke endrer noe
koster friksjon uten å gi noe tilbake. Rollen hadde ingen definert konsekvens,
og da er det bedre å la være enn å samle inn data «til senere».

Alle får samme app. De seks stegene har uansett faste startverdier fordi de er
en skriptet leksjon — en profil ville ikke påvirket dem.

---

## Regelen som gjelder over alle andre

Finner du noe som **ikke** er bestemt i `DECISIONS.md` eller `DESIGN.md` —
**stopp og spør eieren. Ikke bestem selv.**

Det gjelder selv om valget virker opplagt. Særlig da.

Dette prosjektet er en gjenoppbygging fordi den forrige versjonen samlet opp
beslutninger ingen husket å ha tatt. Hver av dem virket opplagt i øyeblikket.
En parallell strøm som tar tretti små opplagte valg produserer tretti nye
udokumenterte bestemmelser — bare raskere enn sist.

**Unntaket:** rene implementeringsdetaljer uten designkonsekvens. Variabelnavn,
filstruktur, hvilken løkke du bruker. Det trenger ingen å vite.

**Ikke unntak:** alt som blir synlig for brukeren. En tom tilstand, en
lastetilstand, en feilmelding, en overgang, en plassering, et ord. Er det
synlig og ikke bestemt — spør.

## Leveranse

1. De seks stegene som klikkbar prototype, i de ekte skjermene
2. Infoboksens plassering per steg, med begrunnelse mot hva som vises
3. Splash
4. Liste over beslutninger du tok som ikke sto i `DECISIONS.md`
