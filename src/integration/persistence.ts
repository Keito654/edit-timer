import type * as vscode from "vscode";
import { store } from "../store";
import { getTime } from "../features/time-tracking/selector";
import type { FsPath } from "../types";

interface PersistentFileData {
  fsPath: FsPath;
  elapsedTime: number;
}

interface PersistentData {
  excludeFiles: FsPath[];
  isTracking: boolean;
  fileData: PersistentFileData[];
  lastSavedAt: number;
}

/**
 * Zustand ストアの現在の状態をワークスペースステートに保存する
 * @param context VS Code ExtensionContext
 */
const save = (context: vscode.ExtensionContext): void => {
  const state = store.getState();
  const now = Date.now();

  // 除外ファイルリストを配列に変換
  const excludeFiles = Array.from(state.excludeFiles);

  // 追跡状態を取得
  const isTracking = state.isTracking;

  // 各ファイルの総経過時間を計算
  const fileData: PersistentFileData[] = [];
  for (const [fsPath] of state.fileTimeTracker) {
    const elapsedTime = getTime(state, { now, fsPath });
    if (elapsedTime !== null && elapsedTime > 0) {
      fileData.push({
        fsPath,
        elapsedTime,
      });
    }
  }

  // 保存するデータオブジェクトを作成
  const persistentData: PersistentData = {
    excludeFiles,
    isTracking,
    fileData,
    lastSavedAt: now,
  };

  // ワークスペースステートに保存
  context.workspaceState.update("editTimer.persistentData", persistentData);
};

/**
 * ワークスペースステートからデータを取得してZustandストアに反映する
 * @param context VS Code ExtensionContext
 * @returns 復元に成功した場合true、データが存在しない場合false
 */
const load = (context: vscode.ExtensionContext): boolean => {
  const persistentData = context.workspaceState.get<PersistentData>(
    "editTimer.persistentData",
  );

  if (!persistentData) {
    return false;
  }

  const { excludeFiles, isTracking, fileData } = persistentData;

  // まずストアをリセット
  store.getState().reset();

  // 除外ファイルを復元
  for (const fsPath of excludeFiles) {
    store.getState().addExcludeFile(fsPath);
  }

  // ファイルタイマーデータを復元
  store.getState().loadTimer(fileData);

  // 追跡状態を復元（現在の状態と異なる場合のみ）
  if (isTracking !== store.getState().isTracking) {
    const now = Date.now();
    store.getState().switchTracking({ now });
  }

  return true;
};

/**
 * 永続化管理機能を作成する
 * 起動時のロード、終了時のセーブ、定期的なセーブを管理する
 */
export interface PersistenceManager {
  initialize: () => void;
  dispose: () => void;
  saveNow: () => void;
}
export const createPersistenceManager = (
  context: vscode.ExtensionContext,
): PersistenceManager => {
  const AUTO_SAVE_INTERVAL_MS = 5 * 60 * 1000; // 5分間隔
  let autoSaveInterval: NodeJS.Timeout | undefined;

  /**
   * 定期的な自動保存を開始する
   */
  const startAutoSave = () => {
    autoSaveInterval = setInterval(() => {
      save(context);
      console.log("Edit Timer: Auto-save completed");
    }, AUTO_SAVE_INTERVAL_MS);
  };

  /**
   * 定期的な自動保存を停止する
   */
  const stopAutoSave = () => {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      autoSaveInterval = undefined;
    }
  };

  /**
   * 永続化機能を初期化する
   * - ワークスペースステートからデータを読み込み
   * - 定期的な自動保存を開始
   */
  const initialize = () => {
    // 起動時にデータを読み込み
    const loaded = load(context);
    if (loaded) {
      console.log("Edit Timer: Data loaded from workspace state");
    } else {
      console.log("Edit Timer: No previous data found, starting fresh");
    }

    // 定期的な自動保存を開始
    startAutoSave();
  };

  /**
   * 永続化機能を終了する
   * - 現在の状態を保存
   * - 自動保存を停止
   */
  const dispose = () => {
    // 終了時に必ず保存
    save(context);

    // 自動保存を停止
    stopAutoSave();

    console.log("Edit Timer: Data saved on extension deactivation");
  };

  /**
   * 即座に保存を実行する
   */
  const saveNow = () => {
    save(context);
  };

  // 公開APIを返す
  return {
    initialize,
    dispose,
    saveNow,
  };
};
