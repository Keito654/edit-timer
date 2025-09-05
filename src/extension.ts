import * as vscode from 'vscode';
import { TimeTrackerService } from './service/timeTrackerService';
import { StatusBarManager } from './ui/statusBarManager';
import { TimeTrackerProvider } from './ui/timeTrackerProvider';
import { TimeCardGenerator } from './ui/timeCardGenerator';
import { FloatingTimer } from './ui/floatingTimer';

let timeTrackerService: TimeTrackerService;
let statusBarManager: StatusBarManager;
let timeTrackerProvider: TimeTrackerProvider;
let floatingTimer: FloatingTimer | undefined;

export function activate(context: vscode.ExtensionContext) {
  // Service層の初期化
  timeTrackerService = new TimeTrackerService(context);

  // UI層の初期化
  statusBarManager = new StatusBarManager(context);
  timeTrackerProvider = new TimeTrackerProvider(context, timeTrackerService.getTimeTracker());

  // 依存性注入
  timeTrackerService.setStatusBarManager(statusBarManager);
  timeTrackerService.setViewProvider(timeTrackerProvider);

  // 初期コンテキストキー設定
  vscode.commands.executeCommand('setContext', 'editTimer.isTracking', timeTrackerService.getTimeTracker().getIsTracking());

  // コマンドの登録
  const toggleCommand = vscode.commands.registerCommand('editTimer.toggle', () => {
    timeTrackerService.toggle();
  });

  const pauseCommand = vscode.commands.registerCommand('editTimer.pause', () => {
    timeTrackerService.pause();
  });

  const resumeCommand = vscode.commands.registerCommand('editTimer.resume', () => {
    timeTrackerService.resume();
  });

  const openPanelCommand = vscode.commands.registerCommand('editTimer.openPanel', () => {
    vscode.commands.executeCommand('workbench.view.explorer');
    vscode.commands.executeCommand('timeTrackerView.focus');
  });

  const resetCommand = vscode.commands.registerCommand('editTimer.reset', async () => {
    await timeTrackerService.resetAllTimers();
  });

  const toggleExcludeCommand = vscode.commands.registerCommand('editTimer.toggleExclude', () => {
    timeTrackerService.showExcludeDialog();
  });

  const generateTimeCardCommand = vscode.commands.registerCommand('editTimer.generateTimeCard', () => {
    new TimeCardGenerator().generateTimeCard(context, timeTrackerService.getTimeTracker());
  });

  const showFloatingTimerCommand = vscode.commands.registerCommand('editTimer.showFloatingTimer', () => {
    floatingTimer ??= new FloatingTimer(context, timeTrackerService.getTimeTracker());
    floatingTimer.show();
  });

  const refreshViewCommand = vscode.commands.registerCommand('editTimer.refreshView', () => {
    timeTrackerProvider.refresh();
  });

  // TreeViewの登録
  const tree = vscode.window.registerTreeDataProvider('timeTrackerView', timeTrackerProvider);

  // エディタ変更の監視
  const editorChanged = vscode.window.onDidChangeActiveTextEditor((editor) => {
    timeTrackerService.onEditorChange(editor);
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
    statusBarManager
  );
}

export function deactivate() {
  timeTrackerService?.dispose();
}
