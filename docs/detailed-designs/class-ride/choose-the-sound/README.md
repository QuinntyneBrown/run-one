# Choose the sound

## Overview

A ride in Ibiza had one sound: *Beautiful Boom Bap*, turned off and on by the "Music" toggle
([play the music](../play-the-music/README.md)). ADR 0050 gives the rider four: Music, No music,
YouTube video and YouTube audio. YouTube video lies over the course in the box's top-right corner;
YouTube audio plays the same player with its picture hidden. The video is a default one
(`xfgZRgPkoME`) or the class's own (`il_OFz6o42I`), in time with the ride and the course.

This feature covers the Sound button and its panel, the kept choice, the YouTube inset and its
hidden form, the player's life as the rider changes their mind, and what the ride does when
YouTube cannot play. Journey 40 builds it in slices 40.3 to 40.6.

Local terms:

- **sound**: the rider's choice for a ride in Ibiza: `music`, `none`, `youtube-video` or
  `youtube-audio`
- **video**: which YouTube video a YouTube sound plays: `default` or `class`
- **inset**: the 16:9 player over the course in its top-right corner
- **hidden player**: the same player kept 1 px square and transparent for YouTube audio

Neighbouring features own the adjacent concerns:

- The track itself, its file and its audio element belong to
  [play the music](../play-the-music/README.md) (`L2-176`).
- The class video's sync rules, which the inset reuses, belong to
  [ride the class](../ride-the-class/README.md) (`L2-088`).
- The course in the box belongs to [ride in Ibiza](../ride-in-ibiza/README.md) (`L2-174`).
- YouTube as the one third party belongs to
  [restrict third parties](../../security/restrict-third-parties/README.md) (`L2-131`).

## Description

### The choice and where it is kept

`RideSound` (`api`, `screen/ride-sound.ts`) is the choice's contract: signals `sound` and `video`,
and `choose(sound)` and `chooseVideo(video)`, each kept at once. `RideSoundStore` (`domain`,
`storage/`) implements it on `localStorage` under `telo-ride.sound` and `telo-ride.sound-video`.
Nothing kept reads as Music with the default video; slice 37.6's `telo-ride.music` = `off` reads
as No music (`L2-185` AC4). A value it does not know counts as never kept (`L2-129`).

`RideMusic` loses its own setting: `on` and `toggle()` go, and the store plays the track only while
the sound is Music. Its `available` signal stays, and disables Music in the panel (`L2-176` AC7).

### The Sound button and its panel

`wz-class-sound` (`components/src/class-ride/`, blocks `class-course__sound` and `class-sound`) is
presentational: inputs `sound`, `video` and `musicAvailable`, outputs `soundChange` and
`videoChange`. It renders the Sound button, naming the choice, with `aria-expanded` and
`aria-controls`, and, while open, a non-modal panel of two native radio groups in fieldsets. The
component keeps whether it is open; Escape closes it and returns focus to the button, and a press
outside it closes it (`L2-185` AC2). It sits in `wz-class-course`'s `controls` slot.

### The inset and the hidden player

`wz-class-course` takes an `inset` slot. The page renders in it, while a YouTube sound is chosen,
`wz-class-inset` (block `class-course__inset`), with the `--audio` modifier and `aria-hidden` for
YouTube audio; it emits its element once drawn (`playInset`). YouTube's player replaces the element
it is given, so the store puts a fresh child in the inset for each video and loads the player into
it with the `VIDEO_PLAYER_FACTORY`,
imported only when a YouTube sound is first chosen (`L2-186` AC4), and destroys it when the sound
becomes Music or No music, when the video changes (then loads the other) and when Class Ride
closes (AC5). Moving between YouTube video and YouTube audio changes only the modifier, so the
player is not reloaded.

The player follows the ride as the class video does: parked before "Go!", played on "Go!", paused
when the ride is held, sought back on a tick when it drifts more than 1.5 s from the ride clock
plus its offset (0:03 for the class video, 0 for the default video), and watched for a stall of
10 s of the ride, which shows "YouTube can’t play. The bike will still follow the class." under
the box (`L2-186` AC3, AC6). The store's player, `syncVideo` and stall watch serve both ways; in
Ibiza they read the chosen video's offset instead of the class's (`syncOffset()`), the stall watch
is reset for each new player (`VideoStallWatch.reset`), and a player that resolves after the rider
changed their mind is destroyed at once. A video chosen while the ride is held loads parked and
plays when the ride carries on (`L2-185` AC7).

The inset lies under the countdown, the finish banner, the roll-out and "Paused" (same layer,
earlier in the box), and under the Sound button, its panel and the intensity control (`L2-186`
AC7, AC8).

### YouTube's policies

YouTube's API Services Developer Policies forbid separating a video's audio from its picture, and
its Required Minimum Functionality asks for a visible player of at least 200 × 200 px. The hidden
player breaks both. The owner accepted the risk (ADR 0050, open question 48); if YouTube refuses
the embed, the stall watch shows the notice and the ride carries on.

## Requirements

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-185` | `L1-028` | A ride in Ibiza shall offer Music, No music, YouTube video and YouTube audio, and for a YouTube sound the default video or the class video, from a Sound button in the course box's top-left corner, each applied at once and kept on the device. |
| `L2-186` | `L1-028` | YouTube video shall play in a 16:9 inset in the box's top-right corner, YouTube audio the same player hidden, each on the ride clock (the class video plus its offset), fetched only when chosen, released when no longer needed, and the ride shall carry on, saying so, when YouTube cannot play. |
| `L2-176` | `L1-028` | The music shall play only while the sound is Music. |

## Diagrams

PlantUML sources are in `diagrams/`; they are not rendered to PNG yet (no PlantUML on the machine
that wrote them).

- [Behaviour: choose a YouTube sound mid-ride](diagrams/sequence-choose-youtube.puml)
