import * as vscode from "vscode";
import { getTreeDataProvider } from "./ui/treeDataProvider";
import { store } from "./app/store";
import { getTimerStatusBar } from "./ui/timerStatusBar";
import { getTimeCardWebView } from "./ui/timeCardWebView";
import { getFloatingTimerWebView } from "./ui/floatingTimeWebView";
import { getExcludeFileDialog } from "./ui/excludeFileDialog";
import { getExcludeFileStatusBar } from "./ui/excludeFileStatusBar";

export function activate(context: vscode.ExtensionContext) {
  let globalTimer: NodeJS.Timeout | undefined = undefined;

  if (vscode.window.activeTextEditor?.document.fileName) {
    store.getState().startTimer({
      now: Date.now(),
      fsPath: vscode.window.activeTextEditor.document.fileName,
    });
  }

  const treeProvider = getTreeDataProvider();
  const timerStatusBar = getTimerStatusBar();
  timerStatusBar.render(vscode.window.activeTextEditor?.document.fileName);
  const excludeFileStatusBar = getExcludeFileStatusBar();
  excludeFileStatusBar.render(
    vscode.window.activeTextEditor?.document.fileName
  );

  const startGlobalTimer = () => {
    globalTimer = setInterval(() => {
      treeProvider.refresh();
      timerStatusBar.render(vscode.window.activeTextEditor?.document.fileName);
    }, 1000);
  };
  const stopGlobalTimer = () => {
    clearInterval(globalTimer);
    globalTimer = undefined;
  };

  // 初期コンテキストキー設定
  vscode.commands.executeCommand(
    "setContext",
    "editTimer.isTracking",
    store.getState().isTracking
  );

  // コマンドの登録
  const toggleCommand = vscode.commands.registerCommand(
    "editTimer.toggle",
    () => {
      store.getState().switchTracking({
        now: Date.now(),
        fsPath: vscode.window.activeTextEditor?.document.fileName,
      });
      vscode.commands.executeCommand(
        "setContext",
        "editTimer.isTracking",
        store.getState().isTracking
      );

      if (store.getState().isTracking) {
        startGlobalTimer();
      } else {
        stopGlobalTimer();
      }
    }
  );

  const pauseCommand = vscode.commands.registerCommand(
    "editTimer.pause",
    () => {
      const now = Date.now();
      store.getState().pause({ now });
      vscode.commands.executeCommand(
        "setContext",
        "editTimer.isTracking",
        store.getState().isTracking
      );
      stopGlobalTimer();
    }
  );

  const resumeCommand = vscode.commands.registerCommand(
    "editTimer.resume",
    () => {
      store.getState().resume({
        now: Date.now(),
        fsPath: vscode.window.activeTextEditor?.document.fileName,
      });
      vscode.commands.executeCommand(
        "setContext",
        "editTimer.isTracking",
        store.getState().isTracking
      );
      startGlobalTimer();
    }
  );

  const openPanelCommand = vscode.commands.registerCommand(
    "editTimer.openPanel",
    () => {
      vscode.commands.executeCommand("workbench.view.explorer");
      vscode.commands.executeCommand("timeTrackerView.focus");
    }
  );

  const resetCommand = vscode.commands.registerCommand(
    "editTimer.reset",
    () => {
      store.getState().reset();
      if (vscode.window.activeTextEditor?.document.fileName) {
        store.getState().startTimer({
          now: Date.now(),
          fsPath: vscode.window.activeTextEditor.document.fileName,
        });
      }
    }
  );

  const excludeFilesApi = getExcludeFileDialog();
  const toggleExcludeCommand = vscode.commands.registerCommand(
    "editTimer.toggleExclude",
    () => {
      excludeFilesApi.showExcludeDialog();
      if (vscode.window.activeTextEditor?.document.fileName) {
        store.getState().startTimer({
          now: Date.now(),
          fsPath: vscode.window.activeTextEditor.document.fileName,
        });
      }
    }
  );

  const generateTimeCardCommand = vscode.commands.registerCommand(
    "editTimer.generateTimeCard",
    () => {
      const generator = getTimeCardWebView();
      generator.generateTimeCard();
    }
  );

  const showFloatingTimerCommand = vscode.commands.registerCommand(
    "editTimer.showFloatingTimer",
    () => {
      const floatingTimer = getFloatingTimerWebView(context);
      floatingTimer.show();
    }
  );

  const refreshViewCommand = vscode.commands.registerCommand(
    "editTimer.refreshView",
    () => {
      treeProvider.refresh();
    }
  );

  const tree = vscode.window.registerTreeDataProvider(
    "timeTrackerView",
    treeProvider
  );

  startGlobalTimer();

  // エディタ変更の監視
  const editorChanged = vscode.window.onDidChangeActiveTextEditor((editor) => {
    const fsPath = editor?.document.uri.fsPath;
    const now = Date.now();
    if (fsPath) {
      store.getState().switchTimer({ now, fsPath });
    } else {
      store.getState().stopTimer({ now });
    }

    timerStatusBar.render(vscode.window.activeTextEditor?.document.fileName);
    excludeFileStatusBar.render(
      vscode.window.activeTextEditor?.document.fileName
    );
  });

  context.subscriptions.push(
    toggleCommand,
    pauseCommand,
    resumeCommand,
    openPanelCommand,
    resetCommand,
    toggleExcludeCommand,
    generateTimeCardCommand,
    showFloatingTimerCommand,
    timerStatusBar,
    refreshViewCommand,
    excludeFileStatusBar,
    tree,
    editorChanged,
    {
      dispose: () => {
        clearInterval(globalTimer);
      },
    }
  );
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
