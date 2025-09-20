import { getTimerState } from "../../store";
import type { FsPath } from "../../types";
import { calcElapse } from "./utils";

export const selectIsTracking = () => getTimerState().isTracking;

export const selectExcludedFiles = () => getTimerState().excludedFiles;

export const selectIsExcluded = (fsPath: FsPath) =>
  getTimerState().excludedFiles.includes(fsPath);

const getTracker = (fsPath: FsPath) => {
  const fileTimeTrackers = getTimerState().fileTimeTrackers;
  return fileTimeTrackers.find((tracker) => tracker.fsPath === fsPath);
};

export const selectTrackers = () => getTimerState().fileTimeTrackers;

export const selectTrackerTime = (args: { now: number; fsPath: FsPath }) => {
  const timer = getTracker(args.fsPath);
  if (!timer) {
    return null;
  }

  if (timer.startAt) {
    return calcElapse(args.now, timer.accumulated, timer.startAt);
  } else {
    return timer.accumulated;
  }
};

export const selectTrackerTimeIfIncluded = (args: {
  now: number;
  fsPath: FsPath;
}) => {
  if (selectIsExcluded(args.fsPath)) {
    return null;
  }

  return selectTrackerTime(args);
};

export const selectTrackersTotalTime = (args: { now: number }) => {
  const timers = getTimerState().fileTimeTrackers;

  return timers.reduce((acc, current) => {
    if (selectIsExcluded(current.fsPath)) {
      return acc;
    }

    if (current.startAt) {
      return acc + calcElapse(args.now, current.accumulated, current.startAt);
    }

    return acc + current.accumulated;
  }, 0);
};

export const selectTrackedFileSize = () =>
  getTimerState().fileTimeTrackers.length;

export const selectCurrentTrackingFile = () =>
  getTimerState().currentTrackingFile;
