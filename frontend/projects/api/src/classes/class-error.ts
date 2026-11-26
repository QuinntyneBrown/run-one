/** Why the class is not offered; a screen branches on `code`, the rider reads plain words. */
export type ClassErrorCode = 'class_invalid';

/** A refusal from `TheClassSource`: `class_invalid` when the class breaks a rule its plan must meet (L2-080 AC3). */
export class ClassError extends Error {
  constructor(
    readonly code: ClassErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ClassError';
  }
}
