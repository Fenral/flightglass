# Artifact-bygg — Studio-splittdemoen

Regenerer den selvforsynte artifact-versjonen med **én kommando**:

```bash
node tools/artifact-build/build.mjs
```

Kilde: `app/studio/split-demo.html` (den som kjører på dev-serveren).
Resultat: `_artifacts/studio-split-demo.html` — én fil, ~2,25 MB, ingen
eksterne kall utenom Google Fonts.

**Bygget er deterministisk:** to kjøringer gir bit-identisk fil. Håndrediger
aldri artifact-en — endre kilden og bygg på nytt (S8).

## Hvorfor det er tre trinn og ikke en kopi

| Trinn | Fil | Hva og hvorfor |
|---|---|---|
| 1 | `bundle.mjs` | Motor + adapter til én bundel, **IIFE per modul**. Fem navn kolliderer på tvers av kjeden — `clamp` og `lowPointShiftPerDegree` (studioContact ↔ studioGeometry), `faceCentreOffsetMm` (studioContact ↔ contactModel), `assertFinite` (tre adaptermoduler), `magnitude` (displayStudio ↔ format). Naiv sammenslåing lar siste definisjon vinne og gir **stille feil tall**. |
| 2 | `verify.mjs` | Differensialtest mot den ekte motoren: alle køller × alle lies × plane 30–80 × dir ±12 × ballpos ±20 × arc ±5 = **305 613 caser**, 17 felter, `Object.is`-likhet. Bygget stopper ved ett avvik. |
| 3 | `png-inline.mjs` | Materialplatene ned og inn som `data:`-URI-er, 5,94 MB → 1,58 MB. Node har ingen bildebehandling, så dette er en minimal PNG-skalerer på `node:zlib`: dekoder alle fem filtertyper, arealmiddel med premultiplisert alfa, koder med filtervalg per rad. Dekker 8-bit, ikke-interlaced RGB/RGBA — alt annet kaster framfor å gjette. |

`build.mjs` binder dem sammen og gjør nøyaktig tre inngrep i sida: inliner
`tokens.css`, bytter import-blokka med bundelen, bytter `ASSETS`-stiene med
data-URI-ene. Skall-taggene strippes fordi artifact-verten eier dem.

## Portene bygget håndhever

Det stopper hvis: differensialtesten finner ett avvik · det ligger igjen en
referanse til noe annet enn Google Fonts · det finnes relative moduler igjen ·
skall-tagger er igjen · fila overstiger 16 MB. Finner det ikke en blokk det
skal bytte, sier det hvilken — kilden kan ha endret seg.

## D117

Resultatet ligger i `_artifacts/`, **aldri i `app/`**. Katalogen er unntatt
fysikklinten, som den må være: en artifact inliner motoren med vilje. En
1,79 MB forhåndsvisning lagt i `app/` ga 49 falske lint-funn og rød rot-test
2026-08-26.

## Skalering av platene

`PLAN` i `png-inline.mjs` bestemmer maksmål per plate — 1024 for bakgrunner,
256 for objekter. Tallene er målt mot behovet: største køllehode i
demoens matrise er 172 px, største ball 72 px, og turf spenner scenebredden
(maks 910 px). Endres demoen slik at noe tegnes større, må `PLAN` opp.

---

# Artifact-bygg 2 — Home-mockene (strøm H)

```bash
node tools/artifact-build/build-home.mjs
```

Kilde: `app/home/home-demo.html`. Resultat: `_artifacts/home-demo.html` —
**0,26 MB**, deterministisk (to kjøringer gir bit-identisk fil).

Gjenbruker `bundle.mjs`; har egen `verify-home.mjs` fordi kjeden er en annen.
Ingen `png-inline.mjs` — Home-mocken tegner ingen scene, så det finnes ingen
materialplater å skalere.

## Utvidelsen av `bundle.mjs`: default-eksport

Home-kjeden har tre `export default` — `graph-data.js`, `solveFlight.js` og
`sa-haptics.js`. Bundleren håndterte bare navngitte eksporter, så den er
utvidet: `export default X` blir `const __default = X`, registrert som
`default` i modulens returobjekt.

**Endringen er en no-op for Studio-bygget, og det er bevist uten
byte-sammenligning:** Studio-kjeden er 9 moduler, og null av dem har
`export default` (verifisert transitivt); den bygde Studio-artifacten
inneholder null forekomster av `__default`. Moduler uten default-eksport går
gjennom nøyaktig samme kode som før.

## Tre inngrep i sida

| # | Hva | Hvorfor |
|---|---|---|
| 1 | `tokens.css` inlines | samme som Studio-bygget |
| 2 | import-blokka → bundel + destrukturering | samme |
| 3 | `fetch()` av `ask-catalog.json` → katalogen inlinet (40 KB) | en selvforsynt fil kan ikke hente noe |

## Porten som måtte bli smartere

Studio-bygget søker rått etter `fetch(` i resultatet. For Home stoppet det
bygget på **en kommentar**: `graph-data.js` forklarer seg selv med «ES-modul
fordi prototypen åpnes via `file://` der fetch() er blokkert».

`build-home.mjs` kjører derfor kodeportene mot en **kopi uten kommentarer**,
og skriver artifacten med kommentarene i behold — de forklarer hvorfor koden
ser ut som den gjør, og skal ikke strippes for å blidgjøre en port.
Porten dekker også `XMLHttpRequest` og `navigator.sendBeacon`.

## Differensialtesten

`verify-home.mjs` sveiper `speed × face × path × attack × dynLoft` =
**12 150 caser**, 13 råfelt med `Object.is`-likhet, pluss utfallsformen
(`shape`/`inDomain`) og at visningslaget svarer. I tillegg sjekkes at grafen
kom hel gjennom den nye default-støtten: node- og kantantall mot D47-fasiten,
og hver kant felt for felt.

**D57-felle, funnet av assertion under bygging:** enhetspakkene heter
`meters` og `yards`. En verifikator som sender `'metric'` kaster — som den
skal.

## Kjøretidsbevis

Målt i nettleser på den ferdige fila: **én ressurs lastet totalt, og det er
Google Fonts.** Null andre nettverkskall. Tallene er identiske med kilden
(Push Fade · 172.3 m · 10.1 m R · 5.4 m R).
