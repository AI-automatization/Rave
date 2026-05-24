import type { NavigationState, PartialState } from '@react-navigation/native';

type AnyState = NavigationState | PartialState<NavigationState>;

export function getActiveScreenName(state: AnyState | undefined): string | undefined {
  if (!state) return undefined;
  const route = state.routes[state.index ?? state.routes.length - 1];
  if (!route) return undefined;
  if (route.state) return getActiveScreenName(route.state as AnyState);
  return route.name;
}
