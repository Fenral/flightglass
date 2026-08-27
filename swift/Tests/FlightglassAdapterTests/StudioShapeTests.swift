import XCTest

@testable import FlightglassAdapter
@testable import FlightglassEngine

/// Adapter modul 6 — StudioShape, portert fra `adapter/test/studioShape.test.js`
/// sin kontrakt: punktene ER motorens `arcPoint`, projeksjonene er rene, og
/// ingen egen kurveform finnes.
final class StudioShapeTests: XCTestCase {

  /// Et representativt solved-objekt fra den porterte motoren selv.
  private func solved() throws -> StudioShape.Solved {
    let r = try StudioSolve.solve(
      swingPlane: 55, swingDirection: -3, ballPositionCm: 5, arcHeightCm: -2,
      lieHeightMm: 0, club: ContactModel.Club.midIron.geometry, dynamicLoftDeg: 31)
    return StudioShape.Solved(r)
  }

  func testArcPointsAreExactlyTheEnginesArcPoint() throws {
    // Ingen egen kurveform: hvert punkt skal være bit-identisk med motorens
    // P(t) for samme t.
    let s = try solved()
    let pts = try StudioShape.faceOnArcPoints(s, n: 8, spanRad: 0.6)
    for i in 0...8 {
      let t = -0.6 + (2 * 0.6 * Double(i)) / 8
      let engine = StudioContact.arcPoint(
        lowPointWorldMetres: s.lowPointWorld, basis: s.planeBasis, thetaRadians: t)
      XCTAssertEqual(pts[i].0, engine.x, "punkt \(i): x")
      XCTAssertEqual(pts[i].1, engine.z, "punkt \(i): z")
    }
  }

  func testProjectionsAreTheDeclaredPlanes() {
    let p = StudioContact.Point(x: 1.5, y: -0.7, z: 0.3)
    let faceOn = StudioShape.faceOnPoint(p)
    XCTAssertEqual(faceOn.0, 1.5)  // x
    XCTAssertEqual(faceOn.1, 0.3)  // z
    let dtl = StudioShape.dtlPoint(p)
    XCTAssertEqual(dtl.0, 0.7)  // −y: skjerm-høyre = golferens høyre
    XCTAssertEqual(dtl.1, 0.3)
  }

  func testSampleCountsAndSpans() throws {
    let s = try solved()
    XCTAssertEqual(try StudioShape.faceOnArcPoints(s).count, 97)
    XCTAssertEqual(try StudioShape.dtlArcPoints(s).count, 97)
    XCTAssertEqual(try StudioShape.arcWorldPoints(s, n: 4).count, 5)
    XCTAssertThrowsError(try StudioShape.faceOnArcPoints(s, n: 1))
  }

  func testTangentIsDerivativeOfArcPoint() throws {
    // d/dθ P(θ) = R cos θ · u + R sin θ · m — numerisk verifisert.
    let s = try solved()
    let theta = -0.3
    let tangent = try StudioShape.tangentWorld(s, thetaRad: theta)
    let h = 1e-7
    let p1 = try StudioShape.arcWorldPoint(s, thetaRad: theta + h)
    let p0 = try StudioShape.arcWorldPoint(s, thetaRad: theta - h)
    XCTAssertEqual(tangent.x, (p1.x - p0.x) / (2 * h), accuracy: 1e-5)
    XCTAssertEqual(tangent.y, (p1.y - p0.y) / (2 * h), accuracy: 1e-5)
    XCTAssertEqual(tangent.z, (p1.z - p0.z) / (2 * h), accuracy: 1e-5)
  }

  func testPlanePointSpansThePlane() throws {
    let s = try solved()
    let origin = try StudioShape.planePoint(s, alongM: 0, upM: 0)
    XCTAssertEqual(origin, s.lowPointWorld)
    let alongU = try StudioShape.planePoint(s, alongM: 1, upM: 0)
    XCTAssertEqual(alongU.x - origin.x, s.planeBasis.u.x, accuracy: 1e-15)
  }

  func testClubShaftPointsFromArcTowardCentre() throws {
    let s = try solved()
    let shaft = try StudioShape.faceOnClubShaft(s, thetaRad: -0.2)
    // Skaftet har den bestilte lengden i projeksjonsplanet.
    let dx = shaft.grip.0 - shaft.sole.0
    let dz = shaft.grip.1 - shaft.sole.1
    XCTAssertEqual(JSMath.hypot(dx, dz), 0.45, accuracy: 1e-12)
  }

  func testPinholeCameraMatchesFixtureCameraSpec() throws {
    // Fixturens _meta.constants.cameras.dtl — samme kamera som mocken.
    let cam = try StudioShape.pinholeCamera(
      StudioShape.CameraSpec(
        pos: StudioContact.Point(x: -5.2, y: 0, z: 1.1),
        look: StudioContact.Point(x: 0, y: 0, z: 0.4),
        fovDeg: 40, xStretch: 1.7),
      w: 960, h: 480)
    XCTAssertEqual(cam.focal, (480.0 / 2) / FDLibm.tan(Angles.studioDegToRad(40) / 2))
    XCTAssertEqual(cam.xStretch, 1.7)

    // Punkt foran kameraet projiseres; punkt bak gir nil.
    let ahead = StudioShape.projectPoint(
      StudioContact.Point(x: 0, y: 0, z: 0.4), camera: cam)
    XCTAssertNotNil(ahead)
    XCTAssertGreaterThan(ahead!.d, 0)
    let behind = StudioShape.projectPoint(
      StudioContact.Point(x: -10, y: 0, z: 1), camera: cam)
    XCTAssertNil(behind)
  }

  func testNonFiniteThrows() throws {
    let s = try solved()
    XCTAssertThrowsError(try StudioShape.arcWorldPoint(s, thetaRad: .nan))
    XCTAssertThrowsError(try StudioShape.tangentWorld(s, thetaRad: .infinity))
    XCTAssertThrowsError(try StudioShape.planePoint(s, alongM: .nan, upM: 0))
    XCTAssertThrowsError(try StudioShape.faceOnArcPoints(s, n: 96, spanRad: .nan))
  }
}
