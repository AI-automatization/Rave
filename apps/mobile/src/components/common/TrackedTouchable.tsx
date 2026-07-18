// WeWatch Mobile — TrackedTouchable
// Drop-in TouchableOpacity replacement that logs every tap via analyticsService.
// Same props as TouchableOpacity plus a required trackId — TypeScript flags any
// call site missing one, which is how full-app coverage gets verified (tsc --noEmit).
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { analyticsService } from '@services/analyticsService';

interface Props extends TouchableOpacityProps {
  /** Stable, human-readable label, e.g. 'home:create_room'. Not derived from dynamic content. */
  trackId: string;
  trackMeta?: Record<string, unknown>;
}

export function TrackedTouchable({ trackId, trackMeta, onPress, onLongPress, ...rest }: Props) {
  const handlePress = onPress
    ? (e: Parameters<NonNullable<TouchableOpacityProps['onPress']>>[0]) => {
        analyticsService.click(trackId, trackMeta);
        onPress(e);
      }
    : undefined;

  // Elements that only use onLongPress (e.g. message bubbles) would otherwise never fire —
  // tag separately from onPress so the two interactions stay distinguishable in the event log.
  const handleLongPress = onLongPress
    ? (e: Parameters<NonNullable<TouchableOpacityProps['onLongPress']>>[0]) => {
        analyticsService.click(`${trackId}:long_press`, trackMeta);
        onLongPress(e);
      }
    : undefined;

  return <TouchableOpacity {...rest} onPress={handlePress} onLongPress={handleLongPress} />;
}
