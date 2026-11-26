# Blender map

Rewritten for Telo Ride 1: one course. Telo Ride 1 has one map, **Ibiza Sunset Strip** (`ibiza`), modelled after
its one class, Intervals to the Beat (GCN Training, `intervals-to-the-beat`, 20:00), which is ridden on it
(AGENTS.md, Direction; ADR 0034). This folder builds the map in Blender from the class's plan. Telo Ride's seven
other courses, their themes, scenes and films went with slice 30.1 (ADR 0042).

```
blender --background --python tools/blender/build_course.py -- tools/blender/courses/ibiza.json
```

or, with Python 3.11+ and `pip install bpy` (no Blender install needed):

```
python tools/blender/build_course.py tools/blender/courses/ibiza.json
```

It writes:

| File | What it is |
| --- | --- |
| `frontend/projects/ride/public/courses/ibiza.glb` | The map the Ride app draws: glTF binary, +Y up, coloured by vertex, no textures, no normals (the app shades it flat, and works out the ground's). |
| `frontend/projects/ride/public/courses/ibiza.course.json` | The road's centre line and the plan's stages along it. The app rides this. |
| `tools/blender/scenes/ibiza.blend` | The Blender scene: open it to look the map over or model it further. The `Guides` collection holds the centre line and is left out of the glb. |

`--preview <dir>` also renders four stills with Cycles (an overview, the start, the steepest climb and
the finale). `--out` and `--blend` move the outputs. `--video blender/ibiza.mp4` stages a 20-second film of
the map after the build (an aerial of its turns and hills, then a drone chasing the rider and three bots out
of the start, up the twistiest climb and in to the finish, rendered with EEVEE at 1280 x 720, 30 fps);
`--render` renders it there and then. No film of Ibiza Sunset Strip has been rendered: the repository's
`blender/` folder, where a film is written, went with the other courses' films and is made again by the first
render.

### From a running Blender (the Blender MCP)

With Blender open and its MCP add-on connected, the same build runs inside the open file (emptied first, not
reset to factory settings) from Blender's Python:

```python
import sys; sys.path.insert(0, r"<repo>/tools/blender")
import build_course
build_course.main([r"<repo>/tools/blender/courses/ibiza.json", "--video", r"<repo>/blender/ibiza.mp4"])
```

`render_film.py` does the build and the render in one go, in the background:

```
blender --background --factory-startup --python tools/blender/render_film.py -- ibiza
```

On a machine short of memory, `film.sh` renders the film in steps, one Blender at a time: it stages the film's
scene, renders frames 1 to 300 and 301 to 600 as PNGs, and encodes them with ffmpeg (on the `PATH`):

```
for step in stage a b encode; do tools/blender/film.sh <scratch dir> $step ibiza; done
```

`main` returns the map's facts (length, climbing, triangles, clubs, efforts). Rendering the film from
the open Blender blocks its window for the length of the render; `blender --background <scene> --render-anim`
of the scene saved by `render_film.py --stage` does the same out of the way.

## How the class becomes the map

The course file (`courses/ibiza.json`) holds the class's plan: for each segment its kind, its seconds,
its target resistance (`level`) and its cadence aim (rpm).

- **Size.** A segment's stretch of road is its seconds x its rpm x 5 m a turn of the pedals (the
  scene driver's gearing). The map is as long as the class: Intervals to the Beat, 20:00, is 8.4 km.
- **Elevation.** A level above the course's mean climbs and one below it descends, by the theme's gradient a
  level (`grade.perLevel`: 0.855 % for Ibiza; 1 % with none named), eased along the road.
- **Ramps.** The theme's `grade` names a `ramp` (`{"work": 0.5, "recover": 0.25}`): an effort's whole climb is
  laid in that share of its stretch and the rest runs level, and a recovery's descent likewise, so a small climb is
  a hill a rider can see. Each effort climbs onto a headland in the first half of its stretch; each recovery
  drops off it in its first quarter.
- **Roll.** The ground between the class's hills rolls a little (`roll`, `rollWave`), so the strip is never dead
  level.
- **Turns.** Dealt from the course's `seed`, by the theme's weights (`turns`): esses and hairpins on the efforts,
  sweeps on the recoveries, sweeps and straights on the warm-up and cool-down. The road never comes within
  46 m of an earlier stretch of itself, and turns for home when it strays far. Change the seed for
  another layout of the same course.
- **Theme.** Ibiza Sunset Strip's concept (`frontend/projects/world/src/world-ibiza.ts`,
  `docs/class-worlds.md`) is rebuilt as geometry. The sea is on the rider's left under a white
  seawall, with yachts at anchor; on the right, whitewashed beach clubs with neon shapes, glowing
  doors, pergola terraces, bougainvillea and a dancing crowd, festoon lights strung across the
  strip, and DJ terraces sweeping light beams. The sun sinks beside Conillera where the last
  stretch points. Each effort starts under a round neon arch and rides over chevrons; tight bends
  have red and white kerbs and arrow boards.
- **Start and finish.** The rider starts on a painted grid; the chequered start line stands 14 m
  up the road under stone pillars, a pergola and the start lights. The last 300 m run straight to
  a chequered finish line under a golden arch strung with bulbs, between barriers and crowds, with
  confetti in the air. Of the layouts a seed can deal, the script keeps one whose start and finish
  look out to open sea.

## The theme

Ibiza Sunset Strip's land and scenery are `build_terrain` and `build_scenery` in `build_course.py`; its theme in
`themes.py` is marked `own` and gives it the rest (its sky, which the course file carries for the app, its haze
and lights, the bends it is dealt, its ramps and roll). `build_scenery` uses the kit in `themes.py` (`Kit`) for
its windows, railings, glows and lights. `sky.py` paints the sunset the sky dome carries;
`python tools/blender/preview_sky.py out.png` draws it to a file without Blender, to tune it.

## Built for low-power tablets

- **Groups and chunks.** Every part hands its faces to the assembly (`assemble`), which joins them into a
  few groups by material (`Land`, `Ground`, `Walls`, `Solid`, `Leaves`, `Glow`, `Beams`, `Confetti`), puts each face's colour
  into its vertices, and cuts each group into chunks of 240 m of road (some groups' chunks are several times as
  long: `WIDER`). The app draws a chunk only near the camera, in one draw call.
- **The ground.** What the road builds (asphalt, paint, kerbs, pavements, shoulders) is the `Ground` group, the only
  one with a UV of its place on the road: each vertex's metres left of the centre line and metres from the start
  line. The app draws its surface from that (`docs/course-realism.md`).
- **The walls.** What is built of a material in `WALL_KINDS` (the clubs' whitewash, the seawall) is the `Walls`
  group. Its UV is each vertex's metres along its wall and metres above the road beside it, plus 1,000 m for each
  kind of wall, from which the app draws plaster (`docs/course-realism.md`).
- **Windows.** `Kit.window` builds a window as one panel of the `Windows` group, its UV its place on the panel, whether
  it is lit and its own number; the app draws the rest. Nothing a window has is modelled.
- **Railings.** `Kit.fence` builds a railing as one flat panel a stretch in the `Fences` group; the app draws its
  posts and rails.
- **Halos and lights.** `Kit.halo` puts four corners at a light's place in the `Halos` group; the app spreads them
  to face the eye and draws the light's glow. `Kit.light` notes where a coloured light falls on the ground, and
  the course file carries it (`lights`).
- **Baked shading.** What stands on the ground is darkened at its foot in its colours.
- **`pack_glb.py`** rewrites the exported vertex colours as bytes, a quarter of their size, and each mesh's positions as
  16-bit steps of its own box, a step a centimetre, put back by the mesh's node (KHR_mesh_quantization).
- **`meshopt_glb.mjs`** then writes the glb's buffers with the meshopt codec (Node, with the app's packages installed):
  a third of the download, and nothing in the file changed. Without Node the build leaves the glb as the packer
  wrote it.
- **`layout`.** Searching the layouts a seed can deal for one whose start and finish look out to sea can
  take minutes. The script prints the layout it chose, and the course file names it (`"layout": 48`) so
  the next build goes straight to it. Remove the line to search again after changing the seed.
- **The budget** (L2-166 AC12): the worst frame within 120,000 triangles and 140 draw calls, the file
  within 3 MB gzipped. `docs/screenshots/courses/README.md` gives the map's numbers.

A hand-modelled change made in the `.blend` is lost the next time the script runs. Until the
pipeline can keep one, change the script, or export the glb from Blender yourself and leave the
script alone.

## The rider

```
python tools/blender/rider.py
```

builds the course's rider (ADR 0045, L2-174 AC11) and writes `frontend/projects/ride/public/riders/rider.glb`
and `tools/blender/scenes/rider.blend`. The body is one watertight mesh on an armature of 19 bones; the feet are
held to the pedals and the hands to the hoods by inverse kinematics, and a turn of the cranks, seated and out of
the saddle, is baked to keyframes before the export. The bike's measurements at the top of the script are
`course-cyclist.ts`'s: change both together and rebuild, or the feet leave the pedals (the script fails if they
do).

The script, the scene and the glb are Telo Ride's (`wattzup` commit `b118c5ee6`), unchanged: the script's first
line names that repository's ADR 0036 and L2-166 AC26. It was not run again here.
