/// Grad ↔ radian, med de to konvensjonene holdt fra hverandre med vilje.
///
/// ⚠ DENNE FILEN ER EN FELLE-VAKT, IKKE EN BEKVEMMELIGHET.
///
/// De to motorene konverterer grader til radianer i ULIK rekkefølge, og
/// forskjellen er 1–2 ULP — nok til å bryte bit-eksakte tester. Verifisert mot
/// begge fixturene i JS-baselinen:
///
/// | Motor  | Uttrykk                | Bevis                                    |
/// |--------|------------------------|------------------------------------------|
/// | Flight | `deg * (π / 180)`      | `faceNormalUnit` 5028/5028 bit-eksakt.   |
/// |        |                        | Motsatt rekkefølge: 4189/5028.           |
/// | Studio | `(deg * π) / 180`      | `planeBasis.m.z`, `thetaAtImpact`,       |
/// |        |                        | `contactHeight` alle 2500/2500.          |
/// |        |                        | `deg * degToRad`: 2000 / 2300 / 2354.    |
///
/// Derfor finnes det ingen delt `degToRad(_:)`-funksjon i denne pakken. Hver
/// kallside må velge motor eksplisitt, og navnet sier hvilken.
public enum Angles {

  /// Flight-motorens konvensjon: `deg * (π / 180)`.
  ///
  /// Konstanten er foldet FØRST, deretter multiplisert. Bruk denne i alt som
  /// hører til ballflukten: geometri, launch, spinn, RK4, curve.
  @inlinable
  public static func flightDegToRad(_ deg: Double) -> Double {
    deg * Constants.degToRad
  }

  /// Studio-motorens konvensjon: `(deg * π) / 180`.
  ///
  /// Multiplisert FØRST, deretter dividert. Bruk denne i alt som hører til
  /// Impact Studio — med ett unntak, se `studioPerDegreeScale`.
  @inlinable
  public static func studioDegToRad(_ deg: Double) -> Double {
    (deg * Double.pi) / 180
  }

  /// Studios ENE unntak: den avsluttende gradskalaen i `perDegree`
  /// (spec §8.2, `Radius × cos(φ) × π/180`) er gruppert som `* (π / 180)`,
  /// altså flight-konvensjonen — inne i studio.
  ///
  /// Bit-eksakt `effectiveLowPointX` 2500/2500 krever BEGGE konvensjonene i
  /// samme uttrykk. Den blandingen finnes i dagens kode. Behold den.
  @inlinable
  public static func studioPerDegreeScale(_ value: Double) -> Double {
    value * Constants.degToRad
  }

  /// Radianer → grader, flight-konvensjonen: `rad * (180 / π)`.
  ///
  /// ⚠ Ikke lenger den eneste: studio grupperer motsatt, se `studioRadToDeg`.
  @inlinable
  public static func radToDeg(_ rad: Double) -> Double {
    rad * Constants.radToDeg
  }

  /// Studio-motorens radianer → grader: `(rad * 180) / π`.
  ///
  /// ⚠ IKKE `rad * radToDeg`. Målt i JS-baselinen på §8.4: `attackAngle`
  /// faller til 1910/2500 og `clubPath` til 1990/2500 bit-eksakte caser med
  /// flight-grupperingen. Litteralene er selve grupperingen, ikke fysikk.
  @inlinable
  public static func studioRadToDeg(_ rad: Double) -> Double {
    (rad * 180) / Double.pi
  }
}
