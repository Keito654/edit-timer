import * as vscode from "vscode";
import * as path from "path";
import type { TimeTracker } from "./timeTracker";
import { formatTime } from "./utils";

export class TimeTrackerProvider
  implements vscode.TreeDataProvider<TimeTrackerItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    TimeTrackerItem | undefined | void
  > = new vscode.EventEmitter<TimeTrackerItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    TimeTrackerItem | undefined | void
  > = this._onDidChangeTreeData.event;

  constructor(
    private context: vscode.ExtensionContext,
    private timeTracker: TimeTracker
  ) {
    // イベント駆動での更新へ移行（ポーリングなし）
  }

  refresh = (): void => {
    this._onDidChangeTreeData.fire();
  };

  getTreeItem = (element: TimeTrackerItem): vscode.TreeItem => {
    return element;
  };

  getChildren = (element?: TimeTrackerItem): Thenable<TimeTrackerItem[]> => {
    if (!element) {
      // ルートレベル
      const items: TimeTrackerItem[] = [];

      // 合計時間の計算
      const fileTimers = this.timeTracker.getFileTimers();
      let totalTime = 0;
      for (const [, timer] of fileTimers) {
        totalTime += timer.totalTime;
      }

      // 合計時間
      const totalTimeStr = totalTime > 0 ? formatTime(totalTime) : "0h 0m";
      const totalItem = new TimeTrackerItem(
        "Total Time",
        totalTimeStr,
        "stopwatch",
        vscode.TreeItemCollapsibleState.None
      );
      items.push(totalItem);

      // プロジェクトフォルダ
      const projectItem = new TimeTrackerItem(
        "Active Files",
        "",
        "folder",
        vscode.TreeItemCollapsibleState.Expanded
      );
      items.push(projectItem);

      return Promise.resolve(items);
    } else if (element.label === "Active Files") {
      // ファイルリスト
      const fileTimers = this.timeTracker.getFileTimers();
      const items: TimeTrackerItem[] = [];

      for (const [filePath, timer] of fileTimers) {
        const fileName = path.basename(filePath);
        const timeStr = formatTime(timer.totalTime);
        const description = timeStr;
        const iconName = this.getFileIcon();

        const item = new TimeTrackerItem(
          fileName,
          description,
          iconName,
          vscode.TreeItemCollapsibleState.None
        );

        item.tooltip = `${filePath}\nTotal time: ${timeStr}`;
        item.contextValue = "fileItem";
        items.push(item);
      }

      return Promise.resolve(items);
    }

    return Promise.resolve([]);
  };

  dispose = (): void => {
    // 現在はポーリングなしのため特に処理なし
  };

  private getFileIcon = (): string => {
    return "file-text";
  };
}

class TimeTrackerItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    iconName: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}: ${this.description}`;
    this.description = description;

    if (this.label !== "Total Time" && this.label !== "Active Files") {
      this.iconPath = new vscode.ThemeIcon(iconName);
    } else {
      this.iconPath = new vscode.ThemeIcon(iconName);
    }
  }
}
