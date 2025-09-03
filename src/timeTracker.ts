import * as vscode from "vscode";
import { ExcludeFiles } from "./excludeFiles";
import { formatTime } from "./utils";

interface FileTimer {
  totalTime: number;
  lastStartTime: number | null;
}

export class TimeTracker {
  private isTracking = true;
  private fileTimers: Map<string, FileTimer>;
  private currentFile: string | undefined;
  private totalTime = 0; // 全ファイル合計（インクリメンタル更新）
  private lastStatusText: string | undefined;
  private context: vscode.ExtensionContext;
  private statusBarItem: vscode.StatusBarItem;
  private excludeFiles: ExcludeFiles;

  private refreshInterval?: ReturnType<typeof setInterval>;

  constructor(
    context: vscode.ExtensionContext,
    statusBarItem: vscode.StatusBarItem,
    excludeFiles: ExcludeFiles
  ) {
    this.context = context;
    this.statusBarItem = statusBarItem;
    this.excludeFiles = excludeFiles;
    this.fileTimers = this.loadFileTimers();
    // 初期合計時間を一度だけ算出
    for (const [, timer] of this.fileTimers) {
      this.totalTime += timer.totalTime;
    }
    this.currentFile = vscode.window.activeTextEditor?.document.fileName;

    // 必要な場合のみタイマー開始
    if (
      this.isTracking &&
      this.currentFile &&
      !this.excludeFiles.isExcluded(this.currentFile)
    ) {
      this.startTick();
    }
  }

  /**
   * 時間計測の有効・無効を切り替える
   */
  toggle = () => {
    this.isTracking = !this.isTracking;
    if (this.isTracking) {
      // 再開: 現在ファイルがあれば再開時刻をセット
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
      // 一時停止: 現在ファイルの時間を確定して保存
      if (this.currentFile && !this.excludeFiles.isExcluded(this.currentFile)) {
        this.updateCurrentFileTimer(true);
        this.saveFileTimers();
      }
      this.stopTick();
    }
    // 状態が変わったので表示を更新（差分適用）
    this.updateStatusBar();
  };

  /**
   * 計測を一時停止（すでに停止中なら何もしない）
   */
  pause = () => {
    if (!this.isTracking) return;
    this.toggle();
  };

  /**
   * 計測を再開（すでに再開中なら何もしない）
   */
  resume = () => {
    if (this.isTracking) return;
    this.toggle();
  };

  /**
   * 作業中のファイルが切り替わった時の処理
   * @param editor
   * @returns
   */
  onEditorChange = (editor: vscode.TextEditor | undefined) => {
    if (!this.isTracking) return;

    // 現在のファイルの時間を保存
    if (this.currentFile && !this.excludeFiles.isExcluded(this.currentFile)) {
      this.updateCurrentFileTimer(true);
      // アクティブファイルから離れるタイミングで保存
      this.saveFileTimers();
    }

    if (!editor) {
      this.currentFile = undefined;
      this.stopTick();
      return;
    }

    // 新しいファイルの開始
    this.currentFile = editor.document.fileName;

    // 除外ファイルのチェック
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

    // 条件を満たしたのでタイマー開始
    this.startTick();
  };

  update = () => {
    if (
      !this.isTracking ||
      !this.currentFile ||
      this.excludeFiles.isExcluded(this.currentFile)
    )
      return;

    this.updateCurrentFileTimer();
    this.updateStatusBar();
    // 毎秒の保存は行わない（I/O負荷軽減のため）
  };

  private updateCurrentFileTimer = (stop = false) => {
    if (!this.currentFile) return;

    const timer = this.fileTimers.get(this.currentFile);

    if (!timer?.lastStartTime) {
      return;
    }
    const now = Date.now();

    const elapsed = now - timer.lastStartTime;
    timer.totalTime += elapsed;
    // 合計時間も同じ増分で更新
    this.totalTime += elapsed;
    timer.lastStartTime = stop ? null : now;
  };

  private updateStatusBar = () => {
    const { totalTime, currentFileTime } = this.getCurrentTime();

    const totalTimeStr = formatTime(totalTime);
    const currentFileTimeStr = formatTime(currentFileTime ?? 0);
    const icon = this.isTracking ? "$(watch)" : "⏸️";
    const nextText = `${icon} ${totalTimeStr} | ${currentFileTimeStr}`;

    if (nextText !== this.lastStatusText) {
      this.statusBarItem.text = nextText;
      this.lastStatusText = nextText;
    }
  };

  /**
   * 実行時点の経過時間を返す
   * @returns 実行時点での現在ファイルと全体の経過時間
   */
  getCurrentTime = () => {
    const currentFileTime = this.currentFile
      ? (this.fileTimers.get(this.currentFile)?.totalTime ?? null)
      : null;

    return {
      currentFileTime,
      totalTime: this.totalTime,
      currentFile: this.currentFile,
    };
  };

  getFileTimers = () => {
    return this.fileTimers;
  };

  getIsTracking = (): boolean => {
    return this.isTracking;
  };

  resetAllTimers = async () => {
    const result = await vscode.window.showWarningMessage(
      "Are you sure you want to reset all time data?",
      { modal: true },
      "Yes",
      "No"
    );

    if (result === "Yes") {
      this.fileTimers.clear();
      this.totalTime = 0;
      this.saveFileTimers();
      vscode.window.showInformationMessage("All time data has been reset");
    }
  };

  dispose = (): void => {
    this.stopTick();
    // 終了時に現在の計測を確定・保存
    if (this.currentFile && !this.excludeFiles.isExcluded(this.currentFile)) {
      this.updateCurrentFileTimer(true);
    }
    this.saveFileTimers();
  };

  private startTick = () => {
    if (this.refreshInterval) return;
    this.refreshInterval = setInterval(() => {
      this.update();
    }, 1000);
  };

  private stopTick = () => {
    if (!this.refreshInterval) return;
    clearInterval(this.refreshInterval);
    this.refreshInterval = undefined;
  };

  private loadFileTimers = (): Map<string, FileTimer> => {
    // ワークスペース単位で保存
    const saved = this.context.workspaceState.get<Record<string, FileTimer>>(
      "fileTimers",
      {}
    );
    return new Map(Object.entries(saved));
  };

  private saveFileTimers = () => {
    const obj: Record<string, FileTimer> = {};
    for (const [key, value] of this.fileTimers) {
      obj[key] = value;
    }
    // ワークスペース単位で保存
    this.context.workspaceState.update("fileTimers", obj);
  };
}
