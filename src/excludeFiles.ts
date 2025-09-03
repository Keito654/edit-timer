import * as vscode from "vscode";
import * as path from "path";

export class ExcludeFiles {
  private context: vscode.ExtensionContext;
  private excludedFiles: Set<string>;
  private statusBarItem: vscode.StatusBarItem;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.excludedFiles = this.loadExcludedFiles();

    // Create status bar item for excluded files
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      99
    );
    this.statusBarItem.command = "editTimer.toggleExclude";
    this.updateStatusBarItem();
    this.statusBarItem.show();

    context.subscriptions.push(this.statusBarItem);
  }

  public isExcluded(filePath: string): boolean {
    return this.excludedFiles.has(filePath);
  }

  public toggleFile(filePath: string): boolean {
    if (this.excludedFiles.has(filePath)) {
      this.excludedFiles.delete(filePath);
    } else {
      this.excludedFiles.add(filePath);
    }
    this.saveExcludedFiles();
    this.updateStatusBarItem();
    // ツリー表示を即時反映
    vscode.commands.executeCommand("editTimer.refreshView");
    return this.excludedFiles.has(filePath);
  }

  public showExcludeDialog() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showInformationMessage("No active file to exclude");
      return;
    }

    const filePath = activeEditor.document.fileName;
    const fileName = path.basename(filePath);
    const isExcluded = this.isExcluded(filePath);

    const action = isExcluded ? "Include" : "Exclude";
    const items: vscode.QuickPickItem[] = [
      {
        label: `${action} "${fileName}"`,
        description: isExcluded
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
          this.toggleFile(filePath);
          vscode.window.showInformationMessage(
            `${fileName} is now ${this.isExcluded(filePath) ? "excluded" : "included"}`
          );
        } else {
          this.showExcludedFilesList();
        }
      });
  }

  private showExcludedFilesList() {
    const items: vscode.QuickPickItem[] = Array.from(this.excludedFiles).map(
      (filePath) => ({
        label: path.basename(filePath),
        description: filePath,
        detail: "Click to include back",
      })
    );

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
          this.toggleFile(selected.description);
          vscode.window.showInformationMessage(
            `${selected.label} is now included`
          );
        }
      });
  }

  private updateStatusBarItem() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      this.statusBarItem.hide();
      return;
    }

    const filePath = activeEditor.document.fileName;
    const isExcluded = this.isExcluded(filePath);

    if (isExcluded) {
      this.statusBarItem.text = "$(eye-closed) Excluded";
      this.statusBarItem.tooltip =
        "This file is excluded from time tracking. Click to include it.";
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground"
      );
    } else {
      this.statusBarItem.text = "$(eye) Tracked";
      this.statusBarItem.tooltip =
        "This file is being tracked. Click to exclude it.";
      this.statusBarItem.backgroundColor = undefined;
    }
    this.statusBarItem.show();
  }

  public onActiveEditorChanged() {
    this.updateStatusBarItem();
  }

  private loadExcludedFiles(): Set<string> {
    const saved = this.context.workspaceState.get<string[]>(
      "excludedFiles",
      []
    );
    return new Set(saved);
  }

  private saveExcludedFiles() {
    this.context.workspaceState.update(
      "excludedFiles",
      Array.from(this.excludedFiles)
    );
  }
}
