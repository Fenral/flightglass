import XCTest

@testable import FlightglassEngine

/// Felles assertjon for feltvise fixturesammenligninger.
///
/// Regelen fra oppdragsbrevet, håndhevet ett sted: **avvik rapporteres per
/// felt med tall — aldri bare «innenfor toleranse»**. Derfor logger denne
/// alltid til `DeviationLog`, både mot den dømmende toleransen og mot
/// `.exact`, og feilmeldingen bærer faktiske tall.
///
/// Antallet bit-eksakte caser er ikke pynt: det er signalet som skiller «porten
/// regner riktig» fra «porten regner riktig på denne libm-en». Et felt som er
/// 5028/5028 bit-eksakt på Windows er trygt på iOS; et felt som er 4900/5028
/// må sjekkes på nytt der (D73).
func assertField(
  _ name: String,
  _ comparisons: [Comparison],
  tolerance: Tolerance,
  file: StaticString = #filePath,
  line: UInt = #line
) {
  XCTAssertFalse(
    comparisons.isEmpty, "\(name): ingen sammenligninger", file: file, line: line)
  guard !comparisons.isEmpty else { return }

  let report = Report(name, comparisons, tolerance: tolerance)
  let exact = Report("\(name) (bit-eksakt)", comparisons, tolerance: .exact)

  DeviationLog.shared.record(report)
  // Bit-eksakthetsraden er DIAGNOSE, ikke dom. Et felt som ligger innenfor sin
  // deklarerte toleranse er godkjent selv om libm avrundet siste bit ulikt.
  DeviationLog.shared.record(exact, informational: true)

  guard !report.ok else { return }

  let worst = report.failures.prefix(3).map {
    """
      \($0.id).\($0.field)
        forventet \($0.expected)
        fikk      \($0.actual)
        rel \($0.relativeDeviation)  abs \($0.absoluteDeviation)
    """
  }.joined(separator: "\n")

  XCTFail(
    """
    \(report.summary)
    bit-eksakt: \(exact.passed)/\(exact.total)
    \(worst)
    """,
    file: file, line: line)
}

/// Bygger sammenligninger for ett skalarfelt over alle caser.
func compareScalarField(
  _ field: String,
  _ cases: [FixtureCase],
  _ compute: (FixtureCase) -> Double
) -> [Comparison] {
  var out: [Comparison] = []
  out.reserveCapacity(cases.count)
  for c in cases {
    guard let expected = c.outDouble(field) else { continue }
    out.append(
      Comparison(id: c.id, field: field, expected: expected, actual: compute(c)))
  }
  return out
}
