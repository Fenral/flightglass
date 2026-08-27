# D7 — Versjonert fysikkendring: kontaktmodell v1 → v2

Kjørt 2026-08-25 med `engine/tools/contact-diff.mjs` mot alle 2500 studio-caser.
Ingenting i motoren er endret av denne rapporten. Den er beslutningsgrunnlaget.

## Hva som endret seg

| | |
|---|---|
| Gjennomsnittlig `\|Δoffset\|` | **1,950 mm** |
| Største `Δoffset` | **2,94 mm** |
| Uendret strike band | **1678 / 2500 = 67,1 %** |

Forskyvningen kommer fra to rettede konstanter:

- **Jernets sweetspot** `21,3 → 18,4 mm` (F11: arvetallet var ballradiusen, limt inn)
- **Ballradius** `21,3 → 21,336 mm` (R&A: diameter 42,672 mm eksakt)

## Fysisk umulige verdier

| | v1 | v2 |
|---|---:|---:|
| Jern med offset utenfor halve slagflaten | 704 / 1250 | 716 merket `OffFace` |
| Driver | 494 / 1250 | 480 merket `OffFace` |
| **Totalt** | **1198 / 2500** | **1196 eksplisitt merket** |

v1 returnerte `−121,15 mm` på en 55 mm slagflate uten å blunke. Nesten halve
tilstandsrommet lå utenfor en fysisk flate, og ingenting sa fra.

## Båndoverganger

| Antall | Overgang | Forklaring |
|---:|---|---|
| 367 | `Low → OffFace` | Driver-caser utenfor slagflaten, nå merket |
| 296 | `Pure → Centre` | Driver på pigg bytter fra turf- til flatevokabular |
| 61 | `Duff → OffFace` | Samme |
| 52 | `High → OffFace` | Samme |
| 21 | `High → Centre` | Terskeljustering |
| 14 | `Pure → Low` | Terskeljustering |
| 7 | `Fat → Thin` | Kjent restfeil |
| 4 | `Thin → Fat` | Kjent restfeil |

Alle 822 endringer er forklarlige. **Ingen er uventet.**

## Feilen diffen fanget

Første versjon av klassifisereren ga `Whiff → Pure` på **320 caser**. Det er en
umulighet — en whiff er at kølla passerer helt over ballen.

Årsaken var to feil i min egen v2:

1. **Fortegnet var bakvendt.** Jeg antok whiff = positiv offset. Whiff er høy
   køllehøyde og *negativ* offset.
2. **Én akse der spec §8.5 bruker tre.** Køllehøyde, low point foran/bak ballen,
   og om kølla er nedadgående. Fixturen bekreftet det: `Pure` er det eneste
   båndet med smalt `effectiveLowPointX`-intervall og alltid negativ `theta`.

Etter rettingen forsvant alle tre meningsløse overgangene — `Whiff → Pure` (320),
`Thin → Pure` (139), `Fat → Whiff` (61) — og uendret gikk fra 45,9 % til 67,1 %.

**Dette er argumentet for D7 i ett bilde.** Mine egne tester var grønne hele veien,
fordi de testet mot mine egne antagelser. Bare sammenligningen mot forrige versjon
avslørte at klassifisereren var feil.

## To konstanter utledet fra fixturen

- **Whiff-terskel = `1.4 × ballradius`.** Observert grense lå i
  `(0.029752, 0.029886)`; `1.4 × 0.0213 = 0.029820`. Et valgt tall, ikke et fit.
- **`Pure` krever low point 20–150 mm foran ballen.** Spec §8.5 oppgir intervallet;
  fixturens `Pure`-caser ligger i `[0.0408, 0.1492]` m, og øvre grense matcher eksakt.

## Restfeil

Turf-regelen reproduserer **1239 / 1250 = 99,12 %**. De 11 gjenværende er
4 `Thin→Fat` og 7 `Fat→Thin` på grensen mellom de to båndene. Grensen lar seg
ikke utlede av fixturen alene, og originalkoden er utenfor prosjektgrensen (D13).

Restfeilen er pinnet i test — vokser den, feiler suiten.

## Anbefaling

Endringen er **forsvarlig og bør gjennomføres**. Den retter en verifisert
kopieringsfeil (F11), erstatter en avrundet ballradius med regelverkets verdi,
fanger 1196 fysisk umulige tilstander som tidligere passerte som tall, og gir
hver kølle et vokabular som passer underlaget den slås fra.

Men den **endrer 32,9 % av strike bands**, og det skal ikke skje stille.
Fixturen beholdes som `v1-legacy`, og denne rapporten er sporet.
