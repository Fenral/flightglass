import Foundation

@testable import FlightglassEngine

/// Golden-fixture loader og sammenligningshjelpere.
///
/// Portert fra `engine/test/_fixture.js`. Fixturene er fasit. Avviker motoren
/// fra fixturen, er det motoren som har feil. Denne filen leser dem, den
/// tolker dem ikke.
///
/// ⚠ Tallene leses med `ExactJSON`, ikke `JSONSerialization`. Sistnevnte bommer
/// med 1 ULP på Windows — se `JSONPrecisionTests` for målingen. Ikke bytt
/// tilbake uten å måle på nytt.
///
/// Filene er store (flight ≈ 20 MB, studio ≈ 4 MB). De leses og parses ÉN gang
/// per prosess og caches. Ingen fysikk her. Ingen toleranser hardkodet her —
/// hver test eier sin egen.

// ── Plassering ─────────────────────────────────────────────────────────────

enum FixturePaths {
  /// `swift/Tests/FlightglassEngineTests/Fixture.swift`
  ///   → `FlightglassEngineTests` → `Tests` → `swift` → prosjektrot
  ///   → `motor/export/`
  ///
  /// Overstyres av `FLIGHTGLASS_FIXTURES` når testene kjøres et annet sted fra.
  static let exportDir: URL = {
    if let override = ProcessInfo.processInfo.environment["FLIGHTGLASS_FIXTURES"] {
      return URL(fileURLWithPath: override, isDirectory: true)
    }
    return URL(fileURLWithPath: #filePath)
      .deletingLastPathComponent()  // FlightglassEngineTests
      .deletingLastPathComponent()  // Tests
      .deletingLastPathComponent()  // swift
      .deletingLastPathComponent()  // prosjektrot
      .appendingPathComponent("motor")
      .appendingPathComponent("export")
  }()

  static let flightFile = "flight-golden.json"
  static let studioFile = "studio-golden.json"
}

// ── Cache ──────────────────────────────────────────────────────────────────

/// Trådsikker dokumentcache. XCTest kan kjøre testklasser parallelt, og en
/// 20 MB parse per klasse er sløsing vi ikke trenger.
final class FixtureStore: @unchecked Sendable {
  static let shared = FixtureStore()

  private let lock = NSLock()
  private var documents: [String: [String: JSONValue]] = [:]
  private var solved: [String: [FixtureCase]] = [:]
  private var failed: [String: [FixtureCase]] = [:]

  private init() {}

  func document(_ fileName: String) -> [String: JSONValue] {
    lock.lock()
    defer { lock.unlock() }
    if let cached = documents[fileName] { return cached }

    let url = FixturePaths.exportDir.appendingPathComponent(fileName)
    let parsed: JSONValue
    do {
      parsed = try ExactJSON.parse(contentsOf: url)
    } catch {
      fatalError(
        """
        Kunne ikke lese fixturen: \(url.path)
        \(error)
        Sett FLIGHTGLASS_FIXTURES til mappen som inneholder \
        flight-golden.json og studio-golden.json.
        """)
    }
    guard let doc = parsed.object else {
      fatalError("\(fileName) er ikke et JSON-objekt.")
    }
    documents[fileName] = doc
    return doc
  }

  func solvedCases(_ fileName: String) -> [FixtureCase] {
    cached(fileName, in: \.solved) { $0.out != nil }
  }

  func failedCases(_ fileName: String) -> [FixtureCase] {
    cached(fileName, in: \.failed) { $0.out == nil }
  }

  private func cached(
    _ fileName: String,
    in keyPath: ReferenceWritableKeyPath<FixtureStore, [String: [FixtureCase]]>,
    where predicate: (FixtureCase) -> Bool
  ) -> [FixtureCase] {
    lock.lock()
    if let hit = self[keyPath: keyPath][fileName] {
      lock.unlock()
      return hit
    }
    lock.unlock()

    let result = allCases(fileName).filter(predicate)

    lock.lock()
    self[keyPath: keyPath][fileName] = result
    lock.unlock()
    return result
  }

  private func allCases(_ fileName: String) -> [FixtureCase] {
    guard let raw = document(fileName)["cases"]?.array else {
      fatalError("\(fileName) mangler `cases`.")
    }
    return raw.compactMap { $0.object.map(FixtureCase.init) }
  }
}

// ── Casemodell ─────────────────────────────────────────────────────────────

/// Én fixture-case. `input` og `out` holdes som rå ordbøker fordi feltnavnene
/// ER kontrakten — en typet speiling ville lagt en oversettelse i midten som
/// kan drifte fra fixturen uten at noen test merker det.
struct FixtureCase {
  let id: String
  let group: String
  let validated: Bool?
  let input: [String: JSONValue]
  let out: [String: JSONValue]?
  let error: [String: JSONValue]?

  init(_ raw: [String: JSONValue]) {
    self.id = raw["id"]?.string ?? "?"
    self.group = raw["group"]?.string ?? "?"
    self.validated = raw["validated"]?.bool
    self.input = raw["in"]?.object ?? [:]
    self.out = raw["out"]?.object
    self.error = raw["error"]?.object
  }

  func inDouble(_ key: String) -> Double {
    guard let d = input[key]?.double else {
      fatalError("\(id): input mangler \(key)")
    }
    return d
  }

  func inString(_ key: String) -> String? { input[key]?.string }

  func outDouble(_ key: String) -> Double? { out?[key]?.double }

  func outBool(_ key: String) -> Bool? { out?[key]?.bool }

  func outString(_ key: String) -> String? { out?[key]?.string }

  /// Fixturen lagrer 3-vektorer som `[x, y, z]`.
  func outVec3(_ key: String) -> Vec3? {
    guard let arr = out?[key]?.array, arr.count == 3 else { return nil }
    guard let x = arr[0].double, let y = arr[1].double, let z = arr[2].double
    else { return nil }
    return Vec3(x, y, z)
  }

  func outNested(_ key: String) -> [String: JSONValue]? { out?[key]?.object }

  func outDoubleArray(_ key: String) -> [Double]? {
    guard let arr = out?[key]?.array else { return nil }
    let doubles = arr.compactMap { $0.double }
    return doubles.count == arr.count ? doubles : nil
  }
}

// ── Lasting ────────────────────────────────────────────────────────────────

enum Fixture {
  /// Alle flight-caser som produserte et resultat.
  /// 5028 av 5029; den ene som mangler er RK4-timeouten (`clubSpeed: 18000`).
  static func flight() -> [FixtureCase] {
    FixtureStore.shared.solvedCases(FixturePaths.flightFile)
  }

  /// Alle studio-caser som produserte et resultat. 2500 av 2500.
  static func studio() -> [FixtureCase] {
    FixtureStore.shared.solvedCases(FixturePaths.studioFile)
  }

  /// Flight-caser der den ekte motoren kastet. Én case i baseline.
  static func flightErrors() -> [FixtureCase] {
    FixtureStore.shared.failedCases(FixturePaths.flightFile)
  }

  /// Studio-caser uten `out`. Tom i baseline; finnes for symmetri.
  static func studioErrors() -> [FixtureCase] {
    FixtureStore.shared.failedCases(FixturePaths.studioFile)
  }

  static func flightMeta() -> [String: JSONValue] {
    FixtureStore.shared.document(FixturePaths.flightFile)["_meta"]?.object ?? [:]
  }

  static func studioMeta() -> [String: JSONValue] {
    FixtureStore.shared.document(FixturePaths.studioFile)["_meta"]?.object ?? [:]
  }
}

// ── Sammenligning ──────────────────────────────────────────────────────────

/// Absolutt toleranse. `|a − b| <= tol`.
///
/// Reglene er bevisst strenge fordi fixturen ikke inneholder ett eneste
/// ikke-endelig tall:
///   - NaN er aldri nær noe, heller ikke NaN.
///   - Eksakt likhet passerer alltid, også `∞ == ∞` og `-0 == 0`.
func close(_ a: Double, _ b: Double, _ tol: Double = 0) -> Bool {
  if a.isNaN || b.isNaN { return false }
  if a == b { return true }
  if !a.isFinite || !b.isFinite { return false }
  return abs(a - b) <= tol
}

/// Hvordan et felt måles mot fixturen.
///
/// Oppdragsbrevet deklarerer tre klasser, og de er IKKE utbyttbare:
///   - algebraiske operasjoner → `.exact`
///   - transcendentale kjeder  → `.relative(1e-12)`
///   - RK4-terminaler          → `.relative(1e-9)`
enum Tolerance {
  case exact
  case absolute(Double)
  /// Relativt til `|expected|`. Er `expected == 0`, faller den tilbake til
  /// absolutt sammenligning — ellers ville enhver nullverdi vært umulig.
  case relative(Double)
  /// `max(rel · |expected|, floor)` — JS-baselinens egen form for
  /// RK4-kjeden (`engine/test/rk4Integrator.test.js`): 713 caser har
  /// `rawCurveFromLaunchLineM` som ren flyttallsstøy (~1e-15), og relativ
  /// toleranse er meningsløs mot støy. Gulvet er IKKE en oppmykning her —
  /// det er portert fra referansens testregime.
  case relativeWithFloor(rel: Double, floor: Double)

  var described: String {
    switch self {
    case .exact: return "eksakt"
    case .absolute(let v): return "abs \(v)"
    case .relative(let v): return "rel \(v)"
    case .relativeWithFloor(let r, let f): return "rel \(r) gulv \(f)"
    }
  }
}

/// Én sammenligning mellom fixturen og porten.
struct Comparison {
  var id: String
  var field: String
  var expected: Double
  var actual: Double

  var absoluteDeviation: Double {
    if expected.isNaN || actual.isNaN { return .infinity }
    if expected == actual { return 0 }
    if !expected.isFinite || !actual.isFinite { return .infinity }
    return abs(actual - expected)
  }

  /// `|actual − expected| / |expected|`, eller det absolutte avviket når
  /// `expected == 0`.
  ///
  /// Nevneren er `|expected|`, ikke `max(|expected|, |actual|)`: fixturen er
  /// fasit, og et avvik skal måles mot fasiten — ikke mot et gjennomsnitt av
  /// fasit og kandidat.
  var relativeDeviation: Double {
    let abs0 = absoluteDeviation
    if abs0 == 0 { return 0 }
    if !abs0.isFinite { return .infinity }
    let denominator = abs(expected)
    return denominator == 0 ? abs0 : abs0 / denominator
  }

  /// Avstand i ULP — det eneste målet som skiller «porten regner feil» fra
  /// «libm avrundet siste bit annerledes».
  var ulpDistance: Double {
    if expected == actual { return 0 }
    if !expected.isFinite || !actual.isFinite { return .infinity }
    let step = Swift.max(expected.ulp, actual.ulp)
    return step == 0 ? 0 : abs(actual - expected) / step
  }

  func passes(_ tol: Tolerance) -> Bool {
    switch tol {
    case .exact: return absoluteDeviation == 0
    case .absolute(let v): return absoluteDeviation <= v
    case .relative(let v): return relativeDeviation <= v
    case .relativeWithFloor(let r, let f):
      // JS: |a − e| <= max(r·|e|, f)
      return absoluteDeviation <= Swift.max(r * abs(expected), f)
    }
  }

  func deviation(for tol: Tolerance) -> Double {
    switch tol {
    case .exact, .absolute: return absoluteDeviation
    case .relative: return relativeDeviation
    case .relativeWithFloor:
      // Rapporter det relative avviket der det er meningsfullt, ellers det
      // absolutte — gulvet gjelder bare dommen, ikke målingen.
      return abs(expected) > 0 ? relativeDeviation : absoluteDeviation
    }
  }
}

/// Teller pass/fail og finner maks avvik over en samling sammenligninger.
struct Report {
  let name: String
  let tolerance: Tolerance
  let total: Int
  let passed: Int
  let failed: Int
  let maxDeviation: Double
  let maxUlp: Double
  let exactCount: Int
  let worst: Comparison?
  let failures: [Comparison]

  var ok: Bool { failed == 0 }

  var summary: String {
    let where0 = worst.map { " at \($0.id).\($0.field)" } ?? ""
    let head = "\(name) [\(tolerance.described)]: \(passed)/\(total) pass"
    let dev = "maxDeviation \(maxDeviation)\(where0)"
    return failed == 0 ? "\(head), \(dev)" : "\(head), \(failed) FAIL, \(dev)"
  }

  /// Én rad i avviksrapporten, leveranse 2.
  ///
  /// `informational` brukes for bit-eksakthetsraden som følger hvert felt.
  /// Den RAPPORTERER, den dømmer ikke: et felt som er innenfor sin deklarerte
  /// toleranse er godkjent selv om det ikke er bit-eksakt. Uten dette skillet
  /// ville rapporten kalt en libm-forskjell for en portfeil.
  func reportLine(informational: Bool = false) -> String {
    let status = informational ? "INFO" : (ok ? "OK" : "FAIL")
    let fields = [
      status,
      name,
      "\(passed)/\(total)",
      tolerance.described,
      "\(maxDeviation)",
      "\(exactCount)/\(total)",
      maxUlp.isFinite ? String(format: "%.1f", maxUlp) : "inf",
    ]
    return fields.joined(separator: "\t")
  }

  init(
    _ name: String,
    _ comparisons: [Comparison],
    tolerance: Tolerance,
    maxFailures: Int = 10
  ) {
    self.name = name
    self.tolerance = tolerance

    var passedCount = 0
    var exact = 0
    var maxDev = 0.0
    var maxUlpSeen = 0.0
    var worstCase: Comparison? = nil
    var failureList: [Comparison] = []

    for c in comparisons {
      let dev = c.deviation(for: tolerance)
      if worstCase == nil || dev > maxDev {
        maxDev = dev
        worstCase = c
      }
      let ulp = c.ulpDistance
      if ulp > maxUlpSeen { maxUlpSeen = ulp }
      if c.absoluteDeviation == 0 { exact += 1 }

      if c.passes(tolerance) {
        passedCount += 1
      } else if failureList.count < maxFailures {
        failureList.append(c)
      }
    }

    self.total = comparisons.count
    self.passed = passedCount
    self.failed = comparisons.count - passedCount
    self.maxDeviation = maxDev
    self.maxUlp = maxUlpSeen
    self.exactCount = exact
    self.worst = worstCase
    self.failures = failureList
  }
}

// ── Avviksrapport, leveranse 2 ─────────────────────────────────────────────

/// Samler rapportlinjer mens testene kjører og skriver dem til disk, slik at
/// avviksrapporten er et biprodukt av kjøringen og ikke noe som skrives for
/// hånd etterpå.
final class DeviationLog: @unchecked Sendable {
  static let shared = DeviationLog()
  private let lock = NSLock()
  private var lines: [String] = []

  private init() {}

  func record(_ report: Report, informational: Bool = false) {
    lock.lock()
    lines.append(report.reportLine(informational: informational))
    lock.unlock()
  }

  var snapshot: [String] {
    lock.lock()
    defer { lock.unlock() }
    return lines.sorted()
  }

  /// Skrives til `swift/AVVIKSRAPPORT.tsv` av `ZZReportTests`, som kjører sist
  /// fordi XCTest sorterer testklasser alfabetisk.
  func flush(to url: URL) {
    let header = [
      "status", "felt", "pass", "toleranse", "maks avvik", "bit-eksakt", "maks ULP",
    ].joined(separator: "\t")
    let body = ([header] + snapshot).joined(separator: "\n")
    try? body.write(to: url, atomically: true, encoding: .utf8)
  }
}
