# 0045. The course's rider is one mesh built in Blender, carried over from Telo Ride

- **Status:** Accepted
- **Date:** 2026-11-23
- **Amends:** [0034](0034-maps-built-in-blender.md) (the course's rider is built in Blender as its map is), [0042](0042-one-class-and-one-course-shipped-with-the-app.md) (the course ships a third file), [0043](0043-static-files-on-azure-static-web-apps.md) (`/riders/*` joins the asset folders)

## Context

The rider on Ibiza Sunset Strip (L2-174 AC1) was put together in the browser from separate rigid
shapes: a trunk, two tubes an arm, two a leg, a ball for the seat. Where they met they showed: a
gap at the shoulder, a pinch at the elbow, a knee standing out of the leg. Each frame the app
worked out where each knee was from the pedal under it.

Telo Ride replaced that rider after this repository was copied from it: commit `b118c5ee6` of
`wattzup`, "Course rider: each limb is one skin that bends at its joint (L2-166 AC26) (#1438)",
its ADR 0036. The owner asked for that rider here. Telo Ride 1 has one course and one rider on it
(L2-174 AC6), so only the rider the person riding sees is wanted.

## Decision

- **The rider's body is Telo Ride's, brought across unchanged.** `tools/blender/rider.py`,
  `tools/blender/scenes/rider.blend` and `frontend/projects/ride/public/riders/rider.glb` are the
  files of `b118c5ee6`, byte for byte. The script's first line still names Telo Ride's ADR 0036
  and L2-166 AC26; here they are this ADR and L2-174 AC11.
- **One connected, watertight mesh, built by the script.** Trunk, neck, head, arms to mitten hands
  and legs to the ankles are one cage of quads in the riding position, subdivided, with edge loops
  round each knee, elbow, hip and shoulder. The helmet, the shoes and the bike are not part of it:
  the app still makes those (`course-cyclist.ts`). It is modelled by the script, not from a bought
  or downloaded figure, so no licence comes with it and the build is repeatable.
- **The kit has thickness.** What is worn is raised 2 mm off the skin and the jersey 2 mm more off
  the shorts, so the collar, the hems, the cuffs and the sock tops are each a small step.
- **A humanoid armature of 19 bones, its pedalling baked.** Inverse kinematics in Blender hold the
  feet to the pedals and the hands to the brake hoods. One turn of the cranks is keyed seated and
  one out of the saddle, 30 frames each, and both are baked to plain keyframes on every bone. The
  app plays the turn from the crank's angle (`rider-turn.ts`) and blends the two by how far the
  rider is out of the saddle; it works out no kinematics.
- **Served as `riders/rider.glb`, loaded with the course.** `RiderBody.load()` (`rider-body.ts`,
  in the `world` library) is one of the three fetches `CourseRenderer.load` awaits, so the file is
  asked for only when a ride in Ibiza opens: never by the initial bundle, The Class or a ride with
  the class video (L2-175 AC1). A file that is missing or is not the rider's fails the load as a
  missing map does (L2-175 AC2). The file holds the body at two finenesses on the one armature:
  the cage as modelled (1,530 triangles) and subdivided once (5,684). Its regions (skin, shorts,
  gripper, sock, glove, hair, kit) are marked in its vertex colours; the app paints the rider's
  colours over them and draws the kit's texture on the trunk and sleeves.
- **It is disposed with the course** (L2-174 AC8). The loaded file's geometries, skeletons and
  materials are one of the renderer's disposables, and the rider's own copy of the mesh, its
  skeleton, its kit's texture and its animation mixer are the rider's (`RiderModel.owned`). A file
  that arrives after the ride was left is disposed at once.
- **The host serves `/riders/*` as files.** The folder joins the `exclude` of
  `staticwebapp.config.json` (ADR 0043): a rider that is not there is 404, never the app's shell.
  The service worker's asset groups do not name `courses`, so they do not name `riders` either.

## What was not brought

- Telo Ride's change also gave every other rider on a course the coarser body. The code that makes
  other riders is still in `course-renderer.ts`, carried over, and now calls the same kit; nothing
  was added to it, and Telo Ride 1 hands it no other rider (L2-174 AC6). It goes when riding in
  Ibiza is built as specified (journey 37).
- `e2e/race-course.spec.ts` went with races (ADR 0036). Its new assertion, that the rider's file is
  loaded with the course, is in `e2e/class-world-start.spec.ts`.
- Telo Ride's design for riding a course (`race/ride-a-course`) has no counterpart here: riding in
  Ibiza has no detailed design yet (`docs/detailed-designs/README.md`). The rider's design is this
  ADR until that one is written.

## Consequences

- The bike's measurements are in two places, `course-cyclist.ts` and `tools/blender/rider.py`. A
  change to the frame, the cranks or the hoods needs the rider rebuilt, or the feet leave the
  pedals. The script fails if a baked ankle is more than 4 mm from where its pedal puts it.
- The muscles and tendons that were painted on the skin as lines of light and shade are gone; the
  body's shape carries them.
- Between seated and standing the app blends two baked poses, so on a 6 % climb an ankle can sit a
  few millimetres off its pedal, inside the shoe.
- A ride in Ibiza downloads 443 kB more (the rider's file is not compressed with meshopt as the
  map is). The initial bundle is unchanged: `rider-body.ts` and three's `SkeletonUtils` are in the
  course renderer's lazy chunk.
- The rider costs about what the one before did (L2-177 AC1): Telo Ride counted 11,400 triangles
  where there were 9,900 at the top tier. Its body is two draw calls (the kit's texture, and
  everything coloured by vertex) and is no longer part of the batch that draws the moving parts as
  one; the shoes, cranks and pedals still are. Its frame rate on a real tablet has not been
  measured (L2's open question 15).
- The rider still wears a number on their back, as Telo Ride's riders do in a race. L2-174 does not
  ask for one; it stays until riding in Ibiza is built as specified.
- The rider is rebuilt by its script: a change modelled by hand in `rider.blend` is lost on the
  next build.
