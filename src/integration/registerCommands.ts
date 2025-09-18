import * as vscode from "vscode";
import { store } from "../store";
import { getTimeCardWebView } from "./views/timeCardWebView";
import { getFloatingTimerWebView } from "./views/floatingTimeWebView";
import { getExcludeFileDialog } from "./views/excludeFileDialog";

export interface TimerControls {
  start: () => void;
  stop: () => void;
}

export interface StatusBars {
  timerStatusBar: { render: (fsPath?: string) => void; dispose: () => void };
  excludeFileStatusBar: {
    render: (fsPath?: string) => void;
    dispose: () => void;
  };
}

export interface PersistenceControls {
  saveNow: () => void;
}

export function registerCommands(
  context: vscode.ExtensionContext,
  deps: {
    timer: TimerControls;
    statusBars: StatusBars;
    treeProvider: {
      refresh: () => void;
      refreshSpecific: (
        type: "total" | "files" | "file",
        fileId?: string,
      ) => void;
    };
    persistence: PersistenceControls;
  },
): {
  floatingTimerWebView: vscode.Disposable;
  timeCardWebView: vscode.Disposable;
} {
  const { timerStatusBar, excludeFileStatusBar } = deps.statusBars;

  // 初期コンテキストキー設定（呼び出し元で一度行っているが保守用に関数化）
  const setTrackingContext = () =>
    vscode.commands.executeCommand(
      "setContext",
      "editTimer.isTracking",
      store.getState().isTracking,
    );

  const toggle = vscode.commands.registerCommand("editTimer.toggle", () => {
    store.getState().switchTracking({
      now: Date.now(),
      fsPath: vscode.window.activeTextEditor?.document.uri.fsPath,
    });
    setTrackingContext();

    if (store.getState().isTracking) {
      deps.timer.start();
    } else {
      deps.timer.stop();
    }

    // 重要な状態変更時に保存
    deps.persistence.saveNow();
  });

  const pause = vscode.commands.registerCommand("editTimer.pause", () => {
    const now = Date.now();
    store.getState().pause({ now });
    setTrackingContext();
    deps.timer.stop();

    // 重要な状態変更時に保存
    deps.persistence.saveNow();
  });

  const resume = vscode.commands.registerCommand("editTimer.resume", () => {
    store.getState().resume({
      now: Date.now(),
      fsPath: vscode.window.activeTextEditor?.document.uri.fsPath,
    });
    setTrackingContext();
    deps.timer.start();

    // 重要な状態変更時に保存
    deps.persistence.saveNow();
  });

  const openPanel = vscode.commands.registerCommand(
    "editTimer.openPanel",
    () => {
      vscode.commands.executeCommand("workbench.view.explorer");
      vscode.commands.executeCommand("timeTrackerView.focus");
    },
  );

  const reset = vscode.commands.registerCommand("editTimer.reset", () => {
    store.getState().reset();
    if (vscode.window.activeTextEditor?.document.uri.fsPath) {
      store.getState().startTimer({
        now: Date.now(),
        fsPath: vscode.window.activeTextEditor.document.uri.fsPath,
      });
    }

    // reset後は全体を更新
    deps.treeProvider.refresh();

    // 重要な状態変更時に保存
    deps.persistence.saveNow();
  });

  const excludeFilesApi = getExcludeFileDialog();
  const toggleExclude = vscode.commands.registerCommand(
    "editTimer.toggleExclude",
    () => {
      excludeFilesApi.showExcludeDialog();
      // 即時ステータスバー更新（現行ファイルのパスで描画）
      excludeFileStatusBar.render(
        vscode.window.activeTextEditor?.document.uri.fsPath,
      );

      // exclude状態変更後はファイルリストを更新
      deps.treeProvider.refreshSpecific("files");

      if (vscode.window.activeTextEditor?.document.uri.fsPath) {
        store.getState().startTimer({
          now: Date.now(),
          fsPath: vscode.window.activeTextEditor.document.uri.fsPath,
        });
      }

      // 除外ファイル変更後に保存（ダイアログで変更される可能性があるため少し遅延）
      setTimeout(() => {
        deps.persistence.saveNow();
      }, 1000);
    },
  );

  // WebViewインスタンスの作成（disposeできるように）
  const timeCardWebView = getTimeCardWebView();
  const generateTimeCard = vscode.commands.registerCommand(
    "editTimer.generateTimeCard",
    () => {
      timeCardWebView.generateTimeCard();
    },
  );

  // FloatingTimerWebViewのインスタンスを1つだけ保持
  const floatingTimerWebView = getFloatingTimerWebView(context);

  const showFloatingTimer = vscode.commands.registerCommand(
    "editTimer.showFloatingTimer",
    () => {
      floatingTimerWebView.show();
    },
  );

  const refreshView = vscode.commands.registerCommand(
    "editTimer.refreshView",
    () => {
      deps.treeProvider.refresh();
      // statusbars are updated by the global timer tick; keep this fast
    },
  );

  // デバッグ用の手動保存コマンド
  const saveData = vscode.commands.registerCommand("editTimer.saveData", () => {
    deps.persistence.saveNow();
    vscode.window.showInformationMessage("Edit Timer: Data saved manually");
  });

  // 再描画を初回明示
  timerStatusBar.render(vscode.window.activeTextEditor?.document.uri.fsPath);
  excludeFileStatusBar.render(
    vscode.window.activeTextEditor?.document.uri.fsPath,
  );

  context.subscriptions.push(
    toggle,
    pause,
    resume,
    openPanel,
    reset,
    toggleExclude,
    generateTimeCard,
    showFloatingTimer,
    refreshView,
    saveData,
  );

  // WebViewのインスタンスを返してextension.tsでdisposeできるようにする
  return {
    floatingTimerWebView,
    timeCardWebView,
  };
}
