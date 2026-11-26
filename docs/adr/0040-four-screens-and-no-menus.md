# 0040. Telo Ride 1 has four screens and no menus

- **Status:** Accepted, amended by [0048](0048-diagnostic-recording-behind-configuration.md) (a recording of the Bluetooth link comes back, behind configuration) and by [0049](0049-a-ride-is-shaped-like-a-race-for-one.md) (five screens: Ibiza Flyover comes before a ride in Ibiza)
- **Date:** 2026-11-23
- **Narrows:** [0028](0028-class-catalogue-shipped-with-the-backend.md) (the app reads one class from the catalogue), [0030](0030-world-library-carried-from-main.md) (the world is drawn at one fixed set of options)

## Context

Telo Ride 1 is four screens with no menus: Connect Bike, The Class, Class Ride and Class Done
(`AGENTS.md`; L2-167 AC4, L2-080 AC4). The code carried over from Telo Ride still opened on Home,
with a header that navigated to Home, Classes and Profile, a class library at `/classes`, Profile
and five Settings screens, a Diagnostics dialog with a packet log, and a heart rate strap that no
screen had used since ADR 0039. Every one of them is on the list of what Telo Ride 1 leaves out.

## Decision

- **Four screens and page not found.** The routes are `/connect` (Connect Bike), `/` (the class),
  `/classes/:id/ride` (the class ride; `/ride` since slice 31.1,
  [ADR 0046](0046-class-ride-at-ride-behind-a-connected-bike.md)), `/results` and page not found. `/classes`, `/classes/:id`,
  `/profile`, `/settings` and everything below them are page not found, whose link reads "Back to
  the class" and leads to `/` (L2-145).
- **`/` is the class, with no redirect.** It shows Class Start for the stand-in class
  `hiit-cardio-30` (`THE_CLASS_ID`) until slice 30.1 ships Intervals to the Beat with the app and
  slice 30.2 draws The Class. With no remembered bike, `/` opens Connect Bike, and a paired bike
  returns to `/`. Results' Done and Ride it again, the class ride's Leave and World loading's back
  link all lead to `/`. With no catalogue to read and none kept, `/` says "The class can’t be
  loaded. Check your connection and try again." with Try again, in place of the library's
  unavailable state and the guard for an unknown class.
- **No menu.** The app header with its navigation, the main shell and its side and bottom
  navigation are removed. Class Start and page not found use the slim header the ride screens
  already had: the wordmark, the bike's status from 1024 px on Class Start (L2-019), and Full
  screen. No link in any header leads anywhere.
- **Class Start offers no choice of picture.** Start class opens the ride as before: a class with a
  world loads it and rides in it with the class video inset. The choice between the class video and
  Ibiza is The Class's (30.2).
- **No Settings; the app decides.** The settings store and its five screens are removed. What they
  set is fixed at what was the default: the world is drawn at Auto quality, stepping down on slow
  frames, at the display's rate and full resolution, with the graphics API chosen automatically;
  the world's music plays when no class video is playing its sound; a downloaded world is kept on
  the device; the screen is kept awake for the length of a ride (L2-133 AC3); a ride does not enter
  full screen by itself; ride numbers are their standard size; and the theme and reduced motion
  follow the device (L2-142, L2-143). Saved worlds cannot be listed or deleted in the app; the
  browser's own site data controls do that.
- **No synthesised ride sound** (L2-176 AC9). The ride sound, its Web Audio implementation and its
  contract are removed, not defaulted to on.
- **No Diagnostics and no packet log.** The dialog, the packet log and the tap on both bike links,
  the connection history, the sent-command log, the build's version and commit (`TELO_VERSION`,
  `TELO_COMMIT`, with their `define` in `angular.json` and the deploy workflow's step that set
  them) and the device check are removed. A Bluetooth failure is still logged to the console
  (L2-115); no per-packet line is written. [ADR 0048](0048-diagnostic-recording-behind-configuration.md)
  brings back a recording of the link and a tap for it, off unless the app is opened with
  `?diagnose`; the dialog, the history, the version and the device check stay removed.
- **No heart rate.** The strap, its decoder, source and stats and the remembered strap are removed.
  The chooser asks for the Echelon service and FTMS and no other service (L2-012 AC1); the FTMS
  decoder skips the heart rate field by its size (L2-021).
- **The backend is not changed.** Nothing in `backend/` served only these screens. The app still
  asks `GET /api/classes` and nothing else, until 30.1.

## Consequences

- A rider cannot change quality, sound, theme or motion in the app. A device that draws the world
  slowly is helped only by the automatic step-down.
- There is no dialog left in the app. `@angular/cdk` stays a dependency; the first slice that opens
  a dialog uses it, and slice 28.8 removes it if none has.
- A fault with a bike in the field can no longer be read from a packet log; the console's Bluetooth
  errors are what is left. (ADR 0048 answers this with the diagnostic recording, L2-178.)
- The lockup still reads TELO Ride; the TELO RIDE 1 wordmark is slice 28.7. Results still shows the
  ride's time first; Class Done replaces it in 32.2.
- `AGENTS.md` is out of date in these lines: *Carried over from Telo Ride* still lists the class
  library as held in the code; "`npm start` serves the app; `?simulate` connects to a simulated
  bike" is right, but the app it serves now opens on the class, not Home; "No inline forms.
  Button-triggered editing opens a CDK Dialog or navigates to a screen" names a dialog the app no
  longer has; and "Bound what grows … (power and cadence traces, command logs, leaderboards)" names
  the command log, which is gone.
