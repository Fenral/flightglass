import XCTest

@testable import FlightglassEngine

/// Modul 13 — contactModel v2 + strikeBand v2.
///
/// D74: strikeBand v2 verifiseres via samme test som JS bruker — turf-regelen
/// skal treffe ≥ 99 % av fixturens jerncaser, **restfeil maks 11, pinnet.**
/// Restfeilen er 4 `Thin→Fat` + 7 `Fat→Thin` på en grense fixturen ikke kan
/// avgjøre, og originalkoden er utenfor prosjektgrensen (D13). IKKE «fiks» den.
final class StrikeBandTests: XCTestCase {

  // ── D74-porten: turf-regelen mot fixturens jerncaser ─────────────────────

  func testTurfRuleReproducesAtLeast99PercentOfIronCases() {
    let ironCases = Fixture.studio().filter { $0.inString("clubMode") == "iron" }
    XCTAssertEqual(ironCases.count, 1250)

    var hit = 0
    var missSummary: [String: Int] = [:]

    for c in ironCases {
      guard let clubHeight = c.outDouble("contactHeight"),
        let effLowPoint = c.outDouble("effectiveLowPointX"),
        let theta = c.outDouble("thetaAtImpact"),
        let expected = c.outString("strikeBand")
      else {
        XCTFail("\(c.id): mangler felt")
        continue
      }
      let got = StrikeBand.turfBand(
        clubHeightM: clubHeight,
        effectiveLowPointM: effLowPoint,
        thetaAtImpact: theta
      ).rawValue

      if got == expected {
        hit += 1
      } else {
        missSummary["\(expected) -> \(got)", default: 0] += 1
      }
    }

    let rate = Double(hit) / Double(ironCases.count)
    let residual = ironCases.count - hit

    print("strikeBand/turf: \(hit)/\(ironCases.count) (\(rate * 100) %), restfeil \(residual): \(missSummary)")
    DeviationLog.shared.record(
      Report(
        "strikeBand/turfBand (jern, D74: restfeil<=11 pinnet)",
        [Comparison(id: "iron", field: "treff", expected: 1239, actual: Double(hit))],
        tolerance: .exact))

    XCTAssertGreaterThanOrEqual(rate, 0.99, "under 99 %: \(missSummary)")
    XCTAssertLessThanOrEqual(residual, 11, "restfeil vokst fra 11 til \(residual): \(missSummary)")

    // Restfeilens SAMMENSETNING er også pinnet: 4 Thin→Fat og 7 Fat→Thin.
    // Endrer den seg, har regelen flyttet seg selv om totalen er lik.
    XCTAssertEqual(missSummary["Thin -> Fat"], 4, "\(missSummary)")
    XCTAssertEqual(missSummary["Fat -> Thin"], 7, "\(missSummary)")
  }

  func testWhiffThresholdIsExactly1Point4TimesLegacyRadius() {
    XCTAssertEqual(StrikeBand.whiffThresholdM, 1.4 * 0.0213)
    XCTAssertNotEqual(
      StrikeBand.whiffThresholdM, 1.4 * ContactModel.ballRadiusM,
      "whiff-terskelen har byttet til den nye radiusen — den skal bruke arven")
    XCTAssertTrue(
      StrikeBand.whiffThresholdM > 0.029752 && StrikeBand.whiffThresholdM < 0.029886,
      "terskelen falt utenfor det observerte vinduet")
  }

  // ── Klassifisererens pinnede egenskaper ──────────────────────────────────

  func testPureRequiresAllThreeAxesSimultaneously() {
    func band(_ h: Double, _ lp: Double, _ th: Double) -> StrikeBand.TurfBand {
      StrikeBand.turfBand(clubHeightM: h, effectiveLowPointM: lp, thetaAtImpact: th)
    }
    XCTAssertEqual(band(0.008, 0.105, -0.05), .pure)
    XCTAssertNotEqual(band(0.008, 0.105, 0.05), .pure, "oppadgående kan ikke være Pure")
    XCTAssertNotEqual(band(0.008, 0.30, -0.05), .pure, "low point for langt foran")
    XCTAssertNotEqual(band(0.008, 0.005, -0.05), .pure, "low point for nær ballen")
    XCTAssertNotEqual(band(0.025, 0.105, -0.05), .pure, "for høy kontakt")
  }

  func testWhiffIsHighClubNotPositiveOffset() {
    // Fortegnet som var bakvendt i første v2 (320 Whiff→Pure-feil).
    XCTAssertEqual(
      StrikeBand.turfBand(clubHeightM: 0.05, effectiveLowPointM: 0.105, thetaAtImpact: -0.05),
      .whiff, "høy kølle skal bli Whiff")
    XCTAssertNotEqual(
      StrikeBand.turfBand(clubHeightM: -0.03, effectiveLowPointM: 0.105, thetaAtImpact: -0.05),
      .whiff, "lav kølle er aldri Whiff")
  }

  func testRegimeIsChosenByLieNotByClub() {
    XCTAssertEqual(
      StrikeBand.contactRegime(lieHeightMm: ContactModel.LiePreset.hardpan.heightMm), .turf)
    XCTAssertEqual(
      StrikeBand.contactRegime(lieHeightMm: ContactModel.LiePreset.fairway.heightMm), .turf)
    XCTAssertEqual(
      StrikeBand.contactRegime(lieHeightMm: ContactModel.LiePreset.tee.heightMm), .teed)
  }

  func testBothAnswersAlwaysReturned_U1() {
    // Driver fra bakken: perfekt turf, men lavt på flaten. Begge må stå.
    let r = StrikeBand.classify(
      lieHeightMm: 0, clubHeightM: 0.004, effectiveLowPointM: 0.105,
      thetaAtImpact: -0.05, offsetMm: -16.6, halfFaceMm: 27.5)
    XCTAssertEqual(r.turfBand, .pure, "turf-interaksjonen var ren")
    XCTAssertEqual(r.facePosition, .low, "men treffet lå lavt på flaten")
    XCTAssertTrue(r.hasTurfContact)
    XCTAssertEqual(r.lead, "Pure", "turf leder når det er turf i spill")
  }

  func testVocabulariesShareNoWords() {
    let turf = Set(StrikeBand.TurfBand.allRawValues)
    for w in StrikeBand.FacePosition.allRawValues {
      XCTAssertFalse(turf.contains(w), "\(w) finnes i begge vokabular")
    }
  }

  // ── ContactModel v2 ──────────────────────────────────────────────────────

  func testF11_ballRadiusAndSweetSpotNeverCancelAgain() {
    let off = ContactModel.faceCentreOffsetMm(
      lieHeightMm: 0, clubHeightMm: 0,
      sweetSpotHeightMm: ContactModel.Club.midIron.geometry.sweetSpotHeightMm)
    XCTAssertNotEqual(off, 0, "offset ved clubZ=0 og lie=0 må ikke være null")
    XCTAssertEqual(off, 2.936, accuracy: 0.01)
    XCTAssertNotEqual(
      ContactModel.Club.midIron.geometry.sweetSpotHeightMm,
      ContactModel.ballRadiusM * 1000,
      "sweetspot er igjen tallidentisk med ballradius — F11 har krøpet tilbake")
  }

  func testD3_offsetNeverExceedsHalfFaceWithoutOffFace() {
    for club in ContactModel.Club.allCases {
      for lie in ContactModel.LiePreset.allCases {
        for cz in stride(from: -60.0, through: 60.0, by: 1.0) {
          let r = ContactModel.strikeContact(
            lieHeightMm: lie.heightMm, clubHeightMm: cz,
            club: club.geometry, dynamicLoftDeg: 30)
          if abs(r.offsetMm) > r.halfFaceMm {
            XCTAssertFalse(
              r.onFace,
              "\(club) lie=\(lie.heightMm) cz=\(cz): utenfor flaten men onFace")
          } else {
            XCTAssertTrue(r.onFace)
          }
        }
      }
    }
  }

  func testTheThreeBallRadiiRemainDistinct() {
    XCTAssertEqual(Constants.ballRadius, 0.021335)
    XCTAssertEqual(Constants.studioBallRadius, 0.0213)
    XCTAssertEqual(ContactModel.ballRadiusM, 0.021336)
    XCTAssertNotEqual(Constants.ballRadius, Constants.studioBallRadius)
    XCTAssertNotEqual(Constants.ballRadius, ContactModel.ballRadiusM)
    XCTAssertNotEqual(Constants.studioBallRadius, ContactModel.ballRadiusM)
  }
}

extension StrikeBand.TurfBand {
  static var allRawValues: [String] {
    [Self.duff, .fat, .pure, .thin, .whiff].map(\.rawValue)
  }
}

extension StrikeBand.FacePosition {
  static var allRawValues: [String] {
    [Self.offFace, .low, .centre, .high].map(\.rawValue)
  }
}
