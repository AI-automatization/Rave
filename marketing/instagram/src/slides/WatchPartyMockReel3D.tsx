import React, { Suspense } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, staticFile, Easing, interpolate } from 'remotion';
import { ThreeCanvas, useOffthreadVideoTexture } from '@remotion/three';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { WATCH_PARTY_MOCK_DURATION } from './WatchPartyMockReel';

// Same real 3D camera rig as Demo3DPhoneFlythrough, but the "phone" is a LIVE video texture
// (the hand-drawn WatchPartyMockReel, pre-rendered to mp4) instead of a static screenshot —
// so the UI is actually animating (messages, emoji, play/pause) while the camera moves through
// real 3D space around it.
const ease = (frame: number, from: number, to: number, delay = 0, duration = 24) =>
  interpolate(frame, [delay, delay + duration], [from, to], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  });

const PHONE_ASPECT = 1920 / 1080; // WatchPartyMockReel composition size

const PhoneVideoPlane: React.FC<{ src: string }> = ({ src }) => {
  const texture = useOffthreadVideoTexture({ src });
  const width = 1.3;
  const height = width * PHONE_ASPECT;
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      {texture ? <meshBasicMaterial map={texture} toneMapped={false} /> : null}
    </mesh>
  );
};

const GlowPlane: React.FC<{ frame: number }> = ({ frame }) => {
  const drift = Math.sin(frame * 0.02) * 0.3;
  return (
    <mesh position={[drift, 0.2, -2.4]}>
      <circleGeometry args={[2.6, 64]} />
      <meshBasicMaterial color="#7C3AED" transparent opacity={0.22} toneMapped={false} />
    </mesh>
  );
};

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

const Scene: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <>
      <CameraRig frame={frame} durationInFrames={durationInFrames} />
      <ambientLight intensity={1.4} />
      <Suspense fallback={null}>
        <GlowPlane frame={frame} />
        <PhoneVideoPlane src={src} />
      </Suspense>
    </>
  );
};

export const WatchPartyMockReel3D: React.FC = () => {
  const { width, height } = useVideoConfig();
  const src = staticFile('watchparty-mock-2d.mp4');
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a0938 0%, #0a0014 70%)' }}>
      <ThreeCanvas width={width} height={height} linear>
        <Scene src={src} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const WATCH_PARTY_MOCK_3D_DURATION = WATCH_PARTY_MOCK_DURATION;
