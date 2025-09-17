import * as vscode from "vscode";
import { getTreeDataProvider } from "./integration/views/treeDataProvider";
import { store } from "./store";
import { getTimerStatusBar } from "./integration/views/timerStatusBar";
import { getExcludeFileStatusBar } from "./integration/views/excludeFileStatusBar";
import { createGlobalTimer } from "./globalTimer";
import { registerCommands } from "./integration/registerCommands";
import { registerEditorEvents } from "./integration/registerEditorEvents";
import { createPersistenceManager } from "./integration/persistence";

export function activate(context: vscode.ExtensionContext) {
  // 永続化マネージャを初期化（データのロード）
  const persistenceManager = createPersistenceManager(context);
  persistenceManager.initialize();

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

  const globalTimer = createGlobalTimer(() => {
    // 差分更新でtotal timeのみを更新（パフォーマンス向上）
    treeProvider.refreshSpecific("total");
    const current = vscode.window.activeTextEditor?.document.uri.fsPath;
    timerStatusBar.render(current);
  });

  // 初期コンテキストキー設定
  vscode.commands.executeCommand(
    "setContext",
    "editTimer.isTracking",
    store.getState().isTracking
  );

  // コマンドの登録
  // コマンド登録（モジュールへ委譲）
  const commandResult = registerCommands(context, {
    timer: { start: globalTimer.start, stop: globalTimer.stop },
    statusBars: { timerStatusBar, excludeFileStatusBar },
    treeProvider,
    persistence: { saveNow: () => persistenceManager.saveNow() },
  });

  const tree = vscode.window.registerTreeDataProvider(
    "timeTrackerView",
    treeProvider
  );

  // グローバルタイマー開始
  globalTimer.start();

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
    globalTimer,
    persistenceManager,
    commandResult.floatingTimerWebView
  );
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
