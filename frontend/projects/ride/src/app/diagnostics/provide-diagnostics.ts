import {
  ApplicationRef,
  DestroyRef,
  EnvironmentInjector,
  type EnvironmentProviders,
  type Provider,
  ViewContainerRef,
  inject,
  provideEnvironmentInitializer,
} from '@angular/core';
import {
  APP_LOGGER,
  BIKE_LINK_TAP,
  DIAGNOSTIC_RECORDING,
  FILE_SAVER,
  SCREEN_CAPTURE,
} from '@telo/api';
import {
  BrowserFileSaver,
  BrowserScreenCapture,
  DiagnosticRecorder,
  RecordingAppLogger,
} from '@telo/domain/diagnostics';
import { DiagnosticsHost } from './diagnostics-host';

/**
 * Everything the diagnostic recording binds (L2-178, ADR 0048), for the providers of the first lazy route. This file
 * is imported dynamically, and only when the app is opened with `?diagnose` (`ride.routes.ts`), so a rider's app
 * fetches none of it. One recorder is the tap on the Bluetooth link and the recording it fills; it is created with
 * the route's injector, before any Bluetooth call. The recording mark is mounted beside the root component, so no
 * screen and no part of the initial bundle knows of it.
 */
export function provideDiagnostics(): (Provider | EnvironmentProviders)[] {
  return [
    DiagnosticRecorder,
    { provide: BIKE_LINK_TAP, useExisting: DiagnosticRecorder },
    { provide: DIAGNOSTIC_RECORDING, useExisting: DiagnosticRecorder },
    { provide: FILE_SAVER, useClass: BrowserFileSaver },
    { provide: SCREEN_CAPTURE, useClass: BrowserScreenCapture },
    // The console still gets every logged error; the recording gets the same line (L2-115 AC4).
    { provide: APP_LOGGER, useClass: RecordingAppLogger },
    provideEnvironmentInitializer(() => {
      inject(DIAGNOSTIC_RECORDING);
      const root = inject(ApplicationRef).components[0];
      const host = root.injector
        .get(ViewContainerRef)
        .createComponent(DiagnosticsHost, { environmentInjector: inject(EnvironmentInjector) });
      inject(DestroyRef).onDestroy(() => host.destroy());
    }),
  ];
}
