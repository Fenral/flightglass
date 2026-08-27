# Sets up the MSVC environment Swift needs on Windows, then runs the swift
# command passed in.
#
# Swift on Windows links with MSVC's link.exe and needs the Windows SDK include
# and lib paths. Running `swift build` outside a developer environment fails
# with "toolchain is invalid: could not find CLI tool `link`". The fix is to
# import the environment from vcvars64.bat before the call.
#
# Usage:
#   powershell -File swift/Tools/swift-env.ps1 build
#   powershell -File swift/Tools/swift-env.ps1 test --filter ConstantsTests
#
# NOTE: ASCII only, on purpose. Windows PowerShell 5.1 reads .ps1 as ANSI when
# there is no BOM, so box-drawing characters and en-dashes break the parser.
# This file is tooling, not documentation - the Norwegian prose lives in the
# Swift sources.
#
# Idempotent. Writes nothing to disk.

param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$SwiftArgs
)

$ErrorActionPreference = 'Stop'

# --- Locate vcvars64.bat ----------------------------------------------------

$vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
if (-not (Test-Path $vswhere)) {
  throw "vswhere.exe missing. Are VS Build Tools installed?"
}

$vsPath = & $vswhere -products * -latest -property installationPath
if (-not $vsPath) { throw "No Visual Studio installation found." }

$vcvars = Join-Path $vsPath 'VC\Auxiliary\Build\vcvars64.bat'
if (-not (Test-Path $vcvars)) { throw "vcvars64.bat not found in $vsPath" }

# --- Import the environment -------------------------------------------------
# `set` prints KEY=VALUE per line. The vcvars banner contains no '=', so the
# regex only picks up real environment variables.

# stderr is swallowed inside cmd: vcvars calls vswhere without a full path and
# writes a harmless "not recognized" line to stderr. With
# $ErrorActionPreference = 'Stop' that line would become a terminating
# NativeCommandError even though the environment was set up correctly.
$previous = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$output = & cmd.exe /c "call `"$vcvars`" 2>nul && set"
$ErrorActionPreference = $previous

$imported = 0
foreach ($line in $output) {
  if ($line -match '^([A-Za-z_][A-Za-z0-9_()#]*)=(.*)$') {
    Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2] -ErrorAction SilentlyContinue
    $imported++
  }
}
if ($imported -lt 10) {
  throw "vcvars64.bat produced only $imported variables - environment not set up."
}

# Pull Swift's own variables from the registry, not from the inherited process
# environment. A shell started BEFORE the toolchain was installed never saw
# SDKROOT, and without it swiftc reports:
#   "unable to load standard library for target x86_64-unknown-windows-msvc"
foreach ($name in @('SDKROOT', 'SWIFTFLAGS', 'DEVELOPER_DIR')) {
  $value = [Environment]::GetEnvironmentVariable($name, 'User')
  if (-not $value) {
    $value = [Environment]::GetEnvironmentVariable($name, 'Machine')
  }
  if ($value) { Set-Item -Path "Env:$name" -Value $value }
}
if (-not $env:SDKROOT) {
  # Fall back to the standard install layout.
  $guess = Get-ChildItem "$env:LOCALAPPDATA\Programs\Swift\Platforms" -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending | Select-Object -First 1
  if ($guess) {
    $candidate = Join-Path $guess.FullName 'Windows.platform\Developer\SDKs\Windows.sdk'
    if (Test-Path $candidate) { $env:SDKROOT = $candidate }
  }
}
if (-not $env:SDKROOT) { throw "SDKROOT could not be resolved - Swift cannot find its stdlib." }

# The Swift toolchain lives under the user profile and is not in the vcvars
# environment.
$swiftRoot = "$env:LOCALAPPDATA\Programs\Swift"
if (Test-Path "$swiftRoot\Toolchains") {
  $toolchain = Get-ChildItem "$swiftRoot\Toolchains" |
    Sort-Object Name -Descending | Select-Object -First 1
  $binDirs = @(
    (Join-Path $toolchain.FullName 'usr\bin')
  )
  if (Test-Path "$swiftRoot\Runtimes") {
    $runtime = Get-ChildItem "$swiftRoot\Runtimes" |
      Sort-Object Name -Descending | Select-Object -First 1
    $binDirs += (Join-Path $runtime.FullName 'usr\bin')
  }
  foreach ($p in $binDirs) {
    if ((Test-Path $p) -and ($env:Path -notlike "*$p*")) {
      $env:Path = "$p;$env:Path"
    }
  }
}

# --- Run --------------------------------------------------------------------

Set-Location (Join-Path $PSScriptRoot '..')
& swift @SwiftArgs
exit $LASTEXITCODE
