'use client';

import { create } from 'zustand';

interface MaintenanceState {
  isMaintenance: boolean;
  setMaintenance: (v: boolean) => void;
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  isMaintenance: false,
  setMaintenance: (v) => set({ isMaintenance: v }),
}));

// Callable outside React components (e.g. from api-client.ts)
export const maintenanceFlag = {
  set: (v: boolean) => useMaintenanceStore.getState().setMaintenance(v),
};
