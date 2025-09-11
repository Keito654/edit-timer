import * as vscode from "vscode";
import { getTreeDataProvider } from "./ui/treeDataProvider";
import { store } from "./app/store";
import { getTimerStatusBarView } from "./ui/statusBar";
import { createTimeCardGenerator } from "./ui/timeCardGenerator";
import { getFloatingTimerView } from "./ui/floatingTimer";

export function activate(context: vscode.ExtensionContext) {
  const treeProvider = getTreeDataProvider();
  if (vscode.window.activeTextEditor?.document.fileName) {
    store.getState().startTimer({
      now: Date.now(),
      fsPath: vscode.window.activeTextEditor.document.fileName,
    });
  }

  // // 初期コンテキストキー設定
  vscode.commands.executeCommand(
    "setContext",
    "editTimer.isTracking",
    store.getState().isTracking
  );

  // // コマンドの登録
  const toggleCommand = vscode.commands.registerCommand(
    "editTimer.toggle",
    () => {
      store.getState().switchTracking();
    }
  );

  const pauseCommand = vscode.commands.registerCommand(
    "editTimer.pause",
    () => {
      store.getState().pause();
    }
  );

  const resumeCommand = vscode.commands.registerCommand(
    "editTimer.resume",
    () => {
      store.getState().resume();
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
    }
  );

  // const toggleExcludeCommand = vscode.commands.registerCommand(
  //   "editTimer.toggleExclude",
  //   () => {
  //     timeTrackerService.showExcludeDialog();
  //   }
  // );

  const generateTimeCardCommand = vscode.commands.registerCommand(
    "editTimer.generateTimeCard",
    () => {
      const generator = createTimeCardGenerator();
      generator.generateTimeCard();
    }
  );

  const showFloatingTimerCommand = vscode.commands.registerCommand(
    "editTimer.showFloatingTimer",
    () => {
      const floatingTimer = getFloatingTimerView(context);
      floatingTimer.show();
    }
  );

  const timerStatusBar = getTimerStatusBarView();
  timerStatusBar.render();

  const refreshViewCommand = vscode.commands.registerCommand(
    "editTimer.refreshView",
    () => {
      treeProvider.refresh();
    }
  );

  // TreeViewの登録
  const tree = vscode.window.registerTreeDataProvider(
    "timeTrackerView",
    treeProvider
  );

  // エディタ変更の監視
  const editorChanged = vscode.window.onDidChangeActiveTextEditor((editor) => {
    const fsPath = editor?.document.uri.fsPath;
    const now = Date.now();
    if (fsPath) {
      store.getState().switchTimer({ now, fsPath });
    } else {
      store.getState().stopTimer({ now });
    }
  });

  const globalTimer = setInterval(() => {
    treeProvider.refresh();
    timerStatusBar.render();
  }, 1000);

  context.subscriptions.push(
    toggleCommand,
    pauseCommand,
    resumeCommand,
    openPanelCommand,
    resetCommand,
    // toggleExcludeCommand,
    generateTimeCardCommand,
    showFloatingTimerCommand,
    timerStatusBar,
    refreshViewCommand,
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
