import { createStore } from "zustand/vanilla";
import { enableMapSet } from "immer";
import {
  createFileTimeTrackerSlice,
  FileTimeTracker,
} from "../features/fileTimeTracker/slice";
import {
  createIsTrackingSlice,
  IsTracking,
} from "../features/isTracking/slice";
import {
  createExcludeFileSlice,
  ExcludeFiles,
} from "../features/excludeFile/slice";

enableMapSet();

export type GlobalStore = FileTimeTracker & IsTracking & ExcludeFiles;

export const store = createStore<GlobalStore>()((...a) => ({
  ...createFileTimeTrackerSlice(...a),
  ...createIsTrackingSlice(...a),
  ...createExcludeFileSlice(...a),
}));
