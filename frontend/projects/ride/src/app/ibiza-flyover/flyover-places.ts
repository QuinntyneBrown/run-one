/** A place the camera is over and a line about it (L2-179 AC2, AC3). */
export interface FlyoverPlace {
  readonly place: string;
  readonly line: string;
}

/** The flight's captions, a fifth of the flight each. A proposal, written from the course as built (open question 40). */
export const FLYOVER_PLACES: readonly FlyoverPlace[] = [
  { place: 'The waterfront', line: 'the warm-up rolls out along the sea' },
  { place: 'The Strip', line: 'every effort climbs past the clubs' },
  { place: 'The DJ terrace', line: 'light beams over the crowd' },
  { place: 'The finale', line: 'five short, steep sprints' },
  { place: 'The finish', line: 'the cool-down runs back down to the sea' },
];

/** The landing's caption, whose class title is the class's (L2-179 AC3). */
export function landingPlace(classTitle: string): FlyoverPlace {
  return { place: 'The start', line: `your grid for ${classTitle}` };
}
