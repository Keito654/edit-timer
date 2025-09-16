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

export function registerCommands(
  context: vscode.ExtensionContext,
  deps: {
    timer: TimerControls;
    statusBars: StatusBars;
    treeProvider: { refresh: () => void };
  },
) {
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
  });

  const pause = vscode.commands.registerCommand("editTimer.pause", () => {
    const now = Date.now();
    store.getState().pause({ now });
    setTrackingContext();
    deps.timer.stop();
  });

  const resume = vscode.commands.registerCommand("editTimer.resume", () => {
    store.getState().resume({
      now: Date.now(),
      fsPath: vscode.window.activeTextEditor?.document.uri.fsPath,
    });
    setTrackingContext();
    deps.timer.start();
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
      if (vscode.window.activeTextEditor?.document.uri.fsPath) {
        store.getState().startTimer({
          now: Date.now(),
          fsPath: vscode.window.activeTextEditor.document.uri.fsPath,
        });
      }
    },
  );

  const generateTimeCard = vscode.commands.registerCommand(
    "editTimer.generateTimeCard",
    () => {
      const generator = getTimeCardWebView();
      generator.generateTimeCard();
    },
  );

  const showFloatingTimer = vscode.commands.registerCommand(
    "editTimer.showFloatingTimer",
    () => {
      const floatingTimer = getFloatingTimerWebView(context);
      floatingTimer.show();
    },
  );

  const refreshView = vscode.commands.registerCommand(
    "editTimer.refreshView",
    () => {
      deps.treeProvider.refresh();
      // statusbars are updated by the global timer tick; keep this fast
    },
  );

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
  );
}
