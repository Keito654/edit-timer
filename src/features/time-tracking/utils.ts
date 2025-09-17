import type { GlobalStore } from "../../store";

interface Timer {
  startAt: number | null;
  accumulated: number;
}
export const calcElapse = (
  now: number,
  accumulated: number,
  startAt: number,
) => {
  // 入力値の妥当性チェックで競合状態由来の異常値を防ぐ
  if (
    typeof now !== "number" ||
    typeof accumulated !== "number" ||
    typeof startAt !== "number"
  ) {
    console.warn("EditTimer: Invalid parameters passed to calcElapse", {
      now,
      accumulated,
      startAt,
    });
    return accumulated; // 安全なデフォルト値を返す
  }

  // 時間の逆転や異常な値を防ぐ
  if (now < startAt) {
    console.warn("EditTimer: Time inconsistency detected in calcElapse", {
      now,
      startAt,
    });
    return accumulated; // 安全なデフォルト値を返す
  }

  // accumulated が負の値の場合を防ぐ
  if (accumulated < 0) {
    console.warn("EditTimer: Negative accumulated time detected", {
      accumulated,
    });
    accumulated = 0;
  }

  return accumulated + (now - startAt);
};
/**
 * 状態の安全なスナップショットを作成するヘルパー関数
 * 競合状態を防ぐため、状態の読み取り時点での一貫性を保証する
 */
export const createStateSnapshot = (state: GlobalStore) => {
  return {
    fileTimeTracker: new Map(state.fileTimeTracker),
    excludeFiles: new Set(state.excludeFiles),
    currentTrackingFile: state.currentTrackingFile,
    isTracking: state.isTracking,
  };
};

/**
 * タイマーオブジェクトの安全なコピーを作成
 */
export const createTimerSnapshot = (timer: Timer) => {
  return {
    startAt: timer.startAt,
    accumulated: timer.accumulated,
  };
};
