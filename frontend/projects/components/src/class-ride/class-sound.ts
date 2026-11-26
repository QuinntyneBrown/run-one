import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { Sound, SoundVideo } from '@telo/api';
import { Button } from '../button/button';

/** What the Sound button reads for each sound (L2-185 AC1). */
const NAMES: Record<Sound, string> = {
  music: 'Music',
  none: 'No music',
  'youtube-video': 'YouTube video',
  'youtube-audio': 'YouTube audio',
};

/**
 * The Sound button and its panel, in the course box's top-left corner (design-system blocks class-course__sound and
 * class-sound; docs/mocks/pages/class-ride/ibiza-sound, ADR 0050): the button names the sound chosen and opens a
 * non-modal panel of native radio groups, "Sound" and, with a YouTube sound, "Video" (L2-185 AC1, AC2). A choice is
 * emitted at once and the panel stays open; the button, Escape or a press outside closes it, and Escape returns the
 * focus to the button. Music that cannot play is disabled with "Can’t play" (L2-176 AC7). It fills the box's sound
 * slot, which places it; the page applies and keeps the choice.
 */
@Component({
  selector: 'wz-class-sound',
  imports: [Button],
  templateUrl: './class-sound.html',
  styleUrl: './class-sound.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'outside($event)',
    '(keydown.escape)': 'escape()',
  },
})
export class ClassSound {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly sound = input.required<Sound>();
  readonly video = input<SoundVideo>('default');
  /** Whether the music can play (L2-176 AC7). */
  readonly musicAvailable = input(true);
  /** Whether the YouTube sounds are offered. */
  readonly youtube = input(true);
  readonly soundChange = output<Sound>();
  readonly videoChange = output<SoundVideo>();

  protected readonly open = signal(false);
  protected readonly name = computed(() => NAMES[this.sound()]);
  protected readonly youtubeChosen = computed(() => this.sound().startsWith('youtube'));

  protected toggle(): void {
    this.open.update((open) => !open);
  }

  protected escape(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.host.nativeElement.querySelector<HTMLElement>('.class-course__sound')?.focus();
  }

  protected outside(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node))
      this.open.set(false);
  }
}
