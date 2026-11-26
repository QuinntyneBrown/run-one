// Ibiza Sunset Strip's files as the app serves them: the course's model and centre line (`/courses/ibiza.glb`,
// `/courses/ibiza.course.json`) and its rider (`/riders/rider.glb`, ADR 0045). A spec watches when they are asked for
// and can hold them, so Class Ride can be seen while the course is still loading (L2-175 AC1) without drawing it.
import type { Page, Request, Route } from '@playwright/test';

/** The three files a ride in Ibiza fetches when it starts (L2-175 AC1). */
export const COURSE_FILES = [
  '/courses/ibiza.course.json',
  '/courses/ibiza.glb',
  '/riders/rider.glb',
] as const;

export class CourseFiles {
  /** Every request the page made for the course's files, in order. */
  readonly requests: Request[] = [];
  private held: Route[] = [];
  private holding: ((path: string) => boolean) | null = null;
  private edit: ((course: Record<string, unknown>) => void) | null = null;
  private refused = new Set<string>();

  /** Watches the course's files from now on, answered by the app's own server unless the spec holds them. */
  static async install(page: Page): Promise<CourseFiles> {
    const files = new CourseFiles();
    await page.route('**/courses/ibiza.*', (route) => files.answer(route));
    await page.route('**/riders/rider.glb', (route) => files.answer(route));
    return files;
  }

  /** The paths asked for so far, in order. */
  paths(): string[] {
    return this.requests.map((request) => new URL(request.url()).pathname);
  }

  /** The origins the files were asked of: the app's own, and no other (L2-175 AC1). */
  origins(): string[] {
    return [...new Set(this.requests.map((request) => new URL(request.url()).origin))];
  }

  /** Holds every request for the course's files, or only those whose path `only` picks, until `release`. */
  hold(only: (path: string) => boolean = () => true): void {
    this.holding = only;
  }

  /** Serves the course's centre-line file with `change` applied to what the app's own server sent (L2-175 AC6). */
  alter(change: (course: Record<string, unknown>) => void): void {
    this.edit = change;
  }

  /** Answers every request for `path` with a 404, as a host that does not have the file would (L2-175 AC2). */
  refuse(path: string): void {
    this.refused.add(path);
  }

  /** Answers the held requests and every one after. */
  async release(): Promise<void> {
    this.holding = null;
    const held = this.held;
    this.held = [];
    for (const route of held) await route.continue();
  }

  private async answer(route: Route): Promise<void> {
    this.requests.push(route.request());
    if (this.holding?.(new URL(route.request().url()).pathname)) {
      this.held.push(route);
      return;
    }
    if (this.refused.has(new URL(route.request().url()).pathname)) {
      await route.fulfill({ status: 404, body: 'Not found' });
      return;
    }
    if (this.edit && new URL(route.request().url()).pathname === '/courses/ibiza.course.json') {
      const response = await route.fetch();
      const course = (await response.json()) as Record<string, unknown>;
      this.edit(course);
      await route.fulfill({ response, json: course });
      return;
    }
    await route.continue();
  }

  /** Lets go of any request still held, so the page's teardown does not wait on it. */
  async dispose(): Promise<void> {
    const held = this.held;
    this.held = [];
    for (const route of held) await route.abort().catch(() => undefined);
  }
}
