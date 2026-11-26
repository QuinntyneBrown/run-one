import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';

/** A plan's segment as the course's file writes it. */
export interface CourseSegment {
  readonly kind: 'warm-up' | 'work' | 'recover' | 'cool-down';
  readonly duration: number;
  readonly level: number;
  readonly cadenceAim: number;
}

/**
 * The file Ibiza Sunset Strip was built from (`tools/blender/courses/ibiza.json`), read as it is: the class's plan is
 * expected from here, so the app's plan and the course's are held to agree to the second (L2-080, L2-174 AC3).
 */
const course = JSON.parse(
  readFileSync(join(__dirname, '../../../tools/blender/courses/ibiza.json'), 'utf8'),
) as {
  readonly class: {
    readonly id: string;
    readonly videoId: string;
    readonly syncOffsetSeconds: number;
  };
  readonly plan: { readonly segments: readonly CourseSegment[] };
};

/** Intervals to the Beat, the one class (L2-080 AC1), with the plan of the course's file. */
export const theClass = {
  id: 'intervals-to-the-beat',
  title: 'Intervals to the Beat',
  channel: 'GCN Training',
  summary:
    'Seventeen efforts from 15 seconds to 1:15, ridden to the beat, with five fast sprints to finish.',
  lengthSeconds: 1200,
  video: { videoId: course.class.videoId, syncOffsetSeconds: course.class.syncOffsetSeconds },
  segments: course.plan.segments,
} as const;

/** Metres a turn of the pedals covers on the course (L2-174 AC3). */
const METRES_A_TURN = 5;

/**
 * Metres from the grid where the plan puts a rider at `seconds` of the ride clock (L2-174 AC2, AC3): each segment's
 * stretch is as long as its seconds × its cadence aim in turns a second × 5 m, and is ridden evenly over the segment.
 */
export function planMetres(seconds: number): number {
  let metres = 0;
  let start = 0;
  for (const segment of theClass.segments) {
    const pace = (segment.cadenceAim / 60) * METRES_A_TURN;
    const ridden = Math.min(Math.max(seconds - start, 0), segment.duration);
    metres += ridden * pace;
    start += segment.duration;
  }
  return metres;
}

/**
 * The class's data as the build ships it, broken on its way to the browser: the plan's two segments at level 24 arrive
 * at level 33, which no bike has (L2-080 AC3). The app is the production build, so the only way to hand it a class
 * that breaks a rule is to change the script that carries it. `mend` lets the script through again.
 */
export class ShippedClassData {
  private broke = 0;

  private constructor(private readonly page: Page) {}

  static async break(page: Page): Promise<ShippedClassData> {
    const data = new ShippedClassData(page);
    await page.route('**/*.js', async (route) => {
      const response = await route.fetch();
      const script = await response.text();
      if (!script.includes(theClass.id)) return route.fulfill({ response });
      const broken = script.replaceAll('level:24', 'level:33');
      if (broken !== script) data.broke += 1;
      await route.fulfill({ response, body: broken });
    });
    return data;
  }

  /** How many scripts carrying the class were changed; none means the fixture no longer finds the plan. */
  brokenScripts(): number {
    return this.broke;
  }

  async mend(): Promise<void> {
    await this.page.unroute('**/*.js');
  }
}
