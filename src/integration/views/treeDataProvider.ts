import * as vscode from "vscode";
import * as path from "path";
import { formatTime } from "../../utils";
import {
  getTimeIfIncluded,
  getTotalTime,
} from "../../features/time-tracking/selector";
import { store } from "../../store";
import type { GlobalStore } from "../../store";

export const getTreeDataProvider =
  (): vscode.TreeDataProvider<TimeTrackerItem> & {
    refresh: () => void;
    refreshSpecific: (
      type: "total" | "files" | "file",
      fileId?: string,
    ) => void;
    dispose: () => void;
  } => {
    const onDidChangeTreeData = new vscode.EventEmitter<
      TimeTrackerItem | undefined | void
    >();

    // キャッシュ管理
    interface TreeCache {
      totalTimeItem?: TimeTrackerItem;
      activeFilesItem?: TimeTrackerItem;
      fileItems: Map<string, TimeTrackerItem>;
      lastUpdate: number;
      lastTotalTime: number;
      lastFileCount: number;
    }

    let cache: TreeCache = {
      fileItems: new Map(),
      lastUpdate: 0,
      lastTotalTime: 0,
      lastFileCount: 0,
    };

    // キャッシュの有効期限（1秒）
    const CACHE_TTL = 1000;

    /**
     * キャッシュが有効かどうかをチェック
     */
    const isCacheValid = (): boolean => {
      const now = Date.now();
      return now - cache.lastUpdate < CACHE_TTL;
    };

    /**
     * 差分更新に対応したrefresh関数
     */
    const refreshSpecific = (
      type: "total" | "files" | "file",
      fileId?: string,
    ) => {
      switch (type) {
        case "total":
          cache.totalTimeItem = undefined;
          break;
        case "files":
          cache.fileItems.clear();
          cache.activeFilesItem = undefined;
          break;
        case "file":
          if (fileId) {
            cache.fileItems.delete(fileId);
          }
          break;
      }

      onDidChangeTreeData.fire();
    };

    const refresh = () => {
      // 全キャッシュをクリア
      cache = {
        fileItems: new Map(),
        lastUpdate: 0,
        lastTotalTime: 0,
        lastFileCount: 0,
      };
      onDidChangeTreeData.fire();
    };

    const getTreeItem = (element: TimeTrackerItem) => {
      return element;
    };

    const getChildren = (element?: TimeTrackerItem) => {
      const now = Date.now();
      const state = store.getState();

      if (!element) {
        // ルートレベル - キャッシュ戦略を使用
        return getRootItems(state, now);
      } else if (element.label === "Active Files") {
        // ファイルリスト - 差分更新対応
        return getFileItems(state, now);
      }

      return [];
    };

    /**
     * ルートアイテム（Total Time + Active Files）を取得
     */
    const getRootItems = (
      state: GlobalStore,
      now: number,
    ): TimeTrackerItem[] => {
      const items: TimeTrackerItem[] = [];

      // Total Timeアイテムの生成またはキャッシュから取得
      if (!cache.totalTimeItem || !isCacheValid()) {
        const totalTime = getTotalTime(state, { now });

        // 前回と同じ値の場合はキャッシュを再利用
        if (
          cache.totalTimeItem &&
          Math.abs(totalTime - cache.lastTotalTime) < 1000
        ) {
          items.push(cache.totalTimeItem);
        } else {
          const totalTimeStr = formatTime(totalTime);
          cache.totalTimeItem = new TimeTrackerItem(
            "Total Time",
            totalTimeStr,
            "stopwatch",
            vscode.TreeItemCollapsibleState.None,
          );
          cache.lastTotalTime = totalTime;
          items.push(cache.totalTimeItem);
        }
      } else {
        items.push(cache.totalTimeItem);
      }

      // Active Filesアイテムの生成またはキャッシュから取得
      cache.activeFilesItem ??= new TimeTrackerItem(
        "Active Files",
        "",
        "folder",
        vscode.TreeItemCollapsibleState.Expanded,
      );
      items.push(cache.activeFilesItem);

      cache.lastUpdate = now;
      return items;
    };

    /**
     * ファイルアイテムを効率的に取得（差分更新対応）
     */
    const getFileItems = (
      state: GlobalStore,
      now: number,
    ): TimeTrackerItem[] => {
      const fileTimeTracker = state.fileTimeTracker;
      const currentFileCount = fileTimeTracker.size;

      // ファイル数が変わった場合はキャッシュをクリア
      if (currentFileCount !== cache.lastFileCount) {
        cache.fileItems.clear();
        cache.lastFileCount = currentFileCount;
      }

      const items: TimeTrackerItem[] = [];
      const processedFiles = new Set<string>();

      for (const [fsPath] of fileTimeTracker) {
        processedFiles.add(fsPath);

        const time = getTimeIfIncluded(state, { now, fsPath });
        if (time === null) {
          continue;
        }

        // キャッシュされたアイテムがあるかチェック
        const cachedItem = cache.fileItems.get(fsPath);

        if (cachedItem && isCacheValid()) {
          // 時間が大きく変わっていない場合はキャッシュを使用
          const cachedTime = extractTimeFromDescription(
            cachedItem.description || "",
          );
          if (Math.abs(time - cachedTime) < 1000) {
            // 1秒未満の差は無視
            items.push(cachedItem);
            continue;
          }
        }

        // 新しいアイテムを作成
        const timeStr = formatTime(time);
        const item = new TimeTrackerItem(
          path.basename(fsPath),
          timeStr,
          "file-text",
          vscode.TreeItemCollapsibleState.None,
        );

        item.tooltip = `${fsPath}\\nTotal time: ${timeStr}`;
        item.contextValue = "fileItem";

        // キャッシュに保存
        cache.fileItems.set(fsPath, item);
        items.push(item);
      }

      // 削除されたファイルをキャッシュから除去
      for (const [cachedPath] of cache.fileItems) {
        if (!processedFiles.has(cachedPath)) {
          cache.fileItems.delete(cachedPath);
        }
      }

      return items;
    };

    /**
     * description文字列から時間（ミリ秒）を抽出
     */
    const extractTimeFromDescription = (description: string): number => {
      // "HH:MM:SS" 形式から時間を抽出
      const regex = /(\d{2}):(\d{2}):(\d{2})/;
      const match = regex.exec(description);
      if (!match) return 0;

      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const seconds = parseInt(match[3], 10);

      return (hours * 3600 + minutes * 60 + seconds) * 1000;
    };

    const dispose = () => {
      onDidChangeTreeData.dispose();
      // キャッシュをクリア
      cache.fileItems.clear();
    };

    return {
      onDidChangeTreeData: onDidChangeTreeData.event,
      getTreeItem,
      getChildren,
      refresh,
      refreshSpecific,
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
