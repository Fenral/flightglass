# Korreksjon D76 — til strømmene A og B

**Kursendring, låst av eier.** Les hele før du rører noe.

## Hva som gikk galt

Brevene deres sa «bygg fra bunnen med DESIGN.md». Det var feil instruks — min,
ikke deres. Eieren har brukt lang tid på mockene sine og ba om å **få inn
fargene**, ikke en remake. Fra-bunnen-leveransene mistet det som gjorde mockene
gode: scenens materialitet, tetthet og komposisjon.

## Den nye regelen (D76)

> **Eierens mocker er komposisjonsfasit. DESIGN.md er maling.**

Kildekoden til de originale mockene ligger i **`_source/mocks/`**. Den er nå
fasit for layout, scene, tetthet og komposisjon.

**MERK GRENSEN mot D13:** `_source/mocks/` er eierens EGNE mocker og er
eksplisitt UNNTATT fra forbudet mot gammel kodebase. Motorkode i mockene
(formler, beregninger) er fortsatt utenfor grensen — dere henter KUN
komposisjon, layout og scene. All fysikk kommer fra `engine/` som før.

## Jobben nå

**Ommaling, ikke nybygg:**

⛔ **`_source/mocks/` er SKRIVEBESKYTTET.** Dere KOPIERER derfra til deres egen
`app/`-mappe og maler om kopien. Ikke én fil i `_source/mocks/` endres, flyttes
eller slettes — den er eierens original og eneste vei tilbake hvis ommalingen
forkastes. En strøm som skriver til `_source/` har brutt en låst regel.

1. KOPIER eierens mockkode til app/<modul>/ — bevar hver piksel av komposisjonen
2. Bytt paletten: per-parameter-fargene (rosa/cyan/lilla) og lilla vask →
   `DESIGN.md`-tokens (D19 står: oransje aktiv, grå holdt, kull-flater)
3. Bytt typografi → Archivo per DESIGN.md
4. Bytt tallformat → D28/D29/D67
5. Koble til ekte motor der mocken har hardkodede tall — via `adapter/`,
   aldri direkte regning (fysikklinten står)

**Avvik fra mockens komposisjon tillates KUN der en låst beslutning krever det:**

- D40/D42: to linser (DIRECTION/HEIGHT), utfallsfordelingen
- D59/D60: brytepunkt og standardslag
- D65–D67: tre køller, lie-presets, ahead/behind-format
- U2-rettelsen: reservert sone + ankere med hysterese (kollisjonene i FLIGHT
  var en feil også i mocken — den rettes, ikke arves)
- Strike-visningen viser begge svar (U1/D3b) med underlaget synlig

**Hvert avvik listes i leveransen med beslutningen som krever det.**
Et avvik uten beslutningsreferanse er en feil.

## Det dere har bygget er ikke bortkastet

Adapterlaget, motorkoblingen, traceShape/directionRay, studioShape — alt
gjenbrukes urørt. Det som byttes er komposisjonslaget: DOM-strukturen og CSS-en
bygges nå fra eierens mockkode i stedet for fra blanke ark.

## Leveranse

1. Ommalt modul — eierens komposisjon, ny palett, ekte motor
2. Avvikslisten: hvert punkt der resultatet skiller seg fra mocken, med
   beslutningsreferansen som krever det
3. Beslutninger du tok som ikke sto i DECISIONS.md
