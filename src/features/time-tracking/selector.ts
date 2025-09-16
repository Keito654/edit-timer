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

  if (timer.startAt) {
    return calcElapse(args.now, timer.accumulated, timer.startAt);
  } else {
    return timer.accumulated;
  }
};

export const getTimeIfIncluded = (
  state: GlobalStore,
  args: { now: number; fsPath: FsPath },
) => {
  if (state.excludeFiles.has(args.fsPath)) {
    return null;
  }

  return getTime(state, args);
};

export const getTotalTime = (state: GlobalStore, args: { now: number }) => {
  const timers = state.fileTimeTracker;
  let totalTime = 0;
  for (const [fsPath, timer] of timers) {
    if (state.excludeFiles.has(fsPath)) {
      continue;
    }

    if (timer.startAt) {
      totalTime += calcElapse(args.now, timer.accumulated, timer.startAt);
    } else {
      totalTime += timer.accumulated;
    }
  }

  return totalTime;
};
