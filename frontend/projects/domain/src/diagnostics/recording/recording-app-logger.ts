import { Injectable, inject } from '@angular/core';
import type { AppLogger } from '@telo/api';
import { ConsoleAppLogger, logLine } from '../console-app-logger';
import { DiagnosticRecorder } from './diagnostic-recorder';

/**
 * The app's logger while a diagnostic recording is on (L2-115 AC4, L2-178 AC7). The console gets every error exactly
 * as it does for a rider, through `ConsoleAppLogger`; the recording gets the same redacted line. It writes nothing to
 * the console itself, and no Bluetooth message ever reaches it (L2-115 AC2).
 */
@Injectable()
export class RecordingAppLogger implements AppLogger {
  private readonly console = new ConsoleAppLogger();
  private readonly recorder = inject(DiagnosticRecorder);

  error(area: string, error: unknown): void {
    this.console.error(area, error);
    this.recorder.logged(logLine(area, error));
  }
}
