import * as vscode from "vscode";
import { formatTime } from "../../utils";
import {
  selectIsTracking,
  selectTrackersTotalTime,
  selectTrackerTimeIfIncluded,
} from "../../features/timer/selectors";

export const getTimerStatusBar = () => {
  const timerItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  timerItem.command = "editTimer.openPanel";
  timerItem.tooltip = "Edit Timer: Click to open panel";

  const render = (currentFile?: string) => {
    const now = Date.now();
    const totalTimeStr = formatTime(selectTrackersTotalTime({ now }));
    const currentFileTimeStr = currentFile
      ? formatTime(selectTrackerTimeIfIncluded({ now, fsPath: currentFile }))
      : "--:--:--";
    const icon = selectIsTracking() ? "$(watch)" : "$(debug-pause)";

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
