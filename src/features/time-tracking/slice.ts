import { produce } from "immer";
import type { FsPath } from "../../types";
import { calcElapse } from "./utils";
import type { StateCreator } from "zustand/vanilla";
import type { GlobalStore } from "../../store";

interface Timer {
  startAt: number | null;
  accumulated: number;
}

export interface FileTimeTracker {
  fileTimeTracker: Map<FsPath, Timer>;
  currentTrackingFile: FsPath | null;
  startTimer: (args: { now: number; fsPath: FsPath }) => void;
  stopTimer: (args: { now: number }) => void;
  switchTimer: (args: { now: number; fsPath: FsPath }) => void;
  loadTimer: (args: { elapsedTime: number; fsPath: FsPath }[]) => void;
  reset: () => void;
}

const startTimerReducer = (
  state: GlobalStore,
  args: { now: number; fsPath: FsPath },
) => {
  // 早期リターンで無効な状態をチェック
  if (state.excludeFiles.has(args.fsPath) || !state.isTracking) {
    return state;
  }

  const hasTracker = state.fileTimeTracker.has(args.fsPath);
  return produce(state, (draft) => {
    // 原子的にタイマー状態を更新
    if (hasTracker) {
      const existingTimer = draft.fileTimeTracker.get(args.fsPath);
      if (existingTimer) {
        existingTimer.startAt = args.now;
      }
    } else {
      // 新しいタイマーオブジェクトを原子的に作成
      draft.fileTimeTracker.set(args.fsPath, {
        startAt: args.now,
        accumulated: 0,
      });
    }
    // 現在追跡中のファイルを原子的に更新
    draft.currentTrackingFile = args.fsPath;
  });
};

const stopTimerReducer = (state: GlobalStore, args: { now: number }) => {
  const currentFile = state.currentTrackingFile;

  // 現在追跡中のファイルがない場合の早期リターン
  if (!currentFile) {
    return produce(state, (draft) => {
      draft.currentTrackingFile = null;
    });
  }

  return produce(state, (draft) => {
    const tracker = draft.fileTimeTracker.get(currentFile);
    if (tracker?.startAt) {
      // 時間計算を原子的に実行
      const elapse = calcElapse(args.now, tracker.accumulated, tracker.startAt);

      // タイマー状態を原子的に更新
      const timerToUpdate = draft.fileTimeTracker.get(currentFile);
      if (timerToUpdate) {
        timerToUpdate.startAt = null;
        timerToUpdate.accumulated = elapse;
      }
    } else {
      console.warn(
        "EditTimer: Attempted to stop timer that was not running for",
        currentFile,
      );
    }
    // 現在追跡中ファイルを原子的にクリア
    draft.currentTrackingFile = null;
  });
};

const switchTimerReducer = (
  state: GlobalStore,
  args: { now: number; fsPath: FsPath },
) => {
  const stopStore = stopTimerReducer(state, { now: args.now });
  return startTimerReducer(stopStore, { now: args.now, fsPath: args.fsPath });
};

const loadTimerReducer = (
  state: GlobalStore,
  args: { elapsedTime: number; fsPath: FsPath }[],
): GlobalStore => {
  return produce(state, (draft) => {
    draft.fileTimeTracker.clear();
    args.forEach((arg) => {
      draft.fileTimeTracker.set(arg.fsPath, {
        startAt: null,
        accumulated: arg.elapsedTime,
      });
    });
  });
};

export const createFileTimeTrackerSlice: StateCreator<
  GlobalStore,
  [],
  [],
  FileTimeTracker
> = (set) => ({
  fileTimeTracker: new Map<FsPath, Timer>(),
  currentTrackingFile: null,
  startTimer: (args) => set((state) => startTimerReducer(state, args)),
  stopTimer: (args) => set((state) => stopTimerReducer(state, args)),
  switchTimer: (args) => set((state) => switchTimerReducer(state, args)),
  loadTimer: (args) => set((state) => loadTimerReducer(state, args)),
  reset: () =>
    set(() => ({
      fileTimeTracker: new Map(),
      currentTrackingFile: null,
    })),
});
