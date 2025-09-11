import { StateCreator } from "zustand/vanilla";

export interface IsTracking {
  isTracking: boolean;
  switchTracking: () => void;
  pause: () => void;
  resume: () => void;
}

export const createIsTrackingSlice: StateCreator<
  IsTracking,
  [],
  [],
  IsTracking
> = (set) => ({
  isTracking: true,
  switchTracking: () =>
    set((state) => ({
      isTracking: !state.isTracking,
    })),
  pause: () =>
    set(() => ({
      isTracking: false,
    })),
  resume: () =>
    set(() => ({
      isTracking: true,
    })),
});
