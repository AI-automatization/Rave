import React from 'react';
import { Composition } from 'remotion';
import {
  BlogyB1Cover,
  BlogyB2Proof,
  BlogyB3Steps,
  BlogyB4CTA,
} from './slides/BlogyCarousel';
import {
  V2B1Cover,
  V2B2Screenshot,
  V2B3Steps,
  V2B4CTA,
} from './slides/BlogyCarousel2';

const W = 1080;
const H = 1080;
const FPS = 30;
const DUR = 5 * FPS;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Blogy-B1-Cover" component={BlogyB1Cover} width={W} height={H} fps={FPS} durationInFrames={DUR} />
    <Composition id="Blogy-B2-Proof" component={BlogyB2Proof} width={W} height={H} fps={FPS} durationInFrames={DUR} />
    <Composition id="Blogy-B3-Steps" component={BlogyB3Steps} width={W} height={H} fps={FPS} durationInFrames={DUR} />
    <Composition id="Blogy-B4-CTA"   component={BlogyB4CTA}   width={W} height={H} fps={FPS} durationInFrames={DUR} />

    {/* V2 — с реальным скрином из TG */}
    <Composition id="V2-B1-Cover"      component={V2B1Cover}      width={W} height={H} fps={FPS} durationInFrames={DUR} />
    <Composition id="V2-B2-Screenshot" component={V2B2Screenshot} width={W} height={H} fps={FPS} durationInFrames={DUR} />
    <Composition id="V2-B3-Steps"      component={V2B3Steps}      width={W} height={H} fps={FPS} durationInFrames={DUR} />
    <Composition id="V2-B4-CTA"        component={V2B4CTA}        width={W} height={H} fps={FPS} durationInFrames={DUR} />
  </>
);
