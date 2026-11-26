# 0008. CoreBluetooth through the Objective-C runtime, in a plain app bundle

- **Status:** Superseded by [0019](0019-no-backend.md) (no backend, so no .NET Bluetooth transports)
- **Date:** 2026-11-15
- **Amends:** [0007](0007-corebluetooth-first.md)

## Context

ADR 0007 put `Wattzup.Ble.CoreBluetooth` and `Wattzup.Mac` on `net10.0-macos`. That target needs
the .NET macOS workload, and the workload needs a full Xcode install to build, sign and link an
app. A machine with only the Command Line Tools, CI runners without Xcode, and every non-Mac
developer could then not build the solution. The transport itself needs only a handful of
CoreBluetooth calls: a central manager, a scan, a connection, two characteristics, notify and write.

macOS asks the rider for Bluetooth permission for the *responsible* process. That is the app bundle
when one is launched, or the terminal app when the server is run from a terminal. A bundle is a
folder (`Wattzup.app/Contents/{Info.plist,MacOS/}`) and needs no Xcode to assemble or ad-hoc sign.

## Decision

- `Wattzup.Ble.CoreBluetooth` targets plain `net10.0`. It reaches CoreBluetooth through the
  Objective-C runtime with source-generated `LibraryImport` declarations of `objc_msgSend` (one per
  signature), registers its delegate class (`WattzupBleDelegate`, conforming to
  `CBCentralManagerDelegate` and `CBPeripheralDelegate`) at run time with `[UnmanagedCallersOnly]`
  callbacks, and receives them on a private serial dispatch queue. Every type is
  `[SupportedOSPlatform("macos")]`.
- `Wattzup.Api` references it directly and registers it only when `OperatingSystem.IsMacOS()`, the
  same way it registers BlueZ only on Linux. `TransportSelector.Contribute` is removed.
- `Wattzup.Mac` is not a project. It holds `Info.plist` (with `NSBluetoothAlwaysUsageDescription`)
  and `bundle.sh`, which publishes `Wattzup.Api` self-contained for `osx-arm64` or `osx-x64` into
  `artifacts/Wattzup.app/Contents/MacOS/` and signs the bundle ad hoc with `codesign`. Inside a
  bundle the host uses the bundle as its content root and writes `raw_packets.log` and
  `status.json` under `~/Library/Application Support/Wattzup/`.
- Run from a terminal (`dotnet run --project backend/src/Wattzup.Api`), the server works too, once the
  terminal app has Bluetooth permission.

## Consequences

- Every project builds on macOS, Linux and Windows with the plain .NET SDK; CI needs no workload.
- The interop surface is hand-written and has no compile-time binding checks. It is small and kept
  in `Wattzup.Ble.CoreBluetooth/Interop/`. The CoreBluetooth hardware smoke test (L2-043), run by a
  person, is the check that it works against a bike.
- The bundle is signed ad hoc, not notarised. Gatekeeper asks the rider to confirm the first launch
  (right-click → Open). Notarisation would need an Apple Developer ID; it can be added to
  `bundle.sh` later without changing the code.
