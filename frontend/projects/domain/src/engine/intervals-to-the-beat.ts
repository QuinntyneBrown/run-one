import type { ClassDefinition, Segment } from '@telo/api';

/**
 * The plan of Intervals to the Beat (L2-080 AC2): 33 segments, 17 of them efforts, 20:00 in all. It is the plan Ibiza
 * Sunset Strip was built from (`tools/blender/courses/ibiza.json`), segment for segment and second for second, so each
 * of the course's hills arrives as the bike's resistance changes for it (L2-174 AC3). Each line ends with the
 * segment's number and the time it starts at.
 */
const SEGMENTS: readonly Segment[] = [
  { kind: 'warm-up', duration: 150, level: 14, cadenceAim: 80 }, // 1: 0:00
  { kind: 'work', duration: 45, level: 19, cadenceAim: 70 }, // 2: 2:30, effort 1
  { kind: 'recover', duration: 30, level: 14, cadenceAim: 90 }, // 3: 3:15
  { kind: 'work', duration: 75, level: 21, cadenceAim: 80 }, // 4: 3:45, effort 2
  { kind: 'recover', duration: 60, level: 13, cadenceAim: 90 }, // 5: 5:00
  { kind: 'work', duration: 30, level: 21, cadenceAim: 74 }, // 6: 6:00, effort 3
  { kind: 'recover', duration: 30, level: 13, cadenceAim: 90 }, // 7: 6:30
  { kind: 'work', duration: 30, level: 21, cadenceAim: 74 }, // 8: 7:00, effort 4
  { kind: 'recover', duration: 30, level: 13, cadenceAim: 90 }, // 9: 7:30
  { kind: 'work', duration: 30, level: 21, cadenceAim: 74 }, // 10: 8:00, effort 5
  { kind: 'recover', duration: 30, level: 13, cadenceAim: 90 }, // 11: 8:30
  { kind: 'work', duration: 30, level: 22, cadenceAim: 65 }, // 12: 9:00, effort 6
  { kind: 'recover', duration: 30, level: 11, cadenceAim: 90 }, // 13: 9:30
  { kind: 'work', duration: 30, level: 22, cadenceAim: 65 }, // 14: 10:00, effort 7
  { kind: 'recover', duration: 30, level: 11, cadenceAim: 90 }, // 15: 10:30
  { kind: 'work', duration: 30, level: 22, cadenceAim: 65 }, // 16: 11:00, effort 8
  { kind: 'recover', duration: 30, level: 11, cadenceAim: 90 }, // 17: 11:30
  { kind: 'work', duration: 15, level: 24, cadenceAim: 70 }, // 18: 12:00, effort 9
  { kind: 'work', duration: 30, level: 21, cadenceAim: 90 }, // 19: 12:15, effort 10
  { kind: 'recover', duration: 30, level: 11, cadenceAim: 90 }, // 20: 12:45
  { kind: 'work', duration: 15, level: 24, cadenceAim: 70 }, // 21: 13:15, effort 11
  { kind: 'work', duration: 30, level: 21, cadenceAim: 90 }, // 22: 13:30, effort 12
  { kind: 'recover', duration: 30, level: 11, cadenceAim: 90 }, // 23: 14:00
  { kind: 'work', duration: 20, level: 22, cadenceAim: 110 }, // 24: 14:30, effort 13
  { kind: 'recover', duration: 20, level: 11, cadenceAim: 90 }, // 25: 14:50
  { kind: 'work', duration: 20, level: 22, cadenceAim: 110 }, // 26: 15:10, effort 14
  { kind: 'recover', duration: 20, level: 11, cadenceAim: 90 }, // 27: 15:30
  { kind: 'work', duration: 20, level: 22, cadenceAim: 110 }, // 28: 15:50, effort 15
  { kind: 'recover', duration: 20, level: 11, cadenceAim: 90 }, // 29: 16:10
  { kind: 'work', duration: 20, level: 22, cadenceAim: 110 }, // 30: 16:30, effort 16
  { kind: 'recover', duration: 20, level: 11, cadenceAim: 90 }, // 31: 16:50
  { kind: 'work', duration: 20, level: 22, cadenceAim: 110 }, // 32: 17:10, effort 17
  { kind: 'cool-down', duration: 150, level: 11, cadenceAim: 81 }, // 33: 17:30
];

/**
 * The one class of Telo Ride 1 (L2-080 AC1), shipped with the app as data (ADR 0037): GCN Training's Intervals to the
 * Beat, with its plan, its video and the sync offset, the second of the video at which the ride's 0:00 falls. It is
 * ridden in Ibiza Sunset Strip.
 */
export const INTERVALS_TO_THE_BEAT: ClassDefinition = {
  id: 'intervals-to-the-beat',
  title: 'Intervals to the Beat',
  channel: 'GCN Training',
  focus: 'Intervals',
  lengthSeconds: 1200,
  summary:
    'Seventeen efforts from 15 seconds to 1:15, ridden to the beat, with five fast sprints to finish.',
  plan: { segments: SEGMENTS },
  video: { videoId: 'il_OFz6o42I', syncOffsetSeconds: 3 },
};
