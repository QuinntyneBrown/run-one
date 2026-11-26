# Set the intensity

## Overview

The class's plan sets the bike's target resistance for every segment, and the stepper lets the
rider nudge it for one segment. Intensity is a third thing: one setting from 0 to 10 for the whole
ride, like a volume control, that makes every interval from then on harder or easier. 5 is the
class as it is. The owner asked for it after riding Ibiza (ADR 0050).

This feature covers the control on Class Ride, how it scales the level the plan sends, the target
power that follows it, and the question Class Done asks at the end: whether the ride's intensity
should be the rider's default, kept on the device. Journey 40 builds it in slices 40.1 and 40.2.

Local terms:

- **intensity**: the ride's setting, a whole number from 0 to 10
- **default**: the intensity a ride starts at; 5 until the rider keeps another on Class Done
- **scaled level**: the level a segment is sent at, `round(level × (1 + (intensity − 5) ÷ 10))`
  clamped to 1 to 32
- **question**: Class Done's card asking whether to keep the ride's intensity as the default

Neighbouring features own the adjacent concerns:

- The plan's levels and the engine that sends them belong to
  [ride the class](../ride-the-class/README.md) (`L2-027`); the stepper's nudge to
  [control resistance](../../bike/control-resistance/README.md) (`L2-028`).
- The ending, when the stepper and the intensity turn off, belongs to
  [ease off and roll on](../ease-off-and-roll-on/README.md) (`L2-182`).
- Class Done's score, facts and **Done** belong to
  [show Class Done](../../class-done/show-class-done/README.md) (`L2-078`, `L2-079`).
- What the device keeps belongs to
  [keep data on the device](../../security/keep-data-on-the-device/README.md).

## Description

The slice lives in the Ride app. The contract and its token are in `api`, the rule and the stored
default in `domain`, the control and the question's card in `components`, and the wiring in the
`ride` application's store and Class Done's page.

### The rule

`intensityLevel(level, intensity)` in `domain`'s `engine/intensity.ts` is pure: it returns
`round(level × (1 + (intensity − 5) ÷ 10))`, halves up, clamped to 1 to 32. At 5 it returns the
plan's level unchanged, so a ride nobody touched is the class as before. The class's levels run
from 11 to 24, so 10/10 sends 17 to 32 (24 clamps at 32 from 9/10) and 0/10 sends 6 to 12.

`RideIntensity` (`engine/intensity.ts`), provided by the ride's page with the engine, holds
the ride's intensity as a signal, starts it at the kept default, and offers `set(n)` (clamped to
0 to 10, whole), `raise()` and `lower()`.

### The engine

`WorkoutEngine` injects `RideIntensity` optionally (the flyover's preview and the unit tests have
none). Where it sends a segment's level, at a segment's start and on `resend()`, it sends the
scaled level. An effect on the intensity sends the current segment's scaled level again when it
changes, which replaces a nudge, as a new segment would (`L2-183` AC4, AC5). Its `state`'s
`targetPower` is `PowerModel.target(cadenceAim, scaledLevel)`, so "On target" and the ride's
on-target share follow the level actually sent (`L2-089` AC2). The segment itself, its kind and
the plan's profile stay the plan's.

### The control

`wz-class-intensity` (block `class-intensity`, `components/src/class-ride/`) is presentational:
inputs `value` and `disabled`, outputs `changed` with the number the slider moved to, and `raise` and `lower` for
**+** and **−**, so a press steps from the ride's own intensity, never from the value last drawn. It renders "Intensity",
"7/10", **+** (`aria-label="Raise intensity"`), a native range input from 0 to 10 standing up
(`writing-mode: vertical-lr; direction: rtl`, `aria-valuetext="7 of 10"`) and **−**. On a short
box (below md, or under 33 rem tall) it lays out − 7/10 + with no slider (`L2-183` AC8). The
video's and the course's boxes take it in a `controls` slot on their left edge; in Ibiza it stands
under the Sound button.

The store disables it with the stepper (`stepperOff`) and announces "Intensity 7 of 10" once per
change through `ANNOUNCER` (`L2-183` AC6, AC7).

### The default and the question

`INTENSITY_DEFAULT` (`api`, `rides/intensity-default.ts`) is the stored default's contract, `IntensityDefault`: `kept()`
returns a whole number from 0 to 10, 5 when nothing valid is kept or storage refuses; `keep(n)`
returns whether it was kept. `IntensityStore` (`domain`, `storage/`) implements it on
`localStorage` under `telo-ride.intensity`, as untrusted data (`L2-129`).

At the finish the store writes the ride's intensity into `ClassResult.intensity`. Class Done
checks it as untrusted (`intensityQuestion`: a whole number from 0 to 10), compares it with
`kept()`, and `wz-intensity-question` (`components/src/class-done/`) draws the card: when they differ it shows the question (`L2-184` AC1); "Make it my
default" calls `keep(n)` and the card turns to its status (AC2) or, when storage refused, to
"Your intensity couldn’t be kept on this device." (AC5); "Keep 5/10" hides the card and focuses
**Done** (AC3). Nothing is kept unless the rider says so; a ride left early asks nothing.

The question's card lies with **Done** in `class-done__end`; from lg the two share one row so the
screen still fits (`L2-078` AC6).

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-183` | `L1-005` | Class Ride shall offer an intensity from 0 to 10 on the box's left edge, starting at the rider's default, that scales every segment's level by 10 % a notch from 5, applies at once to the current segment and every later one, carries the target power with it, and is off when the stepper is. |
| `L2-184` | `L1-013` | When a finished ride's intensity differs from the default, Class Done shall ask whether to keep it, keep it on the device only when the rider says so, and say when it could not. |

## Diagrams

PlantUML sources are in `diagrams/`; they are not rendered to PNG yet (no PlantUML on the machine
that wrote them).

- [Class structure](diagrams/class-structure.puml)
- [Behaviour: change the intensity mid-ride](diagrams/sequence-change-the-intensity.puml)
- [Behaviour: keep it as the default on Class Done](diagrams/sequence-keep-the-default.puml)
