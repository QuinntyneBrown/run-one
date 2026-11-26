import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import {
  type BikeKind,
  type BikeLinkTap,
  type CapturedScreen,
  type DiagnosticRecording,
  MONOTONIC_TIME,
  type ReceivedHow,
  type RecordingFile,
  type ScreenCaptureErrorCode,
  type ShownReadouts,
  type WriteSettled,
} from '@telo/api';
import { describeError } from '../../bluetooth/describe-error';
import { toHex } from '../../protocol/echelon-protocol';
import { redact } from '../console-app-logger';
import { readAnswer, readFrame } from './frame-reading';
import { RECORDING_LIMITS, RecordingBuffer } from './recording-buffer';
import {
  type EntryKind,
  ascii,
  captureFileName,
  entryLine,
  quote,
  recordingFileName,
  recordingHeader,
} from './recording-format';

/** A readout as an entry holds it: the screen's "—" is written "-", so the file stays ASCII. */
const shown = (value: string): string => quote(value.replace(/—/g, '-'));

/**
 * The diagnostic recording (L2-178; docs/detailed-designs/security/record-diagnostics): the tap on the Bluetooth
 * link and the recording it fills. Every entry is formatted to its line when it is made and kept in a ring with a
 * fixed limit, so nothing grows with the ride (AC9). Times come from the monotonic clock, counted from the moment the
 * recording started (AC10). It writes nothing to the console (L2-115 AC2) and sends nothing anywhere: `files()` is
 * the only way out. Provided only when the app is opened with `?diagnose`.
 */
@Injectable()
export class DiagnosticRecorder implements BikeLinkTap, DiagnosticRecording {
  private readonly view = inject(DOCUMENT).defaultView;
  private readonly clock = inject(MONOTONIC_TIME, { optional: true });
  private readonly buffer = new RecordingBuffer();
  private readonly origin = this.now();
  private readonly held = signal(0);
  private readonly gone = signal(0);
  private readonly kept = signal(0);
  /** The screen captures kept, oldest first; at most `RECORDING_LIMITS.captures`. */
  private pictures: RecordingFile[] = [];
  private writes = 0;
  private taken = 0;
  private lastShown = '';

  readonly startedAt = new Date();
  readonly entries = this.held.asReadonly();
  readonly dropped = this.gone.asReadonly();
  readonly captures = this.kept.asReadonly();

  constructor() {
    this.add('EVT', 'recording-started');
  }

  received(from: string, bytes: Uint8Array, how: ReceivedHow, bike: BikeKind | null): void {
    const reading = how === 'notification' ? readFrame(bytes, bike) : readAnswer(from, bytes);
    const raw = `${how} ${from} ${toHex(bytes)}`;
    this.add('RX', reading === null ? raw : `${raw} | ${reading}`);
  }

  writing(to: string, bytes: Uint8Array, targetResistance?: number): WriteSettled {
    const number = ++this.writes;
    const asked = this.now();
    const raw = `#${number} ${to} ${toHex(bytes)}`;
    this.add(
      'TX',
      targetResistance === undefined ? raw : `${raw} | target-resistance=${targetResistance}`,
    );
    return (error?: unknown) =>
      this.add(
        'ACK',
        error === undefined
          ? `#${number} ok ${Math.round(this.now() - asked)}ms`
          : `#${number} failed ${quote(redact(describeError(error)))}`,
      );
  }

  event(name: string, detail?: string): void {
    this.add('EVT', detail === undefined ? name : `${name} ${ascii(detail)}`);
  }

  /** A line the app logged, already redacted (L2-178 AC7). */
  logged(line: string): void {
    this.add('ERR', quote(line));
  }

  readouts(readouts: ShownReadouts): void {
    const detail = `power=${shown(readouts.power)} cadence=${shown(readouts.cadence)} resistance=${shown(readouts.resistance)} target-resistance=${shown(readouts.targetResistance)}`;
    if (detail === this.lastShown) return;
    this.lastShown = detail;
    this.add('SCR', detail);
  }

  note(text: string): void {
    this.add('NOTE', quote(text));
  }

  keepCapture(captured: CapturedScreen): number {
    const number = ++this.taken;
    const name = captureFileName(this.startedAt, number);
    this.pictures.push({ name, blob: captured.picture });
    this.add('CAP', `${number} ${name} ${captured.width}x${captured.height}`);
    while (this.pictures.length > RECORDING_LIMITS.captures) {
      const oldest = this.pictures.shift();
      this.add('CAP', `dropped ${oldest?.name} to keep ${RECORDING_LIMITS.captures}`);
    }
    this.kept.set(this.pictures.length);
    return number;
  }

  captureFailed(code: ScreenCaptureErrorCode, error?: unknown): void {
    const why = error === undefined ? '' : ` ${quote(redact(describeError(error)))}`;
    this.add('CAP', `${code}${why}`);
  }

  files(): RecordingFile[] {
    const header = recordingHeader({
      startedAt: this.startedAt,
      savedAt: new Date(),
      address: redact(this.view?.location.href ?? ''),
      browser: this.view?.navigator.userAgent ?? '',
      dropped: this.buffer.dropped,
    });
    const text = [...header, ...this.buffer.lines(), ''].join('\n');
    return [
      {
        name: recordingFileName(this.startedAt),
        blob: new Blob([text], { type: 'text/plain;charset=utf-8' }),
      },
      ...this.pictures,
    ];
  }

  private add(kind: EntryKind, detail: string): void {
    this.buffer.push(entryLine(this.now() - this.origin, kind, detail));
    this.held.set(this.buffer.size);
    this.gone.set(this.buffer.dropped);
  }

  private now(): number {
    return this.clock?.now() ?? this.view?.performance.now() ?? 0;
  }
}
