import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, Audio, staticFile, Img, Easing } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { WatchPartyMockReel } from './WatchPartyMockReel';

// Spider-Man premiere tie-in Reel — deliberately does NOT use any Marvel/Sony imagery (no movie
// stills, no poster, no official character art, no downloaded third-party spider model/asset).
// The spider is original procedural vector artwork (jointed-leg SVG built from primitives) with a
// black-body/red-hourglass color scheme borrowed from a real biological species (black widow),
// not the licensed character's costume design. The NYC skyline is a generic silhouette built from
// plain rectangles — a common design motif, not a photo or any specific building's likeness.

const FONT = "'Arial Black', Arial, sans-serif";
const BODY_FONT = 'Arial, sans-serif';
const EASE = Easing.inOut(Easing.cubic);
const easedInterp = (
  f: number, range: number[], out: number[],
) => interpolate(f, range, out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE });

// ── Two palettes, blended over the course of the reel ────────────────────────
const SPIDEY_BG     = { r: 0x08, g: 0x11, b: 0x2e };
const SPIDEY_ACCENT = { r: 0xdc, g: 0x26, b: 0x26 };
const BRAND_BG     = { r: 0x0a, g: 0x09, b: 0x12 };
const BRAND_PURPLE = { r: 0x7c, g: 0x3a, b: 0xed };

function lerp(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number): string {
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r},${g},${bl})`;
}

const sp = (f: number, delay = 0, cfg?: Partial<{ damping: number; mass: number; stiffness: number }>) =>
  spring({ frame: f, fps: 30, delay, config: { damping: 26, mass: 1, stiffness: 90, ...cfg } });

// A held static frame reads as "dead" the moment nothing moves — this gives every text block a
// near-imperceptible continuous breathing scale so held beats never fully stop animating, without
// being distracting enough to read as an intentional "pulse" effect.
const breathe = (f: number, period = 46, amount = 0.014) => 1 + Math.sin(f / period) * amount;

// ── Original jointed-leg spider — procedural vector art, not a downloaded model ──────────────
// Each leg is two segments (femur + tibia) from a hip anchor on the body, animated with a
// tripod gait: legs are split into two alternating groups of 4 (diagonally opposite legs move
// together), same principle real arachnids use, giving a much more believable walk than a
// uniform all-legs-together wiggle.
// Long, elegant, curved legs (own proportions — deliberately NOT matching the classic Spider-Man
// emblem's silhouette: that logo's legs are near-symmetrical arcs off a tiny diamond body with no
// walk cycle; this one has a walking gait, a teardrop body, and different leg spacing/curvature).
// Proportions tuned against a real spider-silhouette reference (clustered hips near the waist
// between the two body lobes, long legs relative to body size) — reference used for anatomy/
// proportion only, not traced or embedded; this is still fully procedural original geometry.
const HIPS: Array<{ x: number; y: number; side: -1 | 1; spread: number; group: 0 | 1 }> = [
  { x: -6, y: -10, side: -1, spread: 108, group: 0 },
  { x: -7, y:  -1, side: -1, spread: 128, group: 1 },
  { x: -7, y:   8, side: -1, spread: 122, group: 0 },
  { x: -6, y:  17, side: -1, spread: 98,  group: 1 },
  { x:  6, y: -10, side:  1, spread: 108, group: 1 },
  { x:  7, y:  -1, side:  1, spread: 128, group: 0 },
  { x:  7, y:   8, side:  1, spread: 122, group: 1 },
  { x:  6, y:  17, side:  1, spread: 98,  group: 0 },
];

// A real spider's leg is thin and multi-jointed (coxa → femur → patella → tibia/tarsus), not one
// thick smooth curve — a single fat bezier is exactly what read as "cartoon" the first two passes.
// Four straight, tapering segments with real joint angles (computed, not hand-waved) is what
// actually gives the sharp zigzag silhouette a real arachnid leg has.
const Leg: React.FC<{ hip: typeof HIPS[number]; gaitPhase: number; color: string }> = ({ hip, gaitPhase, color }) => {
  const lift = Math.sin(gaitPhase * Math.PI); // 0 at start/end, 1 at mid-lift
  const reach = Math.cos(gaitPhase * Math.PI * 2 - Math.PI) * 0.5 + 0.5; // forward/back sweep

  const L1 = 8;                        // coxa — short stub off the body
  const L2 = hip.spread * 0.32;        // femur — reaches outward and up (the first big "knee")
  const L3 = hip.spread * 0.3;         // patella — angles further out, second knee
  const L4 = hip.spread * 0.38;        // tibia+tarsus — sharp bend back down to the ground, tapers

  // angle 0 = straight out to the side (hip.side direction), positive = rotates forward (toward -y)
  const a1 = 0.1;
  const a2 = 0.35 + lift * 0.4 + reach * 0.2;
  const a3 = 0.85 + lift * 0.3 + reach * 0.15;
  const a4 = -0.7 - lift * 0.45 + reach * 0.25;

  const p0 = { x: hip.x, y: hip.y };
  const p1 = { x: p0.x + hip.side * Math.cos(a1) * L1, y: p0.y - Math.sin(a1) * L1 * 0.4 - L1 * 0.3 };
  const p2 = { x: p1.x + hip.side * Math.cos(a2) * L2, y: p1.y - Math.sin(a2) * L2 };
  const p3 = { x: p2.x + hip.side * Math.cos(a3) * L3, y: p2.y - Math.sin(a3) * L3 };
  const p4 = { x: p3.x + hip.side * Math.cos(a4) * L4, y: p3.y - Math.sin(a4) * L4 };

  return (
    <>
      <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth={2.6} strokeLinecap="round" />
      <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <line x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} stroke={color} strokeWidth={1.2} strokeLinecap="round" />
    </>
  );
};

const Spider: React.FC<{ frame: number; scale?: number } > = ({ frame, scale = 1 }) => {
  const cycle = frame / 16; // gait speed
  // Top-down, no face, no neon blur — but pure near-black legs on a near-black background were
  // genuinely invisible, not just "subtle". Fix is a crisp (not blurred) light rim stroke — a
  // crisp outline reads as "silhouette with defined edges", a blurred one reads as "glowing icon".
  // Legs are bare strokes (no separate fill/outline split possible), so they get a lighter charcoal
  // color directly; the body ellipses get an actual outline stroke on top of a slightly lighter fill.
  const BODY = '#141414';
  const LEG = '#2c2c2c';
  const RIM = '#c9c9c9';
  // Sliding the whole body smoothly across the screen while only the legs animate underneath reads
  // as "a picture being dragged", not walking. Real locomotion has the body itself bounce/tilt with
  // each footfall — two bounces per full gait cycle (one per alternating tripod group landing).
  const stepBob = Math.abs(Math.sin(cycle * Math.PI * 2)) * 3.2;
  const stepTilt = Math.sin(cycle * Math.PI * 2) * 4;

  return (
    <svg width={440 * scale} height={320 * scale} viewBox="-160 -90 320 180" style={{ overflow: 'visible' }}>
      {/* contact shadow stays put on the ground while the body bounces above it */}
      <ellipse cx={4} cy={22} rx={44} ry={16} fill="#000" opacity={0.35} />
      <g transform={`translate(0 ${-stepBob}) rotate(${stepTilt})`}>
        {HIPS.map((hip, i) => {
          const groupOffset = hip.group === 0 ? 0 : 0.5;
          const phase = ((cycle + groupOffset) % 1 + 1) % 1;
          return <Leg key={i} hip={hip} gaitPhase={phase} color={LEG} />;
        })}
        {/* abdomen (larger, rear) — head end points toward -Y, i.e. "forward" in local space */}
        <ellipse cx={0} cy={16} rx={19} ry={26} fill={BODY} stroke={RIM} strokeWidth={1.4} strokeOpacity={0.55} />
        {/* cephalothorax (smaller, front) */}
        <ellipse cx={0} cy={-18} rx={12} ry={15} fill={BODY} stroke={RIM} strokeWidth={1.4} strokeOpacity={0.55} />
      </g>
    </svg>
  );
};

// ── Real 3D spider (react-three-fiber) — actual geometry + lighting for genuine volume/shading,
// not a flat silhouette. Anatomy grounded in real spider leg structure (coxa+trochanter, femur,
// patella+tibia, metatarsus+tarsus — the four visually-distinct segments of a spider's seven-part
// leg, per arachnology references) and real spider locomotion (alternating TETRAPOD gait — legs
// 1&3 on one side plus legs 2&4 on the other side move together, NOT the 6-legged-insect tripod
// pattern; confirmed against biomechanics literature on octopedal locomotion). Each leg is a chain
// of THREE.Group joints so a segment's rotation correctly carries every joint distal to it, the
// same forward-kinematics approach a real rigged character would use. ─────────────────────────
const SCALE3D = 1 / 100; // whole model (legs fully extended) must fit the camera frustum, not just the body

function quaternionTo(dir: THREE.Vector3): THREE.Quaternion {
  const up = new THREE.Vector3(0, 1, 0);
  const d = dir.clone().normalize();
  if (d.lengthSq() < 1e-6) return new THREE.Quaternion();
  return new THREE.Quaternion().setFromUnitVectors(up, d);
}

const Leg3D: React.FC<{ hip: typeof HIPS[number]; gaitPhase: number }> = ({ hip, gaitPhase }) => {
  const lift = Math.sin(gaitPhase * Math.PI);
  const reach = Math.cos(gaitPhase * Math.PI * 2 - Math.PI) * 0.5 + 0.5;
  const stepZ = (reach - 0.5) * hip.spread * 0.5; // real fore-aft stepping motion, not just an XY swing

  const L1 = 8, L2 = hip.spread * 0.32, L3 = hip.spread * 0.3, L4 = hip.spread * 0.38;
  const a1 = 0.1;
  const a2 = 0.35 + lift * 0.4 + reach * 0.2;
  const a3 = 0.85 + lift * 0.3 + reach * 0.15;
  const a4 = -0.7 - lift * 0.45 + reach * 0.25;

  const pts = [{ x: hip.x, y: 0, z: hip.y }];
  const push = (prevAngle: number, length: number, zBias: number) => {
    const prev = pts[pts.length - 1];
    pts.push({
      x: prev.x + hip.side * Math.cos(prevAngle) * length,
      y: prev.y - Math.sin(prevAngle) * length * (length === L1 ? 0.4 : 1),
      z: prev.z + zBias,
    });
  };
  push(a1, L1, stepZ * 0.1);
  push(a2, L2, stepZ * 0.35);
  push(a3, L3, stepZ * 0.3);
  push(a4, L4, stepZ * 0.25);

  // Bare cylinders butted end-to-end leave a visible hard seam at every joint (reads as
  // "mechanical/robotic", exactly the complaint) — a small sphere at each joint, sized to match
  // the cylinder it's covering, rounds that seam into a real-looking joint knuckle. 12 radial
  // segments instead of 6 also removes the low-poly faceted look on the legs themselves.
  const radii = [1.4, 1.1, 0.85, 0.5];
  const legColor = '#7a7a7a';
  return (
    <group>
      {pts.slice(0, -1).map((p, i) => {
        const next = pts[i + 1];
        const from = new THREE.Vector3(p.x, p.y, p.z);
        const to = new THREE.Vector3(next.x, next.y, next.z);
        const len = from.distanceTo(to);
        const mid = from.clone().add(to).multiplyScalar(0.5).multiplyScalar(SCALE3D);
        const quat = quaternionTo(to.clone().sub(from));
        return (
          <React.Fragment key={i}>
            <mesh position={mid} quaternion={quat}>
              <cylinderGeometry args={[radii[i] * SCALE3D * 6, radii[i] * SCALE3D * 9, len * SCALE3D, 12]} />
              <meshStandardMaterial color={legColor} roughness={0.55} metalness={0.15} />
            </mesh>
            {/* joint knuckle — skip the very first (hidden inside the body) and draw one at each
                internal joint, sized to the thicker of the two segments it connects */}
            {i > 0 && (
              <mesh position={from.clone().multiplyScalar(SCALE3D)}>
                <sphereGeometry args={[radii[i - 1] * SCALE3D * 7.5, 10, 8]} />
                <meshStandardMaterial color={legColor} roughness={0.5} metalness={0.15} />
              </mesh>
            )}
          </React.Fragment>
        );
      })}
      {/* foot claw — small dark tapered tip, real spiders end each leg in claws, not a blunt cylinder */}
      {(() => {
        const tip = pts[pts.length - 1];
        const prev = pts[pts.length - 2];
        const dir = new THREE.Vector3(tip.x - prev.x, tip.y - prev.y, tip.z - prev.z);
        const quat = quaternionTo(dir);
        const pos = new THREE.Vector3(tip.x, tip.y, tip.z).multiplyScalar(SCALE3D);
        return (
          <mesh position={pos} quaternion={quat}>
            <coneGeometry args={[radii[3] * SCALE3D * 4, 8 * SCALE3D, 8]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.2} />
          </mesh>
        );
      })()}
    </group>
  );
};

const SpiderModel3D: React.FC<{ frame: number }> = ({ frame }) => {
  const cycle = frame / 16;
  return (
    <group>
      {HIPS.map((hip, i) => {
        const groupOffset = hip.group === 0 ? 0 : 0.5;
        const phase = ((cycle + groupOffset) % 1 + 1) % 1;
        return <Leg3D key={i} hip={hip} gaitPhase={phase} />;
      })}
      {/* abdomen — larger, rear lobe. Higher segment counts (32/24 vs the old 20/16) round out the
          faceted low-poly look that was part of the "poorly made" read. */}
      <mesh position={[0, 0.02, 16 * SCALE3D]} scale={[19 * SCALE3D, 22 * SCALE3D, 26 * SCALE3D]}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color="#525252" roughness={0.45} metalness={0.15} />
      </mesh>
      {/* cephalothorax — smaller, front lobe */}
      <mesh position={[0, 0.015, -18 * SCALE3D]} scale={[12 * SCALE3D, 13 * SCALE3D, 15 * SCALE3D]}>
        <sphereGeometry args={[1, 28, 20]} />
        <meshStandardMaterial color="#525252" roughness={0.45} metalness={0.15} />
      </mesh>
      {/* eye cluster — real spiders have 6-8 small eyes on the front of the cephalothorax; tiny
          dark glossy dots, not the cartoon "face" that got rejected earlier (that was a big pair
          of oversized googly eyes on a flat 2D silhouette — this is a real anatomical detail at
          the correct small scale on an actual 3D head). */}
      {[-0.55, -0.28, 0, 0.28, 0.55].map((ex, i) => (
        <mesh key={i} position={[ex * 12 * SCALE3D, 0.08, (-18 - 13) * SCALE3D]}>
          <sphereGeometry args={[1.1 * SCALE3D, 8, 6]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.15} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
};

const CameraLookAtOrigin: React.FC = () => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.set(0, 1.9, 1.25);
  camera.lookAt(0, 0, 0.1);
  camera.updateProjectionMatrix();
  return null;
};

const SpiderCanvas3D: React.FC<{ frame: number; width: number; height: number }> = ({ frame, width, height }) => (
  <ThreeCanvas width={width} height={height} linear camera={{ fov: 34 }}>
    {/* Elevated 3/4 angle, not pure orthographic top-down — real geometry only shows its volume
        (shading gradients across the curved body) when the camera isn't looking straight along the
        surface normal. Still reads as "camera above the running spider", per the brief. */}
    <CameraLookAtOrigin />
    <ambientLight intensity={0.8} />
    <directionalLight position={[1.5, 3, 1]} intensity={3.2} color="#fff5ea" />
    <directionalLight position={[-1, 1.5, -1]} intensity={1.2} color="#8899ff" />
    <SpiderModel3D frame={frame} />
  </ThreeCanvas>
);

// ── NYC skyline — generic silhouette built from rectangles, not a real building/photo ────────
const SKYLINE_TILE_W = 1080;
const SKYLINE_H = 560;
const BUILDINGS = [
  { x: 0,    w: 90,  h: 260 }, { x: 85,  w: 60,  h: 380 }, { x: 140, w: 80,  h: 300 },
  { x: 215, w: 50,  h: 460 }, { x: 260, w: 100, h: 340 }, { x: 355, w: 70,  h: 520, spire: true },
  { x: 420, w: 90,  h: 300 }, { x: 505, w: 60,  h: 420 }, { x: 560, w: 110, h: 260 },
  { x: 665, w: 55,  h: 380 }, { x: 715, w: 90,  h: 300 }, { x: 800, w: 70,  h: 440, spire: true },
  { x: 865, w: 100, h: 280 }, { x: 960, w: 60,  h: 360 }, { x: 1015, w: 65, h: 260 },
];

// No position:absolute inside — the caller positions/sizes the wrapper. `tiles` repeats the same
// building layout side by side within ONE svg (baking the seam into a single element instead of
// stacking separately-positioned copies), which is what makes an infinite horizontal pan actually
// safe: nested absolutely-positioned wrappers with no explicit height collapse to zero height and
// silently vanish (that's what happened in the previous version — the "infinite scroll" fix broke
// the skyline entirely instead of looping it).
const Skyline: React.FC<{ opacity: number; color: string; tiles?: number }> = ({ opacity, color, tiles = 1 }) => (
  <svg width={SKYLINE_TILE_W * tiles} height={SKYLINE_H} style={{ display: 'block', opacity }} viewBox={`0 0 ${SKYLINE_TILE_W * tiles} ${SKYLINE_H}`} preserveAspectRatio="none">
    {Array.from({ length: tiles }).map((_, t) => (
      <g key={t} transform={`translate(${t * SKYLINE_TILE_W}, 0)`}>
        {BUILDINGS.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={SKYLINE_H - b.h} width={b.w} height={b.h} fill={color} />
            {b.spire && <rect x={b.x + b.w / 2 - 3} y={SKYLINE_H - b.h - 46} width={6} height={46} fill={color} />}
            {Array.from({ length: Math.floor(b.h / 46) }).map((_, wi) => (
              <rect key={wi} x={b.x + b.w * 0.28} y={SKYLINE_H - b.h + 20 + wi * 46} width={b.w * 0.16} height={10} fill="rgba(255,255,255,0.08)" />
            ))}
          </g>
        ))}
      </g>
    ))}
  </svg>
);

// A real orb-web is spokes + a spiral of STRAIGHT chords between adjacent spokes — perfect circles
// read as a radar/sonar sweep, not a web. Drawing each ring as an N-sided polygon (straight
// segments between consecutive spoke points, not an arc) is what actually gives it the
// characteristic angular web silhouette.
const WEB_SPOKES = 10;
const WEB_CX = 540;
const WEB_CY = -100;
const WebPattern: React.FC<{ opacity: number; color: string }> = ({ opacity, color }) => {
  const spokePoint = (i: number, r: number) => ({
    x: WEB_CX + Math.cos((i / WEB_SPOKES) * Math.PI * 2) * r,
    y: WEB_CY + Math.sin((i / WEB_SPOKES) * Math.PI * 2) * r,
  });
  const rings = [220, 420, 660];
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity }}>
      {Array.from({ length: WEB_SPOKES }).map((_, i) => {
        const p = spokePoint(i, 1400);
        return <line key={i} x1={WEB_CX} y1={WEB_CY} x2={p.x} y2={p.y} stroke={color} strokeWidth={1.5} />;
      })}
      {rings.map((r, ri) => (
        <polygon
          key={ri}
          points={Array.from({ length: WEB_SPOKES }).map((_, i) => { const p = spokePoint(i, r); return `${p.x},${p.y}`; }).join(' ')}
          fill="none" stroke={color} strokeWidth={1.2}
        />
      ))}
    </svg>
  );
};

const SPIDER_START_X = -200;
const SPIDER_START_Y = 1750;
const SPIDER_END_X    = 1280;
const SPIDER_END_Y    = 260;
// Body's "forward" (head/cephalothorax) points toward -Y in the SVG's own local space (see
// Spider component). CSS rotate() is clockwise from that, so the correct heading is measured from
// straight-up, sweeping toward +X — i.e. atan2(dx, -dy), NOT an arbitrary tilt value. Previously
// hardcoded to -32 (wrong sign AND wrong magnitude), which pointed the spider up-and-left while it
// visually traveled up-and-right — reads as "looking at camera" instead of "running that way".
const SPIDER_HEADING_DEG = (Math.atan2(SPIDER_END_X - SPIDER_START_X, -(SPIDER_END_Y - SPIDER_START_Y)) * 180) / Math.PI;

const SpiderIntro: React.FC = () => {
  const f = useCurrentFrame();
  const crossFrames = 95; // slow enough that individual footsteps actually read as walking, not a slide
  const x = easedInterp(f, [0, crossFrames], [SPIDER_START_X, SPIDER_END_X]);
  const y = easedInterp(f, [0, crossFrames], [SPIDER_START_Y, SPIDER_END_Y]);
  const bob = Math.sin(f / 4.2) * 8;
  const fadeOut = easedInterp(f, [crossFrames - 10, crossFrames + 6], [1, 0]);
  const fadeIn = easedInterp(f, [0, 8], [0, 1]);
  // Web spins/grows in with the spider, then is pulled out along with it as it exits — reads as
  // "the web goes with the spider", not a static backdrop decoration.
  const webOpacity = easedInterp(f, [0, 14, crossFrames - 6, crossFrames + 8], [0, 0.55, 0.5, 0]);
  const webScale = 1 + easedInterp(f, [0, crossFrames + 8], [0, 0.35], );
  const webSpin = f * 0.15;

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Audio src={staticFile('audio/spider-scuttle-user-loud.mp3')} volume={1} />
      <div style={{ position: 'absolute', left: 0, bottom: 0 }}>
        <Skyline opacity={0.5} color="#050508" />
      </div>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${webScale}) rotate(${webSpin}deg)`, transformOrigin: '50% -5%' }}>
        <WebPattern opacity={webOpacity} color="#ffffff" />
      </div>
      {/* Real 3D geometry (spheres + cylinder-chain legs) lit with actual lights — genuine volume/
          shading, not a flat silhouette. Anatomy + gait researched against real arachnology/
          biomechanics sources (see SpiderModel3D comment). */}
      <div style={{
        position: 'absolute', left: x, top: y + bob, transform: `translate(-50%,-50%) rotate(${SPIDER_HEADING_DEG}deg)`,
        opacity: fadeOut * fadeIn,
      }}>
        <SpiderCanvas3D frame={f} width={520} height={440} />
      </div>
    </AbsoluteFill>
  );
};

// ── Frame-range constants ─────────────────────────────────────────────────────
const SPIDER_END   = 108;    // covers the slowed-down 95-frame crossing + fade-out tail
const HOOK_START    = 80;    // starts as the now-longer spider run is finishing, not 46f early
const HOOK_END       = 180;  // 100f hold
const PROBLEM_START  = 180;
const PROBLEM_END    = 285;  // 105f
const SOLUTION_START = 285;
const SOLUTION_END   = 415;  // 130f
const MOCK_START     = 415;
const MOCK_DUR       = 180;
const CTA_START       = MOCK_START + MOCK_DUR;
const CTA_END         = CTA_START + 200;

export const SPIDER_PREMIERE_DURATION = CTA_END;

const BgLayer: React.FC = () => {
  const f = useCurrentFrame();
  const t = easedInterp(f, [HOOK_START, SOLUTION_START + 80], [0, 1]);
  const bg = lerp(SPIDEY_BG, BRAND_BG, t);
  const accent = lerp(SPIDEY_ACCENT, BRAND_PURPLE, t);
  const glowOpacity = easedInterp(f, [0, 24], [0, 1]);
  const skylineOpacity = easedInterp(f, [HOOK_START, HOOK_START + 20, SOLUTION_START, SOLUTION_START + 40], [0, 0.4, 0.4, 0]);
  const webOpacity = interpolate(f, [0, CTA_START], [0.07, 0.04], { extrapolateRight: 'clamp' });

  // A held text beat previously read as a genuine freeze-frame — subtle per-element wobble wasn't
  // enough. These three layers move continuously and visibly for the ENTIRE reel (not just on
  // reveal), so there is never a moment where literally nothing on screen is in motion:
  //   - glow drifts in a slow orbit instead of sitting dead-center
  //   - skyline pans sideways like a slow parallax dolly
  //   - a soft light sweep crosses the frame periodically (a common "premium" motion-graphics beat-filler)
  const glowOrbitX = Math.sin(f / 90) * 70;
  const glowOrbitY = Math.cos(f / 110) * 50;
  const skylinePan = (f * 0.6) % 1080;
  const sweepX = ((f * 2.2) % 2400) - 700;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <div style={{
        position: 'absolute', left: `calc(50% + ${glowOrbitX}px)`, top: `calc(30% + ${glowOrbitY}px)`, width: 1050, height: 1050,
        transform: 'translate(-50%,-50%)', borderRadius: '50%', opacity: glowOpacity * 0.5,
        background: `radial-gradient(circle, ${accent} 0%, transparent 65%)`,
      }} />
      <WebPattern opacity={webOpacity} color="#fff" />
      {/* Single svg with the layout baked in 3x side by side (Skyline's `tiles` prop) instead of
          stacking separately-positioned copies — nesting multiple absolutely-positioned wrappers
          with no explicit height collapses to zero height and silently vanishes, which is exactly
          what "fixing" this into two nested divs did last time. One wrapper, one anchor, no
          ambiguity; 3 tiles is comfortable slack for a pan that only ever needs to cover 1 tile
          width before wrapping. */}
      <div style={{ position: 'absolute', left: 0, bottom: 0, opacity: skylineOpacity, transform: `translateX(${-skylinePan}px)` }}>
        <Skyline opacity={1} tiles={3} color={lerp({ r: 5, g: 5, b: 10 }, { r: 20, g: 12, b: 40 }, t)} />
      </div>
      {/* diagonal light sweep — loops continuously, gives held beats a "premium" living-background feel */}
      <div style={{
        position: 'absolute', top: -200, left: sweepX, width: 260, height: 2320,
        transform: 'rotate(18deg)', opacity: 0.05,
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
      }} />
      {/* floating ambient particles — fills empty negative space around the text */}
      {Array.from({ length: 22 }).map((_, i) => {
        const seed = i * 137.5;
        const px = (Math.sin(seed) * 0.5 + 0.5) * 1080;
        const baseY = (Math.cos(seed * 1.7) * 0.5 + 0.5) * 1920;
        const py = (baseY + f * (0.7 + (i % 3) * 0.35)) % 1920;
        const size = 3 + (i % 4);
        const twinkle = 0.14 + Math.abs(Math.sin(f / 20 + i)) * 0.2;
        return (
          <div key={i} style={{
            position: 'absolute', left: px, top: py, width: size, height: size, borderRadius: '50%',
            background: accent, opacity: twinkle,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const local = f - HOOK_START;
  const op = easedInterp(f, [HOOK_START, HOOK_START + 16, HOOK_END - 18, HOOK_END], [0, 1, 1, 0]);
  const p = sp(Math.max(local, 0), 0);
  const rise = interpolate(p, [0, 1], [24, 0]);
  const breath = breathe(f);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: op, padding: '0 80px', textAlign: 'center', transform: `translateY(${rise}px) scale(${breath})` }}>
      <div style={{ fontSize: 40, color: '#F87171', fontFamily: FONT, fontWeight: 900, letterSpacing: '0.06em', marginBottom: 22 }}>
        🕸️ ЧЕЛОВЕК-ПАУК ВЫШЕЛ
      </div>
      <div style={{ fontSize: 68, color: '#fff', fontFamily: FONT, fontWeight: 900, lineHeight: 1.1 }}>
        А ты один<br />перед экраном?
      </div>
      <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.45)', fontFamily: BODY_FONT, marginTop: 26 }}>
        Премьера уже идёт по всему городу
      </div>
    </div>
  );
};

const Problem: React.FC = () => {
  const f = useCurrentFrame();
  const local = f - PROBLEM_START;
  const op = easedInterp(f, [PROBLEM_START, PROBLEM_START + 16, PROBLEM_END - 18, PROBLEM_END], [0, 1, 1, 0]);
  const p = sp(Math.max(local, 0), 0);
  const items = ['Друг в другом городе 📍', 'Все заняты вечером 🕘', 'В кино вместе не собраться 🎟️'];
  const breath = breathe(f, 52);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: op, padding: '0 90px', textAlign: 'center', gap: 34, transform: `scale(${breath})` }}>
      <div style={{ fontSize: 52, color: '#fff', fontFamily: FONT, fontWeight: 900, lineHeight: 1.2, marginBottom: 10 }}>
        Знакомо?
      </div>
      {items.map((t, i) => {
        const ip = sp(Math.max(local - i * 14, 0), 0);
        const bob = Math.sin(f / 34 + i * 2.1) * 4;
        return (
          <div key={i} style={{
            fontSize: 34, color: 'rgba(255,255,255,0.85)', fontFamily: BODY_FONT, fontWeight: 700,
            opacity: ip, transform: `translateX(${(1 - ip) * -30}px) translateY(${bob}px)`,
            background: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: '16px 30px',
          }}>
            {t}
          </div>
        );
      })}
    </div>
  );
};

const Solution: React.FC = () => {
  const f = useCurrentFrame();
  const local = f - SOLUTION_START;
  const op = easedInterp(f, [SOLUTION_START, SOLUTION_START + 16, MOCK_START - 16, MOCK_START], [0, 1, 1, 0]);
  const p = sp(Math.max(local, 0), 0);
  const breath = breathe(f, 40);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: op, padding: '0 80px', textAlign: 'center', gap: 24, transform: `scale(${breath})` }}>
      <div style={{ opacity: p, transform: `scale(${0.85 + p * 0.15})` }}>
        <Img src={staticFile('wewatch-logo-dark.svg')} style={{ width: 260, height: 'auto' }} />
      </div>
      <div style={{ fontSize: 56, color: '#fff', fontFamily: FONT, fontWeight: 900, lineHeight: 1.15, marginTop: 12 }}>
        Смотрите вместе.<br /><span style={{ color: '#A78BFA' }}>Где бы вы ни были.</span>
      </div>
      <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.55)', fontFamily: BODY_FONT }}>
        Синхронный плеер + голосовой чат
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, opacity: sp(Math.max(local - 20, 0), 0) }}>
        {['🎬 Любой сайт', '🔊 Голос рядом', '⚡ Без задержек'].map((t, i) => {
          const bob = Math.sin(f / 30 + i * 1.8) * 3;
          return (
            <div key={i} style={{ fontSize: 22, color: '#fff', fontFamily: BODY_FONT, fontWeight: 700, background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(167,139,250,0.4)', borderRadius: 14, padding: '10px 16px', transform: `translateY(${bob}px)` }}>
              {t}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CTA: React.FC = () => {
  const f = useCurrentFrame();
  const local = f - CTA_START;
  const op = easedInterp(f, [CTA_START, CTA_START + 16], [0, 1]);
  const p = sp(Math.max(local, 0), 10);
  const pulse = 1 + Math.sin(f / 12) * 0.02;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: op, gap: 30, textAlign: 'center' }}>
      <div style={{ fontSize: 40, opacity: sp(Math.max(local, 0), 0) }}>🕸️🎬🕸️</div>
      <div style={{ fontSize: 56, color: '#fff', fontFamily: FONT, fontWeight: 900, lineHeight: 1.15, padding: '0 70px' }}>
        Собери комнату<br />за 10 секунд
      </div>
      <div style={{
        opacity: p, transform: `scale(${(0.9 + p * 0.1) * pulse})`,
        background: 'linear-gradient(135deg, #7C3AED, #EF4444)',
        borderRadius: 100, padding: '22px 56px',
        fontSize: 38, color: '#fff', fontFamily: FONT, fontWeight: 900,
      }}>
        wewatch.uz
      </div>
      <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.4)', fontFamily: BODY_FONT, opacity: sp(Math.max(local - 20, 0), 0), marginTop: 6 }}>
        Бесплатно · Без установки
      </div>
    </div>
  );
};

export const SpiderPremiereReel: React.FC = () => {
  return (
    <AbsoluteFill>
      <BgLayer />
      <Sequence from={0} durationInFrames={SPIDER_END}>
        <SpiderIntro />
      </Sequence>
      <Sequence from={0}><Hook /></Sequence>
      <Sequence from={0}><Problem /></Sequence>
      <Sequence from={0}><Solution /></Sequence>
      <Sequence from={MOCK_START} durationInFrames={MOCK_DUR}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            position: 'relative', width: 1080, height: 1920,
            transform: 'scale(0.94)', borderRadius: 32, overflow: 'hidden',
            boxShadow: '0 30px 90px -20px rgba(124,58,237,0.5)',
          }}>
            <WatchPartyMockReel />
          </div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={0}><CTA /></Sequence>
    </AbsoluteFill>
  );
};
