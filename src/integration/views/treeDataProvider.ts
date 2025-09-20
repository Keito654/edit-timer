import * as vscode from "vscode";
import * as path from "path";
import { formatTime } from "../../utils";
import {
  selectTrackers,
  selectTrackersTotalTime,
  selectTrackerTimeIfIncluded,
} from "../../features/timer/selectors";

export const getTreeDataProvider =
  (): vscode.TreeDataProvider<TimeTrackerItem> & {
    refresh: () => void;
    dispose: () => void;
  } => {
    const onDidChangeTreeData = new vscode.EventEmitter<
      TimeTrackerItem | undefined | void
    >();

    const refresh = () => {
      onDidChangeTreeData.fire();
    };

    const getTreeItem = (element: TimeTrackerItem) => {
      return element;
    };

    const getChildren = (element?: TimeTrackerItem): TimeTrackerItem[] => {
      const now = Date.now();

      if (!element) {
        // 合計時間の計算
        const totalTime = selectTrackersTotalTime({ now });
        const totalTimeStr = formatTime(totalTime);
        const totalItem = new TimeTrackerItem(
          "Total Time",
          totalTimeStr,
          "stopwatch",
          vscode.TreeItemCollapsibleState.None,
        );

        // プロジェクトフォルダ
        const projectItem = new TimeTrackerItem(
          "Active Files",
          "",
          "folder",
          vscode.TreeItemCollapsibleState.Expanded,
        );

        return [totalItem, projectItem];
      } else if (element.label === "Active Files") {
        return selectTrackers()
          .map((tracker) => {
            const time = selectTrackerTimeIfIncluded({
              now,
              fsPath: tracker.fsPath,
            });

            if (time === null) {
              return null;
            }

            const timeStr = formatTime(time);
            const item = new TimeTrackerItem(
              path.basename(tracker.fsPath),
              formatTime(time),
              "file-text",
              vscode.TreeItemCollapsibleState.None,
            );

            item.tooltip = `${tracker.fsPath}\nTotal time: ${timeStr}`;
            item.contextValue = "fileItem";
            return item;
          })
          .filter((x) => x !== null);
      }

      return [];
    };

    const dispose = () => {
      onDidChangeTreeData.dispose();
    };

    return {
      onDidChangeTreeData: onDidChangeTreeData.event,
      getTreeItem,
      getChildren,
      refresh,
      dispose,
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
