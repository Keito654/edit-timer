import * as vscode from 'vscode';
import { StatusBarManager } from './ui/statusBarManager';
import { TimeTrackerProvider } from './ui/timeTrackerProvider';
import { TimeCardGenerator } from './ui/timeCardGenerator';
import { FloatingTimer } from './ui/floatingTimer';
import { TrackerManager } from './service/trackerManager';

let trackerManager: TrackerManager;
let statusBarManager: StatusBarManager;
let timeTrackerProvider: TimeTrackerProvider;
let floatingTimer: FloatingTimer | undefined;

export function activate(context: vscode.ExtensionContext) {
  // Service層の初期化
  trackerManager = new TrackerManager();

  // UI層の初期化
  statusBarManager = new StatusBarManager(context);
  timeTrackerProvider = new TimeTrackerProvider(context, trackerManager);

  // 依存性注入
  // timeTrackerService.setStatusBarManager(statusBarManager);
  // timeTrackerService.setViewProvider(timeTrackerProvider);

  // 初期コンテキストキー設定
  // vscode.commands.executeCommand(
  //   "setContext",
  //   "editTimer.isTracking",
  //   timeTrackerService.getTimeTracker().getIsTracking()
  // );

  // コマンドの登録
  // const toggleCommand = vscode.commands.registerCommand(
  //   "editTimer.toggle",
  //   () => {
  //     timeTrackerService.toggle();
  //   }
  // );

  const pauseCommand = vscode.commands.registerCommand('editTimer.pause', () => {
    trackerManager.pause();
  });

  const resumeCommand = vscode.commands.registerCommand('editTimer.resume', () => {
    trackerManager.resume();
    const activeFile = vscode.window.activeTextEditor;
    if (activeFile) {
      trackerManager.startTimer(activeFile.document.fileName);
    }
  });

  const openPanelCommand = vscode.commands.registerCommand('editTimer.openPanel', () => {
    vscode.commands.executeCommand('workbench.view.explorer');
    vscode.commands.executeCommand('timeTrackerView.focus');
  });

  const resetCommand = vscode.commands.registerCommand('editTimer.reset', () => {
    trackerManager.resetAllTimers();
  });

  // const toggleExcludeCommand = vscode.commands.registerCommand('editTimer.toggleExclude', () => {
  //   timeTrackerService.showExcludeDialog();
  // });

  const generateTimeCardCommand = vscode.commands.registerCommand('editTimer.generateTimeCard', () => {
    new TimeCardGenerator().generateTimeCard(context, trackerManager);
  });

  const showFloatingTimerCommand = vscode.commands.registerCommand('editTimer.showFloatingTimer', () => {
    floatingTimer ??= new FloatingTimer(context, trackerManager);
    floatingTimer.show();
  });

  const refreshViewCommand = vscode.commands.registerCommand('editTimer.refreshView', () => {
    timeTrackerProvider.refresh();
  });

  // TreeViewの登録
  const tree = vscode.window.registerTreeDataProvider('timeTrackerView', timeTrackerProvider);

  // エディタ変更の監視
  const editorChanged = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      trackerManager.switchTimer(editor.document.fileName);
    } else {
      trackerManager.stopTimer();
    }
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
    refreshViewCommand,
    tree,
    editorChanged,
    statusBarManager,
  );
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
