# 0009. The treadmill as a second machine

- **Status:** Superseded by [0016](0016-bike-only.md) (bike only); previously amended by [0010](0010-treadmill-run-design.md)
- **Date:** 2026-11-16

## Context

The rider also owns an Echelon Stride treadmill (it advertises as `STRIDE-8s22-000766`). It uses the
same Echelon GATT service as the bike (`0bf669f1-…`, write `…f2`, notify `…f3` and `…f4`) and the
same `F0` framing and checksum, but its frames mean different things: `D2` is incline, not
resistance; `B1` sets incline, not resistance; and `F0 B0 01 01 A2`, the bike's harmless "start
data stream" init command, starts the treadmill's belt. A wrong byte moves a belt with a person on
it, so the design has to keep the two machines apart and keep belt control conservative.

Wattzup is one process with in-memory state next to one machine (ADR 0004). The state contract
(L2-014) must not break for the bike.

## Decision

**One machine at a time.** The state carries `machine` (`bike` | `treadmill`). The setting
`Wattzup:Machine` (`--machine treadmill`) chooses it at start-up, default `bike`, and
`POST /api/machine` changes it while no workout is active (L2-062). Changing it closes the link,
resets the machine-specific fields and scans for the other machine. The choice is held in memory
for the life of the process, like the rest of the state; it is not written to disk. Each machine has
its own device filter, and neither filter accepts the other machine (L2-063).

**One contract, the other machine's fields `null`.** The treadmill reuses the fields that already
mean the same thing: `speed_kmh` and `speed_mph` (now reported by the treadmill rather than derived
from cadence) and `distance_km` (integrated from speed per running second, as on the bike). It adds
`machine`, `target_speed`, `incline`, `target_incline`, `belt` and `belt_countdown`. Segments gain
`speed` and `incline`; plans gain `work_speed`, `rest_speed`, `work_incline`, `rest_incline`,
`speed` and `incline`. On each machine the other machine's fields are written as `null`, never
omitted, so the bike's existing fields keep their names and types except that `level`, `cadence`
and `plan_level` in a workout become nullable. Command log entries gain `command` and `value`, and
`level` becomes nullable. The plan kinds stay `hiit` and `flat`; the chosen machine decides which
fields are validated. The workout `status` strings are kept as identifiers on both machines
(`waiting for bike`, `paused: bike disconnected`, `ended: bike shut off`); the UI words them for the
machine. Two statuses are added: `starting belt` and `paused: belt stopped`.

**Wattzup starts the belt only after a countdown, and stops it whenever the ride is not running.**
Starting or resuming a treadmill workout runs a 3-second countdown (`belt_countdown` 3, 2, 1) that
the UI shows and announces, then writes the start-belt command once. The ride clock starts only when
the treadmill reports a speed above 0. If it does not within 10 seconds, the ride pauses; Wattzup
never retries the start by itself. Pause, stop, replace and the plan's end each write the stop-belt
command. If the treadmill reports speed 0 while the belt was running (its console stop or safety
key), the ride pauses and Wattzup does not restart the belt; the rider resumes through the
countdown again. After a disconnect, the ride stays paused when the treadmill comes back. The
countdown and the belt rules live in `Wattzup.Core` (the workout engine) and take `TimeProvider`.

**Safety limits.** Wattzup cannot stop the belt without a link; the treadmill's safety key and stop
button always can, and the UI says so whenever the treadmill is disconnected. Speed is limited to
1.0–16.0 km/h and incline to 0–15 %, inside the ranges the reference implementation sends (0–22 km/h
and 0–15 %); the upper speed limit is deliberately below the reference's. Wattzup writes only to the
write characteristic `…f2` and never to the firmware-update service `FE59`.

**Where the bytes come from.** The treadmill frames are taken from the Echelon Stride support of the
open-source project qdomyos-zwift (`src/devices/echelonstride/echelonstride.cpp`, GPL-3.0); facts are
restated, no code is copied. Each field is marked Decoded, Observed or Unknown in
`docs/protocol/echelon-treadmill-frames.md`, and nothing is built on an Unknown field. The source
has not been checked against this treadmill, so every command is on the protocol reference's
"Needs hardware confirmation" list, which a person runs before release (L2-043).

**Estimated power stays bike-only.** ADR 0003's power, average power and energy estimates use
cadence and resistance, which the treadmill does not have; on the treadmill `power`, `target_power`,
`avg_power` and `kcal` are `null` and the power trace is not shown.

## Consequences

- The transports subscribe to the notify characteristics the connection service names: `…f4` for
  the bike as before, `…f3` and `…f4` for the treadmill. `IBikeConnection.SubscribeAsync` takes the
  list.
- `SimulatedBikeTransport` advertises both a simulated bike and a simulated treadmill, so
  `--simulate --machine treadmill` runs the treadmill with no hardware, and every automated test
  stays on the simulated transport.
- Riding both machines at once, a treadmill power or energy estimate, a speed trace on the
  treadmill, mph input, and remembering the machine across restarts are not built; each needs a
  requirement first.
