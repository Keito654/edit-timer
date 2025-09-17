import type { GlobalStore } from "../../store";
import type { FsPath } from "../../types";
import { calcElapse } from "./utils";

export const getTime = (
  state: GlobalStore,
  args: { now: number; fsPath: FsPath },
) => {
  const timer = state.fileTimeTracker.get(args.fsPath);
  if (!timer) {
    return null;
  }

  // タイマーオブジェクトのスナップショットを作成して競合状態を防ぐ
  const timerSnapshot = { ...timer };

  if (timerSnapshot.startAt) {
    return calcElapse(
      args.now,
      timerSnapshot.accumulated,
      timerSnapshot.startAt,
    );
  } else {
    return timerSnapshot.accumulated;
  }
};

export const getTimeIfIncluded = (
  state: GlobalStore,
  args: { now: number; fsPath: FsPath },
) => {
  // excludeFilesの状態をスナップショット
  if (state.excludeFiles.has(args.fsPath)) {
    return null;
  }

  const timer = state.fileTimeTracker.get(args.fsPath);
  if (!timer) {
    return null;
  }

  // タイマーオブジェクトのスナップショットを作成
  const timerSnapshot = { ...timer };

  if (timerSnapshot.startAt) {
    return calcElapse(
      args.now,
      timerSnapshot.accumulated,
      timerSnapshot.startAt,
    );
  } else {
    return timerSnapshot.accumulated;
  }
};

export const getTotalTime = (state: GlobalStore, args: { now: number }) => {
  // 状態のスナップショットを作成して競合状態を防ぐ
  const timersSnapshot = new Map(state.fileTimeTracker);
  const excludeFilesSnapshot = new Set(state.excludeFiles);

  let totalTime = 0;
  for (const [fsPath, timer] of timersSnapshot) {
    if (excludeFilesSnapshot.has(fsPath)) {
      continue;
    }

    // タイマーオブジェクトのスナップショットを作成
    const timerSnapshot = { ...timer };

    if (timerSnapshot.startAt) {
      totalTime += calcElapse(
        args.now,
        timerSnapshot.accumulated,
        timerSnapshot.startAt,
      );
    } else {
      totalTime += timerSnapshot.accumulated;
    }
  }

  return totalTime;
};
