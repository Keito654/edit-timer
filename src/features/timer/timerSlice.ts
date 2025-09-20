import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice, type WritableDraft } from "@reduxjs/toolkit";
import type { FsPath } from "../../types";
import { calcElapse } from "./utils";

export interface TimerState {
  fileTimeTrackers: {
    fsPath: FsPath;
    startAt: number | null;
    accumulated: number;
  }[];
  currentTrackingFile: FsPath | null;
  isTracking: boolean;
  excludedFiles: FsPath[];
}

const initialState: TimerState = {
  fileTimeTrackers: [],
  currentTrackingFile: null,
  isTracking: true,
  excludedFiles: [],
};

const startTimerReducer = (
  state: WritableDraft<TimerState>,
  action: PayloadAction<{ now: number; fsPath?: FsPath }>,
) => {
  if (
    !action.payload.fsPath ||
    state.excludedFiles.includes(action.payload.fsPath) ||
    !state.isTracking
  ) {
    return;
  }

  const existingTracker = state.fileTimeTrackers.find(
    (tracker) => tracker.fsPath === action.payload.fsPath,
  );
  if (existingTracker) {
    existingTracker.startAt = action.payload.now;
  } else {
    state.fileTimeTrackers.push({
      fsPath: action.payload.fsPath,
      startAt: action.payload.now,
      accumulated: 0,
    });
  }
  state.currentTrackingFile = action.payload.fsPath;
};

const stopTimerReducer = (
  state: WritableDraft<TimerState>,
  action: PayloadAction<{ now: number }>,
) => {
  if (state.currentTrackingFile === null) {
    return;
  }

  const currentTracker = state.fileTimeTrackers.find(
    (tracker) => tracker.fsPath === state.currentTrackingFile,
  );
  if (currentTracker?.startAt) {
    const elapse = calcElapse(
      action.payload.now,
      currentTracker.accumulated,
      currentTracker.startAt,
    );
    currentTracker.startAt = null;
    currentTracker.accumulated = elapse;
  } else {
    console.error("error: timer is not starting");
  }
  state.currentTrackingFile = null;
};

const switchTimerReducer = (
  state: WritableDraft<TimerState>,
  action: PayloadAction<{ now: number; fsPath?: FsPath }>,
) => {
  stopTimerReducer(state, action);
  startTimerReducer(state, action);
};

const switchExcludedReducer = (
  state: WritableDraft<TimerState>,
  action: PayloadAction<FsPath>,
) => {
  if (state.excludedFiles.includes(action.payload)) {
    state.excludedFiles = state.excludedFiles.filter(
      (file) => file !== action.payload,
    );
  } else {
    state.excludedFiles.push(action.payload);
  }
};

const pauseTrackingReducer = (
  state: WritableDraft<TimerState>,
  action: PayloadAction<{ now: number }>,
) => {
  state.isTracking = false;
  stopTimerReducer(state, action);
};

const resumeTrackingReducer = (
  state: WritableDraft<TimerState>,
  action: PayloadAction<{ now: number; fsPath?: FsPath }>,
) => {
  state.isTracking = true;
  stopTimerReducer(state, action);
  switchTimerReducer(state, action);
};

const switchIsTrackingReducer = (
  state: WritableDraft<TimerState>,
  action: PayloadAction<{ now: number; fsPath?: FsPath }>,
) => {
  if (state.isTracking) {
    pauseTrackingReducer(state, action);
  } else {
    resumeTrackingReducer(state, action);
  }
};

export const timerSlice = createSlice({
  name: "timer",
  initialState,
  reducers: {
    startTimer: startTimerReducer,
    stopTimer: stopTimerReducer,
    switchTimer: switchTimerReducer,
    resetTimers: (
      state,
      action: PayloadAction<{ now: number; fsPath?: FsPath }>,
    ) => {
      state.fileTimeTrackers = [];
      switchTimerReducer(state, action);
    },
    switchExcluded: switchExcludedReducer,
    pauseTracking: pauseTrackingReducer,
    resumeTracking: resumeTrackingReducer,
    switchIsTracking: switchIsTrackingReducer,
  },
});

export const {
  startTimer,
  stopTimer,
  switchExcluded,
  switchIsTracking,
  pauseTracking,
  resumeTracking,
  switchTimer,
  resetTimers,
} = timerSlice.actions;

export default timerSlice.reducer;
