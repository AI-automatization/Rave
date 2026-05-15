// CineSync — VideoSection styles
import { Dimensions } from 'react-native';

const { height: SCREEN_H } = Dimensions.get('window');
export const VIDEO_HEIGHT = Math.round(SCREEN_H * 0.45);

// useVideoSectionStyles is no longer used — styles live in VideoSection.tsx
export const useVideoSectionStyles = () => ({});
