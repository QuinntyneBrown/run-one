import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { COURSE_RENDERER, type CourseFrame, type CourseRenderer } from '@telo/api';
import { CourseScene } from './course-scene';

/** A fake requestAnimationFrame clock: `refresh(ms)` runs one display refresh `ms` later. */
function fakeFrames() {
  let now = 0;
  let next = 0;
  let queue = new Map<number, FrameRequestCallback>();
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queue.set(++next, cb);
    return next;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => queue.delete(id));
  return {
    refresh(ms: number, times = 1) {
      for (let i = 0; i < times; i++) {
        now += ms;
        const due = queue;
        queue = new Map();
        for (const cb of due.values()) cb(now);
      }
    },
  };
}

/** A fake `matchMedia` whose `(resolution: …)` queries can be told the screen changed. */
function fakeScreens() {
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', (query: string) => {
    const watched = query.includes('resolution') ? listeners : new Set<() => void>();
    return {
      media: query,
      matches: false,
      addEventListener: (_: string, listener: () => void) => watched.add(listener),
      removeEventListener: (_: string, listener: () => void) => watched.delete(listener),
    };
  });
  return {
    move: () => [...listeners].forEach((listener) => listener()),
    listening: () => listeners.size,
  };
}

/** Records what the scene asks of its renderer, in order; draws are counted, not listed. */
class FakeRenderer implements CourseRenderer {
  readonly backend = 'webgl2' as const;
  readonly calls: string[] = [];
  draws = 0;
  /** Whether the last frame drawn was still. */
  reducedMotion: boolean | null = null;
  /** The seconds each frame placed the rider by. */
  readonly times: number[] = [];
  start(): Promise<boolean> {
    this.calls.push('start');
    return Promise.resolve(true);
  }
  resize(): void {
    /* not needed */
  }
  draw(frame: CourseFrame): void {
    this.draws++;
    this.reducedMotion = frame.reducedMotion;
    this.times.push(frame.time);
  }
  setFramePeriod(ms: number): void {
    this.calls.push(`period ${ms.toFixed(1)}`);
  }
  pauseBudget(): void {
    this.calls.push('pause');
  }
  dispose(): void {
    this.calls.push('dispose');
  }
}

const settle = async (fixture: { whenStable(): Promise<unknown> }) => {
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve));
};

/** A scene on a display of `ms` per frame, its period measured and its ride running. */
async function ridingScene(ms: number) {
  const frames = fakeFrames();
  const screens = fakeScreens();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {
        /* not needed */
      }
      disconnect() {
        /* not needed */
      }
    },
  );
  const renderer = new FakeRenderer();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: COURSE_RENDERER, useValue: () => Promise.resolve(renderer) },
    ],
  });
  const fixture = TestBed.createComponent(CourseScene);
  fixture.componentRef.setInput('label', 'Ibiza Sunset Strip');
  fixture.componentRef.setInput('segments', []);
  fixture.componentRef.setInput('elapsed', 0);
  fixture.componentRef.setInput('speedKmh', null);
  fixture.componentRef.setInput('running', false);
  fixture.detectChanges();
  await settle(fixture);
  const before = [...renderer.calls];
  frames.refresh(ms, 31);
  await settle(fixture);
  fixture.componentRef.setInput('running', true);
  await settle(fixture);
  return { fixture, frames, screens, renderer, before };
}

describe('CourseScene reduced motion (L2-142)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('follows this device until the rider chooses, then the rider’s choice', async () => {
    const { fixture, frames, renderer } = await ridingScene(1000 / 60);
    frames.refresh(1000 / 60);
    await settle(fixture);
    expect(renderer.reducedMotion).toBe(false);

    fixture.componentRef.setInput('reducedMotion', true);
    await settle(fixture);
    frames.refresh(1000 / 60);
    await settle(fixture);
    expect(renderer.reducedMotion).toBe(true);

    fixture.componentRef.setInput('reducedMotion', false);
    await settle(fixture);
    frames.refresh(1000 / 60);
    await settle(fixture);
    expect(renderer.reducedMotion).toBe(false);
  });
});

describe('CourseScene frame period (L2-177 AC3)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('measures the display before the scene starts, then hands the renderer the period', async () => {
    const { renderer, before } = await ridingScene(1000 / 30);
    expect(before).toEqual([]);
    expect(renderer.calls).toEqual(['start', 'period 33.3']);
  });

  it('measures again when the tab returns, holding the picture while it does', async () => {
    const { fixture, frames, renderer } = await ridingScene(1000 / 60);
    frames.refresh(1000 / 60, 5);
    await settle(fixture);
    expect(renderer.draws).toBeGreaterThan(0);

    document.dispatchEvent(new Event('visibilitychange'));
    await settle(fixture);
    const held = renderer.draws;
    frames.refresh(1000 / 30, 30);
    await settle(fixture);
    expect(renderer.draws).toBe(held);
    expect(renderer.calls).toEqual(['start', 'period 16.7', 'pause']);

    frames.refresh(1000 / 30);
    await settle(fixture);
    expect(renderer.calls).toEqual(['start', 'period 16.7', 'pause', 'period 33.3']);
    frames.refresh(1000 / 30, 3);
    await settle(fixture);
    expect(renderer.draws).toBeGreaterThan(held);
  });

  it('draws no frame for a change of input while the tab is hidden (L2-174 AC9)', async () => {
    const { fixture, renderer } = await ridingScene(1000 / 60);
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    await settle(fixture);
    const held = renderer.draws;

    fixture.componentRef.setInput('elapsed', 7);
    await settle(fixture);

    expect(renderer.draws).toBe(held);
    hidden.mockRestore();
  });

  it('measures again when the window moves to another screen', async () => {
    const { fixture, frames, screens, renderer } = await ridingScene(1000 / 60);
    expect(screens.listening()).toBe(1);

    screens.move();
    await settle(fixture);
    frames.refresh(1000 / 144, 31);
    await settle(fixture);

    expect(renderer.calls).toEqual(['start', 'period 16.7', 'pause', 'period 6.9']);
    expect(screens.listening()).toBe(1);
  });
});

describe('CourseScene while the course loads (L2-175 AC1, AC3)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the canvas unseen and unnamed until the first frame is drawn, where the clock has got to', async () => {
    const frames = fakeFrames();
    fakeScreens();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {
          /* not needed */
        }
        disconnect() {
          /* not needed */
        }
      },
    );
    let started: (ok: boolean) => void = () => undefined;
    const renderer = new FakeRenderer();
    renderer.start = () => new Promise<boolean>((resolve) => (started = resolve));
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: COURSE_RENDERER, useValue: () => Promise.resolve(renderer) },
      ],
    });
    const fixture = TestBed.createComponent(CourseScene);
    fixture.componentRef.setInput('label', 'Ibiza Sunset Strip');
    fixture.componentRef.setInput('segments', []);
    fixture.componentRef.setInput('elapsed', 0);
    fixture.componentRef.setInput('speedKmh', null);
    fixture.componentRef.setInput('running', true);
    const drawn: string[] = [];
    fixture.componentInstance.drawn.subscribe((backend) => drawn.push(backend));
    fixture.detectChanges();
    await settle(fixture);
    frames.refresh(1000 / 60, 31);
    await settle(fixture);
    const canvas = (fixture.nativeElement as HTMLElement).querySelector('canvas')!;
    // The load's frames are drawn from the grid: the rider never sees them.
    expect(canvas.classList).toContain('course-scene--busy');
    expect(canvas.getAttribute('aria-hidden')).toBe('true');
    expect(canvas.getAttribute('role')).toBe('img');
    expect(drawn).toEqual([]);

    // The ride has run 45 seconds by the time the course is ready.
    fixture.componentRef.setInput('elapsed', 45);
    started(true);
    await settle(fixture);
    fixture.detectChanges();
    expect(renderer.times[0]).toBe(45);
    expect(canvas.classList).not.toContain('course-scene--busy');
    expect(canvas.getAttribute('aria-hidden')).toBeNull();
    expect(canvas.getAttribute('aria-label')).toBe('Ibiza Sunset Strip');
    expect(drawn).toEqual(['webgl2']);
  });
});

describe('CourseScene start and leave (L2-174 AC8)', () => {
  afterEach(() => vi.unstubAllGlobals());

  /** A scene whose renderer starts with `started`, its display measured. */
  async function scene(
    renderer: FakeRenderer,
    load = () => Promise.resolve<CourseRenderer>(renderer),
  ) {
    const frames = fakeFrames();
    fakeScreens();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {
          /* not needed */
        }
        disconnect() {
          /* not needed */
        }
      },
    );
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: COURSE_RENDERER, useValue: load }],
    });
    const fixture = TestBed.createComponent(CourseScene);
    fixture.componentRef.setInput('label', 'Ibiza Sunset Strip');
    fixture.componentRef.setInput('segments', []);
    fixture.componentRef.setInput('elapsed', 0);
    fixture.componentRef.setInput('speedKmh', null);
    fixture.componentRef.setInput('running', false);
    const started: string[] = [];
    let unavailable = 0;
    fixture.componentInstance.drawn.subscribe((backend) => started.push(backend));
    fixture.componentInstance.unavailable.subscribe(() => unavailable++);
    fixture.detectChanges();
    await settle(fixture);
    frames.refresh(1000 / 60, 31);
    await settle(fixture);
    // The first frame is drawn by the scene's effect, on its next render.
    fixture.detectChanges();
    await settle(fixture);
    return { fixture, started, unavailable: () => unavailable };
  }

  it('emits the GPU API drawing the course once its first frame is drawn', async () => {
    const { started, unavailable } = await scene(new FakeRenderer());
    expect(started).toEqual(['webgl2']);
    expect(unavailable()).toBe(0);
  });

  it('emits unavailable and releases the renderer when neither backend starts', async () => {
    const renderer = new FakeRenderer();
    renderer.start = () => Promise.resolve(false);
    const { started, unavailable } = await scene(renderer);
    expect(unavailable()).toBe(1);
    expect(started).toEqual([]);
    expect(renderer.calls).toEqual(['dispose']);
  });

  // A lost graphics context that does not come back means the course cannot be drawn (L2-175 AC2).
  describe('a lost graphics context', () => {
    afterEach(() => vi.useRealTimers());

    it('emits unavailable, hides the canvas and releases the renderer when it does not come back', async () => {
      const renderer = new FakeRenderer();
      const { fixture, unavailable } = await scene(renderer);
      const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
      vi.useFakeTimers();

      const lost = new Event('webglcontextlost', { cancelable: true });
      canvas.dispatchEvent(lost);
      expect(lost.defaultPrevented).toBe(true);
      vi.advanceTimersByTime(2_999);
      expect(unavailable()).toBe(0);
      vi.advanceTimersByTime(1);

      expect(unavailable()).toBe(1);
      expect(renderer.calls.filter((call) => call === 'dispose')).toHaveLength(1);
      fixture.detectChanges();
      expect(canvas.getAttribute('aria-hidden')).toBe('true');
      // Said once, and the renderer is not released again when the scene goes.
      fixture.destroy();
      expect(unavailable()).toBe(1);
      expect(renderer.calls.filter((call) => call === 'dispose')).toHaveLength(1);
    });

    it('carries on when the context comes back in time', async () => {
      const renderer = new FakeRenderer();
      const { fixture, unavailable } = await scene(renderer);
      const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
      vi.useFakeTimers();

      canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
      vi.advanceTimersByTime(1_000);
      canvas.dispatchEvent(new Event('webglcontextrestored'));
      vi.advanceTimersByTime(10_000);

      expect(unavailable()).toBe(0);
      expect(renderer.calls).not.toContain('dispose');
    });
  });

  it('releases the renderer when the scene is destroyed', async () => {
    const renderer = new FakeRenderer();
    const { fixture } = await scene(renderer);
    fixture.destroy();
    expect(renderer.calls).toEqual(['start', 'period 16.7', 'dispose']);
  });

  it('releases a renderer that loads after the scene was destroyed', async () => {
    const renderer = new FakeRenderer();
    let loaded: (r: CourseRenderer) => void = () => undefined;
    const { fixture } = await scene(renderer, () => new Promise((resolve) => (loaded = resolve)));
    fixture.destroy();
    loaded(renderer);
    await new Promise((resolve) => setTimeout(resolve));
    expect(renderer.calls).toEqual(['start', 'period 16.7', 'dispose']);
  });
});
