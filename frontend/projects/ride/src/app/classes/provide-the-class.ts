import type { Provider } from '@angular/core';
import { THE_CLASS } from '@telo/api';
import { shippedClass } from '@telo/domain';

/**
 * The one class, shipped with the app (ADR 0037), for the routes that read it: The Class and the class ride. Bound
 * on them, so the class's data loads with the first of them and stays out of the initial bundle.
 */
export function provideTheClass(): Provider {
  return { provide: THE_CLASS, useFactory: () => shippedClass() };
}
