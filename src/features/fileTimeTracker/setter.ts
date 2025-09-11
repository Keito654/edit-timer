import { produce } from 'immer';
import type { Store } from '../../app/store';
import type { FsPath } from '../../app/types';
import { calcElapse } from './utils';

export const startTimer = (store: Store, now: number, fsPath: FsPath) => {
  const hasTracker = store.fileTimeTracker.has(fsPath);
  return produce(store, (state) => {
    if (hasTracker) {
      state.fileTimeTracker.get(fsPath)!.startAt = now;
    } else {
      state.fileTimeTracker.set(fsPath, { startAt: now, accumulated: 0 });
    }
    state.currentTrackingFile = fsPath;
  });
};

export const stopTimer = (store: Store, now: number) => {
  const currentFile = store.currentTrackingFile;
  if (!currentFile) {
    return produce(store, (state) => {
      state.currentTrackingFile = null;
    });
  }

  return produce(store, (state) => {
    const tracker = store.fileTimeTracker.get(currentFile);
    if (tracker?.startAt) {
      const elapse = calcElapse(now, tracker.accumulated, tracker.startAt);
      state.fileTimeTracker.get(currentFile)!.startAt = null;
      state.fileTimeTracker.get(currentFile)!.accumulated = elapse;
    } else {
      console.error('error: timer is not starting');
    }
    state.currentTrackingFile = null;
  });
};

export const switchTimer = (store: Store, now: number, fsPath: FsPath) => {
  const stopStore = stopTimer(store, now);
  return startTimer(stopStore, now, fsPath);
};
