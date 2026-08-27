/// 3-vektor. Verdensakser i flight: `x = høyre`, `y = mållinjen`, `z = opp`.
/// Studio bruker `+x = target`, `+y = bort fra Face On`, `+z = opp`.
///
/// Ren verditype, ingen Foundation. Operasjonene ligger i `Geometry3D`;
/// her bor kun lagringen, slik at `Constants` kan uttrykke `wind` og
/// `backspinAxisFallback` uten å dra inn fysikk.
public struct Vec3: Equatable, Sendable {
  public var x: Double
  public var y: Double
  public var z: Double

  public init(_ x: Double, _ y: Double, _ z: Double) {
    self.x = x
    self.y = y
    self.z = z
  }
}
