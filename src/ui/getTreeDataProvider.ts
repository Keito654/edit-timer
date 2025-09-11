import * as vscode from 'vscode';
import * as path from 'path';
import { formatTime } from '../utils';
import { getfileTimeTracker, getTime, getTotalTime } from '../features/fileTimeTracker/selector';

export const getTreeDataProvider = (): vscode.TreeDataProvider<TimeTrackerItem> & { refresh: () => void } => {
  const onDidChangeTreeData = new vscode.EventEmitter<TimeTrackerItem | undefined | void>();

  const refresh = () => {
    onDidChangeTreeData.fire();
  };

  const getTreeItem = (element: TimeTrackerItem) => {
    return element;
  };

  const getChildren = (element?: TimeTrackerItem) => {
    if (!element) {
      // ルートレベル
      const items: TimeTrackerItem[] = [];

      // 合計時間の計算
      const totalTime = getTotalTime();

      // 合計時間
      const totalTimeStr = totalTime > 0 ? formatTime(totalTime) : '0h 0m';
      const totalItem = new TimeTrackerItem('Total Time', totalTimeStr, 'stopwatch', vscode.TreeItemCollapsibleState.None);
      items.push(totalItem);

      // プロジェクトフォルダ
      const projectItem = new TimeTrackerItem('Active Files', '', 'folder', vscode.TreeItemCollapsibleState.Expanded);
      items.push(projectItem);

      return items;
    } else if (element.label === 'Active Files') {
      // ファイルリスト
      const fileTimeTracker = getfileTimeTracker();
      const items: TimeTrackerItem[] = [];

      for (const [filePath] of fileTimeTracker) {
        const fileName = path.basename(filePath);
        const timeStr = formatTime(getTime(filePath) ?? 0);
        const description = timeStr;
        const iconName = 'file-text';

        const item = new TimeTrackerItem(fileName, description, iconName, vscode.TreeItemCollapsibleState.None);

        item.tooltip = `${filePath}\nTotal time: ${timeStr}`;
        item.contextValue = 'fileItem';
        items.push(item);
      }

      return items;
    }

    return [];
  };

  return {
    onDidChangeTreeData: onDidChangeTreeData.event,
    getTreeItem,
    getChildren,
    refresh,
  };
};

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
