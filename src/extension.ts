import * as vscode from 'vscode';
import { getTreeDataProvider } from './ui/getTreeDataProvider';
import { store } from './app/store';
import { getTimerStatusBarView } from './ui/statusBarManager';

export function activate(context: vscode.ExtensionContext) {
  const treeProvider = getTreeDataProvider();
  if (vscode.window.activeTextEditor?.document.fileName) {
    store.getState().startTimer(vscode.window.activeTextEditor.document.fileName);
  }

  // // 初期コンテキストキー設定
  // vscode.commands.executeCommand('setContext', 'editTimer.isTracking', timeTrackerService.getTimeTracker().getIsTracking());

  // // コマンドの登録
  // const toggleCommand = vscode.commands.registerCommand('editTimer.toggle', () => {
  //   timeTrackerService.toggle();
  // });

  // const pauseCommand = vscode.commands.registerCommand('editTimer.pause', () => {
  //   timeTrackerService.pause();
  // });

  // const resumeCommand = vscode.commands.registerCommand('editTimer.resume', () => {
  //   timeTrackerService.resume();
  // });

  // const openPanelCommand = vscode.commands.registerCommand('editTimer.openPanel', () => {
  //   vscode.commands.executeCommand('workbench.view.explorer');
  //   vscode.commands.executeCommand('timeTrackerView.focus');
  // });

  // const resetCommand = vscode.commands.registerCommand('editTimer.reset', async () => {
  //   await timeTrackerService.resetAllTimers();
  // });

  // const toggleExcludeCommand = vscode.commands.registerCommand('editTimer.toggleExclude', () => {
  //   timeTrackerService.showExcludeDialog();
  // });

  // const generateTimeCardCommand = vscode.commands.registerCommand('editTimer.generateTimeCard', () => {
  //   new TimeCardGenerator().generateTimeCard(context, timeTrackerService.getTimeTracker());
  // });

  // const showFloatingTimerCommand = vscode.commands.registerCommand('editTimer.showFloatingTimer', () => {
  //   floatingTimer ??= new FloatingTimer(context, timeTrackerService.getTimeTracker());
  //   floatingTimer.show();
  // });

  const timerStatusBar = getTimerStatusBarView();
  timerStatusBar.render();

  const refreshViewCommand = vscode.commands.registerCommand('editTimer.refreshView', () => {
    treeProvider.refresh();
  });

  // TreeViewの登録
  const tree = vscode.window.registerTreeDataProvider('timeTrackerView', treeProvider);

  // エディタ変更の監視
  const editorChanged = vscode.window.onDidChangeActiveTextEditor((editor) => {
    const fsPath = editor?.document.uri.fsPath;
    if (fsPath) {
      store.getState().switchTimer(fsPath);
    } else {
      store.getState().stopTimer();
      store.getState().setTrackingFIle(null);
    }
  });

  const globalTimer = setInterval(() => {
    treeProvider.refresh();
    timerStatusBar.render();
  }, 1000);

  context.subscriptions.push(
    // toggleCommand,
    // pauseCommand,
    // resumeCommand,
    // openPanelCommand,
    // resetCommand,
    // toggleExcludeCommand,
    // generateTimeCardCommand,
    // showFloatingTimerCommand,
    timerStatusBar,
    refreshViewCommand,
    tree,
    editorChanged,
    {
      dispose: () => {
        clearInterval(globalTimer);
      },
    },
  );
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
