import * as vscode from 'vscode';
import { TimeTracker, ITimeTrackerEvents, TimeData } from '../core/timeTracker';
import { ExcludeFiles, IExcludeFilesEvents } from '../core/excludeFiles';

export interface IStatusBarManager {
  updateTimer(data: TimeData, isTracking: boolean): void;
  updateExcludeStatus(filePath: string | undefined, isExcluded: boolean): void;
}

export interface IViewProvider {
  refresh(): void;
}

export class TimeTrackerService implements ITimeTrackerEvents, IExcludeFilesEvents {
  private timeTracker: TimeTracker;
  private excludeFiles: ExcludeFiles;
  private statusBarManager?: IStatusBarManager;
  private viewProvider?: IViewProvider;
  private context: vscode.ExtensionContext;

  public constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.excludeFiles = new ExcludeFiles(context);
    this.timeTracker = new TimeTracker(context, this.excludeFiles);

    // Core層にイベントリスナーを設定
    this.timeTracker.setEventListener(this);
    this.excludeFiles.setEventListener(this);
  }

  // UI層のコンポーネントを登録
  public setStatusBarManager(statusBarManager: IStatusBarManager): void {
    this.statusBarManager = statusBarManager;
    // 初期状態を更新
    const timeData = this.timeTracker.getCurrentTime();
    this.statusBarManager.updateTimer(timeData, this.timeTracker.getIsTracking());

    // 現在のファイルの除外状態も更新
    if (timeData.currentFile) {
      const isExcluded = this.excludeFiles.isExcluded(timeData.currentFile);
      this.statusBarManager.updateExcludeStatus(timeData.currentFile, isExcluded);
    }
  }

  public setViewProvider(viewProvider: IViewProvider): void {
    this.viewProvider = viewProvider;
  }

  // TimeTracker Core層からのイベントハンドリング
  public onTimeUpdated(data: TimeData) {
    this.statusBarManager?.updateTimer(data, this.timeTracker.getIsTracking());
    this.viewProvider?.refresh();
  }

  public onTrackingStateChanged(isTracking: boolean) {
    const timeData = this.timeTracker.getCurrentTime();
    this.statusBarManager?.updateTimer(timeData, isTracking);
    this.viewProvider?.refresh();

    // コンテキストキーの更新
    vscode.commands.executeCommand('setContext', 'editTimer.isTracking', isTracking);
  }

  public onFileChanged(filePath: string | undefined) {
    if (filePath) {
      const isExcluded = this.excludeFiles.isExcluded(filePath);
      this.statusBarManager?.updateExcludeStatus(filePath, isExcluded);
    }
    this.viewProvider?.refresh();
  }

  // ExcludeFiles Core層からのイベントハンドリング
  public onExcludeStateChanged (filePath: string, isExcluded: boolean) {
    this.statusBarManager?.updateExcludeStatus(filePath, isExcluded);
    this.viewProvider?.refresh();
  };

  // 公開メソッド（UIから呼び出される）
  public toggle(): void {
    this.timeTracker.toggle();
  }

  public pause(): void {
    this.timeTracker.pause();
  }

  public resume(): void {
    this.timeTracker.resume();
  }

  public onEditorChange(editor: vscode.TextEditor | undefined): void {
    this.timeTracker.onEditorChange(editor);
  }

  public async resetAllTimers(): Promise<void> {
    await this.timeTracker.resetAllTimers();
    this.viewProvider?.refresh();
  }

  public showExcludeDialog(): void {
    this.excludeFiles.showExcludeDialog();
  }

  public getTimeTracker(): TimeTracker {
    return this.timeTracker;
  }

  public getExcludeFiles(): ExcludeFiles {
    return this.excludeFiles;
  }

  public dispose(): void {
    this.timeTracker.dispose();
  }
}
