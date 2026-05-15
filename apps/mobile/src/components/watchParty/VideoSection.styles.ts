// CineSync — VideoSection styles
import { Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');
// 16:9 aspect ratio based on screen width — fits the video content exactly
export const VIDEO_HEIGHT = Math.round(SCREEN_W * (9 / 16));

// useVideoSectionStyles is no longer used — styles live in VideoSection.tsx
export const useVideoSectionStyles = () => ({});
