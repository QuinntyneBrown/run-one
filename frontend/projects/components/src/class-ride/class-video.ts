import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { InlineMessage } from '../inline-message/inline-message';

/**
 * The class video's frame (design-system block class-video): the class cover until the player paints over it, the
 * element the player takes over, and the warning under the frame when the video cannot play (L2-088 AC4). It emits
 * that element once it is drawn, for the page to hand to the video player; this component only draws.
 */
@Component({
  selector: 'wz-class-video',
  imports: [InlineMessage],
  templateUrl: './class-video.html',
  styleUrl: './class-video.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassVideo implements AfterViewInit {
  readonly videoId = input.required<string>();
  readonly title = input.required<string>();
  readonly unavailable = input(false);
  /** Draws "Paused" over the picture; the page announces the pause itself. */
  readonly paused = input(false);
  /** YouTube's 4:3 cover, cropped to its 16:9 picture (ADR 0014). */
  protected readonly cover = computed(
    () => `https://i.ytimg.com/vi/${encodeURIComponent(this.videoId())}/hqdefault.jpg`,
  );

  /** The element the player embeds its frame in, once it is drawn. */
  readonly frame = output<HTMLElement>();

  // The frame is found from the host rather than with viewChild: the app's first signal query would put the query
  // runtime (1 kB) in the initial bundle, which AGENTS.md puts first.
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  ngAfterViewInit(): void {
    this.frame.emit(this.host.nativeElement.querySelector<HTMLElement>('.class-video__player')!);
  }
}
