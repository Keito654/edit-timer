import { TimeTracker } from "@/core/timeTracker";
import { Stopwatch } from "ts-stopwatch";
import { delay } from "./utils";

describe("timeTracker", () => {
  vi.mock("ts-stopwatch", { spy: true });

  test("タイマーを開始・再開できる", () => {
    // arrange
    const startSpy = vi.spyOn(Stopwatch.prototype, "start");
    const timeTracker = new TimeTracker();
    // act
    timeTracker.start();
    // assert
    expect(startSpy).toHaveBeenCalledOnce();
  });

  test("タイマーを停止できる", () => {
    // arrange
    const stopSpy = vi.spyOn(Stopwatch.prototype, "stop");
    const timeTracker = new TimeTracker();
    // act
    timeTracker.stop();
    // assert
    expect(stopSpy).toHaveBeenCalledOnce();
  });

  test("現在の経過時間を返す", async () => {
    // arrange
    const timeTracker = new TimeTracker();
    // act
    timeTracker.start();
    await delay(100);
    timeTracker.stop();
    const time = timeTracker.getTime();
    // assert
    expect(time).toBeGreaterThan(0);
  });

  test("タイマーをリセットできる", () => {
    // arrange
    const spy = vi.spyOn(Stopwatch.prototype, "reset");
    const timeTracker = new TimeTracker();
    // act
    timeTracker.reset();
    // assert
    expect(spy).toHaveBeenCalledOnce();
  });

  test("保存されている経過時間をロードできる", async () => {
    // arrage
    const savedTime = 100;
    const timeTracker = new TimeTracker(savedTime);
    // act
    timeTracker.start();
    await delay(100);
    timeTracker.stop();
    const time = timeTracker.getTime();
    // assert
    const expected = 200;
    expect(time).toBeGreaterThanOrEqual(expected - 10);
    expect(time).toBeLessThanOrEqual(expected + 10);
  });
});
