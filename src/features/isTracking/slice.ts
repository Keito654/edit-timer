import type { StateCreator } from "zustand/vanilla";
import type { GlobalStore } from "../../app/store";
import type { FsPath } from "../../types";

export interface IsTracking {
  isTracking: boolean;
  switchTracking: (args: { now: number; fsPath?: FsPath }) => void;
  pause: (args: { now: number }) => void;
  resume: (args: { now: number; fsPath?: FsPath }) => void;
}

export const createIsTrackingSlice: StateCreator<
  GlobalStore,
  [],
  [],
  IsTracking
> = (set, get) => ({
  isTracking: true,
  switchTracking: (args) => {
    if (get().isTracking) {
      get().pause(args);
    } else {
      get().resume(args);
    }
  },
  pause: (args) => {
    set(() => ({
      isTracking: false,
    }));
    get().stopTimer(args);
  },
  resume: (args) => {
    set(() => ({
      isTracking: true,
    }));
    if (args.fsPath) {
      get().startTimer(args as { now: number; fsPath: FsPath });
    }
  },
});
