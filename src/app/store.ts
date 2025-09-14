import { createStore } from "zustand/vanilla";
import { enableMapSet } from "immer";
import type { FileTimeTracker } from "../features/fileTimeTracker/slice";
import { createFileTimeTrackerSlice } from "../features/fileTimeTracker/slice";
import type { IsTracking } from "../features/isTracking/slice";
import { createIsTrackingSlice } from "../features/isTracking/slice";
import type { ExcludeFiles } from "../features/excludeFile/slice";
import { createExcludeFileSlice } from "../features/excludeFile/slice";

enableMapSet();

export type GlobalStore = FileTimeTracker & IsTracking & ExcludeFiles;

export const store = createStore<GlobalStore>()((...a) => ({
  ...createFileTimeTrackerSlice(...a),
  ...createIsTrackingSlice(...a),
  ...createExcludeFileSlice(...a),
}));
