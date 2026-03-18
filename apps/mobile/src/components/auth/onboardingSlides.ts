// CineSync Mobile — Onboarding slide data
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const ICON_RING_SIZE = 160;
export const ICON_SIZE = 72;

export interface FloatingIcon {
  name: keyof typeof Ionicons.glyphMap;
  size: number;
  top: number;
  left: number;
  opacity: number;
}

export interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  subtitleKey: string;
  accentColor: string;
  gradientColors: [string, string, string];
  floatingIcons: FloatingIcon[];
}

export const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'film',
    titleKey: 'slide1Title',
    subtitleKey: 'slide1Sub',
    accentColor: '#7C3AED',
    gradientColors: ['#1a0533', '#0A0A0F', '#0A0A0F'],
    floatingIcons: [
      { name: 'play-circle', size: 28, top: 80, left: 40, opacity: 0.12 },
      { name: 'videocam', size: 22, top: 120, left: width - 70, opacity: 0.1 },
      { name: 'tv', size: 20, top: 200, left: 60, opacity: 0.08 },
      { name: 'film-outline', size: 32, top: 160, left: width - 100, opacity: 0.06 },
      { name: 'star', size: 16, top: 100, left: width / 2 + 50, opacity: 0.1 },
    ],
  },
  {
    id: '2',
    icon: 'people',
    titleKey: 'slide2Title',
    subtitleKey: 'slide2Sub',
    accentColor: '#3B82F6',
    gradientColors: ['#0c1a33', '#0A0A0F', '#0A0A0F'],
    floatingIcons: [
      { name: 'chatbubbles', size: 26, top: 90, left: 50, opacity: 0.12 },
      { name: 'heart', size: 20, top: 140, left: width - 80, opacity: 0.1 },
      { name: 'happy', size: 24, top: 180, left: 70, opacity: 0.08 },
      { name: 'person-add', size: 22, top: 110, left: width - 60, opacity: 0.1 },
      { name: 'notifications', size: 18, top: 210, left: width / 2 - 30, opacity: 0.06 },
    ],
  },
  {
    id: '3',
    icon: 'trophy',
    titleKey: 'slide3Title',
    subtitleKey: 'slide3Sub',
    accentColor: '#FBBF24',
    gradientColors: ['#1a1500', '#0A0A0F', '#0A0A0F'],
    floatingIcons: [
      { name: 'medal', size: 28, top: 85, left: 45, opacity: 0.12 },
      { name: 'flame', size: 22, top: 150, left: width - 65, opacity: 0.1 },
      { name: 'ribbon', size: 20, top: 200, left: 55, opacity: 0.08 },
      { name: 'shield-checkmark', size: 24, top: 120, left: width - 90, opacity: 0.1 },
      { name: 'star-half', size: 18, top: 170, left: width / 2 + 40, opacity: 0.06 },
    ],
  },
  {
    id: '4',
    icon: 'globe',
    titleKey: 'slide4Title',
    subtitleKey: 'slide4Sub',
    accentColor: '#34D399',
    gradientColors: ['#0a1a15', '#0A0A0F', '#0A0A0F'],
    floatingIcons: [
      { name: 'logo-youtube', size: 26, top: 95, left: 55, opacity: 0.12 },
      { name: 'link', size: 20, top: 140, left: width - 75, opacity: 0.1 },
      { name: 'browsers', size: 24, top: 190, left: 65, opacity: 0.08 },
      { name: 'wifi', size: 20, top: 115, left: width - 55, opacity: 0.1 },
      { name: 'cloud-download', size: 18, top: 220, left: width / 2, opacity: 0.06 },
    ],
  },
  {
    id: '5',
    icon: 'diamond',
    titleKey: 'slide5Title',
    subtitleKey: 'slide5Sub',
    accentColor: '#88CCFF',
    gradientColors: ['#0c1520', '#0A0A0F', '#0A0A0F'],
    floatingIcons: [
      { name: 'trending-up', size: 28, top: 88, left: 48, opacity: 0.12 },
      { name: 'podium', size: 22, top: 155, left: width - 70, opacity: 0.1 },
      { name: 'sparkles', size: 20, top: 195, left: 60, opacity: 0.08 },
      { name: 'analytics', size: 24, top: 125, left: width - 85, opacity: 0.1 },
      { name: 'rocket', size: 18, top: 210, left: width / 2 + 30, opacity: 0.06 },
    ],
  },
];
