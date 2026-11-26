import { InjectionToken } from '@angular/core';
import type { ClassDefinition } from './class-definition';

/**
 * Where the screens read the one class from (L2-080, ADR 0037). It ships with the app, so it is answered at once and
 * without a network (AC5).
 */
export interface TheClassSource {
  /** The class; refuses with a `ClassError` when it breaks a rule (AC3). */
  get(): ClassDefinition;
}

export const THE_CLASS = new InjectionToken<TheClassSource>('THE_CLASS');
