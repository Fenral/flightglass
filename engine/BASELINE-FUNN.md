# Baseline-verifikasjon — workflow w91v0hcu4

Kjørt 2026-08-24. 21 agenter, 3.5M tokens, 883 verktøykall, 80 minutter.
`mod:strikeBandIron` feilet på 403-autentisering (infrastruktur, ikke logikk).

## Resultat

| Modul | Caser | Maks avvik |
|---|---:|---|
| geometry3d | 5028/5028 | `0` |
| startDirection | 5028/5028 | `0` |
| launchAngle | 5028/5028 | `0` |
| spinMagnitude | 5028/5028 | `0` |
| backspinProjection | 5028/5028 | `0` |
| smashBallSpeed | 5028/5028 | `0` |
| longitudinalLegacy | 5028/5028 | `0` |
| aeroCoefficients | 5028/5028 | `4.4e-11` |
| rk4Integrator | 5029/5029 | `4.4e-11` |
| curveProjection | 5028/5028 | `2.842170943040401e-14` |
| offlineComposition | 5028/5028 | `0` |
| outcomeAdapter | 5028/5028 | `0` |
| studioGeometry | 2500/2500 | `0` |
| studioContact | 2500/2500 | `0` |

**Integrasjon:** flight 5029/5029, studio 2500/2500

Ikke produsert (bevisst): studio:shaftPivot (ikke produsert), studio:tangentAtImpact (ikke produsert), studio:planePolygon (ikke produsert), studio:strikeQuality (ikke produsert), studio:strikeBand@driver (ikke produsert)

## Skeptikernes dom

| Linse | Dom | Alvor | Funn |
|---|---|---|---:|
| uavhengig-reberegning | baseline-suspect | medium | 8 |
| randtilfeller | baseline-holds | low | 6 |
| forurensning | baseline-suspect | medium | 7 |
| kontraktbrudd | baseline-suspect | medium | 9 |

## Alle 30 funn

### 1. METODE — jeg skrev en egen solver fra spec-teksten alene (uten å lese engine/src/) og reberegnet 12 flight-caser fra 8 ulike grupper + 4 studio-caser fra 4 grupper, deretter full sveip over 5028 + 2500 caser med Object.is. FLIGHT-PÅSTANDEN HOLDER. Ingen trippel-uenighet i fysikken: hvert felt motoren produserer stemmer med både fixturen og min uavhengige reberegning. Caser: spec-9.neutral-iron, spec-9.d-plane-default, spec-9.push-draw, spec-9.no-flight, grid.full-width.1, declared-boundary.dynamicLoft.maximum, edge.club-speed-zero, edge.dynamic-loft-zero-with-attack, edge.spin-cap-9000.2, edge.curve-sub-one-m-positive-carry, edge.in-domain-false.negative-vertical-spin-loft-with-flight, edge.aero.spin-parameter-above-0.20, edge.rk4-no-ground-within-30-seconds + studio grid.full-width.1/.2 og grid.fine-band.1/.2.

**Hvor:** C:/Users/siver/AppData/Local/Temp/claude/C--Users-siver-Documents-Apper-2026-Flightglass-final/e5bd75ba-edea-4a8f-b7af-2e2bdc82cfd1/scratchpad/indep.mjs, studioIndep.mjs

**Bevis:** Egen sveip: 5028 flight-caser, 553 080 blad sammenlignet, 0 uventede kast, 0 nøkkelrekkefølge-avvik. Kun 13 blad har Object.is-avvik, 11 av dem nedstrøms RK4 (verste absolutt: curve/offline 1.42e-13 yd, reynoldsRangeObserved[0] 4.37e-11; verste relative blant ikke-null forventning 5.3e-15). Error-casen kaster Error med ordrett riktig melding. shape bit-eksakt 5028/5028. Bekreftet også at deres to omstridte valg er RIKTIGE: total = carry + roll (ikke spec §5.6 sin carry*(1+rollFrac)) skiller i 1443/5028 caser og fixturen følger carry+roll i 5028/5028; |v x n| slår spec-ordrett sin(spinLoft3DDeg*deg) mot fixturen, maks differanse 7.276e-12 rpm (deres «7.3e-12» stemmer eksakt).

### 2. De tre «ueide» studio-geometrifeltene er hver en énlinjers lukket form av verdier deriveImpact ALLEREDE regner ut og returnerer. Jeg reproduserte alle tre BIT-EKSAKT i 2500/2500 caser. Rapportens «Gapet er ARVET, ikke innført her: ingen modul eier shaftPivot, tangentAtImpact eller planePolygon» er en prosesspåstand, ikke et teknisk hinder — ENGINE-GAPS §8 sin egen P(θ)-formel pluss sirkelsenteret gir alle tre, og modulen eksporterer allerede arcPoint, planeBasis og lowPointWorld.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/deriveImpact.js (returobjektet, ~linje 202-225); C:/Users/siver/Documents/Apper 2026/Flightglass final/motor/export/ENGINE-GAPS.md §8

**Bevis:** Målt med Object.is over alle 2500 studio-caser: shaftPivot = lowPointWorld + R*planeBasis.m → 2500/2500 bit-eksakt. tangentAtImpact = R*cos(theta)*u + R*sin(theta)*m → 2500/2500 bit-eksakt (grupperingen R*(cos*u + sin*m) gir bare 1780/920/1760 — rekkefølgen er den eneste tvilen, og den er avgjort av fixturen). planePolygon = lowPointWorld + b*m + w*u med b in {-0.048, 1.38} (= -0.04R, 1.15R), w = ±1.176 (= ±0.98R), hjørnerekkefølge (-w,-b)(+w,-b)(+w,+b)(-w,+b) → 2500/2500 bit-eksakt, 0 avvik.

### 3. strikeQuality.band er IKKE redundant for driver, og den lar seg reprodusere 2500/2500 av motorens EGEN eksisterende klassifiserer. Rapportens begrunnelse — «dens tre motoreide felt (band/offsetRatio/clubZ) finnes allerede som strikeBand/clubBallContact.offsetRatio/contactHeight» — er usann for driver: strikeBand emitteres ikke for driver i det hele tatt, og der begge finnes er de uenige i 82 % av driver-casene (FUNN F7). README sier dessuten eksplisitt at band SKAL beholdes.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/strikeBandIron.js:288 (RangeError-vakten); C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/README.md, avsnitt «Sanering av fixturen (FUNN F6)»

**Bevis:** Jeg kalte motorens egen strikeBandIron(contactHeight, effectiveLowPointX) med driver-geometri: den reproduserer out.strikeQuality.band i 1250/1250 driver-caser OG 1250/1250 iron-caser = 2500/2500, null bom (tomt miss-objekt). Klassifisereren er altså klubbmodus-uavhengig i baseline. README ordrett: «Behold `band`, `clubZ`, `offsetRatio`, `theta`. Slett `color`, `textColor`, `tip`, `pct`, `barPos`.» Motoren blokkerer aktivt gjenbruken: solveStrikeBandIron kaster RangeError når clubMode !== 'iron'.

### 4. Driver-strikeBand (Low/High/Pure/Duff) lar seg reprodusere 1250/1250 med en tre-terskels regel på to verdier motoren allerede regner ut. «Udokumentert» er sant; «ikke reproduserbar» er ikke sant. Standarden er dessuten inkonsistent: shape (15 verdier) er like udokumentert i spec-en, ble reverse-engineert for flight, og er bit-eksakt 5028/5028.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/strikeBandIron.js (omfangsnotatet i filhodet, linje 8-14); C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/README.md, «Åpne punkter for senere agenter» + felle 8

**Bevis:** Regel: contactHeight < -0.025 → Duff; ellers faceCentreOffsetMm < -8 → Low; > +8 → High; ellers Pure. Testet mot fixturen: 1250/1250 treff, tomt bom-objekt. Tersklene er rent pinnet av fixturen med tydelige gap: Duff maks clubZ -0.02536835354910628 mot High min -0.024377122669395613 (spec §8.5 oppgir 25 mm eksplisitt); Pure faceCentreOffsetMm [-7.7716826655306255, 7.927920605500203] mot Low maks -8.076284654781295 og High min 8.017170988052241. README sier ordrett: «Strike-båndterskler ... må reverse-engineeres fra studio-golden.json» og felle 8: «Reproduser begge klassifisererne som de er.»

### 5. «studioCasesPassed: 2500/2500» og «npm test: 419 pass, 0 fail» måles mot en selverklært feltliste, så utelatelsene KAN ikke feile. Testen itererer bare studioProducedFields; de fire utelatte feltene er aldri i sammenligningen. Rapportens «INGEN sammenligning feiler — feltene finnes bare ikke» er teknisk sant, men leses som dekning.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/test/integration.test.js:488-505 (studioProducedFields) og :524-533 (run/ironRun)

**Bevis:** Jeg telte bladverdiene i studio-fixturen: 139 500 totalt, 73 250 sammenlignet = 52.5 % (iron 53.9 %, driver 51.1 %). Manglende blad per case: 26 (iron) / 27 (driver), fordelt på planePolygon 12, shaftPivot 3, tangentAtImpact 3, strikeQuality 8, strikeBand 1 (kun driver). Selv når de 5 legitimt bannlyste presentasjonsnøklene trekkes fra, er ca. 45 % av driver-bladene aldri sammenlignet. Til kontrast: flight sammenligner alle 553 080 blad.

### 6. Motoren bryter invarianten README-felle 5 ber neste agent gjøre om til en assertion — og både FUNN og README oppgir den invarianten feil. Rapporten sier «INGEN sammenligning feiler» uten å flagge dette.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/motor/FUNN.md (avsnittet «Ikke et funn — kontrollert og frikjent»); C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/README.md felle 5; C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/test/integration.test.js:119 (toleranceFor)

**Bevis:** FUNN og README påstår at rå RK4-kurve er 0 i ALLE 713 caser med faceToPath === 0. Målt i fixturen: bare 275 er eksakt 0; 438 er ikke-null (opp til 1.4210854715202004e-13 m). Verre: i grid.full-width.2525 (150/-15/-15/15/50) og grid.full-width.3125 (150/15/15/15/50) er fixturen eksakt 0 mens motoren gir ±7.105427357601002e-15. Det passerer bare fordi toleranceFor gulver på 1e-12 når expected er 0. Skriver noen assertionen README ber om, feiler suiten på disse to.

### 7. «72 av 81 felt er BIT-EKSAKTE (avvik 0 på hvert eneste blad)» holder ikke under Object.is, og rapportens ±0-notat peker på feil komponenter. Etiketten «bit-eksakt» i rapporten betyr `===`, ikke bitlikhet — testens teller øker på `expected === actual`, som er sann for -0 === 0.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/test/integration.test.js:160-166 (bitExactLeaves / signedZeroPairs)

**Bevis:** Egen sveip med Object.is over 5028 caser: spinAxisUnit har 201 avvikende blad og spinVectorRadPerSec har 201 — begge på indeks [1] (y-komponenten), 0 på indeks [0] og 0 på indeks [2]. Rapportens notat 6 sier «201 i spinAxisUnit[0], 201 i spinVectorRadPerSec[2]». Begge indeksene er feil. planeBasis.u.y = 500 stemmer (verifisert i studio-sveipen).

### 8. «Maks toleransebruk 2.84 %» måler forbruk av et absolutt gulv, ikke nøyaktighet. På nær-null forventninger er den relative uenigheten mellom motor og fixtur stor, og der er min uavhengige reberegning enig med MOTOREN mot fixturen — den eneste trippel-uenigheten jeg fant, og den er fysisk uten betydning.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/rk4Integrator.js (rawCurveFromLaunchLineM); C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/test/integration.test.js:68-72

**Bevis:** edge.aero.spin-parameter-above-0.20: fixtur 3.552713678800501e-15, motor 3.1086244689504383e-15, min uavhengige 3.1086244689504383e-15 — motor og uavhengig enige, fixturen alene, relativt avvik 12.5 %. grid.full-width.2525: fixtur 0, motor 7.1e-15, relativt avvik uendelig. Begge under det absolutte gulvet 1e-12, så «toleransebruk» rapporterer 0.7 % og 0.04 %. Til orientering testet jeg også om motorens RK4 er dårligere enn en spec-ordrett implementasjon: den er ikke det — motoren treffer bit-eksakt i 3463-4269 av 5028 caser per felt, min naive variant bare 1325-2736. RK4-toleransen er ærlig.

### 9. VERIFIED — all 29 explicit edge cases reproduce, including the throw. I wrote an independent walker (not their test code) that compares every leaf with exact equality plus key-order at every nesting level. All 4 spec-9 goldens, all 10 declared-boundary cases, edge.club-speed-zero, both dynamic-loft-zero cases, all 3 spin-cap-9000, all 4 aero-validity, all 3 in-domain-false, edge.curve-sub-one-m-positive-carry: 0 leaves beyond tolerance. edge.rk4-no-ground-within-30-seconds throws `Error` with name 'Error' and the verbatim message. Whole fixture: 5028/5028 solved, 0 throws, 0 key-order errors, deviations confined to exactly the 9 declared RK4-derived paths, global max tolerance utilisation 2.842 % at rawCurveFromLaunchLineM (abs 5.684e-14) — the report's number is exact, not rounded in its favour. Studio 2500/2500 bit-exact, 0 leaf diffs, and the gap is exactly the 4 fields (iron) / 5 (driver) claimed — no hidden sixth omission.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/solveFlight.js, C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/deriveImpact.js

**Bevis:** Independent run: `solved 5028 errCases 1 thrown 0 keyOrderBad 0 / numeric diffs (any) 11965 | beyond rk4 tol 0`. Edge run: `BAD EDGE CASES: 0 of 29`. The only two edge cases whose JSON is not byte-identical are edge.spin-cap-9000.1/.2, and both differ by exactly 1 ULP in aerodynamicDiagnostics.spinParameterRangeObserved[0] (dev 1.11e-16 vs tol 4.21e-10). Clamp census confirms the edges are actually exercised: totalSpinRpm===9000 in 929 cases, smashEff===1.15 in 290 and ===1.52 in 127, startFaceW===0.88 in 636, landingAngle===32 in 455, rollFrac===0.055 in 531, carry===0 in 382 (all with signature landing/roll/total/curve/offline/scale/defined = 0/0/0/0/0/1/true), curveCarryProjectionDefined===false in exactly 1.

### 10. UNPINNED BRANCH, ~0.8 % OF THE DECLARED IRON INPUT BOX. strikeBandIron's Fat-vs-Thin boundary is a coin flip the fixture cannot arbitrate, and it is reachable. Inside `offsetRatio <= 0` the code picks Fat when `effectiveLowPointX < 0`; the equally fixture-consistent alternative is `< lowPointAheadMinM` (0.02), which would return Fat where this returns Thin. The file itself flags this as AMBIGUITET 1. The gap is not a 1e-13 sliver like the spinAxis one — the fixture jumps straight from -0.0732 m (Fat) to +0.0408 m (Pure), a 0.114 m hole with zero observations. The status report calls studio 'GRØNT PÅ ALT SOM PRODUSERES' and does not mention that a produced field has an undecidable branch over a reachable region.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/strikeBandIron.js:248-250

**Bevis:** Fixture: of 1250 iron cases, 313 reach the `contactHeight >= 0 && offsetRatio <= 0` branch; 22 have effectiveLowPointX < 0 (largest -0.07317872642929266), 240 have it in [0.02,0.15] (smallest 0.04077932017477113), 0 fall in [0, 0.02). I then swept the declared UI box (swingPlane 30-80, swingDirection ±12, ballPositionCm ±20, arcHeightCm ±5, step 0.5 = 8 418 249 points): 69 656 hits (0.83 %) land in the ambiguous window. Example {swingPlane:30, swingDirection:-6, ballPositionCm:19.5, arcHeightCm:0.5} → contactHeight 0.00307, effectiveLowPointX 0.01883 → this engine returns 'Thin', the `< 0.02` variant returns 'Fat'.

### 11. TWO FIXTURE-FITTED BRANCHES ON EXACT FLOAT EQUALITY, no mechanism in spec or ENGINE-GAPS. `spinLoft3DDeg` returns signedVerticalSpinLoftDeg verbatim when `faceToPath === 0 && verticalSpinLoft > 0`, and `spinAxisDeg` returns 0 when `faceToPath === 0`. Neither rule appears in 01-PHYSICS-AND-MECHANICS-ENGINE.md §5.2 or ENGINE-GAPS §1 — ENGINE-GAPS §6 documents the faceToPath===0 forcing for `curve` only. The code admits both: 'Dette KAN ikke vaere en ren funksjon av geometrien' and 'FIXTUREN KAN IKKE SKILLE to implementasjoner'. FUNN.md reaches the opposite conclusion for the same 713 cases ('Matematisk nødvendig … behold den som assertion, ikke som maske') — but the raw formula gives up to 3.6e-14 there, so the mask is load-bearing, and FUNN's 'frikjent' verdict is wrong. Effects are ≤3.6e-14 deg, but spinLoft feeds smashEff → ballSpeed → the whole chain, so the guess is structural, not cosmetic.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/geometry3d.js:208 and :238

**Bevis:** Live cliff: solveFlight({clubSpeed:90, faceAngle:0.3, clubPath:0.1+0.2, attackAngle:0, dynamicLoft:24}) has faceToPath = -5.551115123125783e-17 and returns spinAxis -1.2218266473868197e-16, spinLoft 24.000000000000004, curve -8.961302154388652e-16; the same shot with clubPath:0.3 (faceToPath exactly 0) returns spinAxis 0, spinLoft 24, curve 0. Header comment lines 46-64 state the mirror pair (face 0, path 0, loft 0, attack ∓7.5) has identical |v x n| = 0.13052619222005157 and identical v·n = 0.9914448613738104 yet the fixture returns 7.5 vs 7.499999999999999 — i.e. the source branches on something the vectors do not contain.

### 12. NaN LEAK AT A MEASURE-ZERO STUDIO EDGE. When sin(swingPlane) === 0 and zLP === 0 simultaneously, `c = 1 + zLP/(R·sinφ)` is 0/0 = NaN, so neither `c >= 1` nor `c <= -1` fires and arccos(NaN) propagates. groundCrossingTheta0 becomes NaN and groundEntry/groundExit become {x:NaN, y:NaN, z:NaN}. studio-golden _meta.units declares the field as 'radian or null'. This is almost certainly faithful (the formula is ENGINE-GAPS §8 verbatim and swingPlane 0 is outside the 30-80 grid), so it is a coverage hole rather than a deviation — but the module's own test 'ingen ikke-endelige tall i geometrien' only samples fixture inputs and never reaches it, so nothing in the suite would notice if a guard were added or removed later.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/studioContact.js (groundCrossing / groundEntry / groundExit)

**Bevis:** deriveImpact({swingPlane:0, swingDirection:0, ballPositionCm:0, arcHeightCm:0.2, clubMode:'iron'}) → groundCrossingTheta0 = NaN, groundEntry = {x:NaN,y:NaN,z:NaN}. Same for driver with arcHeightCm:-1.8 (zClub +1.8 cm → zLP 0). With arcHeightCm:0 the same swingPlane gives the correct null/null. Random fuzz never finds it: 60 000 samples in the declared box and 60 000 in a wide box (swingPlane 0-180, ballPositionCm ±200) both gave 0 non-finite.

### 13. PUBLIC SECOND PARAMETER CAN PRODUCE NON-BASELINE NUMBERS AND NON-BASELINE THROWS. solveFlight(input, options) and integrateFlight(input, options) accept {stepSeconds, maxTimeSeconds}. Spec §3 shows solveFlight taking one object. Defaults are correct so no fixture case is touched, but a caller can silently leave the baseline with no version marker — including making an ordinary 90 mph shot throw the RK4 ground-not-reached error, which a consumer would reasonably read as a real timeout.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/solveFlight.js (flightOptions), C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/rk4Integrator.js:676

**Bevis:** solveFlight({clubSpeed:90,faceAngle:1,clubPath:0,attackAngle:-2,dynamicLoft:24}, {stepSeconds:0.02}).curve = 2.482701728096766 vs default 2.4827042775919987. The same shot with {maxTimeSeconds:0.05} throws Error('Flight did not reach the ground within maxTimeSeconds') — the exact error the one fixture error-case is identified by.

### 14. CALIBRATION NOTE ON THE '5029/5029' HEADLINE: 26 % of flight cases pass on tolerance, not on equality, and the RK4 divergence is real state divergence, not bookkeeping. 1312 of 5028 cases deviate in at least one RK4-derived field (943 in curveFlightTimeSeconds, 849 in curveFlightCarryYd, 1565 in rawCurveFromLaunchLineM, 1462 in curve, 1304 in offline, 2225 in spinParameterRangeObserved). I tested whether the time deviation is merely the `time += h` accumulation in the loop: replacing it with steps*h fixes 0 of 943. So the trajectory itself diverges from the source at ~1e-16 relative. The report discloses the nine tolerant fields and the 2.84 % figure, but not that a quarter of the corpus rides on them.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/rk4Integrator.js:702-742

**Bevis:** Cross-tab over all 5028 cases: time-only 463, carry-only 369, both 480, neither 3716. Accumulation test: `time deviations 943, of which fixed by steps*h instead of accumulation: 0`. Second-worst tolerance utilisation after rawCurveFromLaunchLineM is offline at 0.005167 %, so the margin itself is not at risk.

### 15. Et fixturefelt som den bygde koden FAKTISK kan reprodusere blir aktivt blokkert av en vakt som bygger på en feil premiss. `solveStrikeBandIron` kaster RangeError for `clubMode: "driver"`, og `deriveImpact` hopper derfor over båndet for driver. Begrunnelsen i filhodet er at et jern-bånd på driver-input «ville vært et stille feilsvar i 82 % av tilfellene (FUNN F7)». Det stemmer ikke: den klassifisereren ER fixturens `strikeQuality.band`. Dette er en kjent bug som stilltiende er droppet, ikke arvet — og rapportens formulering «Gapet er ARVET, ikke innfort her» og «strikeQuality er utelatt fordi FUNN F6/kodestilen forbyr color/textColor/tip/pct/barPos» gjengir instruksen feil.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/strikeBandIron.js:288 (throw new RangeError), C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/deriveImpact.js:191-192 (clubMode === 'iron' ? ... : null)

**Bevis:** Jeg kjørte den shippede `strikeBandIron(contactHeight, effectiveLowPointX)` på alle 1250 driver-caser via `deriveImpact`s egen geometri: den reproduserer `out.strikeQuality.band` 1250/1250, null feilklassifiseringer, tom mismatch-bøtte. (Samme kall treffer driver-stand-in-en `out.strikeBand` bare 221/1250 — det er den udokumenterte Low/High-modellen, et annet felt.) Motoren kan altså reprodusere `strikeQuality.band` i 2500/2500 caser i dag og nekter å gjøre det. engine/README.md «Feller» nr. 8 sier ordrett «Reproduser begge klassifisererne som de er. (FUNN F1, F7.)», og README-seksjonen «Sanering av fixturen (FUNN F6)» sier «Behold `band`, `clubZ`, `offsetRatio`, `theta`» — altså var strikeQuality minus de fem presentasjonsnøklene påbudt, ikke forbudt.

### 16. `solveFlight` har fått en andre parameter som endrer fysikken og som baseline ikke har. `flightOptions = {stepSeconds, maxTimeSeconds}` videreformidles til RK4. Dette er en «forbedring» agenten la til på eget initiativ (filhodet: «Kun for konvergensstudier på RK4») og legger en ikke-baseline-bryter på den offentlige flaten.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/solveFlight.js:148, 158, 237

**Bevis:** Spec §3 og engine/README.md definerer kallet som `solveFlight({clubSpeed, faceAngle, clubPath, attackAngle, dynamicLoft})` — ingen andre parameter. Målt på shot {90, 2, -1, -4, 24}: baseline `curveFlightCarryYd` = 171.37742089937345; med `{stepSeconds: 0.005}` = 171.37747469536995, og `curve` skiller seg. Med `{maxTimeSeconds: 0.5}` kaster et helt ordinært 90 mph-slag baseline-feilmeldingen «Flight did not reach the ground within maxTimeSeconds», som i fixturen bare tilhører edge-casen med clubSpeed 18000.

### 17. Ny kastende validering i Studio-kjeden, i direkte motstrid med modulenes egne uttalte regel. `deriveImpact` avviser ikke-endelige tall, numeriske strenger og ukjent `clubMode` med TypeError. Spec §3s innstramming er skrevet for `solveFlight`, ikke for Studio.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/deriveImpact.js:89 (assertFiniteSwing), :140 (kallet)

**Bevis:** `src/studioGeometry.js` skriver i sitt eget filhode: «Ingen validering legges til her — en kastende sjekk ville vært ny oppførsel, ikke baseline (jf. spec §3: parsing hører hjemme i et adapterlag)». `src/studioContact.js` og `src/startDirection.js` sier det samme. Komposisjonslaget legger så inn nøyaktig den sjekken. Verifisert: `deriveImpact({swingPlane: '55', swingDirection: 0, ballPositionCm: 0, arcHeightCm: 0, clubMode: 'iron'})` kaster TypeError; `clubMode: 'wedge'` kaster TypeError. Den gamle adapteren koerket. Samme klasse som RangeError-en i strikeBandIron.js:288.

### 18. Fire fittede konstanter uten kilde i spec, ENGINE-GAPS eller `_meta.constants` styrer to returnerte felt (`shape` og `strikeBand`). De er ærlig dokumentert som fittede, men de er beslutninger, ikke reproduksjoner, og de er nå bærende for input rutenettet ikke dekker.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/outcomeAdapter.js:113 (shapeStartStraightMaxDeg = 1.5), :119 (shapeCurveStraightMaxDeg = 1), :125 (shapeCurveMajorMinDeg = 7); C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/strikeBandIron.js:142 (whiffOffsetRatio = 0.4)

**Bevis:** Jeg regnet intervallene ut av fixturen på nytt og de dokumenterte tallene stemmer: |startDirection| blank maks 1.4800000000000004 / ord min 1.5499999999999998; |faceToPath| blank maks 0 / minor min 1 / minor maks 6 / major min 7.5; whiff-intervallet (0.39681452923688304, 0.4031094374492235]. MERK at blank/minor-grensen bare er pinnet fordi ingen case har 0 < |faceToPath| < 1 — kilden kan like gjerne ha vært `gap === 0`. Alt i (0, 1) og [7, 7.5) får en etikett denne baselinen har funnet opp. README «Åpne punkter» tillater reverse-engineering, men tallene er ikke baseline-dokumentasjon.

### 19. `src/aeroCoefficients.js` er en 427 linjers ANDRE implementasjon av §5.7 som ingen produksjonssti bruker. To uavhengige kopier av samme fysikk i samme baseline, med ulike kontrakter — nettopp mekanismen som lar en gammel beslutning snike seg inn ufortjent senere.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/aeroCoefficients.js (hele filen); duplikatet ligger i C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/rk4Integrator.js

**Bevis:** Ingen fil i src/ importerer aeroCoefficients.js — bare test/aeroCoefficients.test.js gjør det (verifisert med grep over hele importgrafen). Alle 13 eksporterte symboler er ubrukt i produksjonskjeden. Kontraktene divergerer allerede: `aeroStep` returnerer `null` ved speed 0 mens `rk4Integrator.aeroSample` returnerer `{observed: false}`, og `aeroCoefficients.isExtrapolated` har en `null`-tristate som `rk4Integrator.isExtrapolated` ikke har (den siste kaster på null-intervaller). rk4Integrator.js dokumenterer duplikatet selv i filhodet, så det er bevisst — men det er et parallellarbeids-artefakt, ikke baseline-reproduksjon.

### 20. Presentasjons-/tegnekonstanter er importert inn i motorens `constants.js` uten en eneste konsument. De har fixture-proveniens (`_meta.constants`), så de er ikke oppdiktet — men de er rendererparametre som ligger i fysikkmodulen.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/constants.js:317 (studioPlaneDefaultDeg), :320 (studioSamples), :326 (studioSweepDeg), :327 (studioSweepRad), :347 (lowPointIdealM)

**Bevis:** grep over src/: alle fem forekommer kun i constants.js selv; eneste andre referanse er test/_fixture.test.js. `samples`/`sweepDeg`/`sweepRad` er impact-studio.html sine buetegneparametre og finnes for å bygge `planePolygon`, som motoren ikke produserer. `planeDefaultDeg` er en UI-default. `lowPointIdealM` (0.105) er det den gamle koden brukte til å regne `strikeQuality.pct`/`barPos` — nøyaktig de presentasjonsfeltene FUNN F6 ber om å slette. Til motorens forsvar: `_meta.constants.view` (960x480) og `.cameras` er korrekt UTELATT.

### 21. `spinMagnitude` shipper en eksplisitt ikke-baseline numerisk sti pluss to valgfrie input som fixturen aldri eksersererer. En kaller som ikke har kryssproduktet får stille tall som ikke er baseline.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/spinMagnitude.js:161 (sinSpinLoft3DFromDegrees), :217 (fallback-valget), :229-230 (spinAxisDefined / ballSpeed === 0)

**Bevis:** Modulens eget filhode: «Dette er IKKE baseline-veien … den koster opptil 7.3e-12 rpm i `spinRpmRaw` og gjør 1724 av 5028 caser bit-uleselige.» Fallbacken er likevel eksportert og valgt automatisk når `sinSpinLoft3D` mangler. `spinAxisDefined` og `ballSpeed` sendes aldri av solveFlight (bekreftet i solveFlight.js §5.4-blokken, som eksplisitt begrunner utelatelsen), så nullregel-grenen er udekket av fixturen: `spinMagnitude({clubSpeed: 100, dynamicLoft: 30, attackAngle: -3, sinSpinLoft3D: 0.5, ballSpeed: 0})` gir totalSpinRpm 0 med spinRpmRaw 6755.846486680988 — en levende gren ingen kan verifisere mot fasit.

### 22. §11.2 BRUDD — duplisert fysikk. Hele §8.1–8.3-kjeden finnes i TO uavhengige kopier. studioGeometry.js importerer kun fra constants.js og importerer ALDRI studioContact.js; begge filene har hver sin implementasjon av de samme fem formlene: LowPointX (ballLowPointX / lowPointX), LowPointZ (clubLowPointZ / lowPointZ), deg→rad φ (swingPlaneRadians / swingPlaneRad), perDegree (lowPointShiftPerDegree i BEGGE), EffectiveLowPointX (shiftLowPointX / effectiveLowPointX), thetaAtImpact (impactTheta / thetaAtImpact), pluss hver sin lokale clamp. Duplikasjonen er ikke arvet — den er innført i denne fasen: studioContact.js sitt eget filhode (linje 94–102) skrev opp gjelden på forhånd («Når studio-geometry legges, bør den ene importere fra den andre i stedet for at begge holder hver sin kopi»), og studioGeometry.js ble deretter bygget uten å gjøre det.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/studioGeometry.js (linje 141–220) og C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/studioContact.js (linje 158–252)

**Bevis:** Kjørt: begge modulenes eksportlister side om side. Alle fem formelparene gir bit-identiske tall i dag (lowPointX 0.07/0.07, φ 1.0821041362364843/samme, effectiveLowPointX 0.050334821163767016/samme, thetaAtImpact -0.04167873242257787/samme, bitEqual=true på alle) — altså to sannhetskilder som ikke kan skilles av fixturen. `grep -n "^import" src/*.js` bekrefter at studioGeometry.js kun importerer './constants.js'.

### 23. Konkret landmine i duplikasjonen: `lowPointShiftPerDegree` eksporteres under NØYAKTIG SAMME NAVN fra begge studio-modulene, men med inkompatible argumentenheter — studioGeometry sin tar GRADER, studioContact sin tar RADIANER. Ingen av dem validerer. Et bytte av importkilde (eller en fremtidig sammenslåing til det planlagte src/math.js) gir stille feil svar med feil fortegn, ikke en feilmelding.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/studioGeometry.js:180 (`lowPointShiftPerDegree(swingPlaneDeg)`) vs studioContact.js:211 (`lowPointShiftPerDegree(swingPlaneRadians)`)

**Bevis:** Kjørt: `lowPointShiftPerDegree(60)` → studioGeometry 0.010471975511965978, studioContact -0.019947290816372098. Feil fortegn og feil størrelsesorden, ingen kast. Kalt korrekt gir studioContact.lowPointShiftPerDegree(swingPlaneRad(60)) = 0.010471975511965978, identisk med studioGeometry. Dette er de eneste to eksportene i hele src/ som deler navn på tvers av moduler.

### 24. Duplikasjonen er LIVE i returobjektet: deriveImpact kjører BEGGE kjedene og blander dem i ett og samme resultat. `thetaAtImpact` og `effectiveLowPointX` i resultatet kommer fra studioGeometry (via solveStudioGeometry), mens `lowPointWorld`, `planeBasis`, `impactPoint`, `contactHeight`, `groundEntry/Exit` og `clubBallContact.theta` bygges av studioContact sine egent rekalkulerte verdier. Objektet har altså to uavhengig beregnede theta-er som tilfeldigvis er like i dag.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/deriveImpact.js:146–219 (solveStudioGeometry på linje 146, så egen rekalkulering av xEffective/theta/basis/lowPoint på linje 175–188)

**Bevis:** Mutasjonstest på KOPI i scratchpad (brukerens filer urørt, verifisert etterpå): patchet KUN studioGeometry.impactTheta (×1.001). Resultat: out.thetaAtImpact = -0.04199997687800387, men theta faktisk brukt til impactPoint = -0.04195799420745919. arcPoint(out.lowPointWorld, out.planeBasis, out.thetaAtImpact) ga {x:-0.00005026951805177824,...} mot out.impactPoint {x:-9.659563730488041e-18,...} — objektet ble internt selvmotsigende. Tilsvarende sprikte out.contactHeight 0.010932506569364647 mot 0.010934373338495562 rekalkulert med den rapporterte thetaen. (13 tester fanget nettopp denne mutasjonen, så fixturen pinner begge kopiene i dag — dette er en latent risiko, ikke en numerisk feil nå.)

### 25. §11.1-sprekk — komposisjonslaget eier fysikk, i strid med sin egen erklærte kontrakt. solveFlight.js sitt filhode sier ordrett «Denne filen inneholder INGEN fysikk. Den er ren sammensetning», men filen regner selv ut |v × n| (sinSpinLoft3D). geometry3d har tallet internt to steder men eksporterer det ikke, så seamen mangler og krysset regnes tre ganger per kall.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/solveFlight.js:178–180 (`magnitude(cross(geometry.clubVelocityUnit, geometry.faceNormalUnit))`); duplikatene i geometry3d.js:173 (spinAxisUnit → normalize(cross(...))) og geometry3d.js:211–212 (spinLoft3DDeg → cross + magnitude)

**Bevis:** Instrumenterte cross()/magnitude() i scratchpad-kopien og kjørte ett solveFlight-kall: cross(v,n) evaluert 3 ganger, magnitude() 3 ganger. geometry3d.js sin eksportliste (cross, dot, magnitude, normalize, clubVelocityUnit, faceNormalUnit, spinAxisUnit, signedVerticalSpinLoftDeg, spinLoft3DDeg, spinAxisDeg, horizontal/verticalSpinLoftComponent, solveGeometry3D) inneholder ingen sinSpinLoft3D.

### 26. Invertert lagdeling: kjernemotoren importerer fra adapterlaget som er dokumentert å ligge OVER den. solveFlight importerer `hasFlight` og `shape` fra outcomeAdapter.js, hvis eget filhode sier «Outcome-adapteren OVER solveFlight», og hvis `hasFlight` står i fixturens `_meta.requestedFieldsAbsentFromSolveFlight`. Dermed er et adapterlag-predikat load-bearing for kjernens `curve`-utfall. Ingen import-sykel, men retningen er motsatt av både README-tabellen og fixture-metadataen.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/solveFlight.js:91 og :250; C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/outcomeAdapter.js:1–20

**Bevis:** flight-golden.json `_meta.requestedFieldsAbsentFromSolveFlight` = ["hasFlight","inDomain","reason","rk4Diagnostics"] (lest direkte). README.md:90 plasserer det samme i `src/outcome.js` = «Adapterlaget over solveFlight». solveFlight.js:250 bruker `hasFlight: carryHasFlight(longitudinal.carry)` som input til curveProjection.

### 27. Flere mindre duplikater i samme klasse som §11.2 rammer. ENGINE-GAPS §2-predikatet `carry > 0` finnes i tre kopier; `clamp` er skrevet av i syv filer. De tre delte modulene README selv erklærer for nettopp dette (src/math.js, src/vec3.js, src/units.js) ble aldri opprettet, så cross/dot/magnitude/normalize ligger inne i geometry3d.js og clamp er kopiert overalt.

**Hvor:** carry>0: outcomeAdapter.js:167, longitudinalLegacy.js:354, longitudinalLegacy.js:432. clamp: launchAngle.js:40, longitudinalLegacy.js:81, smashBallSpeed.js:49, spinMagnitude.js:92, startDirection.js:50, studioContact.js:145, studioGeometry.js:108. Erklærte men manglende moduler: engine/README.md:72–74

**Bevis:** `grep -n "function clamp" src/*.js` → 7 treff. `grep -n "carry > 0" src/*.js` → 3 kodetreff. `ls src/` viser verken math.js, vec3.js eller units.js. studioGeometry.js:98–101 og studioContact.js:137–139 begrunner hver sin kopi med at «src/math.js er planlagt i README-ens modultabell, men finnes ikke ennå».

### 28. Modulgrense-drift som er større enn rapporten innrømmer. Agenten meldte README-drift kun som et filnavnproblem (solve-flight.js vs solveFlight.js). Men README-tabellen tildeler `src/studio-geometry.js` eierskap til lowPointWorld, planeBasis, thetaAtImpact OG impactPoint — den bygde studioGeometry.js eier ingen av de fire. De ligger i studioContact.js, og deriveImpact strekker seg forbi den erklærte eieren for å hente dem. Det er nettopp denne eierskapsforskyvningen som skapte duplikasjonen i funn 1.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/README.md:96 vs C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/studioGeometry.js:20–24 og deriveImpact.js:55–66

**Bevis:** README.md:96 lister for src/studio-geometry.js: «lowPointX, lowPointZ, effectiveLowPointX, lowPointWorld, planeBasis, thetaAtImpact, attackAngle, clubPath, impactPoint, shaftPivot, tangentAtImpact, planePolygon». studioGeometry.js:20 sier selv «Den eier IKKE lowPointWorld, planeBasis, impactPoint...». deriveImpact.js:55–66 importerer planeBasis/lowPointWorld/arcPoint fra studioContact.js.

### 29. Dekningstallet «studioCasesPassed: 2500 av 2500» måler bare felt implementasjonen faktisk produserer. 4 av 20 erklærte fixturefelt produseres i 0 av 2500 caser, og strikeBand i 0 av 1250 driver-caser — 20 % av studio-kontrakten mangler. Agenten oppgir dette i failingFields og status «partial», så det er ikke skjult, men prosenttallet ved siden av overdriver dekningen.

**Hvor:** C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/deriveImpact.js:203–227 (returobjektet) mot studio-golden.json `_meta.returnedFields`

**Bevis:** Egen uavhengig komparator (ikke agentens testharness) over alle 2500 caser: produserte felt = 16 av 20; aldri produsert = shaftPivot 2500, tangentAtImpact 2500, planePolygon 2500, strikeQuality 2500, strikeBand 1250. Alle 16 produserte felt matchet bit-eksakt i alle 2500 caser.

### 30. IKKE FUNNET — det jeg ikke klarte å velte, etter å ha prøvd. §11.1 (ren/deterministisk), §11.3 (Studio rører ikke flukt-fysikk), §11.4 (testdekning) og §11.5 (ingen skjult tilstand) holder alle. Rapportens tall stemmer nøyaktig mot min egen uavhengige verifikasjon.

**Hvor:** hele C:/Users/siver/Documents/Apper 2026/Flightglass final/engine/src/

**Bevis:** Egen komparator: flight 5028 løste caser + 1 error-case = 5029/5029, 0 nøkkelrekkefølge-avvik mot _meta.returnedFields. Renhet: 0 module-scope mutable bindings, ingen Map/Set/cache/memo, ingen process/fs/Date.now/Math.random/console; ingen deling av referanser mellom to kall (aeroModel/aerodynamicDiagnostics/spinAxisUnit/clubVelocityUnit/faceNormalUnit/spinVectorRadPerSec alle false på ===); mutasjon av returnert aeroModel lekker ikke til senere kall; input uendret; 100 gjentatte kall byte-identiske. §11.3: grep for spin|carry|ballSpeed|backspin|apex|rk4|aero|drag|magnus|reynolds|smash|offline i alle fire studio-filene gir 0 kodetreff, og de importerer ingen flight-modul. §11.4: alle fire spec §9 golden cases reproduseres innenfor tabellens 4 desimaler (største avvik 3.15e-3 rpm på backspin) og er eksplisitt testet; sabotasje av studioContact sin ±0.999-clamp (→±0.5) ga nøyaktig 1 feilende test, «thetaAtImpact klampes på ±0.999, ikke ±1» (studioContact.test.js:500), så begge clamp-kopiene er dekket. npm test: 419/419 grønt, bekreftet. Merk også at aeroModel.disclosure — som ser ut som UI-tekst og ville brutt kodestilen — faktisk ER et ekte fixturefelt (out.aeroModel.disclosure), så det å emittere det er korrekt baseline, ikke et brudd.

