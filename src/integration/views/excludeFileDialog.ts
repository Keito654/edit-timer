import * as vscode from "vscode";
import * as path from "path";
import { store } from "../../store";

export const getExcludeFileDialog = () => {
  const showExcludedFilesList = () => {
    const items: vscode.QuickPickItem[] = Array.from(
      store.getState().excludeFiles,
    ).map((filePath) => ({
      label: path.basename(filePath),
      description: filePath,
      detail: "Click to include back",
    }));

    if (items.length === 0) {
      vscode.window.showInformationMessage("No files are currently excluded");
      return;
    }

    vscode.window
      .showQuickPick(items, {
        placeHolder: "Select files to include back",
      })
      .then((selected) => {
        if (selected?.description) {
          toggleFile(selected.description);
          vscode.window.showInformationMessage(
            `${selected.label} is now included`,
          );
        }
      });
  };

  const isExcluded = (filePath: string): boolean => {
    return store.getState().excludeFiles.has(filePath);
  };

  const toggleFile = (filePath: string): boolean => {
    store.getState().switchExclude(filePath);
    vscode.commands.executeCommand("editTimer.refreshView");
    if (vscode.window.activeTextEditor?.document.uri.fsPath) {
      store.getState().startTimer({
        now: Date.now(),
        fsPath: vscode.window.activeTextEditor.document.uri.fsPath,
      });
    }
    return store.getState().excludeFiles.has(filePath);
  };

  const showExcludeDialog = () => {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showInformationMessage("No active file to exclude");
      return;
    }

    const filePath = activeEditor.document.uri.fsPath;
    const fileName = path.basename(filePath);
    const isCurrentExcluded = isExcluded(filePath);

    const action = isCurrentExcluded ? "Include" : "Exclude";
    const items: vscode.QuickPickItem[] = [
      {
        label: `${action} "${fileName}"`,
        description: isCurrentExcluded
          ? "Start tracking this file"
          : "Stop tracking this file",
        detail: filePath,
      },
      {
        label: "Manage excluded files",
        description: "View and edit all excluded files",
      },
    ];

    vscode.window
      .showQuickPick(items, {
        placeHolder: "Choose an action",
      })
      .then((selected) => {
        if (!selected) return;

        if (
          selected.label.startsWith("Include") ||
          selected.label.startsWith("Exclude")
        ) {
          toggleFile(filePath);
          vscode.window.showInformationMessage(
            `${fileName} is now ${isExcluded(filePath) ? "excluded" : "included"}`,
          );
        } else {
          showExcludedFilesList();
        }
      });
  };

  return {
    isExcluded,
    showExcludeDialog,
  };
};
