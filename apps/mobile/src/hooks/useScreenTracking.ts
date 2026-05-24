import { useEffect, useRef } from 'react';
import { useNavigationState } from '@react-navigation/native';
import { analyticsService } from '@services/analyticsService';

export function useScreenTracking(): void {
  const routeName = useNavigationState((state) => {
    if (!state) return undefined;
    const route = state.routes[state.index];
    // Drill into nested navigators
    let current = route;
    while (current.state?.routes) {
      const nested = current.state as { routes: typeof state.routes; index: number };
      current = nested.routes[nested.index];
    }
    return current.name;
  });

  const prevScreenRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!routeName || routeName === prevScreenRef.current) return;

    if (prevScreenRef.current) {
      analyticsService.screenExit(prevScreenRef.current);
    }
    analyticsService.screenEnter(routeName);
    prevScreenRef.current = routeName;
  }, [routeName]);
}
