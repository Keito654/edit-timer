import { StateCreator } from "zustand/vanilla";
import { GlobalStore } from "../../app/store";

export interface IsTracking {
  isTracking: boolean;
  switchTracking: () => void;
  pause: () => void;
  resume: () => void;
}

export const createIsTrackingSlice: StateCreator<
  GlobalStore,
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
