// The rider's shadow in the sun, drawn (L2-174 AC12). Each frame the rider's own figure is drawn once more, small
// and plain white on black, as the sun sees it; that picture is then laid on the road along the sun's rays, dark
// where the figure is, blurred more the further the shadow lies from what throws it. No shadow map: nothing is
// compared in depth and nothing but the road under the rider reads the picture. sun-shadow-frame.ts says which way
// the rays run and how deep the shade is.
import {
  mix,
  positionLocal,
  positionWorld,
  smoothstep,
  texture,
  uniform,
  userData,
  vec2,
  vec3,
} from 'three/tsl';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  CustomBlending,
  DoubleSide,
  DynamicDrawUsage,
  LinearFilter,
  LinearMipmapLinearFilter,
  MaxEquation,
  type Material,
  Mesh,
  MeshBasicNodeMaterial,
  MultiplyBlending,
  type Node,
  type Object3D,
  OneFactor,
  OrthographicCamera,
  RenderTarget,
  type Scene,
  Vector2,
  Vector3,
  type WebGPURenderer,
} from 'three/webgpu';
import type { Course, CourseLook, CoursePlace } from './course';
import { WHEELS } from './course-cyclist';
import type { ShadowDrawn } from './course-probe';
import {
  FIGURE_LAYER,
  NO_SHADOW,
  type ShadowSun,
  shadowReach,
  shadowShade,
  shadowSun,
} from './sun-shadow-frame';

/**
 * Where each part keeps how solid it is, from 0 to 1, and whether it is a wheel's side; and how much of the light
 * a wheel's turning spokes stop.
 */
const SOLID = 'shadowSolid';
const SPOKES = 'shadowSpokes';
const SPOKED = 0.08;
/** The picture of the figure: half its width and height in metres, and the height of its middle. */
const HALF = 1.1;
const MIDDLE = 0.8;
/**
 * The tallest a part's height is kept as, in metres, and how many texels across the picture is when it is read to
 * find that height: the same 7 cm of the figure to a texel at every step, whatever the picture's own size.
 */
const TALLEST = 2;
const ABOUT = 32;
/** The height of the rider's head on the bike, in metres: its shadow is the shadow's far end. */
const HEAD = 1.65;
/**
 * How far above the road the shadow lies, in metres: over everything painted on it (the centre lines are built 2 cm
 * above the asphalt, the effort chevrons, the grid and the finish's chequers 3 cm) and under the kerbs (5 cm).
 */
const LIFT = 0.036;
/** How many rows the strip on the road is laid in, each on the road's own height. */
const ROWS = 8;
/** How much deeper the shadow is drawn than the light's own arithmetic makes it (sun-shadow-frame.ts). */
const DEPTH = 4.5;
/** How much of the sky's tint the shadow takes, from 0, a grey shadow, to 1. */
const TINT = 0.45;
/** How bright the sky's light on the ground is counted as being, against the sun's own strength. */
const SKY = 1.5;
/** How much of the shadow's dark the sky's light has filled in by its far end. */
const FILLED = 0.2;
/** The blur at the wheels, in metres, and how much wider it grows for each metre the shadow lies from them. */
const SOFT = { near: 0.02, grows: 0.085 } as const;
/** The dark under the bike that the sky cannot reach: how far it spreads along the bike and across it, in metres. */
const UNDER = { long: 0.7, wide: 0.22, dark: 0.3 } as const;
/** The same under each tyre, and how far each axle is from the bike's middle. */
const TYRE = { long: 0.16, wide: 0.07, dark: 0.55 } as const;
const AXLE = 0.5;
/**
 * How the shadow is made at each of the course's five steps, cheapest first: the texels across the figure's
 * picture, how many times the road reads it for each of its points, and how many frames one picture serves.
 */
const STEPS = [
  { texels: 128, readings: 3, frames: 3 },
  { texels: 128, readings: 5, frames: 2 },
  { texels: 192, readings: 7, frames: 2 },
  { texels: 256, readings: 7, frames: 2 },
  { texels: 256, readings: 7, frames: 2 },
] as const;
/** The most readings a step takes: with fewer, the blur is narrower across the shadow. */
const MOST = 7;

/** A soft bump: 1 at 0, falling away over `width`. */
function bell(distance: Node<'float'>, width: number): Node<'float'> {
  return distance
    .mul(distance)
    .div(-width * width)
    .exp();
}

export class SunShadow {
  /** The shadow on the road. */
  readonly mesh: Mesh;
  private readonly sun: ShadowSun;
  private readonly shade: readonly number[];
  private readonly target: RenderTarget;
  private readonly eye = new OrthographicCamera(-HALF, HALF, HALF, -HALF, 0.1, 40);
  private readonly figure = new MeshBasicNodeMaterial({ color: 0xffffff, fog: false });
  private readonly black = new Color(0x000000);
  private readonly geometry: BufferGeometry;
  private readonly under: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  /** The road's material for each number of readings a step has asked for. */
  private readonly materials = new Map<number, MeshBasicNodeMaterial>();
  /** The middle of the picture in the map's axes, and its axes across and up. */
  private readonly middle = uniform(new Vector3());
  private readonly across = uniform(new Vector3());
  private readonly up = uniform(new Vector3());
  /** Where the rider is on the ground, and the way the bike points along it. */
  private readonly rider = uniform(new Vector2());
  private readonly forward = uniform(new Vector2());
  /** The road under the rider, in the map's axes. */
  private readonly road = uniform(new Vector3());
  /** The texels across the picture now. */
  private readonly texels = uniform(256);
  private readonly report: ShadowDrawn;
  private step: (typeof STEPS)[number] = STEPS[STEPS.length - 1]!;
  private figures = 0;
  /** What throws the shadow, and whether each thing in the scene was shown before the figure was drawn. */
  private readonly casters: Object3D[] = [];
  private readonly shown: boolean[] = [];
  private frame = 0;

  /**
   * `sun` is where the course file says the light comes from and `look` its colours; `tier` is the step of the
   * course's five it is drawn at; `report` is the test-only hook's record of the shadow.
   */
  constructor(
    sun: readonly [number, number, number],
    look: CourseLook,
    tier: number,
    report: ShadowDrawn,
  ) {
    this.sun = shadowSun(sun);
    const light = new Color(look.light.colour).multiplyScalar(look.light.intensity);
    const sky = new Color(look.fill[0]).multiplyScalar(SKY);
    const shade = shadowShade(
      [light.r, light.g, light.b],
      [sky.r, sky.g, sky.b],
      this.sun.altitude,
      DEPTH,
    );
    // Only part of the sky's tint is taken: a shadow as blue as the arithmetic makes it turns yellow paint green.
    const grey = (shade[0] + shade[1] + shade[2]) / 3;
    this.shade = shade.map((share) => grey + (share - grey) * TINT);
    this.report = report;
    this.report.reach = shadowReach(HEAD, this.sun.altitude);

    this.eye.layers.set(FIGURE_LAYER);
    this.target = new RenderTarget(256, 256, { depthBuffer: false });
    this.target.texture.generateMipmaps = true;
    this.target.texture.minFilter = LinearMipmapLinearFilter;
    this.target.texture.magFilter = LinearFilter;
    this.figure.depthTest = false;
    this.figure.depthWrite = false;
    // Each part is drawn as dark as it is solid, and where parts overlap the darker one stands.
    // Red is how solid; green is how high above the road the part stands, as a share of `TALLEST`, so the road can
    // tell how far the light has travelled from what throws a shadow to where it lands.
    // A wheel's side is solid at its rim and its hub and all but clear between: thin spokes, turning.
    const whole = userData(SOLID, 'float') as unknown as Node<'float'>;
    const spoked = userData(SPOKES, 'float') as unknown as Node<'float'>;
    const height = positionLocal.y.sub(WHEELS.axleHeight);
    const fromAxle = vec2(height, positionLocal.z.abs().sub(WHEELS.axle)).length();
    const side = smoothstep(WHEELS.rimFrom - 0.01, WHEELS.rimFrom, fromAxle)
      .max(smoothstep(WHEELS.hub + 0.004, WHEELS.hub, fromAxle))
      .max(SPOKED);
    const solid = mix(whole, side, spoked);
    const high = positionWorld.y.sub(this.road.y).div(TALLEST).clamp(0, 1);
    this.figure.colorNode = vec3(solid, solid.mul(high), 0);
    this.figure.blending = CustomBlending;
    this.figure.blendEquation = MaxEquation;
    this.figure.blendSrc = OneFactor;
    this.figure.blendDst = OneFactor;

    // A strip on the road, running away from the sun, in the map's own axes: its points are laid each frame.
    this.geometry = new BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array((ROWS + 1) * 2 * 3), 3).setUsage(DynamicDrawUsage),
    );
    const faces: number[] = [];
    for (let row = 0; row < ROWS; row++) {
      const a = row * 2;
      faces.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    this.geometry.setIndex(faces);
    this.mesh = new Mesh(this.geometry);
    this.mesh.matrixAutoUpdate = false;
    this.mesh.matrix.identity();
    this.mesh.frustumCulled = false;
    // Drawn before everything else that is see-through (the light beams, the halos, the confetti): the shadow
    // darkens the road, and whatever light hangs in the air between the road and the eye is added over it after.
    this.mesh.renderOrder = -1;
    this.detail(tier);
  }

  /** Makes the shadow as finely as the course's step `tier` allows (L2-177 AC3): call it when the step changes. */
  detail(tier: number): void {
    const step = STEPS[Math.min(Math.max(tier, 0), STEPS.length - 1)]!;
    this.step = step;
    if (this.target.width !== step.texels) this.target.setSize(step.texels, step.texels);
    this.texels.value = step.texels;
    let material = this.materials.get(step.readings);
    if (!material) {
      material = this.surface(step.readings);
      this.materials.set(step.readings, material);
    }
    this.mesh.material = material;
    // The next frame draws the figure afresh.
    this.frame = 0;
  }

  /** Marks what throws the shadow: every part of `rider`, which stands in the scene itself, that is drawn. */
  cast(rider: Object3D): void {
    this.casters.push(rider);
    rider.traverse((part) => {
      if (part.layers.mask === 0 || part.userData[NO_SHADOW]) return;
      part.layers.enable(FIGURE_LAYER);
      // A part drawn with holes in it (the wheels' spokes) lets most of the light through.
      const material = (part as Mesh).material as Material | Material[] | undefined;
      const holed = !!material && !Array.isArray(material) && material.alphaTest > 0;
      part.userData[SOLID] = 1;
      part.userData[SPOKES] = holed ? 1 : 0;
    });
  }

  /** Lays the shadow from the rider's place on the road, `metres` from the start line of `course`. */
  at(place: CoursePlace, metres: number, course: Course): void {
    const { sun } = this;
    const sin = Math.sin(sun.altitude);
    const cos = Math.cos(sun.altitude);
    // The picture looks down the sun's rays at the rider's middle.
    const cx = place.x;
    const cy = place.y + MIDDLE;
    const cz = place.z;
    this.eye.position.set(cx + sun.x * 20, cy + sun.y * 20, cz + sun.z * 20);
    this.eye.up.set(0, 1, 0);
    this.eye.lookAt(cx, cy, cz);
    this.eye.updateMatrixWorld();
    this.middle.value.set(cx, cy, cz);
    // Across the picture is level with the ground; up it leans back from the sun.
    this.across.value.set(-sun.awayZ, 0, sun.awayX);
    this.up.value.set(sun.awayX * sin, cos, sun.awayZ * sin);

    // The road the picture falls on: from just up-sun of the wheels to past the shadow of the head, as wide as
    // the picture. The road's slope there is the slope under the rider.
    const near = (MIDDLE * cos - HALF) / sin;
    const far = (MIDDLE * cos + HALF) / sin;
    const length = far - near;
    const forwardX = -Math.sin(place.heading);
    const forwardZ = -Math.cos(place.heading);
    this.rider.value.set(place.x, place.z);
    this.road.value.set(place.x, place.y, place.z);
    this.forward.value.set(forwardX, forwardZ);
    // The strip is laid row by row on the road's own profile, so it neither cuts into a dip nor floats over a
    // crest. The road is level from kerb to kerb, so a point's height is the centre line's that far up the road.
    const positions = this.geometry.getAttribute('position') as BufferAttribute;
    for (let row = 0; row <= ROWS; row++) {
      const along = near + (length * row) / ROWS;
      for (let side = 0; side < 2; side++) {
        const across = side === 0 ? -HALF : HALF;
        const dx = sun.awayX * along - sun.awayZ * across;
        const dz = sun.awayZ * along + sun.awayX * across;
        const height = course.place(metres + dx * forwardX + dz * forwardZ, 0, this.under).y;
        positions.setXYZ(row * 2 + side, place.x + dx, height + LIFT, place.z + dz);
      }
    }
    positions.needsUpdate = true;

    // Which way the square's long axis lies on the ground, against the sun's own line.
    const bx = positions.getX(ROWS * 2) - positions.getX(0);
    const bz = positions.getZ(ROWS * 2) - positions.getZ(0);
    this.report.off =
      (Math.atan2(bx * sun.awayZ - bz * sun.awayX, bx * sun.awayX + bz * sun.awayZ) * 180) /
      Math.PI;
  }

  /**
   * Draws the rider's figure as the sun sees it: call it once the rider is posed, before the frame is drawn. At
   * every step one picture serves two frames, and three at the lowest: the legs' shadow is a frame or two behind the
   * legs, which no eye can tell, and the rider is drawn twice in only half the frames.
   */
  draw(renderer: WebGPURenderer, scene: Scene): void {
    if (this.frame++ % this.step.frames !== 0) return;
    const background = scene.background;
    const before = renderer.getRenderTarget();
    // Nothing but the rider is in the picture: the map's hundreds of chunks are not even walked for it.
    const { children } = scene;
    for (let i = 0; i < children.length; i++) {
      const child = children[i]!;
      this.shown[i] = child.visible;
      if (!this.casters.includes(child)) child.visible = false;
    }
    scene.background = this.black;
    scene.overrideMaterial = this.figure;
    // The rider was placed and posed for this frame already (the batch of their moving parts saw to it): the
    // whole scene's places are not worked out a second time for a picture of one rider.
    const places = scene.matrixWorldAutoUpdate;
    scene.matrixWorldAutoUpdate = false;
    renderer.setRenderTarget(this.target);
    renderer.render(scene, this.eye);
    renderer.setRenderTarget(before);
    scene.overrideMaterial = null;
    scene.background = background;
    scene.matrixWorldAutoUpdate = places;
    for (let i = 0; i < children.length; i++) children[i]!.visible = this.shown[i]!;
    this.report.figures = ++this.figures;
  }

  dispose(): void {
    this.target.dispose();
    this.geometry.dispose();
    for (const material of this.materials.values()) material.dispose();
    this.materials.clear();
    this.casters.length = 0;
    this.figure.dispose();
  }

  /** The material the road's square is drawn with, reading the figure's picture `readings` times a point. */
  private surface(readings: number): MeshBasicNodeMaterial {
    const material = new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      blending: MultiplyBlending,
      premultipliedAlpha: true,
      side: DoubleSide,
    });
    // Where a point of the road falls in the picture: along the picture's own axes from its middle.
    const from = positionWorld.sub(this.middle);
    const at = vec2(from.dot(this.across), from.dot(this.up));
    // How far the shadow lies here from what throws it: the picture's height is the distance along the ground.
    const { altitude } = this.sun;
    const along = at.y
      .add(MIDDLE * Math.cos(altitude))
      .div(Math.sin(altitude))
      .max(0);
    // A picture the renderer drew is kept top row first, on both backends: up the figure is down the picture.
    const place = vec2(at.x.div(2 * HALF).add(0.5), at.y.div(-2 * HALF).add(0.5));
    // The blur's reach on the road, in metres, the same along the shadow as across it. The picture is the road
    // seen along the sun's rays, so a metre along the shadow is only `sin(altitude)` of a metre up the picture: the
    // picture is read at the fineness of the short way, and several readings side by side make up the long way.
    // A shadow is as soft as what throws it is far away. A coarse reading of the picture says how high the figure
    // stands hereabouts, and that height is thrown `1 / tan(altitude)` as far along the road: a tyre's shadow stays
    // sharp even when the wheel stands a metre down-sun of the bike's middle, and the head's is the softest.
    // Read twice: finely, which is right where the figure itself is (a tyre's foot is low, so its shadow is
    // sharp there), and coarsely, which still knows the height just outside the figure's edge, where the fine
    // reading sees nothing and the blur has yet to spread the shadow.
    const coarse = texture(this.target.texture, place).level(this.texels.div(ABOUT).log2());
    const fine = texture(this.target.texture, place).level(this.texels.div(ABOUT * 4).log2());
    const height = mix(
      coarse.g.div(coarse.r.max(0.02)),
      fine.g.div(fine.r.max(0.02)),
      smoothstep(0.05, 0.4, fine.r),
    );
    const thrownFrom = height.mul(TALLEST / Math.tan(altitude));
    const soft = thrownFrom.mul(SOFT.grows).add(SOFT.near);
    const softUp = soft.mul(Math.sin(altitude));
    const level = softUp
      .mul(this.texels.div(2 * HALF))
      .max(1)
      .log2();
    // Fewer readings cannot span the whole blur without gaps between them, and reading a coarser picture to fill
    // the gaps smears the bike into a smudge: they stand as close as the full count does, and the shadow is a
    // little sharper across than it should be at the cheaper steps instead.
    const reach = vec2(soft.mul(readings / MOST).div(2 * HALF), softUp.div(2 * HALF));
    // The readings run across the shadow, each a little up or down, and those nearest the middle count for most.
    const taps = Array.from({ length: readings }, (_, i) => {
      const x = readings > 1 ? (i / (readings - 1)) * 2 - 1 : 0;
      return [x, x === 0 ? 0 : i % 2 ? -0.35 : 0.35, Math.exp(-2 * x * x)] as const;
    });
    const whole = taps.reduce((sum, [, , weight]) => sum + weight, 0);
    let dark: Node<'float'> | null = null;
    for (const [x, y, weight] of taps) {
      const read = texture(this.target.texture, place.add(vec2(x, y).mul(reach)))
        .level(level)
        .r.mul(weight / whole);
      dark = dark ? dark.add(read) : read;
    }
    // The sky's light fills a shadow in more the further it lies from what throws it: the head's is the faintest.
    const filled = smoothstep(0, shadowReach(HEAD, altitude) * 1.15, along)
      .mul(FILLED)
      .oneMinus();
    const thrown = dark!.mul(filled);
    // Under the bike the road is dark whatever the sun does: the sky cannot see it past the rider, least of all
    // where each tyre meets it. Measured along the bike and across it.
    const under = positionWorld.xz.sub(this.rider);
    const bikeAlong = under.dot(this.forward);
    const bikeAcross = under.dot(vec2(this.forward.y.negate(), this.forward.x));
    let hidden: Node<'float'> = bell(bikeAlong, UNDER.long)
      .mul(bell(bikeAcross, UNDER.wide))
      .mul(UNDER.dark);
    for (const axle of [AXLE, -AXLE]) {
      hidden = hidden.add(
        bell(bikeAlong.sub(axle), TYRE.long).mul(bell(bikeAcross, TYRE.wide)).mul(TYRE.dark),
      );
    }
    // The road's own colour is kept and darkened: the paint under a shadow is still paint. The sun's shadow leaves
    // the sky's share of the light, in the sky's colour; what the sky cannot see is simply darker.
    const [red, green, blue] = this.shade as [number, number, number];
    material.colorNode = mix(vec3(1, 1, 1), vec3(red, green, blue), thrown).mul(
      hidden.min(1).oneMinus(),
    );
    return material;
  }
}
