# 0010. The treadmill follows the Run design: the Stride's limits, estimates, and a machine page

- **Status:** Superseded by [0016](0016-bike-only.md) (bike only); previously amended by [0011](0011-treadmill-behind-a-flag.md)
- **Date:** 2026-11-16
- **Amends:** [0009](0009-treadmill-as-a-second-machine.md)

## Context

ADR 0009 added the treadmill with the bike's screens adapted to it. The Magic Patterns OS *Wattzup*
then gained three treadmill frames, *Choose Machine*, *Run Setup* and *Run Dashboard*, and the mocks
in `docs/mocks/` follow them (the mocks are the UI's source of truth, AGENTS.md). Those frames
disagree with ADR 0009 in four places: the limits on speed and incline, what happens to the belt when
the link drops, a speed trace and an energy figure on the treadmill, and where the machine is chosen.
The rider decided on 2026-11-16 that the requirements follow the frames (L2-062 to L2-074).

## Decision

**Limits are the Stride's own.** Speed is 0.8–19.3 km/h (0.5–12 mph) and incline 0–10 %, the
ranges of the Echelon Stride, replacing ADR 0009's 1.0–16.0 km/h and 0–15 %. Both stay inside what
the reference implementation sends (0–22 km/h, 0–15 %). The backend refuses anything outside them
before a byte is built (L2-065).

**The treadmill stops its own belt when the link drops.** The *Run Dashboard* frame tells the runner
that the Stride stopped its belt and to step onto the side rails, so L2-071 says the same. This
replaces ADR 0009's "Wattzup cannot stop the belt without a link; the UI says so". It is an
assumption about the hardware: L2-043 criterion 5 makes a person check, on each platform, that the
belt stops within 2 seconds of the link dropping, before release. If it does not, this decision and
L2-071 criterion 17 are reverted to ADR 0009's wording.

**A stopped belt is reported neutrally.** A pulled safety key and the console's stop button both
arrive as speed 0, so Wattzup cannot tell them apart. The frame's safety-key overlay keeps its look
but reads `Belt stopped` and mentions the key only as one possible cause (L2-071 criterion 16).

**The treadmill has a trace, climb and an energy estimate.** On the treadmill, `climb_m` integrates
speed × incline, and `kcal` estimates energy with the ACSM walking and running equations for a 75 kg
runner (L2-064). The dashboard draws speed against the plan with an incline lane (L2-071), rendered
as ADR 0006 renders the bike's trace. `power`, `target_power` and `avg_power` stay bike-only, as ADR
0003 has them. Heart rate stays `null` (ADR 0003).

**The machine is chosen on its own page.** `/machine` replaces the Machine radio on `/setup`
(L2-073). It shows which Echelon machines are advertising nearby and how strong their signal is,
from a new `nearby` state field filled by the scanner (L2-074). The scanner never connects to the
machine that is not chosen. Each machine's *last session* and the *last used* machine are kept in the
browser's local storage, like the setup draft. The server keeps no ride history, so ADR 0004's
single-process, in-memory state is unchanged.

**On the treadmill the UI says *run*.** Copy says *run* and *Steady*, while the API keeps `flat` and
the `workout.status` strings on both machines. The treadmill's flat `summary` reads `Steady · <speed>
km/h at <incline>% · <minutes> min` (L2-067).

## Consequences

- The treadmill detailed designs, the backend (limits, `climb_m`, `kcal`, `nearby`, the simulated
  advertisements) and the frontend (`/machine`, Run Setup, Run Dashboard) must follow L2-062 to
  L2-074, slice by slice with ATDD. Until they do, they trail the specs and the mocks.
- The protocol reference's command examples and hardware checks move to the new limits.
- A wrong assumption about the belt on disconnect would leave a runner on a moving belt with the
  wrong advice. The L2-043 check is a release gate, not a nice-to-have.
- The energy figure is an estimate for an assumed 75 kg runner. A setting for the runner's weight
  needs a requirement first.
