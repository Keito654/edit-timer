import { GlobalStore } from "../../app/store";
import { FsPath } from "../../types";
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

export const getTotalTime = (state: GlobalStore, args: { now: number }) => {
  const timers = state.fileTimeTracker;
  let totalTime = 0;
  timers.forEach((value) => {
    if (value.startAt) {
      totalTime += calcElapse(args.now, value.accumulated, value.startAt);
    } else {
      totalTime += value.accumulated;
    }
  });

  return totalTime;
};
