import { createStore } from "zustand/vanilla";
import { enableMapSet } from "immer";
import type { FileTimeTracker } from "../features/time-tracking/slice";
import { createFileTimeTrackerSlice } from "../features/time-tracking/slice";
import type { IsTracking } from "../features/tracking-state/slice";
import { createIsTrackingSlice } from "../features/tracking-state/slice";
import type { ExcludeFiles } from "../features/file-exclusion/slice";
import { createExcludeFileSlice } from "../features/file-exclusion/slice";

enableMapSet();

export type GlobalStore = FileTimeTracker & IsTracking & ExcludeFiles;

export const store = createStore<GlobalStore>()((...a) => ({
  ...createFileTimeTrackerSlice(...a),
  ...createIsTrackingSlice(...a),
  ...createExcludeFileSlice(...a),
}));
