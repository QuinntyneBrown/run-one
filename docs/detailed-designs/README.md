# Detailed designs

These designs are written for Telo Ride 1. They replace Telo Ride's designs and drop what Telo
Ride 1 leaves out; the earlier tree is in git history.

Each feature has one design, grouped by subsystem. A design is the feature folder's `README.md`:
an overview, the building blocks, the level-2 (L2) requirements it realizes from
[`docs/specs/L2.md`](../specs/L2.md), and its C4, class and sequence diagrams. The diagrams are
PlantUML sources in the feature's `diagrams/` folder, rendered to PNG beside them.

Each L2 requirement they cover belongs to exactly one design. A gap the requirements leave open is marked
`<TO SUPPLY>` and cites the open question or mock gap in `L2.md`.

The designs of journey 28 to 34 were written against the requirements as they stood before the
class became Intervals to the Beat; a feature is brought in line with `L2.md` before it is built,
and the designs of the screens built since say which slice built each part. Riding in Ibiza
(`L2-174` to `L2-177`) and the shape of a ride (`L2-179` to `L2-182`, ADR 0049) have designs of
their own. The shape of a ride is designed and not built: journey 39 builds it, and its four
designs say what changes in the designs of the ride as built
([ride the class](class-ride/ride-the-class/README.md),
[pause, leave or finish the class](class-ride/pause-leave-or-finish-the-class/README.md) and
[wait for a lost bike](class-ride/wait-for-a-lost-bike/README.md)), which each slice brings in
line first.

## Bike

| Feature | Requirements |
|---|---|
| [Check bike and browser support](bike/check-bike-and-browser-support/README.md) | `L2-007` `L2-008` `L2-009` `L2-010` |
| [Connect a bike](bike/connect-a-bike/README.md) | `L2-011` `L2-012` `L2-013` `L2-014` `L2-018` |
| [Keep the bike connected](bike/keep-the-bike-connected/README.md) | `L2-015` `L2-016` `L2-017` `L2-019` |
| [Read bike telemetry](bike/read-bike-telemetry/README.md) | `L2-020` `L2-021` `L2-023` |
| [Control resistance](bike/control-resistance/README.md) | `L2-025` `L2-026` `L2-027` `L2-028` |
| [Ride a simulated bike](bike/ride-a-simulated-bike/README.md) | `L2-024` |

## The Class

| Feature | Requirements |
|---|---|
| [Open the app](the-class/open-the-app/README.md) | `L2-167` |
| [Show The Class](the-class/show-the-class/README.md) | `L2-080` `L2-084` `L2-173` |

## Ibiza Flyover

| Feature | Requirements |
|---|---|
| [Fly over the course](ibiza-flyover/fly-over-the-course/README.md) | `L2-179` |

## Class Ride

| Feature | Requirements |
|---|---|
| [Ride the class](class-ride/ride-the-class/README.md) | `L2-087` `L2-088` `L2-089` |
| [Pause, leave or finish the class](class-ride/pause-leave-or-finish-the-class/README.md) | `L2-091` `L2-093` |
| [Wait for a lost bike](class-ride/wait-for-a-lost-bike/README.md) | `L2-092` |
| [Ride in Ibiza](class-ride/ride-in-ibiza/README.md) | `L2-174` |
| [Load the course](class-ride/load-the-course/README.md) | `L2-175` |
| [Play the music](class-ride/play-the-music/README.md) | `L2-176` |
| [Count down to the start](class-ride/count-down-to-the-start/README.md) | `L2-180` |
| [Show the finish banner](class-ride/show-the-finish-banner/README.md) | `L2-181` |
| [Ease off and roll on](class-ride/ease-off-and-roll-on/README.md) | `L2-182` |
| [Set the intensity](class-ride/set-the-intensity/README.md) | `L2-183` `L2-184` |
| [Choose the sound](class-ride/choose-the-sound/README.md) | `L2-185` `L2-186` |

## Class Done

| Feature | Requirements |
|---|---|
| [Show Class Done](class-done/show-class-done/README.md) | `L2-077` `L2-078` `L2-079` `L2-169` |
| [Keep the record](class-done/keep-the-record/README.md) | `L2-168` |
| [Score on target](class-done/score-on-target/README.md) | `L2-170` |

## Security

| Feature | Requirements |
|---|---|
| [Log to the console only](security/log-to-the-console-only/README.md) | `L2-115` |
| [Treat device data as untrusted](security/treat-device-data-as-untrusted/README.md) | `L2-129` |
| [Restrict third parties](security/restrict-third-parties/README.md) | `L2-131` |
| [Keep data on the device](security/keep-data-on-the-device/README.md) | `L2-132` |
| [Record diagnostics](security/record-diagnostics/README.md) | `L2-178` |

## Performance

| Feature | Requirements |
|---|---|
| [Keep the ride clock true](performance/keep-the-ride-clock-true/README.md) | `L2-133` `L2-134` |
| [Ride without a network](performance/ride-without-a-network/README.md) | `L2-135` |
| [Meet performance budgets](performance/meet-performance-budgets/README.md) | `L2-136` |
| [Stay smooth on long rides](performance/stay-smooth-on-long-rides/README.md) | `L2-138` |
| [Draw the course on a low-power tablet](performance/draw-the-course-on-a-low-power-tablet/README.md) | `L2-177` |

## UI

| Feature | Requirements |
|---|---|
| [Fit every width, touch and keyboard](ui/fit-every-width-touch-and-keyboard/README.md) | `L2-139` `L2-140` |
| [Fit The Class to every form factor](ui/fit-the-class-to-every-form-factor/README.md) | `L2-171` |
| [Support screen readers and motion](ui/support-screen-readers-and-motion/README.md) | `L2-141` `L2-142` |
| [Switch theme and full screen](ui/switch-theme-and-full-screen/README.md) | `L2-143` `L2-144` |
| [Show page not found](ui/show-page-not-found/README.md) | `L2-145` |
| [Show the wordmark](ui/show-the-wordmark/README.md) | `L2-172` |

## Platform

| Feature | Requirements |
|---|---|
| [Structure the frontend workspace](platform/structure-the-frontend-workspace/README.md) | `L2-146` |
| [Test without hardware](platform/test-without-hardware/README.md) | `L2-148` |
| [Host and deliver](platform/host-and-deliver/README.md) | `L2-149` |

## Rendering the diagrams

After a `.puml` changes, render the tree. The script needs Java, a `plantuml.jar` (set
`PLANTUML_JAR`) and Graphviz.

```sh
python .claude/skills/writing-software-design-documents/scripts/render_puml.py docs/detailed-designs
```
