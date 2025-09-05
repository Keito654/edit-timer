import * as vscode from 'vscode';
import { ExcludeFiles } from './excludeFiles';

export interface FileTimer {
  totalTime: number;
  lastStartTime: number | null;
}

export interface TimeData {
  totalTime: number;
  currentFileTime: number | null;
  currentFile: string | undefined;
}

export interface ITimeTrackerEvents {
  onTimeUpdated: (data: TimeData) => void;
  onTrackingStateChanged: (isTracking: boolean) => void;
  onFileChanged: (filePath: string | undefined) => void;
}

export class TimeTracker {
  private isTracking = true;
  private fileTimers: Map<string, FileTimer>;
  private currentFile: string | undefined;
  private totalTime = 0;
  private context: vscode.ExtensionContext;
  private excludeFiles: ExcludeFiles;
  private events: ITimeTrackerEvents | undefined;
  private refreshInterval?: ReturnType<typeof setInterval>;

  public constructor(context: vscode.ExtensionContext, excludeFiles: ExcludeFiles) {
    this.context = context;
    this.excludeFiles = excludeFiles;
    this.fileTimers = this.loadFileTimers();

    // 初期合計時間を算出
    for (const [, timer] of this.fileTimers) {
      this.totalTime += timer.totalTime;
    }

    this.currentFile = vscode.window.activeTextEditor?.document.fileName;

    // 初期状態で現在のファイルを開始
    if (this.isTracking && this.currentFile && !this.excludeFiles.isExcluded(this.currentFile)) {
      const existing = this.fileTimers.get(this.currentFile);
      if (existing) {
        existing.lastStartTime = Date.now();
      } else {
        this.fileTimers.set(this.currentFile, {
          totalTime: 0,
          lastStartTime: Date.now(),
        });
      }
      this.startTick();
    }
  }

  // イベントリスナーを設定（Service層から設定される）
  public setEventListener(events: ITimeTrackerEvents): void {
    this.events = events;
  }

  /**
   * 時間計測の有効・無効を切り替える
   */
  public toggle() {
    this.isTracking = !this.isTracking;

    if (this.isTracking) {
      if (this.currentFile && !this.excludeFiles.isExcluded(this.currentFile)) {
        const timer = this.fileTimers.get(this.currentFile);
        if (timer) {
          timer.lastStartTime = Date.now();
        } else {
          this.fileTimers.set(this.currentFile, {
            totalTime: 0,
            lastStartTime: Date.now(),
          });
        }
        this.startTick();
      }
    } else {
      if (this.currentFile && !this.excludeFiles.isExcluded(this.currentFile)) {
        this.updateCurrentFileTimer(true);
        this.saveFileTimers();
      }
      this.stopTick();
    }

    // イベント通知
    this.events?.onTrackingStateChanged(this.isTracking);
    this.events?.onTimeUpdated(this.getCurrentTime());
  }

  /**
   * 計測を一時停止（すでに停止中なら何もしない）
   */
  public pause() {
    if (!this.isTracking) return;
    this.toggle();
  }

  /**
   * 計測を再開（すでに再開中なら何もしない）
   */
  public resume() {
    if (this.isTracking) return;
    this.toggle();
  }

  /**
   * 作業中のファイルが切り替わった時の処理
   */
  public onEditorChange(editor: vscode.TextEditor | undefined) {
    if (!this.isTracking) return;

    // 現在のファイルの時間を保存
    if (this.currentFile && !this.excludeFiles.isExcluded(this.currentFile)) {
      this.updateCurrentFileTimer(true);
      this.saveFileTimers();
    }

    if (!editor) {
      this.currentFile = undefined;
      this.stopTick();
      this.events?.onFileChanged(this.currentFile);
      return;
    }

    this.currentFile = editor.document.fileName;
    this.events?.onFileChanged(this.currentFile);

    if (this.excludeFiles.isExcluded(this.currentFile)) {
      this.stopTick();
      return;
    }

    if (!this.fileTimers.has(this.currentFile)) {
      this.fileTimers.set(this.currentFile, {
        totalTime: 0,
        lastStartTime: Date.now(),
      });
    } else {
      const timer = this.fileTimers.get(this.currentFile)!;
      timer.lastStartTime = Date.now();
    }

    this.startTick();
  }

  private update() {
    if (!this.isTracking || !this.currentFile || this.excludeFiles.isExcluded(this.currentFile)) {
      return;
    }

    this.updateCurrentFileTimer();
    // イベント通知
    this.events?.onTimeUpdated(this.getCurrentTime());
  }

  private updateCurrentFileTimer(stop = false) {
    if (!this.currentFile) return;

    const timer = this.fileTimers.get(this.currentFile);
    if (!timer?.lastStartTime) return;

    const now = Date.now();
    const elapsed = now - timer.lastStartTime;
    timer.totalTime += elapsed;
    this.totalTime += elapsed;
    timer.lastStartTime = stop ? null : now;
  }

  /**
   * 実行時点の経過時間を返す
   */
  public getCurrentTime(): TimeData {
    const currentFileTime = this.currentFile ? (this.fileTimers.get(this.currentFile)?.totalTime ?? null) : null;

    return {
      currentFileTime,
      totalTime: this.totalTime,
      currentFile: this.currentFile,
    };
  }

  public getFileTimers(): Map<string, FileTimer> {
    return this.fileTimers;
  }

  public getIsTracking(): boolean {
    return this.isTracking;
  }

  public async resetAllTimers() {
    const result = await vscode.window.showWarningMessage('Are you sure you want to reset all time data?', { modal: true }, 'Yes', 'No');

    if (result === 'Yes') {
      this.fileTimers.clear();
      this.totalTime = 0;
      this.saveFileTimers();
      vscode.window.showInformationMessage('All time data has been reset');

      // イベント通知
      this.events?.onTimeUpdated(this.getCurrentTime());
    }
  }

  public dispose(): void {
    this.stopTick();
    // 終了時に現在の計測を確定・保存
    if (this.currentFile && !this.excludeFiles.isExcluded(this.currentFile)) {
      this.updateCurrentFileTimer(true);
    }
    this.saveFileTimers();
  }

  private startTick() {
    if (this.refreshInterval) return;
    this.refreshInterval = setInterval(() => {
      this.update();
    }, 1000);
  }

  private stopTick() {
    if (!this.refreshInterval) return;
    clearInterval(this.refreshInterval);
    this.refreshInterval = undefined;
  }

  private loadFileTimers(): Map<string, FileTimer> {
    const saved = this.context.workspaceState.get<Record<string, FileTimer>>('fileTimers', {});
    return new Map(Object.entries(saved));
  }

  private saveFileTimers() {
    const obj: Record<string, FileTimer> = {};
    for (const [key, value] of this.fileTimers) {
      obj[key] = value;
    }
    this.context.workspaceState.update('fileTimers', obj);
  }
}
