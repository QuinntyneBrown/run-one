import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Button } from '../button/button';
import { entriesLine } from './entries-line';

/** What the dialog says of the last note, screen capture or save, and whether it reads as a warning. */
export interface DiagnosticStatus {
  readonly text: string;
  readonly tone: 'ok' | 'warn';
}

/** The longest note (L2-178 AC12). */
export const NOTE_MAX_LENGTH = 200;

/**
 * What the "Diagnostic recording" dialog holds (design-system block diagnostic-panel; L2-178 AC11 to AC16): how many
 * entries the recording has, the note of what the bike's own display reads, Capture screen, what the saved files
 * hold, Save files and Close. It records, captures and saves nothing itself: it emits, and the page that opened the
 * dialog does.
 */
@Component({
  selector: 'wz-diagnostic-panel',
  imports: [Button],
  templateUrl: './diagnostic-panel.html',
  styleUrl: './diagnostic-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosticPanel {
  /** How many entries the recording holds. */
  readonly entries = input.required<number>();
  /** How many of the oldest entries went at the recording's limit. */
  readonly dropped = input(0);
  /** When the recording started, as the dialog shows it ("18:00"). */
  readonly since = input.required<string>();
  /** Whether this browser can capture the screen; Capture screen is off where it cannot (AC14). */
  readonly canCapture = input(true);
  /** What to say of the last note, capture or save; `null` says nothing. */
  readonly status = input<DiagnosticStatus | null>(null);

  /** The note the person typed and added. */
  readonly note = output<string>();
  readonly capture = output<void>();
  readonly save = output<void>();
  readonly closed = output<void>();

  protected readonly maxLength = NOTE_MAX_LENGTH;
  protected readonly draft = signal('');
  protected readonly count = computed(() =>
    entriesLine(this.entries(), this.dropped(), this.since()),
  );

  protected type(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }

  protected add(event: Event): void {
    event.preventDefault();
    const text = this.draft().trim();
    if (text === '') return;
    this.note.emit(text);
    this.draft.set('');
  }
}
