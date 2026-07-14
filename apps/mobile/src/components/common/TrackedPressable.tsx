// WeWatch Mobile — TrackedPressable
// Drop-in Pressable replacement that logs every tap via analyticsService.
import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { analyticsService } from '@services/analyticsService';

interface Props extends PressableProps {
  /** Stable, human-readable label, e.g. 'watchparty:play_pause'. Not derived from dynamic content. */
  trackId: string;
  trackMeta?: Record<string, unknown>;
}

export function TrackedPressable({ trackId, trackMeta, onPress, onLongPress, ...rest }: Props) {
  const handlePress = onPress
    ? (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
        analyticsService.click(trackId, trackMeta);
        onPress(e);
      }
    : undefined;

  const handleLongPress = onLongPress
    ? (e: Parameters<NonNullable<PressableProps['onLongPress']>>[0]) => {
        analyticsService.click(`${trackId}:long_press`, trackMeta);
        onLongPress(e);
      }
    : undefined;

  return <Pressable {...rest} onPress={handlePress} onLongPress={handleLongPress} />;
}
