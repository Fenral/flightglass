# Connections — korrelasjonsmatrisen i Flight Glass

Selvstendig designbeskrivelse. Alt som trengs står i denne filen pluss
designsystemet (DESIGN.md). Ingen andre kilder.

---

## Hva modulen er

Flight Glass er en golf-ballfluktsimulator for telefon. Brukeren kan fagbegrepene
(spin axis, face-to-path, attack angle) — det finnes ingen forenklet modus.

Connections er appens **årsakskart**: den viser hvordan størrelsene henger sammen.
Den er en **statisk graf** — ingen tall, ingen beregninger, ingen kobling til
brukerens slag. Arbeidsdelingen er absolutt:

> **Connections eier struktur. Ball Flight eier størrelse.**

Spørsmålet «hvor mye er én grad?» besvares i en annen modul. Kartet svarer kun
på «hva henger sammen med hva, og hvor sterkt».

## Eierens tre krav, ordrett

1. «Vise hvordan de ulike parameterne henger sammen. For eks curve —
   hva er det som påvirker det?»
2. «For mange noder samtidig» var hovedirritasjonen ved forrige versjon.
3. Hele årsakskjeden til inputene, sammenklappet — men kun nodene på kjeden,
   aldri hele grafen.

## Lesemodellen (låste beslutninger)

- **Bakover fra én valgt metrikk.** Brukeren velger f.eks. Curve og ser hva
  som driver den. Kartet navigerer ALDRI forover.
- **Hviletilstanden er metrikkvelgeren, ikke grafen.** Før noe er valgt vises
  ingen graf. Aldri alle noder samtidig.
- **Kjeden stopper ved de fem leveringsinputene** (Club Speed, Club Face,
  Club Path, Attack Angle, Dynamic Loft). Geometry-laget bakenfor nås ved å
  trykke videre på en input-node — aldri i standardkjeden.
- **Forover finnes kun som tekst:** en fokusert node kan liste «shapes: …»
  som én linje. Ikke som navigasjon.
- En typisk kjede er 4–6 noder. Eksempel: Curve ← Spin Axis ← Face og Path.

## Skjermrammen

- Telefon, portrett.
- Eneste permanente chrome: én flytende HOME-sirkel, 44 × 44 px, øverst til
  venstre, med ordet HOME. Alt annet på skjermen er modulens innhold.
- Hele UI-et er på engelsk. Fagbegreper skrives som i launch monitor-litteraturen
  og forkortes aldri. Ingen emoji noe sted.
- Følg designsystemets hierarkiregler nøye: fullmettet oransje på maks TO
  elementer per skjerm; metadata aldri større enn caption-graden; ett svar
  per panel.

## Designnøtten

Hver kant i grafen har en TYPE og en STYRKE — sju begreper totalt:

- Type: direct (ren geometri/fysikk) · coupled (to størrelser bundet i hverandre)
  · modeled (empirisk modellert, en modellgrense)
- Styrke: primary · contributing · contextual · variable

Sju begreper på et kart uten legende er støy. Løsningen er sannsynligvis å IKKE
vise alle sju. Eierens foreløpige lening (kan utfordres med begrunnelse):
styrke vises som visuelt hierarki (tykkelse + tekst), typene skjules i
normalvisning — MEN modeled beholdes synlig fordi den markerer modellgrensen
appen ellers er nøye på å deklarere, og coupled (én eneste kant) fordi den er
semantisk annerledes enn årsak.

HARD REGEL: farge er aldri eneste bærer av type eller styrke. Bruk tykkelse,
mønster, tekst — fargen kan forsterke, aldri bære alene.

## Grafdataene (komplett)

24 noder i 5 lag, 38 kanter. Retningen er alltid
fra årsak til virkning (venstre lag → høyre lag).

### Lag: geometry (5 noder)

- **plane** (`plane`) — The tilted surface that turns circular motion into delivery.
- **direction** (`direction`) — The direction the swing plane points through the target frame.
- **lowpoint** (`lowpoint`) — Where the swing arc reaches its bottom relative to the ball.
- **ballposition** (`ballposition`) — Places the ball earlier or later along the club’s arc.
- **archeight** (`archeight`) — Moves the arc vertically and changes where the club meets the ball.

### Lag: delivery (6 noder)

- **attack** (`attack`) — The clubhead’s vertical direction at impact.
- **path** (`path`) — The clubhead’s horizontal direction through impact.
- **face** (`face`) — Where the face points when the ball leaves the club.
- **loft** (`loft`) — The loft delivered by the face at impact.
- **speed** (`speed`) — The clubhead’s available energy before impact.
- **strike** (`strike`) — Where and how cleanly the club meets the ball.

### Lag: separation (6 noder)

- **spinloft** (`spinloft`) — The true included angle between club path and face normal. Includes face and path, not only loft and attack.
- **spinaxis** (`spinaxis`) — The tilt created by the face and path relationship.
- **launchdir** (`launchdir`) — The ball’s starting direction immediately after impact.
- **launchangle** (`launchangle`) — The ball’s starting height direction after impact.
- **ballspeed** (`ballspeed`) — The speed transferred to the ball at separation.
- **verticalspinloft** (`verticalspinloft`) — Dynamic loft minus attack angle. Blind to face and path — it is a different quantity from 3-D Spin Loft, not a simplification of it.

### Lag: flight (4 noder)

- **backspin** (`backspin`) — The spin that shapes lift, height and descent.
- **curve** (`curve`) — Sideways movement created during the airborne flight.
- **apex** (`apex`) — The highest point reached by the modeled flight.
- **carry** (`carry`) — The airborne distance to the modeled landing point.

### Lag: landing (3 noder)

- **landingangle** (`landingangle`) — In this model, vertical Spin Loft is the primary descent input; treat that as modeled context.
- **side** (`side`) — Where the ball finishes sideways at the carry point.
- **total** (`total`) — The modeled finish after carry and ground response.

### Kantene (alle 38)

| Fra | Til | Type | Styrke |
|---|---|---|---|
| ballposition | lowpoint | direct | primary |
| lowpoint | attack | direct | primary |
| direction | attack | direct | contributing |
| plane | attack | direct | contextual |
| path | attack | coupled | variable |
| direction | path | direct | primary |
| lowpoint | path | direct | contributing |
| plane | path | direct | contextual |
| lowpoint | strike | direct | primary |
| archeight | strike | direct | contributing |
| attack | spinloft | direct | primary |
| loft | spinloft | direct | primary |
| face | spinaxis | direct | primary |
| path | spinaxis | direct | primary |
| attack | spinaxis | direct | contextual |
| loft | spinaxis | direct | contextual |
| face | launchdir | direct | primary |
| path | launchdir | direct | contributing |
| loft | launchdir | direct | contextual |
| attack | launchangle | direct | contributing |
| loft | launchangle | direct | primary |
| speed | ballspeed | direct | primary |
| spinloft | ballspeed | direct | contributing |
| spinloft | backspin | direct | primary |
| speed | backspin | direct | contributing |
| spinaxis | curve | modeled | primary |
| launchangle | apex | modeled | primary |
| ballspeed | apex | modeled | contributing |
| launchangle | carry | modeled | contextual |
| ballspeed | carry | modeled | primary |
| verticalspinloft | landingangle | modeled | primary |
| launchdir | side | modeled | primary |
| curve | side | modeled | contributing |
| carry | side | modeled | contextual |
| carry | total | modeled | primary |
| landingangle | total | modeled | contributing |
| loft | verticalspinloft | direct | primary |
| attack | verticalspinloft | direct | primary |

## Ikke gjør

- Ikke koble til noen motor eller vis tall/deriverte.
- Ikke vis alle noder samtidig — heller ikke som «zoom ut»-modus.
- Ikke bruk rød/grønn som meningsakse.
- Ikke finn opp noder eller kanter som ikke står i tabellen over.
