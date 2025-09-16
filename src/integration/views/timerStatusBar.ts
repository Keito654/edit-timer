import * as vscode from "vscode";
import { formatTime } from "../../utils";
import { getTime, getTotalTime } from "../../features/fileTimeTracker/selector";
import { store } from "../../app/store";

export const getTimerStatusBar = () => {
  const timerItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  timerItem.command = "editTimer.openPanel";
  timerItem.tooltip = "Edit Timer: Click to open panel";

  const render = (currentFile?: string) => {
    const state = store.getState();
    const now = Date.now();
    const totalTimeStr = formatTime(getTotalTime(state, { now }));
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
