import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { DIAGNOSTIC_RECORDING, FILE_SAVER, SCREEN_CAPTURE, ScreenCaptureError } from '@telo/api';
import {
  DiagnosticMark,
  type DiagnosticMarkScreen,
  DiagnosticPanel,
  type DiagnosticStatus,
} from '@telo/components/diagnostics';
import {
  CAPTURE_NOT_KEPT,
  FILES_NOT_SAVED,
  NOTE_ADDED,
  captureKept,
  filesSaved,
  screenAt,
} from './diagnostic-words';

/**
 * The diagnostic recording's controls (docs/mocks/dialogs/diagnostic-recording/, L2-178 AC11): the recording mark,
 * fixed at the foot of every screen, and the "Diagnostic recording" dialog it opens. The dialog is the platform's
 * `<dialog>` element opened with `showModal()`, not the CDK's (ADR 0048): the browser keeps focus in it, closes it on
 * Escape and returns focus to the mark. It is mounted only when the app is opened with `?diagnose`. It adds the
 * person's note to the recording, takes a screen capture with the dialog out of the way, and saves the files; the
 * ride behind it is never touched.
 */
@Component({
  selector: 'wz-diagnostics-host',
  imports: [DiagnosticMark, DiagnosticPanel],
  templateUrl: './diagnostics-host.html',
  styleUrl: './diagnostics-host.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosticsHost {
  protected readonly recording = inject(DIAGNOSTIC_RECORDING);
  protected readonly screenCapture = inject(SCREEN_CAPTURE);
  private readonly saver = inject(FILE_SAVER);
  private readonly router = inject(Router);
  private readonly view = inject(DOCUMENT).defaultView;
  private destroyed = false;

  /** Whether the dialog is open; its content is drawn only then. */
  protected readonly open = signal(false);
  /** Whether a screen capture is being taken: the dialog is closed and the mark reads "Capturing…". */
  protected readonly capturing = signal(false);
  protected readonly status = signal<DiagnosticStatus | null>(null);
  /** The screen the mark is on, where that screen keeps its foot for something else. */
  protected readonly screen = signal<DiagnosticMarkScreen | null>(screenAt(this.router.url));
  /** When the recording started, as the dialog's first line says it. */
  protected readonly since = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(this.recording.startedAt);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) this.screen.set(screenAt(event.urlAfterRedirects));
    });
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
  }

  protected show(dialog: HTMLDialogElement): void {
    if (this.capturing() || dialog.open) return;
    this.status.set(null);
    this.open.set(true);
    dialog.showModal();
  }

  /** What the bike's own display reads, as the person typed it, into the recording (AC12). */
  protected addNote(text: string): void {
    this.recording.note(text);
    this.status.set(NOTE_ADDED);
  }

  /**
   * One still picture of the tab (AC13). The dialog closes first, so the picture shows the screen and not the dialog,
   * and opens again to say what happened. A refusal or a failure keeps nothing and says so (AC14); the ride is not
   * touched either way.
   */
  protected async capture(dialog: HTMLDialogElement): Promise<void> {
    dialog.close();
    this.capturing.set(true);
    let said: DiagnosticStatus;
    try {
      // Two frames, so the dialog is off the screen before the browser is asked to share it.
      await this.nextFrame();
      await this.nextFrame();
      const number = this.recording.keepCapture(await this.screenCapture.capture());
      said = captureKept(number);
    } catch (error) {
      // A capture error's message is the browser's own error, as text.
      if (error instanceof ScreenCaptureError)
        this.recording.captureFailed(error.code, error.message);
      else this.recording.captureFailed('failed', error);
      said = CAPTURE_NOT_KEPT;
    }
    this.capturing.set(false);
    if (this.destroyed) return;
    this.open.set(true);
    dialog.showModal();
    this.status.set(said);
  }

  /** Saves the recording, then each screen capture, as files the browser downloads (AC15). */
  protected save(): void {
    const files = this.recording.files();
    try {
      for (const file of files) this.saver.save(file);
    } catch {
      this.status.set(FILES_NOT_SAVED);
      return;
    }
    this.status.set(filesSaved(files.length));
  }

  private nextFrame(): Promise<void> {
    return new Promise((resolve) =>
      this.view ? this.view.requestAnimationFrame(() => resolve()) : resolve(),
    );
  }
}
