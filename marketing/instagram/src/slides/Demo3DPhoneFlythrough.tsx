import React, { Suspense } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, staticFile, Easing, interpolate } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { useLoader, useThree } from '@react-three/fiber';

// Proof-of-concept for a real 3D camera (perspective, dolly, orbit) via @remotion/three —
// everything else in this repo (W1-*, D1-D7 stories, the 8-slide explainer) is 2D CSS/spring
// animation. This is the first composition using an actual Three.js PerspectiveCamera instead
// of translateX/Y/scale — genuine depth and parallax, not a CSS illusion of it.

const ease = (frame: number, from: number, to: number, delay = 0, duration = 24) =>
  interpolate(frame, [delay, delay + duration], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

const PHONE_ASPECT = 1011 / 500; // mockup-watchparty.png native size

const PhonePlane: React.FC = () => {
  const texture = useLoader(THREE.TextureLoader, staticFile('mockup-watchparty.png'));
  const width = 1.3;
  const height = width * PHONE_ASPECT;
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
};

// Soft purple glow behind the phone — a second, slower-moving layer is what actually sells
// depth in a 3D scene (the phone reads as "in front of" something, not floating on a flat backdrop).
const GlowPlane: React.FC<{ frame: number }> = ({ frame }) => {
  const drift = Math.sin(frame * 0.02) * 0.3;
  return (
    <mesh position={[drift, 0.2, -2.4]}>
      <circleGeometry args={[2.6, 64]} />
      <meshBasicMaterial color="#7C3AED" transparent opacity={0.22} toneMapped={false} />
    </mesh>
  );
};

// No drei available (not installed) — animate the default camera imperatively via useThree()
// instead of drei's <PerspectiveCamera makeDefault>. Remotion re-renders this whole tree fresh
// on every sampled frame (frameloop="never" during render), so mutating camera.position/fov
// here and calling lookAt() runs exactly once per frame, in sync with useCurrentFrame().
const CameraRig: React.FC<{ frame: number; durationInFrames: number }> = ({ frame, durationInFrames }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;

  const introEnd = 36;
  const camZ = ease(frame, 7.5, 4.4, 0, introEnd);
  const camY = ease(frame, 0.9, 0.2, 0, introEnd);
  const orbitAngle = interpolate(frame, [0, durationInFrames], [-0.5, 0.4], {
    easing: Easing.inOut(Easing.sin),
  });
  const camX = Math.sin(orbitAngle) * (frame < introEnd ? ease(frame, 1.8, 1.1, 0, introEnd) : 1.1);
  const fov = ease(frame, 30, 25, 0, introEnd);

  camera.position.set(camX, camY, camZ);
  camera.fov = fov;
  camera.lookAt(0, 0.1, 0);
  camera.updateProjectionMatrix();

  return null;
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <>
      <CameraRig frame={frame} durationInFrames={durationInFrames} />
      <ambientLight intensity={1.4} />
      <Suspense fallback={null}>
        <GlowPlane frame={frame} />
        <PhonePlane />
      </Suspense>
    </>
  );
};

export const Demo3DPhoneFlythrough: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a0938 0%, #0a0014 70%)' }}>
      <ThreeCanvas width={width} height={height} linear>
        <Scene />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const DEMO_3D_DURATION = 5 * 30;
