import { store } from '../../app/store';
import { calcElapse } from './utils';

export const getfileTimeTracker = () => store.getState().fileTimeTracker;

export const getTime = (fileName: string) => {
  const timer = store.getState().fileTimeTracker.get(fileName);
  if (!timer) {
    return null;
  }

  if (timer.startAt) {
    const now = Date.now();
    return calcElapse(now, timer.accumulated, timer.startAt);
  } else {
    return timer.accumulated;
  }
};

export const getTotalTime = () => {
  const timers = store.getState().fileTimeTracker;
  const now = Date.now();
  let totalTime = 0;
  timers.forEach((value) => {
    if (value.startAt) {
      totalTime += calcElapse(now, value.accumulated, value.startAt);
    } else {
      totalTime += value.accumulated;
    }
  });

  return totalTime;
};
