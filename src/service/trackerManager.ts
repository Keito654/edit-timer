import { TimeTracker } from "@/core/timeTracker";

export class TrackerManager {
  #trackers = new Map<string, TimeTracker>();

  public startTimer(file: string) {
    const timer = this.#trackers.get(file);
    if (timer) {
      timer.start();
    } else {
      const newTimer = new TimeTracker();
      newTimer.start();
      this.#trackers.set(file, newTimer);
    }
  }

  public stopTimer(file: string) {
    const timer = this.#trackers.get(file);
    timer?.stop();
  }

  public getTimeTracker(file: string) {
    return this.#trackers.get(file);
  }
}
