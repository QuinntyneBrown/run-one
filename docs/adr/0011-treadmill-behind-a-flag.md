# 0011. Treadmill support behind a flag

- **Status:** Superseded by [0016](0016-bike-only.md) (bike only)
- **Date:** 2026-11-16

## Context

ADRs 0009 and 0010 added the Echelon Stride as a second machine, built against the simulator and a
third-party reference (qdomyos-zwift). On 2026-11-16 the rider's Stride-8s (`STRIDE-8s22-000766`,
Device Information: ChangYow `SI0115 V2`, firmware `09`) was tried for real from macOS:

- Wattzup connects, discovers the Echelon service and subscribes to both notify characteristics
  (`isNotifying` is true for `…f3` and `…f4`). Every write is acknowledged.
- The treadmill sends **no notification at all**: not after the init frames (`A4`, `A1` × 4, `A3`,
  `A1`), not for keepalives, not after `F0 B0 01 01 A2` with the reference's `D0 01 00` and
  `D0 01 11`, not after the reference's Stride 4 `E0` frame, and not while the belt runs from the
  console with speed and incline changed by hand.
- The belt never moved from a Bluetooth command, so Wattzup's 10-second start timeout stopped it and
  paused the ride (L2-066 criterion 4).
- The Stride-8s has a built-in Echelon screen, which reports `Connected Via: UART` to the
  treadmill. Releasing it (*Forget Equipment*) did not change the Bluetooth behaviour.
- The reference project has an open report with the same symptoms that its author attributes to an
  Echelon lock (qdomyos-zwift issue 4831), whose unlock needs the official app.

So treadmill support does not work on the only real treadmill available, and offering it in the UI
moves the rider into a ride that cannot start.

## Decision

**Treadmill support is off by default behind `Wattzup:Treadmill:Enabled` (L2-075).** While it is
off, the backend refuses to start with the treadmill chosen, `POST /api/machine` answers 409
`machine_unavailable` for the treadmill, the scanner does not record treadmills in `nearby`, the
state carries `treadmill_enabled: false`, and the frontend redirects `/machine` to `/setup` and
shows no link to switch machines. With the flag on, everything in L2-062 to L2-074 applies
unchanged, so the simulator and the tests keep the treadmill working.

The flag is a plain boolean option, like `Wattzup:RawPacketLog:Enabled`; no feature-management
library is added for one switch. The state field is how the frontend learns it, because the
frontend already reads all server facts (`simulated`, `exposed`) from the state.

## Consequences

- The treadmill code, its tests and its mocks stay and keep running with the flag on; nothing is
  deleted.
- Turning the treadmill on for real needs the unlock or start sequence the Stride-8s expects, which
  can only be learned by capturing the official Echelon app's traffic (an iOS Bluetooth log through
  PacketLogger, or an Android HCI snoop log). The findings above are in
  `docs/protocol/echelon-treadmill-frames.md`.
- When the flag is removed, L2-075, this ADR and the flag-only tests go with it.
