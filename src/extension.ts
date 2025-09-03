import * as vscode from "vscode";
import { TimeTrackerProvider } from "./timeTrackerProvider";
import { TimeCardGenerator } from "./timeCardGenerator";
import { FloatingTimer } from "./floatingTimer";
import { ExcludeFiles } from "./excludeFiles";
import { TimeTracker } from "./timeTracker";

let statusBarItem: vscode.StatusBarItem;
let timeTracker: TimeTracker;
let floatingTimer: FloatingTimer | undefined;
let excludeFiles: ExcludeFiles;

export function activate(context: vscode.ExtensionContext) {
  // ステータスバーアイテムの作成
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.command = "timeTracker.openPanel";
  statusBarItem.text = "$(watch) 00:00:00";
  statusBarItem.tooltip = "Time Tracker: Click to open panel";
  statusBarItem.show();

  // ExcludeFilesの初期化
  excludeFiles = new ExcludeFiles(context);

  // タイムトラッカーの初期化
  timeTracker = new TimeTracker(context, statusBarItem, excludeFiles);

  // コマンドの登録
  const toggleCommand = vscode.commands.registerCommand(
    "timeTracker.toggle",
    () => {
      timeTracker.toggle();
      // Toggling tracking affects times shown
      timeTrackerProvider.refresh();
    },
  );

  const openPanelCommand = vscode.commands.registerCommand(
    "timeTracker.openPanel",
    () => {
      vscode.commands.executeCommand("workbench.view.explorer");
      vscode.commands.executeCommand("timeTrackerView.focus");
    },
  );

  const generateTimeCardCommand = vscode.commands.registerCommand(
    "timeTracker.generateTimeCard",
    () => {
      TimeCardGenerator.generateTimeCard(context, timeTracker);
    },
  );

  const showFloatingTimerCommand = vscode.commands.registerCommand(
    "timeTracker.showFloatingTimer",
    () => {
      floatingTimer ??= new FloatingTimer(context, timeTracker);
      floatingTimer.show();
    },
  );

  const toggleExcludeCommand = vscode.commands.registerCommand(
    "timeTracker.toggleExclude",
    () => {
      excludeFiles.showExcludeDialog();
    },
  );

  const resetCommand = vscode.commands.registerCommand(
    "timeTracker.reset",
    async () => {
      await timeTracker.resetAllTimers();
      // Reset updates view data entirely
      timeTrackerProvider.refresh();
    },
  );

  // Time Tracker View Provider
  const timeTrackerProvider = new TimeTrackerProvider(context, timeTracker);
  const tree = vscode.window.registerTreeDataProvider(
    "timeTrackerView",
    timeTrackerProvider,
  );

  // Refresh command for manual update
  const refreshViewCommand = vscode.commands.registerCommand(
    "timeTracker.refreshView",
    () => {
      timeTrackerProvider.refresh();
    },
  );

  // エディタの変更監視
  const editorChanged = vscode.window.onDidChangeActiveTextEditor((editor) => {
    timeTracker.onEditorChange(editor);
    excludeFiles.onActiveEditorChanged();
    // Editor change implies data changed => refresh view
    timeTrackerProvider.refresh();
  });

  context.subscriptions.push(
    statusBarItem,
    toggleCommand,
    refreshViewCommand,
    openPanelCommand,
    generateTimeCardCommand,
    showFloatingTimerCommand,
    toggleExcludeCommand,
    resetCommand,
    timeTrackerProvider,
    timeTracker,
    editorChanged,
    tree,
  );
}

export function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}
