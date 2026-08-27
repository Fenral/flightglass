import Foundation

/// Bit-eksakt JSON-leser for fixturene.
///
/// ⚠ HVORFOR DENNE FINNES.
///
/// `JSONSerialization` på Windows leser `0.8377580409572781` som
/// `0.8377580409572782` — 1 ULP feil. Målt, ikke antatt: bitmønstrene er
/// `d5eb7bf3e9ceea3f` mot `d6eb7bf3e9ceea3f`, og Node 24.14.1, som genererte
/// fixturen, gir `…d5`.
///
/// En parser som bommer med 1 ULP gjør hele verifikasjonen verdiløs. Toleransen
/// for transcendentale kjeder er `1e-12` relativt; en parserfeil på 1 ULP er
/// ~1e-16 og drukner ikke i den — men for felt som skal være BIT-EKSAKTE er
/// den fatal, og det er nettopp de feltene som beviser at porten er riktig.
/// Verre: den ville produsert «avvik» som ser ut som portfeil, og sendt
/// feilsøkingen til feil sted.
///
/// Løsningen er `strtod`, som er korrekt avrundet per C99 og gir samme svar
/// som V8s tallparser. Resten av parseren er en rett fram rekursiv nedstigning
/// over UTF-8-bytes.
///
/// Kun i testmålet. Motoren leser ingenting fra disk.
enum JSONValue {
  case null
  case bool(Bool)
  case number(Double)
  case string(String)
  case array([JSONValue])
  case object([String: JSONValue])

  var double: Double? {
    if case .number(let d) = self { return d }
    return nil
  }
  var string: String? {
    if case .string(let s) = self { return s }
    return nil
  }
  var bool: Bool? {
    if case .bool(let b) = self { return b }
    return nil
  }
  var array: [JSONValue]? {
    if case .array(let a) = self { return a }
    return nil
  }
  var object: [String: JSONValue]? {
    if case .object(let o) = self { return o }
    return nil
  }
  var isNull: Bool {
    if case .null = self { return true }
    return false
  }

  /// Heltall der fixturen har et heltall (`samples`, `counts`).
  var int: Int? {
    guard let d = double, d.rounded() == d, d.magnitude < 9e15 else { return nil }
    return Int(d)
  }
}

enum ExactJSON {

  enum ParseError: Error, CustomStringConvertible {
    case unexpected(byte: UInt8, offset: Int)
    case truncated(offset: Int)
    case badNumber(offset: Int)
    case badEscape(offset: Int)

    var description: String {
      switch self {
      case .unexpected(let b, let o):
        let ch = Character(UnicodeScalar(b))
        return "uventet tegn '\(ch)' (0x\(String(b, radix: 16))) ved offset \(o)"
      case .truncated(let o): return "JSON slutter brått ved offset \(o)"
      case .badNumber(let o): return "ugyldig tall ved offset \(o)"
      case .badEscape(let o): return "ugyldig escape ved offset \(o)"
      }
    }
  }

  /// Leser en fil. Bytene nulltermineres slik at `strtod` kan lese direkte inn
  /// i bufferet uten en kopi per tall — 20 MB fixture har ~400 000 tall.
  static func parse(contentsOf url: URL) throws -> JSONValue {
    var bytes = [UInt8](try Data(contentsOf: url))
    bytes.append(0)
    return try parse(bytes: bytes)
  }

  static func parse(_ text: String) throws -> JSONValue {
    var bytes = [UInt8](text.utf8)
    bytes.append(0)
    return try parse(bytes: bytes)
  }

  /// Bekvemmelighet for testene: nil ved feil.
  static func parseObject(_ text: String) -> [String: JSONValue]? {
    try? parse(text).object
  }

  static func parse(bytes: [UInt8]) throws -> JSONValue {
    try bytes.withUnsafeBufferPointer { buffer in
      var parser = Parser(buffer: buffer)
      parser.skipWhitespace()
      let value = try parser.parseValue()
      parser.skipWhitespace()
      return value
    }
  }

  // ── Parser ───────────────────────────────────────────────────────────────

  private struct Parser {
    let buffer: UnsafeBufferPointer<UInt8>
    var index: Int = 0

    /// Siste byte er nullterminatoren og teller ikke som innhold.
    var end: Int { buffer.count - 1 }

    mutating func skipWhitespace() {
      while index < end {
        switch buffer[index] {
        case 0x20, 0x09, 0x0A, 0x0D: index += 1
        default: return
        }
      }
    }

    mutating func parseValue() throws -> JSONValue {
      guard index < end else { throw ParseError.truncated(offset: index) }
      switch buffer[index] {
      case UInt8(ascii: "{"): return try parseObjectValue()
      case UInt8(ascii: "["): return try parseArrayValue()
      case UInt8(ascii: "\""): return .string(try parseString())
      case UInt8(ascii: "t"):
        try expect("true")
        return .bool(true)
      case UInt8(ascii: "f"):
        try expect("false")
        return .bool(false)
      case UInt8(ascii: "n"):
        try expect("null")
        return .null
      default: return .number(try parseNumber())
      }
    }

    mutating func expect(_ literal: String) throws {
      for ch in literal.utf8 {
        guard index < end, buffer[index] == ch else {
          throw ParseError.unexpected(
            byte: index < end ? buffer[index] : 0, offset: index)
        }
        index += 1
      }
    }

    /// ⚠ KJERNEN. `strtod` leser direkte fra bufferet.
    ///
    /// Bufferet er nullterminert, så `strtod` kan ikke lese forbi slutten.
    /// Den stopper selv på `,`, `}`, `]` eller whitespace, og `endPointer`
    /// forteller hvor mange bytes den brukte.
    mutating func parseNumber() throws -> Double {
      let start = index
      guard let base = buffer.baseAddress else {
        throw ParseError.badNumber(offset: start)
      }

      let raw = UnsafeRawPointer(base.advanced(by: start))
      let chars = raw.assumingMemoryBound(to: CChar.self)

      var endPointer: UnsafeMutablePointer<CChar>? = nil
      let value = strtod(chars, &endPointer)

      guard let stop = endPointer else { throw ParseError.badNumber(offset: start) }
      // `UnsafeRawPointer - UnsafeRawPointer` gir Int; direkte subtraksjon
      // mellom `UnsafeMutablePointer` og `UnsafePointer` gjør ikke det.
      let consumed = UnsafeRawPointer(stop) - raw
      guard consumed > 0 else { throw ParseError.badNumber(offset: start) }

      index = start + consumed
      return value
    }

    mutating func parseString() throws -> String {
      guard index < end, buffer[index] == UInt8(ascii: "\"") else {
        throw ParseError.unexpected(byte: buffer[index], offset: index)
      }
      index += 1

      // Rask sti: ingen escapes. Den store fixturen er nesten bare slike.
      let start = index
      var hasEscape = false
      while index < end {
        let b = buffer[index]
        if b == UInt8(ascii: "\"") { break }
        if b == UInt8(ascii: "\\") {
          hasEscape = true
          break
        }
        index += 1
      }

      if !hasEscape, index < end {
        let slice = UnsafeBufferPointer(
          rebasing: buffer[start..<index])
        index += 1  // avsluttende hermetegn
        return String(decoding: slice, as: UTF8.self)
      }

      // Treg sti: bygg opp med escapes.
      index = start
      var out: [UInt8] = []
      while index < end {
        let b = buffer[index]
        if b == UInt8(ascii: "\"") {
          index += 1
          return String(decoding: out, as: UTF8.self)
        }
        if b != UInt8(ascii: "\\") {
          out.append(b)
          index += 1
          continue
        }
        index += 1
        guard index < end else { throw ParseError.truncated(offset: index) }
        let escape = buffer[index]
        index += 1
        switch escape {
        case UInt8(ascii: "\""): out.append(UInt8(ascii: "\""))
        case UInt8(ascii: "\\"): out.append(UInt8(ascii: "\\"))
        case UInt8(ascii: "/"): out.append(UInt8(ascii: "/"))
        case UInt8(ascii: "b"): out.append(0x08)
        case UInt8(ascii: "f"): out.append(0x0C)
        case UInt8(ascii: "n"): out.append(0x0A)
        case UInt8(ascii: "r"): out.append(0x0D)
        case UInt8(ascii: "t"): out.append(0x09)
        case UInt8(ascii: "u"):
          let scalar = try parseUnicodeEscape()
          out.append(contentsOf: Array(String(scalar).utf8))
        default: throw ParseError.badEscape(offset: index - 1)
        }
      }
      throw ParseError.truncated(offset: index)
    }

    /// `\uXXXX`, med surrogatpar.
    mutating func parseUnicodeEscape() throws -> UnicodeScalar {
      let high = try parseHex4()
      if high >= 0xD800, high <= 0xDBFF,
        index + 1 < end,
        buffer[index] == UInt8(ascii: "\\"),
        buffer[index + 1] == UInt8(ascii: "u")
      {
        index += 2
        let low = try parseHex4()
        if low >= 0xDC00, low <= 0xDFFF {
          let combined =
            0x10000 + (UInt32(high - 0xD800) << 10) + UInt32(low - 0xDC00)
          guard let scalar = UnicodeScalar(combined) else {
            throw ParseError.badEscape(offset: index)
          }
          return scalar
        }
        guard let scalar = UnicodeScalar(low) else {
          throw ParseError.badEscape(offset: index)
        }
        return scalar
      }
      guard let scalar = UnicodeScalar(high) else {
        throw ParseError.badEscape(offset: index)
      }
      return scalar
    }

    mutating func parseHex4() throws -> UInt16 {
      var value: UInt16 = 0
      for _ in 0..<4 {
        guard index < end else { throw ParseError.truncated(offset: index) }
        let b = buffer[index]
        let digit: UInt16
        switch b {
        case UInt8(ascii: "0")...UInt8(ascii: "9"):
          digit = UInt16(b - UInt8(ascii: "0"))
        case UInt8(ascii: "a")...UInt8(ascii: "f"):
          digit = UInt16(b - UInt8(ascii: "a") + 10)
        case UInt8(ascii: "A")...UInt8(ascii: "F"):
          digit = UInt16(b - UInt8(ascii: "A") + 10)
        default: throw ParseError.badEscape(offset: index)
        }
        value = value << 4 | digit
        index += 1
      }
      return value
    }

    mutating func parseArrayValue() throws -> JSONValue {
      index += 1  // [
      var items: [JSONValue] = []
      skipWhitespace()
      if index < end, buffer[index] == UInt8(ascii: "]") {
        index += 1
        return .array(items)
      }
      while true {
        skipWhitespace()
        items.append(try parseValue())
        skipWhitespace()
        guard index < end else { throw ParseError.truncated(offset: index) }
        if buffer[index] == UInt8(ascii: ",") {
          index += 1
          continue
        }
        if buffer[index] == UInt8(ascii: "]") {
          index += 1
          return .array(items)
        }
        throw ParseError.unexpected(byte: buffer[index], offset: index)
      }
    }

    mutating func parseObjectValue() throws -> JSONValue {
      index += 1  // {
      var members: [String: JSONValue] = [:]
      skipWhitespace()
      if index < end, buffer[index] == UInt8(ascii: "}") {
        index += 1
        return .object(members)
      }
      while true {
        skipWhitespace()
        let key = try parseString()
        skipWhitespace()
        guard index < end, buffer[index] == UInt8(ascii: ":") else {
          throw ParseError.unexpected(
            byte: index < end ? buffer[index] : 0, offset: index)
        }
        index += 1
        skipWhitespace()
        members[key] = try parseValue()
        skipWhitespace()
        guard index < end else { throw ParseError.truncated(offset: index) }
        if buffer[index] == UInt8(ascii: ",") {
          index += 1
          continue
        }
        if buffer[index] == UInt8(ascii: "}") {
          index += 1
          return .object(members)
        }
        throw ParseError.unexpected(byte: buffer[index], offset: index)
      }
    }
  }
}
