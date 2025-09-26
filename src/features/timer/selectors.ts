import { getTimerState } from "../../store";
import type { FsPath, PersistentData, PersistentFileData } from "./types";
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

  return timer.startAt
    ? calcElapse(args.now, timer.accumulated, timer.startAt)
    : timer.accumulated;
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

export const selectPersistenceData = (args: {
  now: number;
}): PersistentData => {
  const state = getTimerState();

  const fileData: PersistentFileData[] = state.fileTimeTrackers
    .map((timer) => {
      return {
        fsPath: timer.fsPath,
        elapsedTime: timer.startAt
          ? calcElapse(args.now, timer.accumulated, timer.startAt)
          : timer.accumulated,
      };
    })
    .filter((data) => data.elapsedTime > 0);

  return {
    excludedFiles: state.excludedFiles,
    fileData,
    isTracking: state.isTracking,
    lastSavedAt: args.now,
  };
};
