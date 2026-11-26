# User journeys

This document is rewritten for Telo Ride 1 and drops what Telo Ride 1 leaves out: races and the
World, the class library, sign-in, progression, group classes and live races, Home, Profile,
ride settings, the custom workout, heart rate, Telo Ride's Diagnostics screen, feedback and installing the app. It
follows the requirements in [`specs/L1.md`](specs/L1.md) and [`specs/L2.md`](specs/L2.md).

Estimates are working days for one intermediate developer. **% complete** is the days of a
journey's finished slices in [`detailed-journeys.md`](detailed-journeys.md) over its days, updated
as each slice finishes.

A journey kept from Telo Ride keeps its number, because [`lessons-learned.md`](lessons-learned.md),
[`videos/`](videos/README.md) and [`prompts/`](prompts/README.md) refer to its slices by number.
Telo Ride's journeys 6 to 27 are gone and their numbers are not used again. Telo Ride 1's own
journeys start at 28.

## Carried over from Telo Ride

Work finished in Telo Ride that Telo Ride 1 keeps as it is.

| #   | Journey              | Description                                                       | Days | % complete |
| --- | -------------------- | ----------------------------------------------------------------- | ---- | ---------- |
| 1   | Scaffold the product | Angular workspace and libraries, test fixtures and CI.            | 7    | 100%       |
| 2   | Connect a bike       | A simulated bike; keepalive and automatic reconnect.              | 5    | 100%       |
| 3   | Read live telemetry  | Power, cadence, resistance and output, live as the rider pedals.  | 4    | 100%       |
| 4   | Control resistance   | The plan sets target resistance; the rider can raise or lower it. | 5    | 100%       |
| 5   | Ride a solo class    | The plan steps on a true clock while the video stays in sync.     | 6    | 100%       |

## To build

Telo Ride 1's journeys, ordered by value added to the product, scaffolding first.

| #   | Journey                                   | Description                                                                                                                                                                                                                           | Days | % complete |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---------- |
| 28  | Make it Telo Ride 1                       | Decide the backend, take out what Telo Ride 1 leaves out, the TELO RIDE 1 wordmark, static hosting.                                                                                                                                   | 15   | 100%       |
| 29  | Pair the bike                             | Connect Bike as designed: pair once, and say why when the bike cannot be reached.                                                                                                                                                     | 5    | 100%       |
| 30  | Open on The Class                         | The one class on the home screen: video, length, how to ride it, what the bike will do and one start button.                                                                                                                          | 12   | 100%       |
| 31  | Take the class                            | Class Ride as designed: pause, lose the bike, leave or ride to the finish.                                                                                                                                                            | 8    | 100%       |
| 37  | Ride in Ibiza                             | The Ibiza Sunset Strip course in the video's box, placed by the clock, with no loading screen; _Beautiful Boom Bap_ and its Music button; the course's budgets on a low-power tablet.                                                 | 20   | 100%       |
| 32  | See your number                           | Class Done: output in kJ, best, time, average, on target and the 17 efforts; the record to beat.                                                                                                                                      | 11   | 100%       |
| 33  | Ride through a hidden tab or lost network | The clock stays true and the ride finishes without a network.                                                                                                                                                                         | 4    | 100%       |
| 34  | Stay smooth on long rides                 | Bundle budgets, running totals only, stable heap, web vitals.                                                                                                                                                                         | 6    | 100%       |
| 35  | Keep it private                           | Nothing loads from or goes to a third party but YouTube; bike and stored data are untrusted.                                                                                                                                          | 3    | 100%       |
| 36  | Use by touch, keyboard and screen reader  | Every width, 44 px targets, keyboard paths, announcements, motion, theme, full screen.                                                                                                                                                | 8    | 100%       |
| 39  | Give the ride its shape                   | A ride shaped like a race for one (ADR 0049): Ibiza Flyover before a ride in Ibiza, the countdown to "Go!", the finish banner with the output, the target resistance easing off, and the roll-out before Class Done opens on its own. | 16   | 100%       |
| 40  | Ride it your way                          | Intensity from 0 to 10 on every ride, kept as the default when the rider says so on Class Done; in Ibiza a choice of sound: the music, no music, a YouTube video over the course (the default video or the class video, in time) or its audio alone (ADR 0050).| 14   | 100%       |
| 38  | Diagnose a bike that misbehaves           | A diagnostic recording, off unless the app is opened with `?diagnose`: every byte both ways with what the app decoded, the link's events, the readouts shown, notes and screen captures, saved as files.                              | 11   | 100%       |

**Total:** 160 days. **Complete:** 160 days (100%), 27 of them carried over. **To build:** none.
Journey 37 was added by slice 30.2 and is built after journey 31, so its number is out of order.
Journey 38 was added for L2-178 (ADR 0048). It is not a journey of the rider's: the person
diagnosing takes it, with the app opened at `/?diagnose`.
Journey 39 was added when the mocks drew the shape of a ride (L2-179 to L2-182); it is the
rider's, and sits above journey 38 because it adds more to the product.
Journey 40 was added for intensity and the sound of a ride in Ibiza (L2-183 to L2-186, ADR 0050),
asked for by the owner after riding Ibiza; it is the rider's, and sits above journey 38 too.
