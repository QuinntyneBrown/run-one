import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { THE_CLASS } from '@telo/api';

/**
 * The class ride's guard (L2-080 AC3): a class that breaks a rule is not offered, so its ride does not open. The rider
 * is led to `/`, which says the class can't be loaded.
 */
export const theClassGuard: CanActivateFn = () => {
  try {
    inject(THE_CLASS).get();
    return true;
  } catch {
    return inject(Router).createUrlTree(['/']);
  }
};
