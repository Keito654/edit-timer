import { TimeTracker } from "@/core/timeTracker";
import { TrackerManager } from "@/service/trackerManager";
import { delay } from "./utils";

describe("trackerManager", () => {
  test("タイマーをファイル名と紐づけて開始する", () => {
    // arrange
    const trackerManager = new TrackerManager();
    // act
    trackerManager.startTimer("a.txt");
    // assert
    const tracker = trackerManager.getTimeTracker("a.txt");
    expect(tracker?.getStopwatch().isRunning()).toBeTruthy();
  });

  test("タイマーを停止する", () => {
    // arrange
    const trackerManager = new TrackerManager();
    // act
    trackerManager.startTimer("a.txt");
    trackerManager.stopTimer("a.txt");
    // assert
    const tracker = trackerManager.getTimeTracker("a.txt");
    expect(tracker?.getStopwatch().isStopped()).toBeTruthy();
  });

  test("再度タイマーを再開する", async () => {
    // arrange
    const trackerManager = new TrackerManager();
    // act
    trackerManager.startTimer("a.txt");
    await delay(300);
    trackerManager.stopTimer("a.txt");
    trackerManager.startTimer("a.txt");
    await delay(100);
    trackerManager.stopTimer("a.txt");
    // assert
    const tracker = trackerManager.getTimeTracker("a.txt");
    expect(tracker?.getTime()).toBeGreaterThanOrEqual(390);
    expect(tracker?.getTime()).toBeLessThanOrEqual(410);
    expect(tracker?.getStopwatch().isStopped()).toBeTruthy();
  });
});
