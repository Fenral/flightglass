import XCTest

@testable import FlightglassEngine

/// Modul 2 — §5.2 sentrert D-plane-geometri, mot alle 5028 flight-caser.
///
/// JS-baselinen er bit-eksakt på alle åtte felt (5028/5028, maks avvik 0).
/// Swift-porten kan ikke garantere det samme for de transcendentale kjedene —
/// `sin`/`cos`/`atan2` er libm, og libm er ikke samme kode på ucrt som på
/// Apples plattformer (D73). Derfor:
///
///   - toleransen som DØMMER er den deklarerte, `1e-12` relativt
///   - antallet bit-eksakte caser TELLES og rapporteres uansett
///
/// Et felt som faller under 100 % bit-eksakt er ikke nødvendigvis en feil, men
/// det er alltid noe som skal stå i avviksrapporten med tall.
final class Geometry3DTests: XCTestCase {

  /// Transcendentale kjeder. Oppdragsbrevets deklarerte bånd.
  private let transcendental = Tolerance.relative(1e-12)

  /// Rent algebraiske felt. Avvik her er en feil i porten, ikke libm.
  private let algebraic = Tolerance.exact

  // ── Hele §5.2 mot fixturen ───────────────────────────────────────────────

  func testAllEightFieldsMatchFixture() {
    let cases = Fixture.flight()
    XCTAssertEqual(cases.count, 5028)

    // felt → sammenligninger
    var scalar: [String: [Comparison]] = [:]
    var vector: [String: [Comparison]] = [:]

    for c in cases {
      let solved = Geometry3D.solve(
        attackAngle: c.inDouble("attackAngle"),
        clubPath: c.inDouble("clubPath"),
        dynamicLoft: c.inDouble("dynamicLoft"),
        faceAngle: c.inDouble("faceAngle")
      )

      func addScalar(_ field: String, _ actual: Double) {
        guard let expected = c.outDouble(field) else {
          return XCTFail("\(c.id): fixturen mangler \(field)")
        }
        scalar[field, default: []].append(
          Comparison(id: c.id, field: field, expected: expected, actual: actual))
      }

      func addVector(_ field: String, _ actual: Vec3) {
        guard let expected = c.outVec3(field) else {
          return XCTFail("\(c.id): fixturen mangler \(field)")
        }
        let components: [(String, Double, Double)] = [
          ("x", expected.x, actual.x),
          ("y", expected.y, actual.y),
          ("z", expected.z, actual.z),
        ]
        for (axis, e, a) in components {
          vector[field, default: []].append(
            Comparison(id: c.id, field: "\(field).\(axis)", expected: e, actual: a))
        }
      }

      addVector("clubVelocityUnit", solved.clubVelocityUnit)
      addVector("faceNormalUnit", solved.faceNormalUnit)
      addVector("spinAxisUnit", solved.spinAxisUnit)
      addScalar("spinLoft3DDeg", solved.spinLoft3DDeg)
      addScalar("signedVerticalSpinLoftDeg", solved.signedVerticalSpinLoftDeg)
      addScalar("spinAxis", solved.spinAxis)
      addScalar("horizontalSpinLoftComponent", solved.horizontalSpinLoftComponent)
      addScalar("verticalSpinLoftComponent", solved.verticalSpinLoftComponent)
    }

    // `signedVerticalSpinLoftDeg` er ren subtraksjon — den skal være eksakt.
    assertField(
      "geometry3d/signedVerticalSpinLoftDeg",
      scalar["signedVerticalSpinLoftDeg"] ?? [],
      tolerance: algebraic)

    for field in [
      "spinLoft3DDeg", "spinAxis",
      "horizontalSpinLoftComponent", "verticalSpinLoftComponent",
    ] {
      assertField("geometry3d/\(field)", scalar[field] ?? [], tolerance: transcendental)
    }

    for field in ["clubVelocityUnit", "faceNormalUnit", "spinAxisUnit"] {
      assertField("geometry3d/\(field)", vector[field] ?? [], tolerance: transcendental)
    }
  }

  // `assertField` er felles for alle modultestene og bor i `TestSupport.swift`.

  // ── De to grenene fixturen krever og spec-en ikke nevner ─────────────────

  func testBranchA_spinAxisIsExactlyZeroWhenFaceEqualsPath() {
    let cases = Fixture.flight().filter {
      $0.inDouble("faceAngle") - $0.inDouble("clubPath") == 0
    }
    XCTAssertEqual(cases.count, 713, "antall faceToPath == 0-caser har endret seg")

    for c in cases {
      let solved = Geometry3D.solve(
        attackAngle: c.inDouble("attackAngle"),
        clubPath: c.inDouble("clubPath"),
        dynamicLoft: c.inDouble("dynamicLoft"),
        faceAngle: c.inDouble("faceAngle")
      )
      XCTAssertEqual(solved.spinAxis, 0, "\(c.id): spinAxis skal være eksakt 0")
      XCTAssertEqual(c.outDouble("spinAxis"), 0, "\(c.id): fixturen er ikke 0")
    }
  }

  func testBranchA_doesNotLeakIntoTheUnroundedNeighbours() {
    // Nullingen treffer den offentlige skalaren ALENE. `spinAxisUnit[2]` og
    // `rightCurveSpinRpm` står uavkortet i fixturen — en maske ville tatt dem.
    // Delt opp i egne uttrykk: samlet i ett `first { … }` klarte ikke
    // typesjekkeren det innen rimelig tid.
    var sample: FixtureCase? = nil
    for candidate in Fixture.flight() {
      let face: Double = candidate.inDouble("faceAngle")
      let path: Double = candidate.inDouble("clubPath")
      guard face - path == 0 else { continue }
      guard let axis = candidate.outVec3("spinAxisUnit") else { continue }
      if axis.z != 0 {
        sample = candidate
        break
      }
    }
    guard let c = sample else {
      return XCTFail("fant ingen case der spinAxisUnit.z er ulik null")
    }

    let solved = Geometry3D.solve(
      attackAngle: c.inDouble("attackAngle"),
      clubPath: c.inDouble("clubPath"),
      dynamicLoft: c.inDouble("dynamicLoft"),
      faceAngle: c.inDouble("faceAngle")
    )
    XCTAssertEqual(solved.spinAxis, 0)
    XCTAssertNotEqual(
      solved.spinAxisUnit.z, 0,
      "\(c.id): nullingen har lekket ut i vektoren — den skal treffe skalaren alene")
  }

  func testBranchB_spinLoft3DFollowsSignedVerticalOnlyWhenPositive() {
    // Fordelingen er verifisert mot fixturen, ikke lest ut av prosa:
    //   faceToPath == 0 → 713 caser, fordelt 607 / 77 / 29
    //   på vertikal > 0 / vertikal < 0 / vertikal == 0.
    var positiveCount = 0
    var negativeCount = 0
    var zeroCount = 0

    for c in Fixture.flight() {
      let faceToPath = c.inDouble("faceAngle") - c.inDouble("clubPath")
      guard faceToPath == 0 else { continue }

      let vertical = c.inDouble("dynamicLoft") - c.inDouble("attackAngle")
      let solved = Geometry3D.solve(
        attackAngle: c.inDouble("attackAngle"),
        clubPath: c.inDouble("clubPath"),
        dynamicLoft: c.inDouble("dynamicLoft"),
        faceAngle: c.inDouble("faceAngle")
      )
      guard let expected = c.outDouble("spinLoft3DDeg") else {
        return XCTFail("\(c.id): fixturen mangler spinLoft3DDeg")
      }

      if vertical > 0 {
        positiveCount += 1
        // Grenen tas: den signerte vertikale returneres ordrett.
        XCTAssertEqual(
          solved.spinLoft3DDeg, vertical,
          "\(c.id): gren B skal returnere den signerte vertikale ordrett")
        XCTAssertEqual(expected, vertical, "\(c.id): fixturen er ikke på grenen")
      } else if vertical < 0 {
        negativeCount += 1
        // Grenen tas IKKE: atan2-formelen gjelder, og den gir en ikke-negativ
        // vinkel — altså aldri den negative vertikale.
        XCTAssertNotEqual(
          solved.spinLoft3DDeg, vertical,
          "\(c.id): gren B tok en case den ikke skulle ta")
        XCTAssertGreaterThan(solved.spinLoft3DDeg, 0, "\(c.id)")
      } else {
        zeroCount += 1
        // `v == n`: kryss = 0, prikk = 1, atan2(0, 1) = 0. Grenen tas ikke
        // (0 er ikke > 0), men formelen gir samme svar. Fixturen har 0.
        XCTAssertEqual(solved.spinLoft3DDeg, 0, "\(c.id)")
        XCTAssertEqual(expected, 0, "\(c.id): fixturen")
      }
    }

    XCTAssertEqual(positiveCount, 607, "antall gren-B-caser har endret seg")
    XCTAssertEqual(negativeCount, 77, "antall negative caser har endret seg")
    XCTAssertEqual(zeroCount, 29, "antall degenererte caser har endret seg")
  }

  func testBranchB_mirrorPairIsAsymmetricInTheFixture() {
    // Speilparet (face 0, path 0, loft 0, attack ∓7.5) har identisk |v × n| og
    // identisk v · n, men fixturen gir 7.5 for attack −7.5 og 7.499999999999999
    // for attack +7.5. Motoren forgrener seg på fortegnet, ikke på geometrien.
    let minus = Geometry3D.solve(
      attackAngle: -7.5, clubPath: 0, dynamicLoft: 0, faceAngle: 0)
    let plus = Geometry3D.solve(
      attackAngle: 7.5, clubPath: 0, dynamicLoft: 0, faceAngle: 0)

    XCTAssertEqual(minus.spinLoft3DDeg, 7.5)
    XCTAssertEqual(plus.spinLoft3DDeg, 7.499999999999999)
    XCTAssertNotEqual(
      minus.spinLoft3DDeg, plus.spinLoft3DDeg,
      "asymmetrien er borte — grenen er implementert som en ren funksjon")
  }

  // ── Degenerert akse ──────────────────────────────────────────────────────

  func testDegenerateCrossProductFallsBackToUnitX() {
    // `v == n` når face = path OG dynamic loft = attack. 29 caser i fixturen.
    let degenerate = Fixture.flight().filter {
      $0.inDouble("faceAngle") == $0.inDouble("clubPath")
        && $0.inDouble("dynamicLoft") == $0.inDouble("attackAngle")
    }
    XCTAssertEqual(degenerate.count, 29, "antall degenererte caser har endret seg")

    for c in degenerate {
      let solved = Geometry3D.solve(
        attackAngle: c.inDouble("attackAngle"),
        clubPath: c.inDouble("clubPath"),
        dynamicLoft: c.inDouble("dynamicLoft"),
        faceAngle: c.inDouble("faceAngle")
      )
      XCTAssertEqual(solved.spinAxisUnit, Vec3(1, 0, 0), "\(c.id)")
      XCTAssertEqual(c.outVec3("spinAxisUnit"), Vec3(1, 0, 0), "\(c.id): fixturen")
    }
  }

  // ── Byggeklossene enkeltvis ──────────────────────────────────────────────

  func testUnitVectorsAreNotRenormalised() {
    // `v` og `n` er enhetsvektorer per konstruksjon. Et normaliseringssteg
    // ville flyttet dem 1 ULP, og fixturen ser det.
    var movedByRenormalisation = 0
    for c in Fixture.flight().prefix(500) {
      let v = Geometry3D.clubVelocityUnit(
        attackAngleDeg: c.inDouble("attackAngle"),
        clubPathDeg: c.inDouble("clubPath"))
      let renormalised = Geometry3D.normalize(v)
      if renormalised != v { movedByRenormalisation += 1 }
    }
    XCTAssertGreaterThan(
      movedByRenormalisation, 0,
      """
      Normalisering flyttet ingen av 500 vektorer. Da er denne vakten tannløs \
      — undersøk før du stoler på den.
      """)
  }

  func testCrossAndDotAgainstHandComputedValues() {
    // Ren algebra, ingen libm. Skal være bit-eksakt uansett plattform.
    let a = Vec3(1, 2, 3)
    let b = Vec3(4, 5, 6)
    XCTAssertEqual(Geometry3D.cross(a, b), Vec3(-3, 6, -3))
    XCTAssertEqual(Geometry3D.dot(a, b), 32)
    XCTAssertEqual(Geometry3D.cross(a, a), Vec3(0, 0, 0))
  }

  func testMagnitudeUsesJSHypotNotNaiveSqrt() {
    // Sanity: de to skal være ulike for minst én vektor i fixturen, ellers
    // beviser `magnitude` ingenting om hvilken variant som er valgt.
    var divergences = 0
    for c in Fixture.flight().prefix(1000) {
      guard let v = c.outVec3("spinAxisUnit") else { continue }
      // Delt opp: typesjekkeren gikk i stå på det samlede uttrykket.
      let xx: Double = v.x * v.x
      let yy: Double = v.y * v.y
      let zz: Double = v.z * v.z
      let sum: Double = xx + yy + zz
      let naive: Double = sum.squareRoot()
      if Geometry3D.magnitude(v) != naive { divergences += 1 }
    }
    XCTAssertGreaterThan(
      divergences, 0,
      "hypot og naiv sqrt gir samme svar overalt — vakten er tannløs")
  }

  func testPureFunctionSameInputSameOutput() {
    let first = Geometry3D.solve(
      attackAngle: -2.5, clubPath: 3, dynamicLoft: 24, faceAngle: 2)
    let second = Geometry3D.solve(
      attackAngle: -2.5, clubPath: 3, dynamicLoft: 24, faceAngle: 2)
    XCTAssertEqual(first, second)
  }
}
