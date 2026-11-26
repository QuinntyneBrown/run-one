import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';

/**
 * The YouTube inset over the course (design-system block class-course__inset; docs/mocks/pages/class-ride/
 * ibiza-youtube and ibiza-youtube-audio, L2-186 AC1, AC2): 16:9 in the box's top-right corner, or, for YouTube audio,
 * the same element kept 1 px square, transparent and hidden from screen readers, so the player in it plays on
 * unseen. It emits its element once drawn, for the page to hand to the video player; this component only draws.
 */
@Component({
  selector: 'wz-class-inset',
  templateUrl: './class-inset.html',
  styleUrl: './class-inset.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'class-course__inset',
    '[class.class-course__inset--audio]': 'audio()',
    '[attr.aria-hidden]': 'audio() ? "true" : null',
  },
})
export class ClassInset implements AfterViewInit {
  /** Whether only the video's sound is wanted: the picture is hidden (L2-186 AC2). */
  readonly audio = input(false);
  /** The element the player embeds its frame in, once it is drawn. */
  readonly frame = output<HTMLElement>();

  // Found from the host rather than with viewChild, as the class video's frame is (initial bundle first).
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  ngAfterViewInit(): void {
    this.frame.emit(this.host.nativeElement);
  }
}
