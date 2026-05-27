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
import { Slide09IntroUz } from './slides/09-IntroUz';
import { Slide10ProblemUz } from './slides/10-ProblemUz';
import { Slide11FeaturesUz } from './slides/11-FeaturesUz';
import { Slide12HowItWorksUz } from './slides/12-HowItWorksUz';
import { Slide13CTAUz } from './slides/13-CTAUz';
import { WeWatchReel } from './slides/WeWatchReel';
import { ReelCover } from './slides/ReelCover';
import { TK1Cover, TK2Problem, TK3Solution, TK4Features, TK5CTA } from './slides/TezKundaCarousel';
import { AS1Hero, AS2Rooms, AS3Chat, AS4Login } from './slides/AppStoreSlides';
import { PhoneShowcase } from './slides/PhoneShowcase';
import { PS1Home, PS2WatchParty, PS3Profile, PS4Login } from './slides/PlayStoreSlides';
import { LifestyleSlide, LifestyleLogin, LifestyleWatchParty } from './slides/LifestyleSlide';
import { HowItWorks } from './slides/HowItWorks';
import { WeWatchPromo, WEWATCH_PROMO_DURATION } from './slides/WeWatchPromo';
import { WeWatchReel2, REEL2_DURATION } from './slides/WeWatchReel2';
import { HayitSlide } from './slides/HayitSlide';

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

    {/* Intro post — Uzbek (Coremed style) */}
    <Composition id="Slide09-IntroUz"       component={Slide09IntroUz}       width={W} height={H} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="Slide10-ProblemUz"     component={Slide10ProblemUz}     width={W} height={H} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="Slide11-FeaturesUz"    component={Slide11FeaturesUz}    width={W} height={H} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="Slide12-HowItWorksUz"  component={Slide12HowItWorksUz}  width={W} height={H} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="Slide13-CTAUz"         component={Slide13CTAUz}         width={W} height={H} fps={FPS} durationInFrames={SLIDE_DUR} />

    {/* Instagram Reel — 1080×1920, 24s */}
    <Composition id="WeWatchReel" component={WeWatchReel} width={1080} height={1920} fps={FPS} durationInFrames={24 * FPS} />

    {/* Reel cover — 1080×1920, 1 frame */}
    <Composition id="ReelCover" component={ReelCover} width={1080} height={1920} fps={FPS} durationInFrames={1} />

    {/* Tez Kunda carousel — 5 slides, 1080×1080 */}
    <Composition id="TK1-Cover"    component={TK1Cover}    width={W} height={H} fps={FPS} durationInFrames={1} />
    <Composition id="TK2-Problem"  component={TK2Problem}  width={W} height={H} fps={FPS} durationInFrames={1} />
    <Composition id="TK3-Solution" component={TK3Solution} width={W} height={H} fps={FPS} durationInFrames={1} />
    <Composition id="TK4-Features" component={TK4Features} width={W} height={H} fps={FPS} durationInFrames={1} />
    <Composition id="TK5-CTA"      component={TK5CTA}      width={W} height={H} fps={FPS} durationInFrames={1} />

    {/* App Store / Play Store portrait slides — 1080×1920 */}
    <Composition id="AS1-Hero"   component={AS1Hero}  width={1080} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="AS2-Rooms"  component={AS2Rooms} width={1080} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="AS3-Chat"   component={AS3Chat}  width={1080} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="AS4-Login"  component={AS4Login} width={1080} height={1920} fps={FPS} durationInFrames={1} />

    {/* Phone Showcase — real login screenshot, animated, 1080×1920 */}
    <Composition id="PhoneShowcase" component={PhoneShowcase} width={1080} height={1920} fps={FPS} durationInFrames={SLIDE_DUR} />

    {/* Play Store / App Store slides — Payme style, 1080×1920 */}
    <Composition id="PS1-Home"       component={PS1Home}       width={1080} height={1920} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="PS2-WatchParty" component={PS2WatchParty} width={1080} height={1920} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="PS3-Profile"    component={PS3Profile}    width={1080} height={1920} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="PS4-Login"      component={PS4Login}      width={1080} height={1920} fps={FPS} durationInFrames={SLIDE_DUR} />

    {/* Instagram Post carousel — 1080×1080 square */}
    <Composition id="LifestyleSlide"      component={LifestyleSlide}      width={1080} height={1080} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="LifestyleLogin"      component={LifestyleLogin}      width={1080} height={1080} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="LifestyleWatchParty" component={LifestyleWatchParty} width={1080} height={1080} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="HowItWorks"          component={HowItWorks}          width={1080} height={1080} fps={FPS} durationInFrames={SLIDE_DUR} />

    {/* WeWatch Promo video — 14s, 1080×1080 */}
    <Composition id="WeWatchPromo" component={WeWatchPromo} width={1080} height={1080} fps={FPS} durationInFrames={WEWATCH_PROMO_DURATION} />

    {/* WeWatch Reel 2 — 14s, 1080×1920 (9:16) */}
    <Composition id="WeWatchReel2" component={WeWatchReel2} width={1080} height={1920} fps={FPS} durationInFrames={REEL2_DURATION} />

    {/* Qurbon Hayit slide — 1080×1080 */}
    <Composition id="HayitSlide" component={HayitSlide} width={1080} height={1080} fps={FPS} durationInFrames={SLIDE_DUR} />
  </>
);
