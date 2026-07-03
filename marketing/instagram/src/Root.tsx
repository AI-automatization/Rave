import React from 'react';
import { Composition } from 'remotion';
import {
  StoryD1S1, StoryD1S2, StoryD1S3,
  StoryD2S1, StoryD2S2,
  StoryD3S1, StoryD3S2, StoryD3S3,
  StoryD4S1, StoryD4S2, StoryD4S3,
  StoryD5S1, StoryD5S2, StoryD5S3, StoryD5S4,
  StoryD6S1, StoryD6S2, StoryD6S3,
  StoryD7S1, StoryD7S2, StoryD7S3,
} from './slides/WeWatchStories';
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
import { TAB7_1Home, TAB7_2WatchParty, TAB7_3Profile, TAB7_4Login, TAB10_1Home, TAB10_2WatchParty, TAB10_3Profile, TAB10_4Login } from './slides/TabletSlides';
import { AND1Home, AND2WatchParty, AND3Profile, AND4Login, TAB7A_1Home, TAB7A_2WatchParty, TAB7A_3Profile, TAB7A_4Login, TAB10A_1Home, TAB10A_2WatchParty, TAB10A_3Profile, TAB10A_4Login } from './slides/AndroidDeviceSlides';
import { ANDR1Home, ANDR2WatchParty, ANDR3Profile, ANDR4Login, TABL7_1Home, TABL7_2WatchParty, TABL7_3Profile, TABL7_4Login, TABL10_1Home, TABL10_2WatchParty, TABL10_3Profile, TABL10_4Login } from './slides/AndroidFrameSlides';
import { LifestyleSlide, LifestyleLogin, LifestyleWatchParty } from './slides/LifestyleSlide';
import { HowItWorks } from './slides/HowItWorks';
import { WeWatchPromo, WEWATCH_PROMO_DURATION } from './slides/WeWatchPromo';
import { WeWatchReel2, REEL2_DURATION } from './slides/WeWatchReel2';
import { WeWatchReelRu, REEL_RU_DURATION } from './slides/WeWatchReelRu';
import { WeWatchReel3, REEL3_DURATION } from './slides/WeWatchReel3';
import { WeWatchReel4, REEL4_DURATION } from './slides/WeWatchReel4';
import { HayitSlide } from './slides/HayitSlide';
import { WeWatchReel5, REEL5_DURATION } from './slides/WeWatchReel5';
import { WeWatchReelUz2, REEL_UZ2_DURATION } from './slides/WeWatchReelUz2';
import { W1C1Cover, W1C2Sync, W1C3Chat, W1C4Battle, W1C5Free } from './slides/W1Carousel';
import { W1Quote } from './slides/W1Quote';
import { SatStory1Poll, SatStory2Hook, SatStory3HowTo } from './slides/SaturdayStories';
import { SundayReel, SUNDAY_REEL_DURATION } from './slides/SundayReel';
import { AnimeCrossover, ANIME_REEL_DURATION } from './slides/AnimeCrossover';

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

    {/* Android 7" Tablet screenshots — 1200×1920 */}
    <Composition id="TAB7-1-Home"       component={TAB7_1Home}       width={1200} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="TAB7-2-WatchParty" component={TAB7_2WatchParty} width={1200} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="TAB7-3-Profile"    component={TAB7_3Profile}    width={1200} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="TAB7-4-Login"      component={TAB7_4Login}      width={1200} height={1920} fps={FPS} durationInFrames={1} />

    {/* Android 10" Tablet screenshots — 1600×2560 (two phones side by side) */}
    <Composition id="TAB10-1-Home"       component={TAB10_1Home}       width={1600} height={2560} fps={FPS} durationInFrames={1} />
    <Composition id="TAB10-2-WatchParty" component={TAB10_2WatchParty} width={1600} height={2560} fps={FPS} durationInFrames={1} />
    <Composition id="TAB10-3-Profile"    component={TAB10_3Profile}    width={1600} height={2560} fps={FPS} durationInFrames={1} />
    <Composition id="TAB10-4-Login"      component={TAB10_4Login}      width={1600} height={2560} fps={FPS} durationInFrames={1} />

    {/* Android Phone (CSS frame, no iPhone) — 1080×1920 */}
    <Composition id="AND1-Home"       component={AND1Home}       width={1080} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="AND2-WatchParty" component={AND2WatchParty} width={1080} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="AND3-Profile"    component={AND3Profile}    width={1080} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="AND4-Login"      component={AND4Login}      width={1080} height={1920} fps={FPS} durationInFrames={1} />

    {/* Android 7" Tablet (CSS frame, two screens) — 1200×1920 */}
    <Composition id="TAB7A-1-Home"       component={TAB7A_1Home}       width={1200} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="TAB7A-2-WatchParty" component={TAB7A_2WatchParty} width={1200} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="TAB7A-3-Profile"    component={TAB7A_3Profile}    width={1200} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="TAB7A-4-Login"      component={TAB7A_4Login}      width={1200} height={1920} fps={FPS} durationInFrames={1} />

    {/* Android 10" Tablet (CSS frame, two screens) — 1600×2560 */}
    <Composition id="TAB10A-1-Home"       component={TAB10A_1Home}       width={1600} height={2560} fps={FPS} durationInFrames={1} />
    <Composition id="TAB10A-2-WatchParty" component={TAB10A_2WatchParty} width={1600} height={2560} fps={FPS} durationInFrames={1} />
    <Composition id="TAB10A-3-Profile"    component={TAB10A_3Profile}    width={1600} height={2560} fps={FPS} durationInFrames={1} />
    <Composition id="TAB10A-4-Login"      component={TAB10A_4Login}      width={1600} height={2560} fps={FPS} durationInFrames={1} />

    {/* Android REAL FRAME (downloaded PNG) — Phone 1080×1920 */}
    <Composition id="ANDR1-Home"       component={ANDR1Home}       width={1080} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="ANDR2-WatchParty" component={ANDR2WatchParty} width={1080} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="ANDR3-Profile"    component={ANDR3Profile}    width={1080} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="ANDR4-Login"      component={ANDR4Login}      width={1080} height={1920} fps={FPS} durationInFrames={1} />

    {/* Tablet REAL FRAME (Samsung Tab S7) — 7" 1200×1920 */}
    <Composition id="TABL7-1-Home"       component={TABL7_1Home}       width={1200} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="TABL7-2-WatchParty" component={TABL7_2WatchParty} width={1200} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="TABL7-3-Profile"    component={TABL7_3Profile}    width={1200} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="TABL7-4-Login"      component={TABL7_4Login}      width={1200} height={1920} fps={FPS} durationInFrames={1} />

    {/* Tablet REAL FRAME (Samsung Tab S7) — 10" 1600×2560 */}
    <Composition id="TABL10-1-Home"       component={TABL10_1Home}       width={1600} height={2560} fps={FPS} durationInFrames={1} />
    <Composition id="TABL10-2-WatchParty" component={TABL10_2WatchParty} width={1600} height={2560} fps={FPS} durationInFrames={1} />
    <Composition id="TABL10-3-Profile"    component={TABL10_3Profile}    width={1600} height={2560} fps={FPS} durationInFrames={1} />
    <Composition id="TABL10-4-Login"      component={TABL10_4Login}      width={1600} height={2560} fps={FPS} durationInFrames={1} />

    {/* Instagram Post carousel — 1080×1080 square */}
    <Composition id="LifestyleSlide"      component={LifestyleSlide}      width={1080} height={1080} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="LifestyleLogin"      component={LifestyleLogin}      width={1080} height={1080} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="LifestyleWatchParty" component={LifestyleWatchParty} width={1080} height={1080} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="HowItWorks"          component={HowItWorks}          width={1080} height={1080} fps={FPS} durationInFrames={SLIDE_DUR} />

    {/* WeWatch Promo video — 14s, 1080×1080 */}
    <Composition id="WeWatchPromo" component={WeWatchPromo} width={1080} height={1080} fps={FPS} durationInFrames={WEWATCH_PROMO_DURATION} />

    {/* WeWatch Reel 2 — 14s, 1080×1920 (9:16) */}
    <Composition id="WeWatchReel2" component={WeWatchReel2} width={1080} height={1920} fps={FPS} durationInFrames={REEL2_DURATION} />

    {/* WeWatch Reel RU — 24s, 1080×1920 — русская версия оригинального рилса */}
    <Composition id="WeWatchReelRu" component={WeWatchReelRu} width={1080} height={1920} fps={FPS} durationInFrames={REEL_RU_DURATION} />

    {/* WeWatch Reel 3 — 30s, 1080×1920 — Dowork.uz style */}
    <Composition id="WeWatchReel3" component={WeWatchReel3} width={1080} height={1920} fps={FPS} durationInFrames={REEL3_DURATION} />

    {/* WeWatch Reel 4 — 30s, 1080×1920 — Coremed style (8 slides + phone mockups) */}
    <Composition id="WeWatchReel4" component={WeWatchReel4} width={1080} height={1920} fps={FPS} durationInFrames={REEL4_DURATION} />

    {/* Qurbon Hayit slide — 1080×1080 */}
    <Composition id="HayitSlide" component={HayitSlide} width={1080} height={1080} fps={FPS} durationInFrames={SLIDE_DUR} />

    {/* ── WEEK 1 content (4–8 June) ── */}
    {/* Reel 15s — "Смотришь фильм один?" */}
    <Composition id="W1-Reel15s" component={WeWatchReel5} width={1080} height={1920} fps={FPS} durationInFrames={REEL5_DURATION} />
    {/* Carousel "5 причин" — 5 static slides */}
    <Composition id="W1-C1-Cover"  component={W1C1Cover}  width={1080} height={1080} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="W1-C2-Sync"   component={W1C2Sync}   width={1080} height={1080} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="W1-C3-Chat"   component={W1C3Chat}   width={1080} height={1080} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="W1-C4-Battle" component={W1C4Battle} width={1080} height={1080} fps={FPS} durationInFrames={SLIDE_DUR} />
    <Composition id="W1-C5-Free"   component={W1C5Free}   width={1080} height={1080} fps={FPS} durationInFrames={SLIDE_DUR} />
    {/* Quote post — "Кино — это с кем ты смотришь" */}
    <Composition id="W1-Quote"     component={W1Quote}    width={1080} height={1080} fps={FPS} durationInFrames={SLIDE_DUR} />

    {/* ── Instagram Stories 9:16 (1080×1920) — 7 kunlik kontent plan ── */}
    {/* Day 1 — Tanishuv */}
    <Composition id="Story-D1S1-Teaser"  component={StoryD1S1} width={1080} height={1920} fps={FPS} durationInFrames={7 * FPS} />
    <Composition id="Story-D1S2-Poll"    component={StoryD1S2} width={1080} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="Story-D1S3-CTA"     component={StoryD1S3} width={1080} height={1920} fps={FPS} durationInFrames={6 * FPS} />
    {/* Day 2 — Demo */}
    <Composition id="Story-D2S1-Teaser"  component={StoryD2S1} width={1080} height={1920} fps={FPS} durationInFrames={6 * FPS} />
    <Composition id="Story-D2S2-Quiz"    component={StoryD2S2} width={1080} height={1920} fps={FPS} durationInFrames={7 * FPS} />
    {/* Day 3 — Watch Party */}
    <Composition id="Story-D3S1-Before"  component={StoryD3S1} width={1080} height={1920} fps={FPS} durationInFrames={7 * FPS} />
    <Composition id="Story-D3S2-QBox"    component={StoryD3S2} width={1080} height={1920} fps={FPS} durationInFrames={7 * FPS} />
    <Composition id="Story-D3S3-Feature" component={StoryD3S3} width={1080} height={1920} fps={FPS} durationInFrames={7 * FPS} />
    {/* Day 4 — Battle Mode */}
    <Composition id="Story-D4S1-Score"   component={StoryD4S1} width={1080} height={1920} fps={FPS} durationInFrames={7 * FPS} />
    <Composition id="Story-D4S2-Poll"    component={StoryD4S2} width={1080} height={1920} fps={FPS} durationInFrames={1} />
    <Composition id="Story-D4S3-CTA"     component={StoryD4S3} width={1080} height={1920} fps={FPS} durationInFrames={6 * FPS} />
    {/* Day 5 — Tips x4 */}
    <Composition id="Story-D5S1-Tip1"    component={StoryD5S1} width={1080} height={1920} fps={FPS} durationInFrames={7 * FPS} />
    <Composition id="Story-D5S2-Tip2"    component={StoryD5S2} width={1080} height={1920} fps={FPS} durationInFrames={7 * FPS} />
    <Composition id="Story-D5S3-Tip3"    component={StoryD5S3} width={1080} height={1920} fps={FPS} durationInFrames={7 * FPS} />
    <Composition id="Story-D5S4-Tip4"    component={StoryD5S4} width={1080} height={1920} fps={FPS} durationInFrames={7 * FPS} />
    {/* Day 6 — Social Proof */}
    <Composition id="Story-D6S1-Quote"   component={StoryD6S1} width={1080} height={1920} fps={FPS} durationInFrames={7 * FPS} />
    <Composition id="Story-D6S2-Share"   component={StoryD6S2} width={1080} height={1920} fps={FPS} durationInFrames={6 * FPS} />
    <Composition id="Story-D6S3-Tag"     component={StoryD6S3} width={1080} height={1920} fps={FPS} durationInFrames={7 * FPS} />
    {/* Day 7 — Hafta yakuni */}
    <Composition id="Story-D7S1-Stats"   component={StoryD7S1} width={1080} height={1920} fps={FPS} durationInFrames={7 * FPS} />
    <Composition id="Story-D7S2-Soon"    component={StoryD7S2} width={1080} height={1920} fps={FPS} durationInFrames={7 * FPS} />
    <Composition id="Story-D7S3-Poll"    component={StoryD7S3} width={1080} height={1920} fps={FPS} durationInFrames={1} />

    {/* Reel — WeWatch nima? (06-iyun 2026) */}
    <Composition id="Reel-WeWatch-Nima" component={WeWatchReelUz2} width={1080} height={1920} fps={FPS} durationInFrames={REEL_UZ2_DURATION} />

    {/* ── Saturday Stories (06-iyun) — без музыки, под озвучку ── */}
    <Composition id="Sat-Story1-Poll"  component={SatStory1Poll}  width={1080} height={1920} fps={FPS} durationInFrames={10 * FPS} />
    <Composition id="Sat-Story2-Hook"  component={SatStory2Hook}  width={1080} height={1920} fps={FPS} durationInFrames={5 * FPS} />
    <Composition id="Sat-Story3-HowTo" component={SatStory3HowTo} width={1080} height={1920} fps={FPS} durationInFrames={4 * FPS} />

    {/* Sunday Reel — POV (07-iyun) */}
    <Composition id="Sunday-Reel-POV" component={SundayReel} width={1080} height={1920} fps={FPS} durationInFrames={SUNDAY_REEL_DURATION} />
    {/* Anime crossover meme reel */}
    <Composition id="Anime-Crossover" component={AnimeCrossover} width={1080} height={1920} fps={FPS} durationInFrames={ANIME_REEL_DURATION} />
  </>
);
