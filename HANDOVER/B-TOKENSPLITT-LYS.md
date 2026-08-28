# B → orkestrator · tokensplitt før lys maling (D143-forarbeid)

D143 krever at arkitekturhullet tettes **før** maling, med nye tokens framfor
overstyringer per komponent. Denne fila er inventaret det krever: hvert
aksent-token talt opp i Studio-flaten og klassifisert etter hvilken grunn det
faktisk ligger på. Ingen kode er endret — v4 står som levert.

## Kjernen i hullet

Ett token brukes i dag på to grunner samtidig:

| Token | Krom-CSS | Scene-SVG | Grunn i dag | Grunn etter D143 |
|---|---:|---:|---|---|
| `--copper` | 4 | 5 | mørk | **krom blir lyst**, scene forblir mørk |
| `--copper-hot` | 8 | 4 | mørk | samme splitt |
| `--accent-rgb` | 5 | 0 | mørk | kun krom → kan mørknes fritt |
| `--cyan` | 1 | 3 | mørk | metric-dot (krom) vs retningsstråle (scene) |
| `--magenta` | 1 | 4 | mørk | metric-dot (krom) vs low point (scene) |
| `--muted` | 14 | 8 | mørk | etiketter (krom) vs BACK/MID/FWD, ENTRY/EXIT (scene) |

Mørknes `--copper` til #C2410C for å holde 4,5:1 mot hvitt krom, mister
ballgløden og den aktive buen i scenen sin varme — samme token, motsatt behov.
Lysnes den for scenen, faller kromkontrasten under kravet. **Ingen enkeltverdi
løser begge.** Det er hullet.

## Splitten — LÅST som D144

Prinsippet: tokenet sier hvilken GRUNN det ligger på, ikke hvilken farge det
er. **Basenavnet er ALLTID krom; `-scene`-suffikset er den mørke scenen.**
(Mitt første forslag brukte `--accent`/`--copper`-navn; det ville gitt to
vokabular for samme farge, siden `tokens.css` er mekanisk avledet fra
DESIGN.md-frontmatteren. Mockens arvenavn mappes INN i systemets.)

```
primary            aksent på KROM       (lys grunn → mørk ember, ~#C2410C)
primary-hot        trykk/hover på krom  (~#9A3412)
primary-scene      aksent i SCENEN      (mørk grunn → #FF8A4D, uendret)
primary-scene-hot  scenens varme topp   (#FFB08A, uendret)
primary-scene-rgb  rgba-bruk i scenen   (255,138,77)

muted              etikett på krom      (~#5D5672 på hvitt)
muted-scene        etikett i scenen     (#A79FC7 på mørkt)

path / path-scene · attack / attack-scene   param-hues som tegner begge
                                            steder (metric-dot er krom,
                                            strålen/markøren er scene)

edge-light / edge-shadow                    erstatter de seks hardkodede
                                            kantlys/skygge-verdiene under
```

**Regelen som følger med (D144):** ingen komponent overstyrer farge for tema —
den velger riktig token. Konsekvens for byggingen: studiens
`html[data-theme="cN"] .metric { … }`-overstyringer er stillas og skal IKKE
porteres. Komponent-CSS-en blir temaagnostisk; kun tokenverdiene skifter.

Båndfargene (`--good`, `--strike`, `--bad`) trenger **ikke** splitt i dag:
de brukes kun ett sted, i strike-stripens tekst (`BAND_HUE`, index.html:626),
altså krom. De må likevel få lysgrunn-verdier når kromet blir lyst — dagens
#58E6A8 / #E3B05C / #FF7B8A ligger på 1,6–2,4:1 mot hvitt og er ulesbare der.
Forslag: #047857 / #8A6A0B / #B91C1C (7–9:1 mot hvitt), verifisert i studien.

## Det som må tokeniseres samtidig (ikke tema-portabelt i dag)

Hardkodede mørke verdier i komponent-CSS, som alle bryter på lys grunn:

| Sted | Verdi | Rolle |
|---|---|---|
| `.metric` | `border-bottom-color:#090a0a`, `inset 0 1px 3px rgba(0,0,0,.9)` | nedre kant/skygge |
| `.scene` | `inset 0 0 0 1px #090a0a`, `0 11px 26px rgba(0,0,0,.55)` | ramme + slagskygge |
| `.active-instrument` | `inset 0 -1px 0 #000` | nedre kant |
| `.parameter-rail` | `border-bottom:1px solid #080909` | nedre kant |
| slider-track/thumb | `inset 0 1px 2px #000`, `0 4px 11px #000` | spor + tommel |
| `.topbar` | `rgba(255,255,255,.07)` | kantlys (usynlig på lyst) |

Mønsteret er det samme i alle seks: **kantlys og skygge er hardkodet for mørk
grunn.** De trenger to tokens, ikke seks unntak — `edge-light` og
`edge-shadow`, som snur betydning med temaet (låst i D144).

## Rekkefølge jeg anbefaler

1. Eier velger C1–C4 (avgjør hvor mye skygge/linje-språket skal bære).
2. Orkestrator skriver DESIGN.md (Colors, Elevation & Depth, scope-setningen)
   med splittede navn; `tokens.css` regenereres derfra.
3. B maler flaten mot de nye navnene og kjører matrisen på nytt
   (390×844 + 375×812, begge temaer så lenge A/B består, E-sekvens 4–5).

Merk at C4 MACHINE gjør deler av splitten unødvendig: der forblir
kontrolldekket mørkt, så `--accent` og `--accent-scene` kan være samme verdi.
Det er det billigste alternativet arkitektonisk — verdt å vite når eier velger.
