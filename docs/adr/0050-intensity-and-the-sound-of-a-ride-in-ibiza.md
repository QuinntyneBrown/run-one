# 0050. Intensity for every ride, and four sounds for a ride in Ibiza, one of them YouTube with its picture hidden

- **Status:** Accepted
- **Date:** 2026-11-25
- **Amends:** [0047](0047-a-ride-in-ibiza-is-class-ride-with-the-course-in-the-box.md) (the class video inset in the course comes back, as the rider's choice), [0049](0049-a-ride-is-shaped-like-a-race-for-one.md) (Class Done may ask one question before **Done**)
- **Narrows:** L2-176 AC9 (the music is no longer the app's only sound in Ibiza), L2-079 AC1 (**Done** is no longer Class Done's only action)

## Context

The product owner asked for three things after riding Ibiza Sunset Strip on the bike:

1. **Intensity, like a volume control.** During the ride, a scale from 0 to 10 that the rider
   slides or steps with **+** and **−**. 5 is the class as it is; every interval from then on is
   harder above it and easier below it. At the end of the ride, the app asks whether the setting
   should be the rider's default from then on, kept on the device.
2. **A choice of sound in Ibiza:** the music, no music, a YouTube video, or a YouTube video's
   audio only.
3. **The YouTube video over the course**, in the box's top-right corner, as Telo Ride drew it and
   ADR 0047 took out, with more room from the right edge. By default the video is
   `xfgZRgPkoME`; the rider can choose the class's own video instead, played in time with the
   ride and the course.

Three earlier decisions say otherwise. `AGENTS.md` and L2-176 AC9 make *Beautiful Boom Bap* the
app's only music, with "no way to choose one". ADR 0047 removed the class video inset from the
course. L2-079 AC1 makes **Done** Class Done's only action. `AGENTS.md` asks that a request
working against the direction be named before it is built. These do, and the owner chose to
change the direction.

Three questions were put to the owner before the requirements were written:

- **How far a notch moves the bike.** Answered: 10 % of the plan's level per notch, so efforts
  move further than recoveries.
- **Where intensity applies.** Answered: on every ride, with the class video too. The sound
  choice is Ibiza's only, since a ride with the class video already has its sound.
- **YouTube's audio with its picture hidden.** YouTube's API Services Developer Policies forbid
  separating a video's audio from its picture, and its Required Minimum Functionality asks for a
  visible player of at least 200 × 200 px. A hidden player breaks both. The owner was told this
  and chose to hide the player anyway.

## Decision

- **Intensity is a ride setting from 0 to 10, 5 by default.** Each notch is 10 % of the plan's
  level: the target resistance a segment sends is `round(level × (1 + (intensity − 5) ÷ 10))`,
  clamped to 1 to 32. 5 sends the plan's level unchanged, so a rider who never touches it rides
  the class as before. A change applies at once to the current segment and to every segment
  after it. The segment's target power, and so "On target", follows the level actually sent. The
  stepper's one-segment nudge (L2-028) stays as it is, on top of the intensity.
- **The control lies in the video's or the course's box, on its left edge**, a slider standing
  up between **+** and **−**, with "Intensity" and "7/10" beside it. It is a native range input,
  so touch, keyboard and screen readers get the platform's own behaviour. It is off when the
  stepper is off.
- **The default is kept on the device, and asked about once, on Class Done.** A ride starts at
  the kept default (5 when nothing is kept). When a finished ride ended at another intensity,
  Class Done asks above **Done** whether it should be the default, with "Make it my default" and
  "Keep {n}/10". Nothing is kept without the rider's answer. A ride the rider leaves before the
  finish asks nothing.
- **A ride in Ibiza has four sounds:** Music (*Beautiful Boom Bap*, as L2-176 has it), No music,
  YouTube video and YouTube audio. The "Music" toggle becomes a "Sound" button that opens a
  panel with the four, and, for the two YouTube sounds, which video plays: the default video
  (`xfgZRgPkoME`) or the class video. The choice is kept on the device. The Sound button moves to
  the box's top-left corner so the inset can have the top-right.
- **The YouTube video lies over the course**, 16:9, in the top-right corner, a rem further from
  the right edge than from the top. Both videos follow the ride clock: the class video from its
  sync offset (0:03), as with a ride with the class video, the default video from 0:00. Each
  seeks back when it drifts more than 1.5 s, and pauses with the ride.
- **YouTube audio hides the player.** The same player plays, kept 1 px square and transparent,
  outside what a screen reader reads. This is against YouTube's API Services Developer Policies,
  as above. It is recorded here so the risk is not forgotten: YouTube may stop serving the embed
  to the app, and then neither YouTube sound plays, and the ride carries on (L2-186 AC6).
- **YouTube is fetched only when a YouTube sound is chosen.** The video library and YouTube's
  player load when the rider picks one, never with Ibiza Flyover, The Class or a ride with
  music or no music. The music track is fetched only when Music plays (L2-176 AC2 stands).
- **Intensity does not make a custom workout.** The plan, its segments and their order stay the
  class's; the setting scales how hard the bike is set, as the stepper already does for one
  segment. The custom workout stays left out.

## Consequences

- `AGENTS.md`'s direction, L1-005, L1-013, L1-021 and L1-028 change, and L2-183 to L2-186 are
  added; L2-028, L2-079, L2-089 and L2-176 are amended. Journey 40 plans the work.
- The YouTube third party now reaches a ride in Ibiza when the rider chooses it. The CSP already
  allows it (L2-131).
- `WorkoutEngine` sends a level scaled by intensity, and `PlanState`'s target power is scaled the
  same way. `RIDE_MUSIC` gives way to a `RIDE_SOUND` choice; the music's "off" setting kept by
  slice 37.6 is read as "No music".
- The risk taken with the hidden player is the owner's. If YouTube objects, YouTube audio is
  taken out by changing the mocks first, then L2-186, then this record.
