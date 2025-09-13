import * as vscode from "vscode";
import * as path from "path";
import { store } from "../app/store";

// 型定義
interface ExcludeFilesAPI {
  isExcluded: (filePath: string) => boolean;
  toggleFile: (filePath: string) => boolean;
  showExcludeDialog: () => void;
  onActiveEditorChanged: () => void;
}

// メイン関数：クロージャを使って状態管理とAPIを提供
export const createExcludeFiles = (
  context: vscode.ExtensionContext,
): ExcludeFilesAPI => {
  let statusBarItem: vscode.StatusBarItem | null = null;

  const updateStatusBarItem = () => {
    if (statusBarItem === null) {
      return;
    }

    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      statusBarItem.hide();
      return;
    }

    const filePath = activeEditor.document.fileName;
    const isCurrentExcluded = isExcluded(filePath);

    if (isCurrentExcluded) {
      statusBarItem.text = "$(eye-closed) Excluded";
      statusBarItem.tooltip =
        "Edit Timer: This file is excluded from time tracking. Click to include it.";
      statusBarItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground",
      );
    } else {
      statusBarItem.text = "$(eye) Tracked";
      statusBarItem.tooltip =
        "Edit Timer: This file is being tracked. Click to exclude it.";
      statusBarItem.backgroundColor = undefined;
    }
    statusBarItem.show();
  };

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

  // 初期化処理
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    99,
  );
  statusBarItem.command = "editTimer.toggleExclude";
  updateStatusBarItem();
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  const isExcluded = (filePath: string): boolean => {
    return store.getState().excludeFiles.has(filePath);
  };

  const toggleFile = (filePath: string): boolean => {
    store.getState().switchExclude(filePath);
    updateStatusBarItem();
    vscode.commands.executeCommand("editTimer.refreshView");
    return store.getState().excludeFiles.has(filePath);
  };

  const showExcludeDialog = () => {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showInformationMessage("No active file to exclude");
      return;
    }

    const filePath = activeEditor.document.fileName;
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

  const onActiveEditorChanged = () => {
    updateStatusBarItem();
  };

  // APIオブジェクトを返す
  return {
    isExcluded,
    toggleFile,
    showExcludeDialog,
    onActiveEditorChanged,
  };
};
