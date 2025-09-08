import * as vscode from 'vscode';
import * as path from 'path';
import { formatTime } from '../utils';
import type { TrackerManager } from '@/service/trackerManager';

export class TimeTrackerProvider implements vscode.TreeDataProvider<TimeTrackerItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TimeTrackerItem | undefined | void> = new vscode.EventEmitter<TimeTrackerItem | undefined | void>();
  public readonly onDidChangeTreeData: vscode.Event<TimeTrackerItem | undefined | void> = this._onDidChangeTreeData.event;

  #trackerManager: TrackerManager;

  public constructor(_context: vscode.ExtensionContext, timeTracker: TrackerManager) {
    this.#trackerManager = timeTracker;
  }

  public refresh = (): void => {
    this._onDidChangeTreeData.fire();
  };

  public getTreeItem = (element: TimeTrackerItem): vscode.TreeItem => {
    return element;
  };

  public getChildren = (element?: TimeTrackerItem): Thenable<TimeTrackerItem[]> => {
    if (!element) {
      // ルートレベル
      const items: TimeTrackerItem[] = [];

      const totalTime = this.#trackerManager.getTotalTime();

      // 合計時間
      const totalTimeStr = totalTime > 0 ? formatTime(totalTime) : '0h 0m';
      const totalItem = new TimeTrackerItem('Total Time', totalTimeStr, 'stopwatch', vscode.TreeItemCollapsibleState.None);
      items.push(totalItem);

      // プロジェクトフォルダ
      const projectItem = new TimeTrackerItem('Active Files', '', 'folder', vscode.TreeItemCollapsibleState.Expanded);
      items.push(projectItem);

      return Promise.resolve(items);
    } else if (element.label === 'Active Files') {
      // ファイルリスト
      const fileTimers = this.#trackerManager.getAllTimeTrackers();
      const items: TimeTrackerItem[] = [];

      for (const [filePath, timer] of fileTimers) {
        const fileName = path.basename(filePath);
        const timeStr = formatTime(timer.getTime());
        const description = timeStr;
        const iconName = this.getFileIcon();

        const item = new TimeTrackerItem(fileName, description, iconName, vscode.TreeItemCollapsibleState.None);

        item.tooltip = `${filePath}\nTotal time: ${timeStr}`;
        item.contextValue = 'fileItem';
        items.push(item);
      }

      return Promise.resolve(items);
    }

    return Promise.resolve([]);
  };

  public dispose = (): void => {
    // 処理なし
  };

  private getFileIcon = (): string => {
    return 'file-text';
  };
}

class TimeTrackerItem extends vscode.TreeItem {
  public constructor(
    public readonly label: string,
    public readonly description: string,
    iconName: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}: ${this.description}`;
    this.description = description;

    this.iconPath = new vscode.ThemeIcon(iconName);
  }
}
