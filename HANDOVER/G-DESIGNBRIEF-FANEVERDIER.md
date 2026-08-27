# Designoppdrag — verdien inn i de sammenslåtte parameterfanene

*Lim inn hele fila som prompt. Smalt oppdrag: én rad, tre celler, ett problem.*

---

## Problemet

Impact Studio har fire parametre. Én er alltid **utvidet** til et kort med
stor verdi og slider. De tre andre ligger som **sammenslåtte faner** under.

Fanene viser i dag bare navnet:

```
   SWING PLANE   |   SWING DIRECTION   |   ARC HEIGHT
```

De skal vise **navn og verdi**:

```
   SWING PLANE        SWING DIRECTION       ARC HEIGHT
      60.0°               +2.0°              −1.4 cm
```

Grunnen: når brukeren leser `ATTACK ANGLE −4.3°` er det relevant at planet står
på 60°. Verdiene er ikke pynt — de er konteksten resultatet skal leses i.

## Plassen, målt

Skjerm 390 px. Kortets innvendige bredde er **346 px**, delt på tre celler med
skillelinjer: **~115 px per celle.**

Etikettene i 10 px versal Geist med 0.03em sperring:

| Etikett | Bredde |
|---|---:|
| `SWING PLANE` | 72 px |
| `SWING DIRECTION` | **95 px** ← den som sprekker først |
| `BALL POSITION` | 79 px |
| `ARC HEIGHT` | 63 px |

`SWING DIRECTION` bruker 95 av 115 px. Det er 20 px igjen på samme linje.
Verdien får altså **ikke** plass ved siden av navnet uten å endre noe.

## De fire parameterne

| Parameter | Format | Område |
|---|---|---|
| Swing Plane | `60.0°` — ingen fortegn | 30–80 |
| Swing Direction | `+2.0°` — alltid fortegn | −12…+12 |
| Ball Position | `+3.9 cm` — se merknad | −20…+20 |
| Arc Height | `−1.4 cm` — se merknad | −5…+5 |

Alle tall settes i **IBM Plex Mono**. Etikettene i **Geist**, versal.
Lengste verdi blir `−20.0 cm` = 8 tegn.

**Merknad om fortegn (viktig):** eieren har bestemt `+`/`−` på avstander for å
spare plass, og at designsystemet ryddes senere. Vær klar over at dette er et
bevisst avvik fra to låste regler — systemet sier ellers at *avstander bærer
ord* (`3.9 cm before`, `1.4 cm above`) og at *fortegn er forbeholdt vinkler*.
Hvis løsningen din tilfeldigvis skaper plass til ordformen, si fra: da er
avviket kanskje unødvendig.

## Krav

- **Ingen forkortelse.** `SWING DIRECTION` skrives fullt ut. `SWING DIR.` er
  ikke en løsning.
- **Verdien må ikke konkurrere med det utvidede kortets verdi.** Den er stor
  og leder; fanenes verdier er kontekst og skal vike. To nivåer, ikke ett.
- **Berøringsflate 44 px** per fane. Visuelt lettere er lov hvis treffsonen
  utvides usynlig.
- **Tallene skal ikke hoppe** når slideren dras. Mono er valgt nettopp for
  det — sørg for at oppsettet ikke reintroduserer sprang.
- Mørkt tema. Etiketter i dempet grå, verdier lysere. Fargen på hver parameter
  finnes, men er ikke løsningen på hierarkiet.

## Retninger som finnes, og hva de koster

Ikke velg blindt — dette er kartet, ikke svaret:

- **To linjer per celle** (navn over verdi). Enklest, koster ~14 px høyde på
  raden. Spørsmålet er om raden har den høyden.
- **Verdien først, navnet under i mindre grad.** Snur lesningen: tallet er det
  man skanner etter, navnet bekrefter. Kan gi bedre hierarki på samme plass.
- **Ujevne celler.** `SWING DIRECTION` får mer bredde enn `ARC HEIGHT`, siden
  behovet er ulikt. Bryter rutenettet, men bruker plassen ærlig.
- **Navnet forkortes visuelt uten å forkortes** — f.eks. `SWING` på én linje og
  `DIRECTION` på neste. Ordet står helt, men bruker to linjer.
- **Verdien som eneste innhold, navnet kun i den utvidede tilstanden.** Radikalt;
  krever at brukeren husker rekkefølgen. Sannsynligvis for langt, men vurder det.

## Leveranse

Én HTML-fil, 390 px bred, som viser raden i to tilstander: én der
`BALL POSITION` er utvidet (tre faner: plane, direction, arc), og én der
`SWING DIRECTION` er utvidet (tre faner: plane, ball position, arc). Da ser man
at oppsettet tåler at den lengste etiketten både er utvidet og sammenslått.

**Gi to reelt forskjellige løsninger.** Skriv én linje under hver om hva du
ofret.
