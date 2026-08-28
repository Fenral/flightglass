# G → B · overlevering ved parkering (D133–D137)

Strøm G settes i ro. Alt målt materiale ligger i
`HANDOVER/G-STRIKE-SPLITT-PLAN.md` (arkiv for V2-landskap). Denne fila er det
som **ikke** er selvforklarende fra disk, og som vil bite ombyggingen.

Sortert etter risiko.

---

## 1 · STILLE REGRESJON: `lowPointMarker`-kroken forsvinner med canvasen

**Dette er den viktigste linja i hele overleveringen.**

Onboardingens coachmark i steg 4 bruker low point-markøren som **gulv** for
sonen sin. Uten det gulvet legger boksen seg over markøren i hver eneste
ballposisjon — det var defekt **G-2**, som E rettet og D114 finnes for.

Kjeden er tre ledd, og det midterste er en canvas-krok:

| Ledd | Fil | Hva |
|---|---|---|
| **skriver** | `app/studio/index.html:1240` | `$('stage').dataset.lowPointMarker = [view, x, y, '1'].join(',')` — inne i canvas-tegningen |
| leser | `app/onboarding/host-studio.js:58–66` | `rect('lowPointMarker')` |
| bruker | `app/onboarding/steps.js:88–89` | `const bottom = marker ? marker.top - gap : controls.top - gap` |

**D134 bytter canvas-tegningen med Sol-handoffens SVG.** Skriver ikke den nye
scenen `stage.dataset.lowPointMarker`, returnerer `rect()` null, og `steps.js`
faller **stille** tilbake til kontrollraden. Ingen feilmelding, ingen rød test —
coachmarken oppfører seg bare feil, og bare i steg 4.

**Til B:** skriv markørposisjonen fra den nye scenen i samme format
(`view,x,y,1`, i stage-koordinater). Det er én linje, og den er ikke synlig
noe sted i handoffen.

## 2 · Død kobling som kaster når insetten er borte

`app/onboarding/host-studio.js:99` — `openStrikeInset() { api.setInspect(true) }`.

D135 fjerner insetten, så `setInspect` forsvinner fra `window.__studio`.
Ingenting kaller `openStrikeInset` i dag (E fjernet kallet i D114-rettelsen),
så den er død kode — men den kaster hvis noen gjeninnfører den. Fjern den
sammen med insetten.

Samme sted: `rect('inset')` degraderer pent (`new DOMRect(0,0,0,0)` gir
venstrekant = 12 px, altså full scenebredde), så *den* knekker ikke. Men
kommentaren over den i `steps.js` begrunner seg med at «insetten bærer LIE» —
den begrunnelsen faller med D136, og sonen skal uansett måles helt på nytt
(D135).

## 3 · Buens amplitude er ikke en funksjon av høyde

Målt i den bygde flaten: **buen stiger 77 px uansett scenehøyde.** 260 px scene
gir 77 px bue, 520 px scene gir 77 px bue. All ekstra høyde blir tom himmel.

Årsaken er at den vertikale skalaen utledes fra scenens **bredde**
(`scale = W / winM`); høyden flytter bare bakkelinja nedover.

**Hvorfor dette treffer portrett hardt:** bredden faller fra 546 px (landskap
568) til ~355–410 px. Oppløsningen går fra 666 px/m til ~450–520 px/m, så buen
blir *flatere* enn i landskap — samtidig som høyden man har å fylle blir
større.

Målt på de fire portrettmockene eieren har vurdert: **53–62 % av canvasen er
tom over buen.** Fire uavhengige forsøk, samme tall.

Leveren er **vertikal forsterkning**, ikke høyde. Den bygde flaten bruker en
hybrid gain (`PED_K = 1.7`) der kontaktbåndet står 1:1 i mm og armene
forsterkes. Målt effekt ved 380 px scene: 1.7× → 77 px · 3× → 117 · 5× → 180 ·
8× → 268.

Handoff-SVG-en har sannsynligvis sin egen geometri. Prinsippet står uansett:
**buens visuelle amplitude må være et bevisst valg.** Utledes den av bredden,
blir den flat i portrett.

## 4 · Gressbåndet — tykkelsen er det som gjør at ballen «ligger på» noe

Eieren spurte 2026-08-27 om den mørke bakgrunnen tar bort at ballen ligger på
gress. Målt:

| | Gressbånd |
|---|---:|
| Bygd flate i dag | **8 px** |
| Mockene eieren responderte godt på | 22–26 px |
| Sol-handoffens søsterretning m/ dobbel ramme | 12 px (halvert av rammen) |

Med 8 px er kontrasten gress mot jord **2,18** og gress mot himmel **2,97** —
begge under 3:1, som er der en forskjell leses automatisk framfor å sluttes.

**Felle jeg gikk i selv, meldt så B slipper:** den bygde flaten tegner
gressbåndet, en lys bakkelinje og strå *oppå* den nedmørkede turf-platen
(`index.html:1293–1316`). Min mock returnerte etter platen og hoppet over alle
tre. Da målte gresset grønnhet **−1** — altså rødere enn grønt. Når
Higgsfield-materialet porteres inn i handoff-SVG-en (D134): platen alene er
ikke gress. Båndet, linja og stråene er det som gjør jobben.

Merk også at standard-lie er **HARDPAN** — pakket jord. Ved den innstillingen
er det korrekt at ballen ikke ligger på gress; strå tegnes kun når lie > 0.
Det er en åpen sak jeg la fram for eieren og som ikke er avgjort.

## 5 · Tallformatering: rut gjennom adapteren, ikke gjennom handoffen

D137 låser «aldri fortegn på null». **Adapteren oppfyller det allerede**, også
i det tilfellet folk vanligvis bommer på — verdier som *avrundes* til null:

```
formatAngle(0.04, {signed:true})  →  "0.0°"     (ikke "+0.0°")
formatLongitudinalCm(-0.02)       →  "0.0 cm"   (ikke "−0.0 cm")
```

Sol-handoffen hadde nakne fortegn og 0.5-steg, altså sin egen formatering.
Beholdes den, mistes både dette og D67-ordene. **Alle tall gjennom
`adapter/src/displayStudio.js` og `format.js`.**

## 6 · Safe-area: insettet LEGGES TIL kromet

Ved D118-gulvet 390 × 844 er insettene 47 px topp og 34 px bunn.

**Bunninsettet bæres av det nederste kromet** — bunnmenyen når den finnes,
ellers kontrollraden. Aldri begge; det ville telt det to ganger.

Og det **legges til** stripens høyde: en 56 px meny okkuperer 90 px. Jeg gjorde
først den motsatte feilen — padding inni en fast høyde, slik at insettet ble
spist av stripen. Det ser riktig ut og er galt.

Verifisert at treffflatene overlever: kontrollboksen vokser (148 → 180 px i
portrett, 96 → 128 i landskap) mens chip, slider og range holder 44 px.

---

## Ryddesak: tre leveranser viser nå en forbigått retning

Disse er ikke feil, men de er **utdaterte** etter D133–D135, og minst én ligger
i eierens hender:

| | Hva | Forslag |
|---|---|---|
| `_artifacts/studio-split-demo.html` | **Publisert artifact** — viser MODUS-splitten med pille-toggle (D128, nå omgjort av D135) | Merkes eller trekkes. Eieren har mobil-lenken |
| `app/studio/split-demo.html` | Kilden til samme | Merkes som arkiv |
| `HANDOVER/G-DESIGNBRIEF-KONTROLLER.md` | Brief mot den låste canvasen + chips/slider | Arkiv |
| `HANDOVER/G-DESIGNBRIEF-FANEVERDIER.md` | Brief mot faneverdier | Arkiv — premisset (tre celler side om side) er dessuten vist feil |

`HANDOVER/G-DESIGNBRIEF-GRONN-SVART-ITERASJON.md` og
`-FULLBREDDE-ITERASJON.md` er portrett-briefer og fortsatt relevante for B.

`tools/artifact-build/` er retningsuavhengig og består — ett kall,
deterministisk, med differensialtest mot motoren som port.

---

## Én ting jeg ikke rakk å avgjøre

**Standard-lie er HARDPAN**, som er det minst representative underlaget.
D60-presedensen sier at et instrument som åpner på null lærer ingenting i
første sekund. Et bytte til FAIRWAY er ett ord, men hardpan er låst i B2-e som
reset-oppførsel. Lagt fram for eieren 2026-08-27, ikke besvart.
