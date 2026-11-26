import { NgTemplateOutlet } from '@angular/common';
import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import type { RideWith as Way, TheClassView } from '@telo/api';
import { Button } from '../button/button';
import { RideWith } from '../ride-with/ride-with';
import { ClassProfile } from './class-profile';

/**
 * The Class under its header (design-system block the-class; docs/mocks/pages/the-class/; L2-084, L2-173): the
 * video's box with the class cover under the player, or the course's still when the rider has chosen Ibiza; the
 * class's words and length; "Ride with"; "What the bike will do", with the plan's average target power, its resistance
 * profile and the efforts in words (L2-084 AC2); and the one start button, in the details column from lg and pinned
 * to the bottom below it, of which the layout shows one. The page hands the element the player embeds in, emitted
 * once it is drawn, to the player.
 */
@Component({
  selector: 'wz-the-class',
  imports: [Button, ClassProfile, NgTemplateOutlet, RideWith],
  templateUrl: './the-class.html',
  styleUrl: './the-class.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TheClass implements AfterViewInit {
  readonly view = input.required<TheClassView>();

  /** The start button was pressed. */
  readonly start = output<void>();
  /** The rider chose how to ride. */
  readonly choose = output<Way>();
  /** The element the player embeds its frame in, once it is drawn. */
  readonly videoFrame = output<HTMLElement>();

  // Found from the host rather than with viewChild, whose query runtime would join the initial bundle (AGENTS.md).
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  ngAfterViewInit(): void {
    const player = this.host.nativeElement.querySelector<HTMLElement>('.the-class__player');
    if (player) this.videoFrame.emit(player);
  }
}
