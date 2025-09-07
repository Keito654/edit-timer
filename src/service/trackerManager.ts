import { TimeTracker } from "@/core/timeTracker";

export interface SavedTimeByFile {
  file: string;
  time: number;
}

export type SavedTimeByFileArr = SavedTimeByFile[];

export interface PauseState {
  isPausing: boolean;
}

export class TrackerManager {
  #trackers = new Map<string, TimeTracker>();
  #runningFile: string | null = null;
  #isPausing = false;

  public constructor(
    savedTimeByFileArr?: SavedTimeByFileArr,
    pauseState?: PauseState
  ) {
    if (savedTimeByFileArr) {
      for (const savedTimeByFile of savedTimeByFileArr) {
        const tracker = new TimeTracker(savedTimeByFile.time);
        this.#trackers.set(savedTimeByFile.file, tracker);
      }
    }
    if (pauseState) {
      this.#isPausing = pauseState.isPausing;
    }
  }

  public pause() {
    this.#isPausing = true;
  }

  public resume(file: string) {
    this.#isPausing = false;
    this.startTimer(file);
  }

  public startTimer(file: string) {
    if (this.#isPausing) {
      return;
    }
    const timer = this.#trackers.get(file);
    if (timer) {
      timer.start();
    } else {
      const newTimer = new TimeTracker();
      newTimer.start();
      this.#trackers.set(file, newTimer);
    }
    this.#runningFile = file;
  }

  public stopTimer() {
    if (this.#runningFile) {
      const timer = this.#trackers.get(this.#runningFile);
      timer?.stop();
      this.#runningFile = null;
    }
  }

  public switchTimer(file: string) {
    this.stopTimer();
    this.startTimer(file);
  }

  public getTimeTracker(file: string) {
    return this.#trackers.get(file);
  }

  public getTotalTime() {
    let totaiTime = 0;
    for (const [, trackTimer] of this.#trackers) {
      totaiTime += trackTimer.getTime();
    }
    return totaiTime;
  }

  public resetAllTimers() {
    this.#trackers.clear();
  }
}
