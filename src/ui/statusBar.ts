import * as vscode from "vscode";
import { formatTime } from "../utils";
import { getTime, getTotalTime } from "../features/fileTimeTracker/selector";
import { store } from "../app/store";

export const getTimerStatusBarView = () => {
  const timerItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  timerItem.command = "editTimer.openPanel";
  timerItem.tooltip = "Edit Timer: Click to open panel";

  const render = () => {
    const state = store.getState();
    const now = Date.now();
    const totalTimeStr = formatTime(getTotalTime(state, { now }));
    const currentFile = store.getState().currentTrackingFile;
    const currentFileTimeStr = currentFile
      ? formatTime(getTime(state, { now, fsPath: currentFile }))
      : "--:--:--";
    const icon = store.getState().isTracking ? "$(watch)" : "⏸️";

    timerItem.text = `${icon} ${totalTimeStr} | ${currentFileTimeStr}`;
    timerItem.show();
  };

  const dispose = () => {
    timerItem.dispose();
  };

  return {
    render,
    dispose,
  };
};

export const getIsTrackingBarView = (activeTextEditor: vscode.TextDocument) => {
  const excludeItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    99,
  );
  excludeItem.command = "editTimer.toggleExclude";
  excludeItem.tooltip = "Edit Timer: ";

  const render = () => {
    if (!activeTextEditor) {
      excludeItem.hide();
      return;
    }

    if (store.getState().excludeFiles) {
      excludeItem.text = "$(eye-closed) Excluded";
      excludeItem.tooltip =
        "Edit Timer: This file is excluded from time tracking. Click to include it.";
      excludeItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground",
      );
    } else {
      excludeItem.text = "$(eye) Tracked";
      excludeItem.tooltip =
        "Edit Timer: This file is being tracked. Click to exclude it.";
      excludeItem.backgroundColor = undefined;
    }

    excludeItem.show();
  };

  const dispose = () => {
    excludeItem.dispose();
  };

  return {
    render,
    dispose,
  };
};
