import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ANNOUNCER, type ClassResult, INTENSITY_DEFAULT } from '@telo/api';
import { Button, ClassDone, type IntensityAnswer, IntensityQuestion } from '@telo/components';
import { type ClassDoneView, classDoneView } from './class-done-view';
import { FullscreenButton } from '../fullscreen/fullscreen-button';
import { type IntensityQuestionView, intensityQuestion } from './intensity-question';

/** What a finished ride leaves in the navigation's state for Class Done: its result. */
interface ClassDoneState {
  readonly classResult?: ClassResult;
}

/**
 * Class Done (docs/mocks/pages/class-done/, L2-078, L2-079): the finished class's output, time and average. The ride
 * hands its result over in the navigation's history state, which a reload keeps; with none, The Class opens instead
 * (AC5). Done leads to The Class. The ride is sent nowhere and earns nothing (ADR 0039). When the ride ended at an
 * intensity other than the kept default, a card above Done asks whether to keep it, and keeps it only at the rider's
 * word (L2-184).
 */
@Component({
  selector: 'wz-class-done-page',
  imports: [ClassDone, FullscreenButton, IntensityQuestion, RouterLink, Button],
  templateUrl: './class-done-page.html',
  styleUrl: './class-done-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ClassDonePage {
  protected readonly view: ClassDoneView | null;
  private readonly defaults = inject(INTENSITY_DEFAULT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** The intensity question, or `null` when there is none or the rider kept the default (L2-184). */
  protected readonly question = signal<IntensityQuestionView | null>(null);
  protected readonly answer = signal<IntensityAnswer>('ask');

  constructor() {
    const state = (inject(Location).getState() ?? {}) as ClassDoneState;
    const result = state.classResult ?? null;
    this.view = result === null ? null : classDoneView(result);
    if (result !== null)
      this.question.set(intensityQuestion(result.intensity, this.defaults.kept()));
    // The result, said as Class Done opens (L2-141 AC2).
    if (this.view !== null) inject(ANNOUNCER).announce(this.view.announcement);
    if (result === null) void inject(Router).navigateByUrl('/', { replaceUrl: true });
  }

  /** "Make it my default": kept on the device, and the card says so, or says it could not be (L2-184 AC2, AC5). */
  protected keep(): void {
    const question = this.question();
    if (question === null) return;
    this.answer.set(this.defaults.keep(question.intensity) ? 'kept' : 'refused');
  }

  /** "Keep 5/10": nothing is kept, the card goes and Done has the focus (L2-184 AC3). */
  protected dismiss(): void {
    this.question.set(null);
    this.host.nativeElement.querySelector<HTMLElement>('.class-done-page__done')?.focus();
  }
}
