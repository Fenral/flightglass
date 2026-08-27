# Flight Glass — felles kontekst

**Lim inn denne først i enhver ny chat. Deretter det spesifikke oppdragsbrevet.**

---

## Hva Flight Glass er

En golf-ballfluktsimulator for telefon. Brukeren drar i fem leveringsparametre og
ser hva som skjer med ballflukten. Målet er å kjenne **størrelsesordener**:
hvor mye er én grad?

**Brukeren kan fagbegrepene.** Spin axis, angle of attack, face-to-path. Det finnes
ingen forenklet modus, ingen forklaringer av grunnbegreper, ingen nybegynnertekst.

## Prosjektets ene regel

Dette er en gjenoppbygging. Den gamle kodebasen er **utenfor prosjektgrensen** og
skal aldri leses eller kopieres (D13). Grunnen er at gamle beslutninger ellers
sniker seg inn uten å bli tatt på nytt.

Alt som er bestemt står i `DECISIONS.md` — **54 låste beslutninger**. Finner du noe
som motsier en av dem, er det en feil som skal meldes, ikke rettes stille.

## Filene som gjelder

| Fil | Hva den er |
|---|---|
| `DESIGN.md` | **Designsystemet. Normativt.** Linter 0/0. Alt visuelt følger denne. |
| `DECISIONS.md` | 54 låste beslutninger med begrunnelse |
| `STATUS.md` | Hvor prosjektet står, hva som er blokkert |
| `01`–`05`*.md | Spec per modul. **Alle har korreksjonshode øverst** — les det først. |
| `engine/` | Motoren. 465 tester, alle grønne. |
| `motor/FUNN.md` | 17 funn fra det gamle uttrekket |
| `UTFORDRINGER.md` | 10 problemer i de gamle mockene, 5 lukket |

## Designsystemet i kortform

**Oransje er kontrast, ikke mengde.** Målt: referansen kjører 3,0 % mettet oransje
mot 2,7 % vask, resten kjølig kull. Flatene må være kalde for at oransjen skal
kunne være varm.

```
primary    #F75105   aktiv — det du tar på, det som endrer seg
primary-hi #F78E21   gradienttopp, målelinjer, retningsetiketter
neutral    #0A0B0D   lerret
coal-1     #22242B   kortflate — BÆRER KONTRASTEN, aldri varm tint
grey       #5D5C5B   inaktiv. Aldri dempet oransje.
trace      #FFE3D0   levende ballbane, hårtynn
warn       #E0514A   Duff · Whiff · no-flight · off-face. Aldri retning.
```

**Typografi:** Archivo. `wdth 125` for display-caps, `wdth 100` ellers.
Alle tall har `tnum`.

**Den strengeste regelen:** nøyaktig ett element på skjermen er mykt — deltaflaten.
Ingen bloom på baner, tekst, ikoner eller kanter. Dette ble verifisert seks ganger:
legges glød på banen, svelges arealet mellom banene.

**Det som svarer på en slider, animeres ikke.** Tracer, deltaflate og verditall
følger fingeren i sanntid. Animasjon er kun for det som *skifter*.

## Regler som gjelder alt

- **Farge er aldri eneste bærer.** Retning har fortegn *og* `L`/`R`/`C`.
- **Avstander bærer bokstav, vinkler bærer fortegn.** `16.3 m L` og `−16.3°`.
  Aldri begge på samme verdi.
- **Desimaler:** vinkler 1 · avstander 1 · spinn heltall m/ tynt mellomrom ·
  smash 3 · ballfart 1.
- **Hele UI-et er på engelsk.** Fagbegrep skrives som i launch monitor-litteraturen.
- **Enheter velges av brukeren** i onboarding, endres i Innstillinger.
- **Scenen og avlesningene deler aldri piksler.** Kolliderer et tall med banen,
  er det en feil — ikke en tetthetsavveining.
- **Ingen emoji, noe sted.**

## Modellgrense-setningen

Én global setning, aldri firetrinns sannhetsmerker per verdi:

> **Modelled shot — not a measurement. Strike is assumed centred.**

Andre halvdel er ikke en detalj: treffpunktet påvirker **ikke** ballflukten i denne
modellen (D52). Impact Studio kan si at du traff 16,6 mm lavt mens Ball Flight
viser uendret kurve. Det er en deklarert søm (D53), ikke en feil.

## Plattform (D70–D72)

**Full native. iOS først: Swift + SwiftUI.** Capacitor-sporet er dødt.

Konsekvens for strømmene: HTML-prototypene er **spesifikasjonslab** — de beviser
layout, interaksjon og beslutninger som SwiftUI bygges fra. De er ikke
produktkode, og det endrer ingenting i hva en strøm skal levere.

`engine/` (JS) er **referanseimplementasjonen**. Swift-porten verifiseres mot
alle 7 528 fixture-caser og differensielt mot JS-motoren (D71).

## Modulene

| Modul | Orientering | Hva den gjør |
|---|---|---|
| Home | portrett | Inngang |
| **Ball Flight** | portrett | Fem slidere → 13 utfall. To linser: **DIRECTION** og **HEIGHT** |
| **Impact Studio** | **landskap** | Buegeometri → attack, path, low point, treff |
| D-plane | portrett | Face/path-geometrien isolert |
| Connections | portrett | Årsakskart. **Motoruavhengig.** |
| Ask | portrett | 28 spørsmål med lab |
| Innstillinger | portrett | **Ny flate.** Enheter m.m. |

**`FLIGHT`-linsen er fjernet** (D40). To linser, ikke tre. `TOP` → `DIRECTION`,
`SIDE` → `HEIGHT`. Utfallene fordeles på plan:

- **DIRECTION:** Launch Dir · Spin Axis · Curve · Side · Face-to-Path
- **HEIGHT:** Launch · Apex · Landing · Carry · Total · Smash · Backspin · Spin Loft
- **Begge:** Ball Speed

## Navigasjonsfunnet

Apper der en visualisering er hovedinnholdet bruker **ikke bunnfelt**. Verifisert
mot AllTrails, Moonlitt, Tide Guide, FocusFlight og Weather:

- Dataene fyller hele skjermen
- Kontroller er **flytende sirkler** i hjørnene
- Avlesninger ligger i et **flytende kort eller bunnark** som kan dras sammen
- Tilstandsbytter er **piller**, ikke faner

For mange parametre finnes to strategier: **stable tynt** (Telegram: fire slidere
à 40 px) eller **én om gangen valgt av en velger** (Apple Photos, Depop, eBay).

Flight Glass bruker allerede den andre. Problemet er at parameterkortene gjør
**to jobber** — de er både velger og avlesning, og blir derfor høye.
Apple Photos skiller dem: velgeren er tynn, verdien flyter over slideren.
