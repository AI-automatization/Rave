// WeWatch Mobile — shared React Query client singleton
// Module-level export (not created inside App.tsx) so non-component code
// (auth.store.ts logout) can clear it too — Zustand stores have no access
// to the QueryClientProvider's instance otherwise.
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 min
    },
  },
});
