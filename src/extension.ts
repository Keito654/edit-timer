import * as vscode from "vscode";
import { getTreeDataProvider } from "./integration/views/treeDataProvider";
import { store } from "./store";
import { getTimerStatusBar } from "./integration/views/timerStatusBar";
import { getExcludeFileStatusBar } from "./integration/views/excludeFileStatusBar";
import { createGlobalTimer } from "./globalTimer";
import { registerCommands } from "./integration/registerCommands";
import { registerEditorEvents } from "./integration/registerEditorEvents";
import {
  createPersistenceManager,
  type PersistenceManager,
} from "./integration/persistence";

// グローバルリソース管理用の変数
let globalTimer: { dispose: () => void } | undefined;
let persistenceManager: PersistenceManager | undefined;
let floatingTimerWebView: { dispose: () => void } | undefined;
let timeCardWebView: { dispose: () => void } | undefined;

export function activate(context: vscode.ExtensionContext) {
  // 永続化マネージャを初期化（データのロード）
  const localPersistenceManager = createPersistenceManager(context);
  localPersistenceManager.initialize();

  // グローバル変数に保存（deactivate時に解放するため）
  persistenceManager = localPersistenceManager;

  // 初期アクティブエディタがあればタイマー開始
  if (vscode.window.activeTextEditor?.document.uri.fsPath) {
    store.getState().startTimer({
      now: Date.now(),
      fsPath: vscode.window.activeTextEditor.document.uri.fsPath,
    });
  }

  const treeProvider = getTreeDataProvider();
  const timerStatusBar = getTimerStatusBar();
  const excludeFileStatusBar = getExcludeFileStatusBar();

  const localGlobalTimer = createGlobalTimer(() => {
    // 差分更新でtotal timeのみを更新（パフォーマンス向上）
    treeProvider.refreshSpecific("total");
    const current = vscode.window.activeTextEditor?.document.uri.fsPath;
    timerStatusBar.render(current);
  });

  // グローバル変数に保存（deactivate時に解放するため）
  globalTimer = localGlobalTimer;

  // 初期コンテキストキー設定
  vscode.commands.executeCommand(
    "setContext",
    "editTimer.isTracking",
    store.getState().isTracking
  );

  // コマンドの登録
  // コマンド登録（モジュールへ委譲）
  const commandResult = registerCommands(context, {
    timer: { start: localGlobalTimer.start, stop: localGlobalTimer.stop },
    statusBars: { timerStatusBar, excludeFileStatusBar },
    treeProvider,
    persistence: { saveNow: () => localPersistenceManager.saveNow() },
  });

  // グローバル変数に保存（deactivate時に解放するため）
  floatingTimerWebView = commandResult.floatingTimerWebView;
  timeCardWebView = commandResult.timeCardWebView;

  const tree = vscode.window.registerTreeDataProvider(
    "timeTrackerView",
    treeProvider
  );

  // グローバルタイマー開始
  localGlobalTimer.start();

  // エディタ変更の監視
  // エディタイベント登録
  registerEditorEvents(context, {
    timerStatusBar,
    excludeFileStatusBar,
    treeProvider,
  });

  context.subscriptions.push(
    timerStatusBar,
    excludeFileStatusBar,
    tree,
    treeProvider,
    localGlobalTimer,
    localPersistenceManager,
    commandResult.floatingTimerWebView
  );
}

export function deactivate() {
  console.log("Edit Timer: Extension deactivating, cleaning up resources...");

  try {
    // 現在の状態を最終保存
    if (persistenceManager) {
      persistenceManager.saveNow();
      console.log("Edit Timer: Final state saved");
    }
  } catch (error) {
    console.error("Edit Timer: Error during final save:", error);
  }

  // グローバルタイマーの停止と解放
  if (globalTimer) {
    try {
      globalTimer.dispose();
      console.log("Edit Timer: Global timer disposed");
    } catch (error) {
      console.error("Edit Timer: Error disposing global timer:", error);
    }
    globalTimer = undefined;
  }

  // 永続化マネージャの解放
  if (persistenceManager) {
    try {
      persistenceManager.dispose();
      console.log("Edit Timer: Persistence manager disposed");
    } catch (error) {
      console.error("Edit Timer: Error disposing persistence manager:", error);
    }
    persistenceManager = undefined;
  }

  // Floating Timer WebViewの解放
  if (floatingTimerWebView) {
    try {
      floatingTimerWebView.dispose();
      console.log("Edit Timer: Floating timer WebView disposed");
    } catch (error) {
      console.error(
        "Edit Timer: Error disposing floating timer WebView:",
        error
      );
    }
    floatingTimerWebView = undefined;
  }

  // Time Card WebViewの解放
  if (timeCardWebView) {
    try {
      timeCardWebView.dispose();
      console.log("Edit Timer: Time card WebView disposed");
    } catch (error) {
      console.error("Edit Timer: Error disposing time card WebView:", error);
    }
    timeCardWebView = undefined;
  }

  // 最後にタイマーを停止してストアの状態を整理
  try {
    const now = Date.now();
    store.getState().stopTimer({ now });
    console.log("Edit Timer: Store timer stopped");
  } catch (error) {
    console.error("Edit Timer: Error stopping store timer:", error);
  }

  console.log("Edit Timer: Extension deactivation completed");
}
