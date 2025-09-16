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
export function save(context: vscode.ExtensionContext): void {
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
}

/**
 * ワークスペースステートからデータを取得してZustandストアに反映する
 * @param context VS Code ExtensionContext
 * @returns 復元に成功した場合true、データが存在しない場合false
 */
export function load(context: vscode.ExtensionContext): boolean {
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
  // Zustandの内部データ構造を直接操作
  // これは復元処理のため例外的に許可される
  store.setState((state) => {
    for (const { fsPath, elapsedTime } of fileData) {
      state.fileTimeTracker.set(fsPath, {
        startAt: null,
        accumulated: elapsedTime,
      });
    }
    return state;
  });

  // 追跡状態を復元（現在の状態と異なる場合のみ）
  if (isTracking !== store.getState().isTracking) {
    const now = Date.now();
    store.getState().switchTracking({ now });
  }

  return true;
}
