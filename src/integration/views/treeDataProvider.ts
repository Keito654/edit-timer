import * as vscode from "vscode";
import * as path from "path";
import { formatTime } from "../../utils";
import {
  getTimeIfIncluded,
  getTotalTime,
} from "../../features/time-tracking/selector";
import { store } from "../../store";

export const getTreeDataProvider =
  (): vscode.TreeDataProvider<TimeTrackerItem> & { refresh: () => void } => {
    // TODO: disposeするように修正する
    const onDidChangeTreeData = new vscode.EventEmitter<
      TimeTrackerItem | undefined | void
    >();

    const refresh = () => {
      onDidChangeTreeData.fire();
    };

    const getTreeItem = (element: TimeTrackerItem) => {
      return element;
    };

    // TODO: 除外指定ファイルは表示しないように修正する
    const getChildren = (element?: TimeTrackerItem) => {
      const now = Date.now();
      const state = store.getState();

      if (!element) {
        // ルートレベル
        const items: TimeTrackerItem[] = [];

        // 合計時間の計算
        const totalTime = getTotalTime(state, { now });
        // 合計時間（formatTimeで統一）
        const totalTimeStr = formatTime(totalTime);
        const totalItem = new TimeTrackerItem(
          "Total Time",
          totalTimeStr,
          "stopwatch",
          vscode.TreeItemCollapsibleState.None,
        );
        items.push(totalItem);

        // プロジェクトフォルダ
        const projectItem = new TimeTrackerItem(
          "Active Files",
          "",
          "folder",
          vscode.TreeItemCollapsibleState.Expanded,
        );
        items.push(projectItem);

        return items;
      } else if (element.label === "Active Files") {
        // ファイルリスト
        const fileTimeTracker = state.fileTimeTracker;
        const items: TimeTrackerItem[] = [];

        for (const [fsPath] of fileTimeTracker) {
          const fileName = path.basename(fsPath);
          const timeStr = formatTime(
            getTimeIfIncluded(state, { now, fsPath }) ?? 0,
          );
          const description = timeStr;
          const iconName = "file-text";

          const item = new TimeTrackerItem(
            fileName,
            description,
            iconName,
            vscode.TreeItemCollapsibleState.None,
          );

          item.tooltip = `${fsPath}\nTotal time: ${timeStr}`;
          item.contextValue = "fileItem";
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
