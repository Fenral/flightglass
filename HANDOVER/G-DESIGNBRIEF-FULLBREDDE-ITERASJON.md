# Iterasjon — Impact Studio, full bredde-varianten

*Lim inn hele fila sammen med mocken. Målet er tre ting: oversiktlig, native
følelse, dybde.*

---

## Hvorfor det ble denne, og ikke de to andre

Tre varianter ble målt: canvas i kort med ramme, canvas i full bredde, og
canvas i dobbel ramme. **Full bredde vant**, og grunnene er målbare:

| | Kort m/ramme | **Full bredde** | Dobbel ramme |
|---|---:|---:|---:|
| Gressbånd | 24 px | **26 px** | **12 px** |
| Tomt over buen | 62 % | **53 %** | 58 % |

Den doble rammen ser mest «instrument» ut, men den koster nøyaktig det som
betyr noe: **gressbåndet halveres til 12 px.** Gresset er det som gjør at
ballen leses som *liggende på* noe framfor å sveve. Rammen spiser beviset.

Og en dobbel ramme er ikke native. Den er en app som later som den er
maskinvare. Native er innhold først og stille krom.

**Behold derfor:** canvas i full bredde, gress som går helt ut i skjermkanten,
`BACK · MID · FWD` i margen under gresset, ingen ramme rundt scenen.

---

## 1 · Den viktigste rettelsen: over halve scenen er tom

**Målt: 53 % av canvasen er tom over buen.** Buen ligger nede mot gresset, og
alt over den er rutenett.

Vær klar over hvorfor, for det avgjør hva som virker: **den vertikale skalaen i
denne scenen kommer fra BREDDEN, ikke fra høyden.** Å gjøre canvasen høyere
legger bare til mer himmel — buen blir like flat. Det er målt i den bygde
flaten: buen er like høy i en 260 px scene som i en 520 px scene.

To lovlige grep:

- **Forsterk buen vertikalt.** Scenen bruker allerede en hybrid gain der
  kontaktsonen står 1:1 i mm og armene forsterkes. Å øke forsterkningen gjør
  buen lesbar uten å lyve om treffet. Kontaktbåndet rundt ballen må forbli 1:1.
- **Beskjær canvasen.** Mindre høyde, samme bue, og høyden går til kontrollene.

Vis begge, så forskjellen kan sammenlignes. Det er sannsynligvis en blanding.

## 2 · Dybde må komme fra scenen, ikke fra krom

Når rammen er borte, må dybden bæres av verdenen. Fire virkemidler, i den
rekkefølgen de gir mest:

1. **Kontaktskygge under ballen.** Det er dette som sier «ligger på» framfor
   «er tegnet foran». Én myk, kort skygge der ballen møter gresset.
2. **Gresset som et lag, ikke en strek.** En lysere toppkant der lyset treffer,
   mørkere ned mot jorda. Da har flaten en overside.
3. **Rutenettet som perspektiv.** Det er der allerede — la linjene trekke seg
   sammen mot horisonten og bli svakere med avstand, så gulvet får dybde.
4. **Atmosfære oppover.** Luften over bakken kan bli minimalt lysere eller
   mattere mot toppen. Det gir rom uten å legge til objekter.

**Ikke løs dybde med slagskygger under kortene.** I dette systemet er dybde
materiale: lerret bakerst, flater over, avlesninger på halvt gjennomsiktige
plater med blur og en tynn indre lyskant som leser som refraksjon.

## 3 · Fargen gjør tre jobber samtidig

Grønn brukes nå på: HOME-ikonet, RESET, aktiv visning, `ATTACK ANGLE`,
`BALL POSITION`, `SWING PLANE`, `ARC HEIGHT` og sliderfyllet. Cyan brukes på
`CLUB PATH` og `SWING DIRECTION`.

To ting blandes: **hvilken parameter dette er** og **hva som er aktivt/klikkbart**.

I systemet eier hver parameter sin egen kulør, konsekvent overalt — attack,
path, swing plane, arc height og ball position har fem forskjellige. Aksenten
for «aktiv» er en sjette, og deler ikke farge med noen av dem.

Velg én av to og gjennomfør den:

- **Semantisk:** hver parameter får sin faste kulør, og aksenten er en egen
  farge som ingen parameter bruker.
- **Nøytral:** etikettene er grå, og farge brukes kun til aktiv tilstand.

Dagens veksling mellom grønn og cyan uten regel er den tredje muligheten, og
den er den eneste som ikke kan forklares.

## 4 · Fortegn på null

`+0.0 cm`, `+0.0°` — fortegn på null leser som en retning der det ikke finnes
noen. Gjelder ball position, swing direction og arc height. Når verdien er
nøyaktig null: `0.0 cm`, uten fortegn. Fortegn på alt annet beholdes.

## 5 · To ting jeg ikke har sett ennå

**Bunnmenyen.** Alle tre variantene er beskåret over den. Den skal ha fire
destinasjoner, ligge i bunnen, og bære safe-area-insettet på 34 px **i tillegg
til** stripens egen høyde — ikke inni den.

**STRIKE.** Velgeren har `FACE ON | DTL | STRIKE`, men bare FACE ON er tegnet.
STRIKE er halve grunnen til at skjermen finnes: det er visningen som ble skilt
ut fra attack og path for å få mindre på skjermen samtidig. Der gjelder:

- Toppavlesningene er ikke attack og path, men treffet: et båndord
  (`PURE` · `THIN` · `FAT` · `DUFF` · `WHIFF`) og en mm-verdi (`1.0 mm low`).
- Underlaget må være synlig i samme visning som treffstatusen —
  `MID-IRON · FAIRWAY 8 mm`. Uten det leses «PURE» og «ingen bakkekontakt» som
  en selvmotsigelse.
- Dynamisk loft vises som liten caption merket `ASSUMED`. Det er en antagelse,
  ikke en måling.
- Scenen zoomer inn på kontaktsonen: bakken, ballen, køllehodet som
  referanseflate, buen gjennom sonen, hakk for ENTRY / LOW / EXIT der de finnes.

## 6 · Sjekkpunkter

- **44 px berøringsflate** på alt som trykkes — også de tre parametercellene
  nederst. Er noe visuelt lettere, utvid treffsonen usynlig.
- **Ingen forkortelser.** `SWING DIRECTION` er den lengste og skal stå helt.
- **Alle tall i monospace**, så de ikke hopper mens slideren dras.
- Vis en tilstand der tallene **ikke** er null — f.eks. ball position
  `+3.9 cm`, direction `−2.0°` — og sjekk at cellene holder ved `−20.0 cm`.

## 7 · Rammer

390 × 844. Safe-area 47 px topp, 34 px bunn. Mørkt tema, ingen lys modus.
Engelsk UI, ingen emoji, fagbegreper uforkortet.

**Én setning om landskap:** flaten skal etter planen bygges i landskap først,
der total høyde er 320 px. Du trenger ikke løse det nå, men si hva som skjer
med komposisjonen når høyden er 320 i stedet for 844 — det avgjør om denne
retningen kan bygges som den er.

## Leveranse

Én HTML-fil. Vis **DELIVERY med tall som ikke er null** og **STRIKE**, begge
med bunnmenyen. Vis også den forsterkede buen mot den beskårne canvasen, så
valget i punkt 1 kan tas på noe man ser.

**Skriv én linje om hva du ofret.**
