import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import {
  MARK_XML,
  ICON_DARK_XML,
  ICON_LIGHT_XML,
  WORDMARK_DARK_XML,
  WORDMARK_LIGHT_XML,
} from './WeWatchLogos';

interface Props {
  variant?: 'mark' | 'icon' | 'wordmark' | 'horizontal' | 'stacked';
  size?: number;
  theme?: 'dark' | 'light';
}

// W mark — no bg, scales to any size (aspect ratio 85:68 ≈ 1.25:1)
function Mark({ size }: { size: number }) {
  return <SvgXml xml={MARK_XML} width={size} height={size * (68 / 85)} />;
}

// W mark inside rounded square (app icon style)
function Icon({ size, theme }: { size: number; theme: 'dark' | 'light' }) {
  return <SvgXml xml={theme === 'dark' ? ICON_DARK_XML : ICON_LIGHT_XML} width={size} height={size} />;
}

// Full horizontal wordmark SVG (aspect ratio 271:68 ≈ 4:1)
function Wordmark({ width, theme }: { width: number; theme: 'dark' | 'light' }) {
  const height = width * (68 / 271);
  return <SvgXml xml={theme === 'dark' ? WORDMARK_DARK_XML : WORDMARK_LIGHT_XML} width={width} height={height} />;
}

export function WeWatchLogo({ variant = 'horizontal', size = 44, theme = 'dark' }: Props) {
  // mark — just the W glyph, no background
  if (variant === 'mark') return <Mark size={size} />;

  // icon — W inside rounded square (for avatars, app icons)
  if (variant === 'icon') return <Icon size={size} theme={theme} />;

  // wordmark / horizontal — full SVG with W + "weWatch" text side by side
  if (variant === 'wordmark' || variant === 'horizontal') {
    return <Wordmark width={size * (271 / 68)} theme={theme} />;
  }

  // stacked — only the horizontal wordmark (icon + text), centred
  return <Wordmark width={size * 2.2} theme={theme} />;
}
