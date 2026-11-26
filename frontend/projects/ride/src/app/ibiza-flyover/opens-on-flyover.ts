/**
 * Whether Class Ride opens on Ibiza Flyover: a ride in Ibiza on a device that does not ask for reduced motion
 * (L2-179 AC9). A ride with the class video has no flyover.
 */
export function opensOnFlyover(way: 'video' | 'ibiza', reducedMotion: boolean): boolean {
  return way === 'ibiza' && !reducedMotion;
}
