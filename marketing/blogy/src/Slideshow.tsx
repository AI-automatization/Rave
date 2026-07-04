import React from 'react';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';
import { slide } from '@remotion/transitions/slide';
import { Slide01Hook } from './slides/01-Hook';
import { Slide02Problem } from './slides/02-Problem';
import { Slide03Solution } from './slides/03-Solution';
import { Slide04WatchParty } from './slides/04-WatchParty';
import { Slide05Sync } from './slides/05-Sync';
import { Slide06Features } from './slides/06-Features';
import { Slide07Content } from './slides/07-Content';
import { Slide08CTA } from './slides/08-CTA';

const SLIDE_FRAMES = 150; // 5s at 30fps
const TRANSITION_FRAMES = 20;

export const Slideshow: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={SLIDE_FRAMES}>
      <Slide01Hook />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition
      presentation={slide({ direction: 'from-right' })}
      timing={springTiming({ config: { damping: 18, mass: 0.8 }, durationInFrames: TRANSITION_FRAMES })}
    />
    <TransitionSeries.Sequence durationInFrames={SLIDE_FRAMES}>
      <Slide02Problem />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition
      presentation={wipe({ direction: 'from-right' })}
      timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
    />
    <TransitionSeries.Sequence durationInFrames={SLIDE_FRAMES}>
      <Slide03Solution />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition
      presentation={fade()}
      timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
    />
    <TransitionSeries.Sequence durationInFrames={SLIDE_FRAMES}>
      <Slide04WatchParty />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition
      presentation={slide({ direction: 'from-right' })}
      timing={springTiming({ config: { damping: 18, mass: 0.8 }, durationInFrames: TRANSITION_FRAMES })}
    />
    <TransitionSeries.Sequence durationInFrames={SLIDE_FRAMES}>
      <Slide05Sync />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition
      presentation={wipe({ direction: 'from-right' })}
      timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
    />
    <TransitionSeries.Sequence durationInFrames={SLIDE_FRAMES}>
      <Slide06Features />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition
      presentation={slide({ direction: 'from-right' })}
      timing={springTiming({ config: { damping: 18, mass: 0.8 }, durationInFrames: TRANSITION_FRAMES })}
    />
    <TransitionSeries.Sequence durationInFrames={SLIDE_FRAMES}>
      <Slide07Content />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition
      presentation={fade()}
      timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
    />
    <TransitionSeries.Sequence durationInFrames={SLIDE_FRAMES}>
      <Slide08CTA />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
