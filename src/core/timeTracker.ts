import { Stopwatch } from 'ts-stopwatch';

export const State = Stopwatch.State;

export class TimeTracker {
  #stopwatch: Stopwatch;
  #savedTime: number;

  public constructor(savedTime = 0) {
    this.#stopwatch = new Stopwatch();
    this.#savedTime = savedTime;
  }

  public start(): void {
    this.#stopwatch.start();
  }

  public stop(): void {
    this.#stopwatch.stop();
  }

  public getTime(): number {
    return this.#stopwatch.getTime() + this.#savedTime;
  }

  public reset(): void {
    this.#stopwatch.reset();
  }

  public getState() {
    return this.#stopwatch.getState();
  }

  public getStopwatch() {
    return this.#stopwatch;
  }
}
