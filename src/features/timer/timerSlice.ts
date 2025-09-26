import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice, type WritableDraft } from "@reduxjs/toolkit";
import type { FsPath, PersistentData } from "./types";
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
  action: PayloadAction<{
    fsPath: FsPath;
    now?: number;
    activeFilePath?: FsPath;
  }>,
) => {
  if (state.excludedFiles.includes(action.payload.fsPath)) {
    state.excludedFiles = state.excludedFiles.filter(
      (file) => file !== action.payload.fsPath,
    );
    if (action.payload.activeFilePath && action.payload.now) {
      switchTimerReducer(state, {
        type: action.type,
        payload: {
          now: action.payload.now,
          fsPath: action.payload.activeFilePath,
        },
      });
    }
  } else {
    state.excludedFiles.push(action.payload.fsPath);
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
  action: PayloadAction<{ now: number; activeFilePath?: FsPath }>,
) => {
  state.isTracking = true;
  switchTimerReducer(state, {
    type: action.type,
    payload: { now: action.payload.now, fsPath: action.payload.activeFilePath },
  });
};

const switchIsTrackingReducer = (
  state: WritableDraft<TimerState>,
  action: PayloadAction<{ now: number; activeFilePath?: FsPath }>,
) => {
  if (state.isTracking) {
    pauseTrackingReducer(state, action);
  } else {
    resumeTrackingReducer(state, action);
  }
};

const loadDataReducer = (
  state: WritableDraft<TimerState>,
  action: PayloadAction<{
    data: PersistentData;
    now: number;
    activeFilePath?: FsPath;
  }>,
) => {
  state.isTracking = action.payload.data.isTracking;
  state.excludedFiles = action.payload.data.excludedFiles;
  state.currentTrackingFile = initialState.currentTrackingFile;
  state.fileTimeTrackers = action.payload.data.fileData.map((p) => ({
    fsPath: p.fsPath,
    startAt: null,
    accumulated: p.elapsedTime,
  }));

  switchTimerReducer(state, {
    type: action.type,
    payload: { now: action.payload.now, fsPath: action.payload.activeFilePath },
  });
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
      action: PayloadAction<{ now: number; activeFilePath?: FsPath }>,
    ) => {
      state.fileTimeTrackers = [];
      switchTimerReducer(state, {
        type: action.type,
        payload: {
          now: action.payload.now,
          fsPath: action.payload.activeFilePath,
        },
      });
    },
    switchExcluded: switchExcludedReducer,
    pauseTracking: pauseTrackingReducer,
    resumeTracking: resumeTrackingReducer,
    switchIsTracking: switchIsTrackingReducer,
    loadData: loadDataReducer,
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
  loadData,
} = timerSlice.actions;

export default timerSlice.reducer;
