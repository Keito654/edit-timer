import { TrackerManager } from '@/service/trackerManager';
import { delay } from '../../tests/utils';

describe('trackerManager', () => {
  test('タイマーをファイル名と紐づけて開始する', () => {
    // arrange
    const trackerManager = new TrackerManager();
    // act
    trackerManager.startTimer('a.txt');
    // assert
    const tracker = trackerManager.getTimeTracker('a.txt');
    expect(tracker?.getStopwatch().isRunning()).toBeTruthy();
  });

  test('pause中はタイマーを開始することはできない。', () => {
    // arrange
    const trackerManager = new TrackerManager();
    // act
    trackerManager.pause();
    trackerManager.startTimer('a.txt');
    // assert
    const tracker = trackerManager.getTimeTracker('a.txt');
    expect(tracker?.getStopwatch().isRunning()).toBeFalsy();
  });

  test('pause中に再開する', () => {
    // arrange
    const trackerManager = new TrackerManager();
    // act
    trackerManager.pause();
    trackerManager.resume();
    trackerManager.startTimer('a.txt');
    // assert
    const tracker = trackerManager.getTimeTracker('a.txt');
    expect(tracker?.getStopwatch().isRunning()).toBeTruthy();
  });

  test('進行中のタイマーをみつけ、停止する', () => {
    // arrange
    const trackerManager = new TrackerManager();
    // act
    trackerManager.startTimer('a.txt');
    trackerManager.stopTimer();
    // assert
    const tracker = trackerManager.getTimeTracker('a.txt');
    expect(tracker?.getStopwatch().isStopped()).toBeTruthy();
  });

  test('再度タイマーを再開する', async () => {
    // arrange
    const trackerManager = new TrackerManager();
    // act
    trackerManager.startTimer('a.txt');
    await delay(300);
    trackerManager.stopTimer();
    trackerManager.startTimer('a.txt');
    await delay(100);
    trackerManager.stopTimer();
    // assert
    const tracker = trackerManager.getTimeTracker('a.txt');
    expect(tracker?.getTime()).toBeGreaterThanOrEqual(390);
    expect(tracker?.getTime()).toBeLessThanOrEqual(410);
    expect(tracker?.getStopwatch().isStopped()).toBeTruthy();
  });

  test('もとのタイマーを停止し、新しいタイマーを開始する', async () => {
    // arrange
    const trackerManager = new TrackerManager();
    // act
    trackerManager.startTimer('a.txt');
    await delay(400);
    trackerManager.switchTimer('b.txt');
    await delay(100);
    trackerManager.stopTimer();
    // assert
    const trackerA = trackerManager.getTimeTracker('a.txt');
    expect(trackerA?.getTime()).toBeGreaterThanOrEqual(390);
    expect(trackerA?.getTime()).toBeLessThanOrEqual(410);
    expect(trackerA?.getStopwatch().isStopped()).toBeTruthy();

    const trackerB = trackerManager.getTimeTracker('b.txt');
    expect(trackerB?.getTime()).toBeGreaterThanOrEqual(90);
    expect(trackerB?.getTime()).toBeLessThanOrEqual(110);
    expect(trackerB?.getStopwatch().isStopped()).toBeTruthy();
  });

  test('現在トラッキング中のファイルの経過時間を返す', async () => {
    // arrange
    const trackerManager = new TrackerManager();
    // act
    trackerManager.startTimer('a.txt');
    await delay(400);
    // assert
    const time = trackerManager.getTrackingFileTime();
    expect(time).toBeGreaterThanOrEqual(390);
    expect(time).toBeLessThanOrEqual(410);
  });

  test('経過時間の合計を返す', async () => {
    // arrange
    const trackerManager = new TrackerManager();
    // act
    trackerManager.startTimer('a.txt');
    await delay(400);
    trackerManager.switchTimer('b.txt');
    await delay(100);
    trackerManager.stopTimer();
    // assert
    const totalTime = trackerManager.getTotalTime();
    expect(totalTime).toBeGreaterThanOrEqual(490);
    expect(totalTime).toBeLessThanOrEqual(510);
  });

  test('コンストラクタにファイルと時間の組み合わせを受け取り、タイマーに反映させる', () => {
    // arrange
    const savedTimeByFile = [
      {
        file: 'a.txt',
        time: 100,
      },
      {
        file: 'b.txt',
        time: 300,
      },
    ];
    const trackerManager = new TrackerManager(savedTimeByFile);
    // act
    // assert
    const timeA = trackerManager.getTimeTracker('a.txt')?.getTime();
    expect(timeA).toBeGreaterThanOrEqual(90);
    expect(timeA).toBeLessThanOrEqual(110);
    const timeB = trackerManager.getTimeTracker('b.txt')?.getTime();
    expect(timeB).toBeGreaterThanOrEqual(290);
    expect(timeB).toBeLessThanOrEqual(320);
  });

  test('コンストラクタにpause中かどうかを受け取り、反映させる', () => {
    // arrange
    const savedTimeByFile = [
      {
        file: 'a.txt',
        time: 100,
      },
      {
        file: 'b.txt',
        time: 300,
      },
    ];
    const pauseState = {
      isPausing: true,
    };
    const trackerManager = new TrackerManager(savedTimeByFile, pauseState);
    trackerManager.startTimer('a.txt');
    // assert
    const tracker = trackerManager.getTimeTracker('a.txt');
    expect(tracker?.getStopwatch().isRunning()).toBeFalsy();
  });

  test('すべてのタイマーをリセットする', () => {
    // arrange
    const savedTimeByFile = [
      {
        file: 'a.txt',
        time: 100,
      },
      {
        file: 'b.txt',
        time: 300,
      },
    ];
    const trackerManager = new TrackerManager(savedTimeByFile);
    // act
    trackerManager.resetAllTimers();
    // assert
    expect(trackerManager.getTimeTracker('a.txt')).toBeUndefined();
    expect(trackerManager.getTimeTracker('b.txt')).toBeUndefined();
  });

  test('すべてのタイマーを返す', () => {
    // arrange
    const savedTimeByFile = [
      {
        file: 'a.txt',
        time: 100,
      },
      {
        file: 'b.txt',
        time: 300,
      },
    ];
    const trackerManager = new TrackerManager(savedTimeByFile);
    // act
    const allTimeTrackers = trackerManager.getAllTimeTrackers();
    // assert
    expect(allTimeTrackers.get('a.txt')?.getTime()).toBe(100);
    expect(allTimeTrackers.get('b.txt')?.getTime()).toBe(300);
  });
});
