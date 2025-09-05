import * as vscode from 'vscode';
import * as path from 'path';

export interface IExcludeFilesEvents {
  onExcludeStateChanged: (filePath: string, isExcluded: boolean) => void;
}

export class ExcludeFiles {
  private context: vscode.ExtensionContext;
  private excludedFiles: Set<string>;
  private events: IExcludeFilesEvents | undefined;

  public constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.excludedFiles = this.loadExcludedFiles();
  }

  // イベントリスナーを設定（Service層から設定される）
  public setEventListener(events: IExcludeFilesEvents): void {
    this.events = events;
  }

  public isExcluded(filePath: string): boolean {
    return this.excludedFiles.has(filePath);
  }

  public toggleFile(filePath: string): boolean {
    const wasExcluded = this.excludedFiles.has(filePath);

    if (wasExcluded) {
      this.excludedFiles.delete(filePath);
    } else {
      this.excludedFiles.add(filePath);
    }

    this.saveExcludedFiles();

    const isNowExcluded = this.excludedFiles.has(filePath);

    // イベント通知
    this.events?.onExcludeStateChanged(filePath, isNowExcluded);

    return isNowExcluded;
  }

  public showExcludeDialog() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showInformationMessage('No active file to exclude');
      return;
    }

    const filePath = activeEditor.document.fileName;
    const fileName = path.basename(filePath);
    const isExcluded = this.isExcluded(filePath);

    const action = isExcluded ? 'Include' : 'Exclude';
    const items: vscode.QuickPickItem[] = [
      {
        label: `${action} "${fileName}"`,
        description: isExcluded ? 'Start tracking this file' : 'Stop tracking this file',
        detail: filePath,
      },
      {
        label: 'Manage excluded files',
        description: 'View and edit all excluded files',
      },
    ];

    vscode.window
      .showQuickPick(items, {
        placeHolder: 'Choose an action',
      })
      .then((selected) => {
        if (!selected) return;

        if (selected.label.startsWith('Include') || selected.label.startsWith('Exclude')) {
          this.toggleFile(filePath);
          vscode.window.showInformationMessage(`${fileName} is now ${this.isExcluded(filePath) ? 'excluded' : 'included'}`);
        } else {
          this.showExcludedFilesList();
        }
      });
  }

  private showExcludedFilesList() {
    const items: vscode.QuickPickItem[] = Array.from(this.excludedFiles).map((filePath) => ({
      label: path.basename(filePath),
      description: filePath,
      detail: 'Click to include back',
    }));

    if (items.length === 0) {
      vscode.window.showInformationMessage('No files are currently excluded');
      return;
    }

    vscode.window
      .showQuickPick(items, {
        placeHolder: 'Select files to include back',
      })
      .then((selected) => {
        if (selected?.description) {
          this.toggleFile(selected.description);
          vscode.window.showInformationMessage(`${selected.label} is now included`);
        }
      });
  }

  private loadExcludedFiles(): Set<string> {
    const saved = this.context.workspaceState.get<string[]>('excludedFiles', []);
    return new Set(saved);
  }

  private saveExcludedFiles() {
    this.context.workspaceState.update('excludedFiles', Array.from(this.excludedFiles));
  }
}
