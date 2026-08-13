import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, interpolate, staticFile, Img, Sequence, Easing, Audio } from 'remotion';

// "Pain → demo → offer" structure, matching the reference the user sent (a LevelUp Academy ad,
// used here as a STYLE/pacing reference only — content, copy and palette are all WeWatch's own,
// not that other client's branding). Bold typography hook with one accent word, ambient blurred
// background glow (no hard gradient edges), a run of real product screenshots each with a short
// caption underneath, a dark pill benefit callout, logo + CTA close.

const FONT = "'Arial Black', Arial, sans-serif";
const BODY_FONT = 'Arial, sans-serif';
const EASE = Easing.inOut(Easing.cubic);
const ei = (f: number, range: number[], out: number[]) =>
  interpolate(f, range, out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE });

const PURPLE = '#7C3AED';
const PURPLE_LIGHT = '#A78BFA';
const WHITE = '#ffffff';
const BG = '#0A0912';

const sp = (f: number, delay = 0) =>
  spring({ frame: f, fps: 30, delay, config: { damping: 22, mass: 0.9, stiffness: 120 } });

const BgLayer: React.FC = () => {
  const f = useCurrentFrame();
  const glowX = Math.sin(f / 100) * 70;
  const glowY = Math.cos(f / 120) * 50;
  return (
    <AbsoluteFill style={{ background: BG }}>
      <div style={{
        position: 'absolute', left: `calc(50% + ${glowX}px)`, top: `calc(24% + ${glowY}px)`, width: 1100, height: 1100,
        transform: 'translate(-50%,-50%)', borderRadius: '50%', opacity: 0.3,
        background: `radial-gradient(circle, ${PURPLE} 0%, transparent 65%)`,
        filter: 'blur(10px)',
      }} />
      <div style={{
        position: 'absolute', left: '50%', bottom: '10%', width: 800, height: 800,
        transform: 'translate(-50%,50%)', borderRadius: '50%', opacity: 0.16,
        background: `radial-gradient(circle, #4338CA 0%, transparent 65%)`,
      }} />
    </AbsoluteFill>
  );
};

// ── timing (30fps) ────────────────────────────────────────────────────────
// Tightened ~20% vs the original cut — the Рассказчик voiceover is 16s but the video ran 24s,
// leaving an 8s silent tail after the voice finished ("video lags behind the voice"). Scaling
// every beat down keeps the same relative pacing/proportions, just compressed to actually finish
// close to when the voiceover does instead of dragging on after it.
const HOOK_END       = 60;
const PAIN_START     = 44;
const PAIN_END        = 128;
const DEMO_START      = 128;
const SCREEN_DUR      = 80; // per phone screen
const DEMO_SCREENS: Array<{ src: string; caption: string }> = [
  { src: 'mockup-home.png',       caption: 'Любой фильм — в одном месте' },
  { src: 'mockup-watchparty.png', caption: 'Комната для друзей — за 10 секунд' },
  { src: 'mockup-login.png',      caption: 'Вход в 1 клик — без пароля' },
];
const DEMO_END = DEMO_START + DEMO_SCREENS.length * SCREEN_DUR;
const BENEFIT_START = DEMO_END;
const BENEFIT_END    = BENEFIT_START + 71;
const CTA_START       = BENEFIT_END;
const CTA_END         = CTA_START + 110;
export const FAST_DEMO_DURATION = CTA_END;

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const op = ei(f, [0, 14, HOOK_END - 14, HOOK_END], [0, 1, 1, 0]);
  const p = sp(f, 0);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: op, padding: '0 90px', textAlign: 'center' }}>
      <div style={{ fontSize: 60, color: WHITE, fontFamily: FONT, fontWeight: 900, lineHeight: 1.15, transform: `scale(${0.92 + p * 0.08})` }}>
        Сколько друзей должны<br /><span style={{ color: PURPLE_LIGHT }}>ЖДАТЬ</span>, пока ты найдёшь фильм?
      </div>
    </div>
  );
};

const Pain: React.FC = () => {
  const f = useCurrentFrame();
  const local = f - PAIN_START;
  const op = ei(f, [PAIN_START, PAIN_START + 14, PAIN_END - 16, PAIN_END], [0, 1, 1, 0]);
  const p1 = sp(Math.max(local, 0), 0);
  const p2 = sp(Math.max(local - 25, 0), 0);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: op, padding: '0 90px', textAlign: 'center', gap: 20 }}>
      <div style={{ fontSize: 44, color: 'rgba(255,255,255,0.5)', fontFamily: BODY_FONT, opacity: p1 }}>
        Если ответ —
      </div>
      <div style={{ fontSize: 56, color: WHITE, fontFamily: FONT, fontWeight: 900, lineHeight: 1.2, opacity: p1, transform: `translateY(${(1 - p1) * 16}px)` }}>
        20 минут в переписке 😩
      </div>
      <div style={{ fontSize: 40, color: 'rgba(255,255,255,0.5)', fontFamily: BODY_FONT, marginTop: 10, opacity: p2, transform: `translateY(${(1 - p2) * 16}px)` }}>
        ...и всё равно никто не согласен
      </div>
    </div>
  );
};

const DemoScreen: React.FC<{ src: string; caption: string }> = ({ src, caption }) => {
  const f = useCurrentFrame();
  const op = ei(f, [0, 14, SCREEN_DUR - 16, SCREEN_DUR], [0, 1, 1, 0]);
  const p = sp(f, 0);
  const rise = interpolate(p, [0, 1], [40, 0]);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: op, gap: 40 }}>
      <div style={{ transform: `translateY(${rise}px) scale(${0.9 + p * 0.1})`, filter: `drop-shadow(0 30px 70px ${PURPLE}55)` }}>
        <Img src={staticFile(src)} style={{ width: 460, height: 'auto', display: 'block' }} />
      </div>
      <div style={{ fontSize: 34, color: WHITE, fontFamily: FONT, fontWeight: 900, textAlign: 'center', padding: '0 60px' }}>
        {caption}
      </div>
    </div>
  );
};

const Benefit: React.FC = () => {
  const f = useCurrentFrame();
  const local = f - BENEFIT_START;
  const op = ei(f, [BENEFIT_START, BENEFIT_START + 14, BENEFIT_END - 14, BENEFIT_END], [0, 1, 1, 0]);
  const p = sp(Math.max(local, 0), 0);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: op }}>
      <div style={{
        transform: `scale(${0.85 + p * 0.15})`,
        border: `2px solid ${PURPLE_LIGHT}55`, borderRadius: 28,
        padding: '46px 60px', textAlign: 'center',
        background: 'rgba(124,58,237,0.08)',
      }}>
        <div style={{ fontSize: 50, color: PURPLE_LIGHT, fontFamily: FONT, fontWeight: 900, lineHeight: 1.2 }}>
          Бесплатно.<br />Без установки.
        </div>
        <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.5)', fontFamily: BODY_FONT, marginTop: 14 }}>
          Открой ссылку — и вы уже в комнате
        </div>
      </div>
    </div>
  );
};

const CTA: React.FC = () => {
  const f = useCurrentFrame();
  const local = f - CTA_START;
  const op = ei(f, [CTA_START, CTA_START + 14], [0, 1]);
  const p = sp(Math.max(local, 0), 8);
  const pulse = 1 + Math.sin(f / 12) * 0.02;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: op, gap: 28 }}>
      <div style={{ opacity: p, transform: `scale(${0.85 + p * 0.15})` }}>
        <Img src={staticFile('wewatch-logo-dark.svg')} style={{ width: 240, height: 'auto' }} />
      </div>
      <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.55)', fontFamily: BODY_FONT, textAlign: 'center' }}>
        Приложение для совместного просмотра
      </div>
      <div style={{
        opacity: p, transform: `scale(${(0.9 + p * 0.1) * pulse})`,
        background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT})`,
        borderRadius: 100, padding: '20px 52px', marginTop: 10,
        fontSize: 34, color: WHITE, fontFamily: FONT, fontWeight: 900,
      }}>
        wewatch.uz
      </div>
    </div>
  );
};

export const FastDemoReel: React.FC<{ voiceoverSrc?: string }> = ({ voiceoverSrc }) => {
  return (
    <AbsoluteFill>
      {/* bg music kept deliberately quiet (0.14) for the whole reel — no dynamic ducking, just a
          conservative constant level low enough that the voiceover on top stays clearly audible
          without needing frame-by-frame volume automation. */}
      <Audio src={staticFile('audio/bg.mp3')} volume={0.14} />
      {voiceoverSrc && <Audio src={staticFile(voiceoverSrc)} volume={1} />}
      <BgLayer />
      <Sequence from={0}><Hook /></Sequence>
      <Sequence from={0}><Pain /></Sequence>
      {DEMO_SCREENS.map((s, i) => (
        <Sequence key={i} from={DEMO_START + i * SCREEN_DUR} durationInFrames={SCREEN_DUR}>
          <DemoScreen src={s.src} caption={s.caption} />
        </Sequence>
      ))}
      <Sequence from={0}><Benefit /></Sequence>
      <Sequence from={0}><CTA /></Sequence>
    </AbsoluteFill>
  );
};

export const FastDemoReelRasskazchik: React.FC = () => <FastDemoReel voiceoverSrc="audio/vo-rasskazchik.mp3" />;
export const FastDemoReelAnalitik: React.FC = () => <FastDemoReel voiceoverSrc="audio/vo-analitik.mp3" />;
export const FastDemoReelKisy: React.FC = () => <FastDemoReel voiceoverSrc="audio/vo-kisy.mp3" />;
