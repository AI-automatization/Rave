import React from 'react';
import { Composition } from 'remotion';
import { Slide01Hook } from './slides/01-Hook';
import { Slide02Problem } from './slides/02-Problem';
import { Slide03Solution } from './slides/03-Solution';
import { Slide04WatchParty } from './slides/04-WatchParty';
import { Slide05Sync } from './slides/05-Sync';
import { Slide06Features } from './slides/06-Features';
import { Slide07Content } from './slides/07-Content';
import { Slide08CTA } from './slides/08-CTA';
import { Slideshow } from './Slideshow';

const W = 1080;
const H = 1080;
const FPS = 30;
const SLIDE_DUR = 5 * FPS;       // 5s per slide
const TRANSITION = 20;            // 20 frames overlap
const TOTAL = 8 * SLIDE_DUR - 7 * TRANSITION; // 1060 frames ≈ 35s

export const RemotionRoot: React.FC = () => (
  <>
    {/* Full slideshow with transitions */}
    <Composition id="Slideshow" component={Slideshow} width={W} height={H} fps={FPS} durationInFrames={TOTAL} />

    {/* Individual slides */}
    <Composition id="Slide01-Hook"       component={Slide01Hook}       width={W} height={H} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="Slide02-Problem"    component={Slide02Problem}    width={W} height={H} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="Slide03-Solution"   component={Slide03Solution}   width={W} height={H} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="Slide04-WatchParty" component={Slide04WatchParty} width={W} height={H} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="Slide05-Sync"       component={Slide05Sync}       width={W} height={H} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="Slide06-Features"   component={Slide06Features}   width={W} height={H} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="Slide07-Content"    component={Slide07Content}    width={W} height={H} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="Slide08-CTA"        component={Slide08CTA}        width={W} height={H} fps={FPS} durationInFrames={SLIDE_DUR} />
  </>
);
