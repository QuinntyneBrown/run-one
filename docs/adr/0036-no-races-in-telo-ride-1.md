# 0036. Telo Ride 1 has no races; the World is kept for riding the class

- **Status:** Accepted
- **Date:** 2026-11-22
- **Narrows:** [0029](0029-map-catalogue-shipped-with-the-backend.md), [0030](0030-world-library-carried-from-main.md), [0034](0034-maps-built-in-blender.md), [0035](0035-every-map-a-course.md)

## Context

Telo Ride 1 is Telo Ride with everything but one class taken away (`AGENTS.md`). It has four
screens, Connect Bike, The Class, Class Ride and Class Done, and no races. The code carried over
from Telo Ride still held the race: Map Select, Race Setup, the race lobby, the race itself with
its ghost, bots and standings, the race's part of Results, and the map catalogue's client.

The slice that removes them was first written as "remove races and the World". Since then the
specs decided that the one class can be ridden in Ibiza (L2-173 to L2-177): Ibiza Sunset Strip is
drawn by the course renderer in the `world` library, from the course built in Blender. So the
World cannot go with the races.

## Decision

- **No races.** The app has no route, link or request that leads to a race, a map list, a ghost
  or a bot. `/race` and every address under it show page not found. Home keeps its greeting and
  its Classes door; Results shows a finished class only, with no place, standings, stars or
  unlocked map.
- **The World stays, for a class ride.** The `world` library (ADR 0030), the Blender build
  (ADR 0034) and the courses in `public/courses/` stay, because a class ride in the World draws
  them. ADR 0034 and ADR 0035 now describe courses a class is ridden on, not maps a race is won
  on.
- **The other seven courses go with the class library.** They are still the worlds of the
  classes the class library lists. The slice that leaves one class (30.1) removes them, their
  Blender scenes and their films, and leaves Ibiza Sunset Strip.
- **The backend's race code goes with the backend's decision.** The map catalogue (ADR 0029),
  the race sessions of the hub, bots and race results in `backend/` are no longer called by the
  app. Slice 28.1 decides whether Telo Ride 1 keeps a backend at all; they are removed there or
  in the slices that follow it (28.3, 28.4, 28.8), not twice.

## Consequences

- The eight race-world behaviour specs that failed in the code as carried over are gone with the
  feature, and CI is green again.
- Until 28.3 and 28.4, the contracts in `api` still carry race fields the backend sends (a ride's
  kind, the hub's race messages, a rider's stars and open maps); nothing in the app reads them
  for a race.
- A rider with a bookmarked race address sees page not found, with the way back.
