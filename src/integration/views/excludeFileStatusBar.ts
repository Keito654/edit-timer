import * as vscode from "vscode";
import { selectIsExcluded } from "../../features/timer/selectors";

export const getExcludeFileStatusBar = () => {
  const excludeItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    99,
  );
  excludeItem.command = "editTimer.toggleExclude";
  excludeItem.tooltip = "Edit Timer: ";

  const render = (currentFile?: string) => {
    if (!currentFile) {
      excludeItem.hide();
      return;
    }

    if (selectIsExcluded(currentFile)) {
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
