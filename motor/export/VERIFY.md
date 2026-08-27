# VERIFY

## 1. Source commit

`410a365d47de5c7a1542edc71d0336cd5b7d1b56`

## 2. Case counts

- `flight-golden.json`: 5029 total; 5000 requested-grid cases; 29 explicit edge records.
- `studio-golden.json`: 2500 total; 1250 full-width; 1250 fine-band.

## 3. Existing test output

Command: `C:\Program Files\nodejs\node.exe --test scripts/impact-flight-3d-spin.test.mjs scripts/impact-flight-calculated-spin.test.mjs scripts/impact-flight-domain-coherence.test.mjs scripts/flightglass-3d-spin-model.test.mjs scripts/academy-attack-at-impact-model.test.mjs scripts/academy-plane-coupling-model.test.mjs scripts/academy-contact-height-model.test.mjs`.

Command exit code: `0`.

~~~text
(node:33456) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///C:/Users/siver/Documents/Codex/2026-08-03/gh-repo-clone-fenral-svingbue/svingbue/impact-flight.js is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to C:\Users\siver\Documents\Codex\2026-08-03\gh-repo-clone-fenral-svingbue\svingbue\package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
✔ five flight fixtures retain protected-engine raw truth (20.6373ms)
✔ per-degree flight sensitivity is exact and signed (2.7197ms)
✔ six geometry fixtures retain deriveImpact output without copied tangent math (1.5605ms)
✔ vertical translation leaves derived Attack invariant (0.349ms)
✔ two-state live gate accepts descending then ascending learner geometry (0.3459ms)
✔ every raw transfer boundary and provenance condition fails independently (0.7465ms)
✔ invalid geometry fails closed and exact zero normalizes (0.3776ms)
(node:86440) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///C:/Users/siver/Documents/Codex/2026-08-03/gh-repo-clone-fenral-svingbue/svingbue/swing-parameters-and-impact.js is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to C:\Users\siver\Documents\Codex\2026-08-03\gh-repo-clone-fenral-svingbue\svingbue\package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
✔ nine z fixtures retain protected clubZ and exact Attack invariance (1.9355ms)
✔ every millimeter of z translates Contact Height exactly one millimeter (0.2726ms)
✔ four x fixtures preserve lift budget and verified ground-entry order (0.2833ms)
✔ no ground crossing is fabricated when the modeled bottom is not below ground (0.1656ms)
✔ compensation pair holds height within 0.02 mm while Attack differs (0.1457ms)
✔ live gate accepts two raw height windows at one invariant Attack (0.271ms)
✔ every raw provenance and held-state near miss fails independently (0.742ms)
(node:74876) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///C:/Users/siver/Documents/Codex/2026-08-03/gh-repo-clone-fenral-svingbue/svingbue/swing-parameters-and-impact.js is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to C:\Users\siver\Documents\Codex\2026-08-03\gh-repo-clone-fenral-svingbue\svingbue\package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
✔ exchange rates at 45 55 and 70 use exact protected formula (5.7166ms)
✔ direction sweeps consume protected effective impact and contact outputs (1.1165ms)
✔ three compensation fixtures preserve exact effective plus 10.5 centimeters (0.2622ms)
✔ zero direction makes raw and effective equal while positive direction subtracts (0.1292ms)
✔ live check requires learner raw provenance target and MODEL acknowledgment (0.4669ms)
(node:84376) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///C:/Users/siver/Documents/Codex/2026-08-03/gh-repo-clone-fenral-svingbue/svingbue/flightglass-3d-spin-model.js is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to C:\Users\siver\Documents\Codex\2026-08-03\gh-repo-clone-fenral-svingbue\svingbue\package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
✔ ESM exposes the centered-strike geometry, spin-vector, aero and optional gear contracts (1.4113ms)
✔ declared units are exact: mph -> m/s, yards -> metres and rpm -> rad/s (0.2463ms)
✔ centered geometry builds explicit unit club-velocity and face-normal vectors in x-right/y-target/z-up axes (0.8543ms)
✔ neutral horizontal delivery reduces exactly to dynamicLoft - attackAngle and a horizontal +x backspin axis (0.8193ms)
✔ neutral exact-subtraction compatibility never escapes the principal 0-to-180 included-angle domain (0.2439ms)
✔ true 3-D spin loft is the angle between delivery vectors and grows when a horizontal face/path gap is added (0.2631ms)
✔ D-plane tilt mirrors with face-to-path sign and its spin vector has the right-handed curve sign (0.1967ms)
✔ reported D-plane tilt is the exact spin-axis angle from world horizontal (0.1567ms)
✔ loft forgiveness is geometric: the same +3 degree face-to-path tilts low loft much more (0.9616ms)
✔ compatibility spin vector preserves reported backspin as an exact flight-relative projection (0.3865ms)
✔ total-spin vector is bounded at a near-vertical D-plane axis and zero spin loft stays zero (0.6529ms)
✔ ideal centered impact spin remains centered and never smuggles in strike-location gear effect (0.4056ms)
✔ horizontal gear effect is a separate optional add-on: zero is exact, toe draws and heel fades (0.372ms)
✔ published Smits-Smith equations remain available while the default is an explicitly disclosed historical Pro-V1-class bridge (0.3675ms)
✔ tour-class bridge reproduces the two published historical Pro V1 coefficient anchors (0.1003ms)
✔ vacuum trajectory demonstrates mph input and metre output without an aerodynamic lookup table (5.6658ms)
✔ RK4 flight uses the full spin vector: neutral is straight and mirrored tilt gives mirrored curve (5.248ms)
✔ target-side and launch-line curve are distinct and obey their coordinate transform (1.2899ms)
✔ fixed-step RK4 converges from 0.01 s to 0.005 s without changing the modeled shot materially (3.7116ms)
✔ custom aerodynamic callbacks never inherit the default coefficient-set label or validity silently (4.0483ms)
✔ invalid geometry, units, environment and aerodynamic functions fail explicitly instead of producing NaN (0.7119ms)
(node:77772) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///C:/Users/siver/Documents/Codex/2026-08-03/gh-repo-clone-fenral-svingbue/svingbue/impact-flight.js is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to C:\Users\siver\Documents\Codex\2026-08-03\gh-repo-clone-fenral-svingbue\svingbue\package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
✔ neutral five-field reference pins the recalibrated longitudinal outputs (9.2927ms)
✔ neutral low-loft delivery pins the recalibrated five-field fit exactly (3.621ms)
✔ 3-D spin loft drives smash while vertical spin loft alone selects bag calibration (2.6336ms)
✔ same face-to-path is more forgiving with loft, including the ~2.4 driver/hybrid axis ratio (4.4021ms)
✔ representative +3 degree driver miss remains below 30 yards offline (0.8772ms)
✔ flagship driver diagnosis remains monotonic when the face-to-path gap is halved (2.9341ms)
✔ higher spin loft still raises backspin and lowers smash factor at neutral face/path (2.2484ms)
✔ curve comes from the metre-based simulator with a disclosed retained-carry projection (0.8737ms)
✔ reported backspin is exactly the flight-relative projection of the full spin vector (0.8113ms)
✔ near-zero vertical spin loft cannot create a projection singularity or reverse curve sign (2.4198ms)
✔ mirror delivery produces mirrored spin axis and curve without a hidden gear term (1.8094ms)
✔ shape labels use true face-to-path, not a recovered fitted spin-axis gain (1.6334ms)
✔ trajectory samples retain yards and the offline = start + curve endpoint identity (1.0304ms)
✔ solveFlight rejects non-finite and physically invalid speed instead of silently substituting zero (0.4695ms)
✔ zero club speed cannot produce spin from the empirical minimum clamp (0.2311ms)
✔ spin goes continuously to zero with true spin loft — there is no floor left (2.774ms)
(node:84064) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///C:/Users/siver/Documents/Codex/2026-08-03/gh-repo-clone-fenral-svingbue/svingbue/impact-flight.js is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to C:\Users\siver\Documents\Codex\2026-08-03\gh-repo-clone-fenral-svingbue\svingbue\package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
✔ nøytral levering beholder de beskyttede invariantene (8.4214ms)
✔ mid-iron delivery stays near the current TrackMan bag spin scale (4.0292ms)
✔ driver får fysisk spinn — ikke det gamle 1500-gulvet (1.2733ms)
✔ driver bøyer nå mer enn hybrid ved samme face-to-path (2.4634ms)
✔ den fittede stien og 1500-gulvet er borte fra motorens utdata (5.2526ms)
(node:17728) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///C:/Users/siver/Documents/Codex/2026-08-03/gh-repo-clone-fenral-svingbue/svingbue/impact-flight.js is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to C:\Users\siver\Documents\Codex\2026-08-03\gh-repo-clone-fenral-svingbue\svingbue\package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
✔ exactly zero launch suppresses shipping flight without erasing impact physics (4.724ms)
✔ airborne extent collapses continuously at the zero-launch boundary (3.3157ms)
ℹ tests 63
ℹ suites 0
ℹ pass 63
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 162.9076

~~~

## 4. Spec section 9 golden records extracted from flight-golden.json

{"id":"spec-9.neutral-iron","group":"edge.spec-9-golden","in":{"clubSpeed":90,"faceAngle":0,"clubPath":0,"attackAngle":-4,"dynamicLoft":24},"out":{"clubPath":0,"faceAngle":0,"attackAngle":-4,"dynamicLoft":24,"clubSpeed":90,"club":"7iron","startDirection":0,"spinLoft":28,"spinLoft3DDeg":28,"signedVerticalSpinLoftDeg":28,"launchAngle":12.253017767130947,"spinAxis":0,"ballSpeed":125.864477425604,"carry":180.38286474188666,"apex":28.706221994053116,"landingAngle":49.619984446597776,"offline":0,"total":186.34813028725173,"curve":0,"curveFromLaunchLineM":0,"rawCurveFromLaunchLineM":0,"curveFlightCarryYd":172.01244682437616,"curveFlightTimeSeconds":5.088653895616494,"curveCarryProjectionDefined":true,"curveCarryProjectionScale":1.0486616990342372,"curveCarryProjectionMinimumDownrangeM":1,"backspin":4834.536848226549,"signedBackspinRpm":4834.536848226549,"totalSpinRpm":4834.536848226549,"rightCurveSpinRpm":0,"spinVectorRadPerSec":[506.27151486325596,0,0],"spinAxisUnit":[1,0,0],"clubVelocityUnit":[0,0.9975640502598242,-0.0697564737441253],"faceNormalUnit":[0,0.9135454576426009,0.4067366430758002],"horizontalSpinLoftComponent":0,"verticalSpinLoftComponent":0.46947156278589075,"centeredStrike":true,"gearEffectApplied":false,"aerodynamicDiagnostics":{"coefficientSetId":"tour-class-v1-era-bridge-v1+legacy-7iron-curve-flight-anchor-v1","validityKnown":true,"reynoldsValidity":[70000,210000],"spinParameterValidity":[0.08,0.2],"reynoldsRangeObserved":[69649.47916749712,164444.49842620228],"spinParameterRangeObserved":[0.191967000229151,0.3854274179535461],"extrapolated":true,"reverseMagnusPolicy":"not modeled; positive-lift bridge is extrapolated below Reynolds 70000"},"aeroModel":{"coefficientSetId":"tour-class-v1-era-bridge-v1+legacy-7iron-curve-flight-anchor-v1","baseCoefficientSetId":"tour-class-v1-era-bridge-v1","class":"historical Pro-V1-class isotropic bridge","exactNamedBall":false,"dragCompatibilityScale":1.275116456035,"referenceAnchorDragScale":1.275116456035,"carryProjectionScale":1.0486616990342372,"carryProjectionDefined":true,"integrationStepSeconds":0.01,"spinDecayPerSecond":0.04,"disclosure":"Historical Pro-V1-class isotropic bridge; not exact current named-ball physics because proprietary modern coefficients are unavailable. Legacy-carry compatibility constraint for the curve flight only; not a ball property or named-ball calibration. Terminal RK4 lateral displacement is projected by its downrange ratio onto the retained Flightglass carry; this is a disclosed compatibility transform, not a measured ball coefficient."},"smash":1.3984941936178221,"smashEff":1.3984941936178221,"apexLaunchFactor":1.7536512400885,"faceToPath":0,"startFaceW":0.78,"launchLoftW":-0.1693792957175766,"launchLoftQuadratic":0.012024703872880052,"launchAttackW":0.25,"launchIntercept":10.391891433573875,"launchInterceptBlend":1,"smashModelIntercept":1.544034400161688,"smashSpinLoftLinear":-0.0033788247838473073,"smashSpinLoftQuadratic":-0.00006496570484201677,"smashMinimum":1.15,"smashMaximum":1.52,"spinCalibration":0.8531119488025043,"spinCalibrationLow":0.81,"spinCalibrationRange":0.32,"spinCalibrationMidpointDeg":31.98,"spinCalibrationWidthDeg":2.14,"spinRpmRaw":4834.536848226549,"maxTotalSpinRpm":9000,"carryBallSpeedLinear":0.9205937574433162,"carryBallSpeedQuadratic":0.004072298666112809,"carryBallSpeedFit":180.38286474188666,"carryFullLaunchAtDeg":10,"carryLaunchEfficiency":1,"apexBasePerBallSpeed":0.1300557732,"apexLaunchPerBallSpeedDeg":0.0079993922,"apexBallSpeedTerm":16.369401930000873,"apexLaunchTerm":12.336820064052246,"rollFrac":0.03307002333010334,"roll":5.9652655453650665,"landingBase":52.8,"landingSpinTerm":-3.1800155534022188,"landingLaunchTerm":0,"landingApexTerm":0,"landingDomainTerm":0,"landingSpinLoftTau":10.9,"landingRaw":49.619984446597776,"shape":"Straight"}}

{"id":"spec-9.d-plane-default","group":"edge.spec-9-golden","in":{"clubSpeed":90,"faceAngle":2,"clubPath":0,"attackAngle":3,"dynamicLoft":24},"out":{"clubPath":0,"faceAngle":2,"attackAngle":3,"dynamicLoft":24,"clubSpeed":90,"club":"7iron","startDirection":1.56,"spinLoft":21.088673579856664,"spinLoft3DDeg":21.088673579856664,"signedVerticalSpinLoftDeg":21,"launchAngle":14.003017767130947,"spinAxis":5.076549826581551,"ballSpeed":129.94984164625276,"carry":188.399763155694,"apex":31.457140656241222,"landingAngle":46.755867766476946,"offline":10.991865469432575,"total":195.43954607491628,"curve":5.8629131846006235,"curveFromLaunchLineM":5.36104781599881,"rawCurveFromLaunchLineM":5.061854907889942,"curveFlightCarryYd":177.88542436219228,"curveFlightTimeSeconds":5.174236654094203,"curveCarryProjectionDefined":true,"curveCarryProjectionScale":1.0591073654921468,"curveCarryProjectionMinimumDownrangeM":1,"backspin":3510.5899927683545,"signedBackspinRpm":3510.5899927683545,"totalSpinRpm":3526.207052838138,"rightCurveSpinRpm":329.84240167933166,"spinVectorRadPerSec":[367.8110667183741,1.7124181640104483,-32.674885054031954],"spinAxisUnit":[0.996066569800816,0.0046373876183462065,-0.08848662701964236],"clubVelocityUnit":[0,0.9986295347545738,0.052335956242943835],"faceNormalUnit":[0.03188227668658269,0.9129889504329772,0.4067366430758002],"horizontalSpinLoftComponent":0.03188227668658269,"verticalSpinLoftComponent":0.358397074882272,"centeredStrike":true,"gearEffectApplied":false,"aerodynamicDiagnostics":{"coefficientSetId":"tour-class-v1-era-bridge-v1+legacy-7iron-curve-flight-anchor-v1","validityKnown":true,"reynoldsValidity":[70000,210000],"spinParameterValidity":[0.08,0.2],"reynoldsRangeObserved":[71349.77643450645,169782.10983089777],"spinParameterRangeObserved":[0.13560876427290622,0.2726775739389901],"extrapolated":true,"reverseMagnusPolicy":"not modeled; positive-lift bridge is extrapolated below Reynolds 70000"},"aeroModel":{"coefficientSetId":"tour-class-v1-era-bridge-v1+legacy-7iron-curve-flight-anchor-v1","baseCoefficientSetId":"tour-class-v1-era-bridge-v1","class":"historical Pro-V1-class isotropic bridge","exactNamedBall":false,"dragCompatibilityScale":1.275116456035,"referenceAnchorDragScale":1.275116456035,"carryProjectionScale":1.0591073654921468,"carryProjectionDefined":true,"integrationStepSeconds":0.01,"spinDecayPerSecond":0.04,"disclosure":"Historical Pro-V1-class isotropic bridge; not exact current named-ball physics because proprietary modern coefficients are unavailable. Legacy-carry compatibility constraint for the curve flight only; not a ball property or named-ball calibration. Terminal RK4 lateral displacement is projected by its downrange ratio onto the retained Flightglass carry; this is a disclosed compatibility transform, not a measured ball coefficient."},"smash":1.4438871294028084,"smashEff":1.4438871294028086,"apexLaunchFactor":1.8612891865291585,"faceToPath":2,"startFaceW":0.78,"launchLoftW":-0.1693792957175766,"launchLoftQuadratic":0.012024703872880052,"launchAttackW":0.25,"launchIntercept":10.391891433573875,"launchInterceptBlend":1,"smashModelIntercept":1.544034400161688,"smashSpinLoftLinear":-0.0033788247838473073,"smashSpinLoftQuadratic":-0.00006496570484201677,"smashMinimum":1.15,"smashMaximum":1.52,"spinCalibration":0.8118805902552874,"spinCalibrationLow":0.81,"spinCalibrationRange":0.32,"spinCalibrationMidpointDeg":31.98,"spinCalibrationWidthDeg":2.14,"spinRpmRaw":3526.207052838138,"maxTotalSpinRpm":9000,"carryBallSpeedLinear":0.9205937574433162,"carryBallSpeedQuadratic":0.004072298666112809,"carryBallSpeedFit":188.399763155694,"carryFullLaunchAtDeg":10,"carryLaunchEfficiency":1,"apexBasePerBallSpeed":0.1300557732,"apexLaunchPerBallSpeedDeg":0.0079993922,"apexBallSpeedTerm":16.900727132520963,"apexLaunchTerm":14.556413523720257,"rollFrac":0.03736619835028458,"roll":7.039782919222299,"landingBase":52.8,"landingSpinTerm":-6.044132233523051,"landingLaunchTerm":0,"landingApexTerm":0,"landingDomainTerm":0,"landingSpinLoftTau":10.9,"landingRaw":46.755867766476946,"shape":"Push Fade"}}

{"id":"spec-9.push-draw","group":"edge.spec-9-golden","in":{"clubSpeed":90,"faceAngle":2,"clubPath":5,"attackAngle":-3,"dynamicLoft":24},"out":{"clubPath":5,"faceAngle":2,"attackAngle":-3,"dynamicLoft":24,"clubSpeed":90,"club":"7iron","startDirection":2.66,"spinLoft":27.157365697365666,"spinLoft3DDeg":27.157365697365666,"signedVerticalSpinLoftDeg":27,"launchAngle":12.503017767130947,"spinAxis":-6.004442971857732,"ballSpeed":126.39246750676323,"carry":181.41131517286283,"apex":29.079407724595818,"landingAngle":49.31443830223904,"offline":1.2230161274190658,"total":187.4937358898153,"curve":-7.196116582907217,"curveFromLaunchLineM":-6.580129003410359,"rawCurveFromLaunchLineM":-6.2454027232980405,"curveFlightCarryYd":172.1830561726785,"curveFlightTimeSeconds":5.07412903742047,"curveCarryProjectionDefined":true,"curveCarryProjectionScale":1.0535956278469674,"curveCarryProjectionMinimumDownrangeM":1,"backspin":4591.301374571777,"signedBackspinRpm":4591.301374571777,"totalSpinRpm":4619.511665274681,"rightCurveSpinRpm":-506.8968697418096,"spinVectorRadPerSec":[479.4932770071182,-39.288084814616745,50.603382662736415],"spinAxisUnit":[0.9911921096163304,-0.08121498577258922,0.10460558264397843],"clubVelocityUnit":[0.0870362988312832,0.994829447880333,-0.052335956242943835],"faceNormalUnit":[0.03188227668658269,0.9129889504329772,0.4067366430758002],"horizontalSpinLoftComponent":-0.047811275097123254,"verticalSpinLoftComponent":0.45392497604868665,"centeredStrike":true,"gearEffectApplied":false,"aerodynamicDiagnostics":{"coefficientSetId":"tour-class-v1-era-bridge-v1+legacy-7iron-curve-flight-anchor-v1","validityKnown":true,"reynoldsValidity":[70000,210000],"spinParameterValidity":[0.08,0.2],"reynoldsRangeObserved":[70056.84594780761,165134.32820062424],"spinParameterRangeObserved":[0.18265025928875453,0.3631606131076889],"extrapolated":true,"reverseMagnusPolicy":"not modeled; positive-lift bridge is extrapolated below Reynolds 70000"},"aeroModel":{"coefficientSetId":"tour-class-v1-era-bridge-v1+legacy-7iron-curve-flight-anchor-v1","baseCoefficientSetId":"tour-class-v1-era-bridge-v1","class":"historical Pro-V1-class isotropic bridge","exactNamedBall":false,"dragCompatibilityScale":1.275116456035,"referenceAnchorDragScale":1.275116456035,"carryProjectionScale":1.0535956278469674,"carryProjectionDefined":true,"integrationStepSeconds":0.01,"spinDecayPerSecond":0.04,"disclosure":"Historical Pro-V1-class isotropic bridge; not exact current named-ball physics because proprietary modern coefficients are unavailable. Legacy-carry compatibility constraint for the curve flight only; not a ball property or named-ball calibration. Terminal RK4 lateral displacement is projected by its downrange ratio onto the retained Flightglass carry; this is a disclosed compatibility transform, not a measured ball coefficient."},"smash":1.404360750075147,"smashEff":1.404360750075147,"apexLaunchFactor":1.7690280895800226,"faceToPath":-3,"startFaceW":0.78,"launchLoftW":-0.1693792957175766,"launchLoftQuadratic":0.012024703872880052,"launchAttackW":0.25,"launchIntercept":10.391891433573875,"launchInterceptBlend":1,"smashModelIntercept":1.544034400161688,"smashSpinLoftLinear":-0.0033788247838473073,"smashSpinLoftQuadratic":-0.00006496570484201677,"smashMinimum":1.15,"smashMaximum":1.52,"spinCalibration":0.8384489775352614,"spinCalibrationLow":0.81,"spinCalibrationRange":0.32,"spinCalibrationMidpointDeg":31.98,"spinCalibrationWidthDeg":2.14,"spinRpmRaw":4619.511665274681,"maxTotalSpinRpm":9000,"carryBallSpeedLinear":0.9205937574433162,"carryBallSpeedQuadratic":0.004072298666112809,"carryBallSpeedFit":181.41131517286283,"carryFullLaunchAtDeg":10,"carryLaunchEfficiency":1,"apexBasePerBallSpeed":0.1300557732,"apexLaunchPerBallSpeedDeg":0.0079993922,"apexBallSpeedTerm":16.43807008824797,"apexLaunchTerm":12.64133763634785,"rollFrac":0.03352834254664144,"roll":6.082420716952477,"landingBase":52.8,"landingSpinTerm":-3.4855616977609554,"landingLaunchTerm":0,"landingApexTerm":0,"landingDomainTerm":0,"landingSpinLoftTau":10.9,"landingRaw":49.31443830223904,"shape":"Push Draw"}}

{"id":"spec-9.no-flight","group":"edge.spec-9-golden","in":{"clubSpeed":90,"faceAngle":0,"clubPath":0,"attackAngle":0,"dynamicLoft":0},"out":{"clubPath":0,"faceAngle":0,"attackAngle":0,"dynamicLoft":0,"clubSpeed":90,"club":"7iron","startDirection":0,"spinLoft":0,"spinLoft3DDeg":0,"signedVerticalSpinLoftDeg":0,"launchAngle":0,"spinAxis":0,"ballSpeed":136.8,"carry":0,"apex":0,"landingAngle":0,"offline":0,"total":0,"curve":0,"curveFromLaunchLineM":0,"rawCurveFromLaunchLineM":0,"curveFlightCarryYd":0.001363291183582465,"curveFlightTimeSeconds":0.000020414680476476482,"curveCarryProjectionDefined":true,"curveCarryProjectionScale":1,"curveCarryProjectionMinimumDownrangeM":1,"backspin":0,"signedBackspinRpm":0,"totalSpinRpm":0,"rightCurveSpinRpm":0,"spinVectorRadPerSec":[0,0,0],"spinAxisUnit":[1,0,0],"clubVelocityUnit":[0,1,0],"faceNormalUnit":[0,1,0],"horizontalSpinLoftComponent":0,"verticalSpinLoftComponent":0,"centeredStrike":true,"gearEffectApplied":false,"aerodynamicDiagnostics":{"coefficientSetId":"tour-class-v1-era-bridge-v1+legacy-7iron-curve-flight-anchor-v1","validityKnown":true,"reynoldsValidity":[70000,210000],"spinParameterValidity":[0.08,0.2],"reynoldsRangeObserved":[178197.94843276602,178731.98097534248],"spinParameterRangeObserved":[0,0],"extrapolated":true,"reverseMagnusPolicy":"not modeled; positive-lift bridge is extrapolated below Reynolds 70000"},"aeroModel":{"coefficientSetId":"tour-class-v1-era-bridge-v1+legacy-7iron-curve-flight-anchor-v1","baseCoefficientSetId":"tour-class-v1-era-bridge-v1","class":"historical Pro-V1-class isotropic bridge","exactNamedBall":false,"dragCompatibilityScale":1.275116456035,"referenceAnchorDragScale":1.275116456035,"carryProjectionScale":1,"carryProjectionDefined":true,"integrationStepSeconds":0.01,"spinDecayPerSecond":0.04,"disclosure":"Historical Pro-V1-class isotropic bridge; not exact current named-ball physics because proprietary modern coefficients are unavailable. Legacy-carry compatibility constraint for the curve flight only; not a ball property or named-ball calibration. Terminal RK4 lateral displacement is projected by its downrange ratio onto the retained Flightglass carry; this is a disclosed compatibility transform, not a measured ball coefficient."},"smash":1.52,"smashEff":1.52,"apexLaunchFactor":1,"faceToPath":0,"startFaceW":0.88,"launchLoftW":-0.1693792957175766,"launchLoftQuadratic":0.012024703872880052,"launchAttackW":0.25,"launchIntercept":10.391891433573875,"launchInterceptBlend":0,"smashModelIntercept":1.544034400161688,"smashSpinLoftLinear":-0.0033788247838473073,"smashSpinLoftQuadratic":-0.00006496570484201677,"smashMinimum":1.15,"smashMaximum":1.52,"spinCalibration":0.8100001035346146,"spinCalibrationLow":0.81,"spinCalibrationRange":0.32,"spinCalibrationMidpointDeg":31.98,"spinCalibrationWidthDeg":2.14,"spinRpmRaw":0,"maxTotalSpinRpm":9000,"carryBallSpeedLinear":0.9205937574433162,"carryBallSpeedQuadratic":0.004072298666112809,"carryBallSpeedFit":202.14720060756065,"carryFullLaunchAtDeg":10,"carryLaunchEfficiency":0,"apexBasePerBallSpeed":0.1300557732,"apexLaunchPerBallSpeedDeg":0.0079993922,"apexBallSpeedTerm":0,"apexLaunchTerm":0,"rollFrac":0,"roll":0,"landingBase":52.8,"landingSpinTerm":-41.5,"landingLaunchTerm":0,"landingApexTerm":0,"landingDomainTerm":-11.299999999999997,"landingSpinLoftTau":10.9,"landingRaw":0,"shape":"Straight"}}

## 5. Differences between specification documents and current code

1. The requested example fields `hasFlight`, `inDomain`, `reason`, and `rk4Diagnostics` are not returned by `solveFlight`. `hasFlight` is local; `inDomain` and `reason` are Outcome-adapter fields; the returned RK4-related diagnostic object is named `aerodynamicDiagnostics`. The five documented UI boundaries also do not clamp direct engine input. This is today's behavior.
2. The four section-9 document values are rounded metre/UI summaries. The extracted records retain raw yard, mph, degree, rpm and nested diagnostic values from `solveFlight`. This is today's behavior.
3. Studio does not expose one aggregate solver. Ground Entry/Exit and face-centre offset are composed by `impact-studio.html` from exported geometry primitives. Driver presentation is marked unvalidated and can override the raw engine strike band. This is today's behavior.
4. Five Guide questions contain metric IDs that the old renderer registry does not support. They remain unfiltered in `ask-catalog.json` and are listed in `_knownDebt`. This is today's behavior.
5. Connections edge `e30` says Spin Loft → Landing Angle, while landing uses `abs(signedVerticalSpinLoftDeg)` rather than public nonnegative 3-D `spinLoft`. The edge remains exported and marked in `_knownDebt`. This is today's behavior.

## 6. Asset SHA-256

- `ball-flight.png`: `0BA98C698500A9A7E22C7812D3B2102B75B6AE0E49724800B64350CD201CE876`
- `impact-studio.png`: `64D63CDA65D0B0D6E14A1E424AE431F28596D7784E14290D8A24658AA847C4AA`
- `d-plane.png`: `B4AB68A7DE1D973EEF2AFE7A5FFD0D86D7B67A38EB1FFA79226881F1338D7F0E`
