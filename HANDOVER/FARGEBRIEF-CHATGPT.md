# Fargebrief — kontekst for analyse og nytt fargesystem

*Lim inn hele fila som prompt, sammen med skjermbilder av flatene
(Ball Flight, Impact Studio, Home) og gjerne DESIGN.md. Uten skjermbildene
mangler halve konteksten: fargene sitter på fotomateriale og canvas-scener,
ikke på flate kort.*

---

## Hva appen er

Flight Glass er et **måleinstrument for golfballflukt** på telefon — ikke en
app med et diagram i. Brukeren kan fagbegrepene (spin axis, attack angle,
face-to-path) og bruker verktøyet for å kjenne størrelsesordener. Mørk,
dyp dusk-lilla verden; glassplater bærer avlesninger; canvas-scener tegner
svingbue, ballbane og treffgeometri over materialplater (gress, jord, himmel,
køllehoder). Enkelttema — lys modus er bevisst utenfor scope.

Fire flater: **Ball Flight** (ballbanen, fem slidere), **Impact Studio**
(treffgeometrien, landskap — splittes nå i to modi: DELIVERY og STRIKE),
**Connections** (årsaksgraf, statisk), **Home** (dashboard under redesign,
med bunnmeny på vei inn).

## Dagens palett — med JOBBENE, ikke bare verdiene

| Token | Hex | Jobben — det et nytt system MÅ løse tilsvarende |
|---|---|---|
| neutral | #07060C | lerretet; nesten svart med lilla stikk |
| surface | #110D1C | scener |
| plate | #0D0A18 | glassplatene avlesninger bor på |
| primary | #FF8A4D | HANDLING: CTA, aktiv kontroll, hårlinjer i tre styrker |
| secondary | #9D8BFF | ÉN jobb: progresjon/lab-elementer + aktiv linse |
| ink / muted / ghost | #F5F2FF / #A79FC7 / #A7A0C4 | tekstens tre nivåer; ink er også fokusring |
| face | #FF5C6B | parameterfarge: Club Face |
| path | #5BC8F5 | parameterfarge: Club Path |
| attack | #F470B8 | parameterfarge: Attack Angle |
| loft | #B9A0FF | parameterfarge: Dynamic Loft |
| plane | #9C8DF5 | parameterfarge: Swing Plane |
| strike | #E3B05C | EKSKLUSIV: betyr KUN treffbånd (gull) |
| depth | #C98AE6 | parameterfarge: Strike depth |
| good / bad | #58E6A8 / #FF7B8A | utfallssemantikk, aldri retning |
| celebrate | #FF5CE1 | kun milepæler |

Parameterpaletten er identitetsbærende: **hver leveringsparameter eier sin
kulør, konsekvent i hele appen** (chip, stråle i scenen, graf-node). Aktiv
parameter i full kulør; holdte demoteres til ghost + kulørprikk. Maks én
parameter leder per skjerm. LIE (underlaget) har BEVISST ingen kulør — den
er kontekst, ikke parameter.

## Låste regler et nytt system må respektere — eller EKSPLISITT foreslå omgjort

1. **Gull er eksklusiv:** #E3B05C betyr kun treffbånd. Advarselsnivået er
   pensjonert; feiltilstander bruker bad-familien. Tre-trinns båndskala:
   Pure/Centre → good · Thin/Fat/High/Low → gull · Duff/Whiff → bad.
2. **Ordet er bæreren, fargen forsterker** — ingen informasjon kun i farge.
3. **Glød er skopet:** inne i banescener er baner hårstreker og deltaflaten
   eneste myke element; materialglød er fri utenfor scenen.
4. **Mockenes visuelle språk er fasit** — dusk-lilla verden, glassplater,
   materialitet. Et nytt fargesystem er en OMGJØRING av dette og må si det.
5. Kilde ved tvil: OKLCH-verdier og kontrastmål ligger i mockens sa-p3.css.
6. Enkelttema mørkt. Datafont er IBM Plex Mono; UI er Geist.

## MÅLTE svakheter i dagens palett — det et nytt system faktisk kan fikse

- **secondary (#9D8BFF) og plane (#9C8DF5) er nesten identiske** — en
  tilstandsfarge og en parameterfarge kolliderer visuelt.
- **Gress mot jord: kontrast 2,18 · gress mot himmel: 2,97** — begge under
  3:1. Ballen skal leses som «liggende på gress» uten å tenke; i dag bæres
  det av et 22 px gressbånd mer enn av fargeseparasjon.
- **loft (#B9A0FF), plane (#9C8DF5) og depth (#C98AE6) er tre fioletter** —
  parameterpaletten har en trang lilla-klynge mens grønt er helt ubrukt
  (grønt er reservert good — er det riktig prioritering?).
- Historisk felle (unngå reprise): v2 hadde fem varme gultoner med ulike
  jobber og fullmettet aksent på sju elementer samtidig — «når alt er
  oransje, er ingenting det». Hierarkiregelen finnes for å hindre dette.

## Hva leveransen skal inneholde

1. Full tokenliste (samme jobber som tabellen over) med hex, på mørk grunn.
2. **Målte kontrasttall** for hvert kritisk par: tekst/grunn, gress/jord,
   gress/himmel, hver parameterfarge mot surface, aktiv mot holdt.
3. Parameterpaletten vurdert som SETT: sju kulører som er innbyrdes
   adskillbare, også for fargesvakhet (deuteranopi-sjekk).
4. Eksplisitt liste over hvilke låste regler forslaget beholder og hvilke
   det foreslår omgjort — med begrunnelse per punkt.
5. Behold det som virker: si aktivt hva fra dagens palett som overlever.
