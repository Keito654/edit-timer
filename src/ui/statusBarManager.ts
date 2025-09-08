import * as vscode from 'vscode';
import { formatTime } from '../utils';
import type { TrackerManager } from '@/service/trackerManager';

export class StatusBarManager {
  private timerItem: vscode.StatusBarItem;
  private excludeItem: vscode.StatusBarItem;
  private context: vscode.ExtensionContext;

  #trackerManager: TrackerManager;

  public constructor(context: vscode.ExtensionContext, trackerManager: TrackerManager) {
    this.context = context;
    this.#trackerManager = trackerManager;

    // タイマー用ステータスバー
    this.timerItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.timerItem.command = 'editTimer.openPanel';
    this.timerItem.tooltip = 'Edit Timer: Click to open panel';
    this.timerItem.text = '$(watch) 00:00:00 | 00:00:00';
    this.timerItem.show();

    // 除外ファイル用ステータスバー
    this.excludeItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    this.excludeItem.command = 'editTimer.toggleExclude';

    context.subscriptions.push(this.timerItem, this.excludeItem);
  }

  public updateTimer(): void {
    const totalTimeStr = formatTime(this.#trackerManager.getTotalTime());
    const currentFileTimeStr = formatTime(this.#trackerManager.getTrackingFileTime() ?? 0);
    const icon = this.#trackerManager.isPausing() ? '⏸️' : '$(watch)';

    this.timerItem.text = `${icon} ${totalTimeStr} | ${currentFileTimeStr}`;
  }

  public updateExcludeStatus(filePath: string | undefined, isExcluded: boolean): void {
    if (!filePath) {
      this.excludeItem.hide();
      return;
    }

    if (isExcluded) {
      this.excludeItem.text = '$(eye-closed) Excluded';
      this.excludeItem.tooltip = 'Edit Timer: This file is excluded from time tracking. Click to include it.';
      this.excludeItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
      this.excludeItem.text = '$(eye) Tracked';
      this.excludeItem.tooltip = 'Edit Timer: This file is being tracked. Click to exclude it.';
      this.excludeItem.backgroundColor = undefined;
    }

    this.excludeItem.show();
  }

  public dispose(): void {
    this.timerItem.dispose();
    this.excludeItem.dispose();
  }
}
