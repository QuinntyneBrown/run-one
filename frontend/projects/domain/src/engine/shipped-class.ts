import { type ClassDefinition, ClassError, type TheClassSource } from '@telo/api';
import { ClassRule } from './class-rule';
import { INTERVALS_TO_THE_BEAT } from './intervals-to-the-beat';

/**
 * The `THE_CLASS` the app binds (ADR 0037): the class it ships with, Intervals to the Beat, checked against the rules a
 * class's plan must meet each time it is read. A class that breaks one is refused, so no screen offers it (L2-080 AC3).
 */
export function shippedClass(definition: ClassDefinition = INTERVALS_TO_THE_BEAT): TheClassSource {
  return {
    get(): ClassDefinition {
      const broken = ClassRule.broken(definition);
      if (broken !== null)
        throw new ClassError('class_invalid', `The class breaks the rule "${broken}"`);
      return definition;
    },
  };
}
