# 0023. World Ride bends the road in the vertex stage

- **Status:** Accepted
- **Date:** 2026-11-20
- **Amends:** [0021](0021-webgpu-renderer-with-webgl2-fallback.md)

## Context

L2-101 criterion 6 and L2-110 criterion 9 make the road in every World Ride scene bend left and
right, and everything laid along it follow: kerbs and ribbons, roadside lamps and posts, each
scene's props and crowds, the ground, terrain and mist, the pacers, the arch and the camera.

The 192 scenes are built from over 80 street modules (`core/world-*.ts`, some over 7,000 lines),
the shared kit and the renderer's own parts. Every one of them places what it draws at `x` across a straight road and `-metres` along
it, and lays ribbons, terrain and instanced crowds as geometry along `-z`. Bending them at the
source would mean rewriting each module by hand, and every new scene would have to repeat it.

Three ways were weighed:

1. **Bend on the CPU at the source.** Give `RoadPoint` and `StreetPoint` an offset and a heading
   and convert every module's placement. Exact, but touches every module and every new one,
   bends instanced meshes only per instance, and costs CPU time on every vertex of every ribbon.
2. **A curved-world shear.** Shift each vertex sideways by the road's offset at its distance.
   Cheap and never folds, but cannot turn the road beyond about 45°, narrows it in a bend and
   leans buildings: no hairpin reads as one.
3. **Bend in the vertex stage.** Leave the modules laying a straight road, and move every
   vertex onto the bending road in the materials' vertex stage, from a small array of samples of
   the road's centre line and heading filled once a frame.

## Decision

- The road is bent **in the vertex stage**, by one TSL `positionNode` (`core/world-bend.ts`) set
  on every material of the scene except the sky and the photographed distance. It works on the
  vertex's world position after instancing, so the street modules, the kit's `Ribbons`, `Crowd`,
  mist and terrain, the pacers, You and the arch all follow without a change of their own.
- The rule is **pure code** (`core/scene-bend.ts`): `heading`, `bendAhead` (128 samples of
  centre, heading and curvature from 40 m behind to 468 m ahead) and `bendPoint`, which the
  vertex stage follows line for line. Unit tests prove it per scene; the lamps and the camera use
  it on the CPU.
- The road under the rider always points down the view, and the bend is turned from the heading
  under the rider. Points on the inside of a bend are eased towards its centre and never reach
  it, so nothing folds over the road.
- Bent meshes are drawn without frustum culling, because their bounding spheres are those of the
  straight road.
- Normals are not turned: shading on a bend is that of the straight road. A `normalNode` would
  override each material's normal map.

## Consequences

- Every existing and future scene bends with no per-scene code; a scene sets only its `bend`
  and `bend length` in `worlds.ts`.
- The cost per vertex is a few arithmetic steps and two array reads on both backends and at
  every tier, and one 2 KB upload a frame (L2-111 criterion 8). Turning off frustum culling adds
  the draws of meshes outside the view.
- A material made after the scene starts must take the bend's `positionNode` too; the renderer
  does so for the materials it makes (the arch label).
- Facades on a tight bend are lit as if the road ran straight. Shadows are cast and received on
  the bent geometry, because Three's shadow pass uses the same `positionNode`.
- Two roads of the same scene can overlap in view only if the heading turned by more than about
  120° within the drawn road; L2-101 keeps `bend` at or under 60°, so it never does.
