/// Plattformens libm. Motoren bruker `sin`, `cos`, `asin`, `atan2`, `exp`,
/// `pow` og `abs` — ingen av dem finnes i Swift sitt standardbibliotek.
///
/// ⚠ D73-FORBEHOLDET BOR HER.
///
/// Dette er den ENE filen som gjør porten plattformavhengig. `sin`/`cos`/
/// `atan2`/`exp`/`pow` er libm-funksjoner, og libm er ikke den samme koden på
/// Windows (ucrt) som på Apple-plattformer (Apples egen libm). IEEE 754 krever
/// korrekt avrunding for `+ − × ÷ √`, men **ikke** for de transcendentale — de
/// får avvike i siste ULP mellom implementasjoner.
///
/// Konsekvens: en grønn testkjøring på Windows beviser portens LOGIKK og
/// fanger alle algebraiske feil, men den er ikke et bevis for iOS-tall. Full
/// re-kjøring på Mac er et eget, senere steg før shipping.
///
/// Rent aritmetiske ledd — og alt i `JSMath.hypot`, som kun bruker `× ÷ − +`
/// og `sqrt` — er derimot bit-identiske på tvers av plattformer.

#if canImport(Darwin)
@_exported import Darwin
#elseif canImport(Glibc)
@_exported import Glibc
#elseif canImport(Musl)
@_exported import Musl
#elseif canImport(ucrt)
@_exported import ucrt
#else
#error("Ingen kjent libm for denne plattformen.")
#endif
