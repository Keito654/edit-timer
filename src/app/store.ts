import { createStore } from 'zustand/vanilla';
import { enableMapSet } from 'immer';
import type { FsPath } from './types';
import { startTimer, stopTimer, switchTimer } from '../features/fileTimeTracker/setter';
enableMapSet();

interface Timer {
  startAt: number | null;
  accumulated: number;
}

interface FileTimeTracker {
  fileTimeTracker: Map<FsPath, Timer>;
  currentTrackingFile: FsPath | null;
  startTimer: (fsPath: FsPath) => void;
  stopTimer: () => void;
  switchTimer: (fsPath: FsPath) => void;
  setTrackingFIle: (fsPath: FsPath | null) => void;
}

interface IsTracking {
  isTracking: boolean;
  switchTracking: () => void;
}

interface ExcludeFiles {
  excludeFiles: FsPath[];
  addExcludeFile: (fsPath: FsPath) => void;
  removeExcludeFile: (fsPath: FsPath) => void;
}

export type Store = FileTimeTracker & IsTracking & ExcludeFiles;

export const store = createStore<Store>()((set) => ({
  fileTimeTracker: new Map<FsPath, Timer>(),
  currentTrackingFile: null,
  setTrackingFIle: (fsPath) =>
    set((store) => ({
      ...store,
      currentTrackingFile: fsPath,
    })),
  startTimer: (fsPath: FsPath) => set((store) => startTimer(store, Date.now(), fsPath)),
  stopTimer: () => set((store) => stopTimer(store, Date.now())),
  switchTimer: (fsPath: FsPath) => set((store) => switchTimer(store, Date.now(), fsPath)),
  isTracking: true,
  switchTracking: () =>
    set((state) => ({
      ...state,
      isTracking: !state.isTracking,
    })),
  excludeFiles: [],
  addExcludeFile: (fsPath) =>
    set((state) => ({
      ...state,
      excludeFiles: [...state.excludeFiles, fsPath],
    })),
  removeExcludeFile: (fsPath) =>
    set((state) => ({
      ...state,
      excludeFiles: state.excludeFiles.filter((x) => x === fsPath),
    })),
}));
