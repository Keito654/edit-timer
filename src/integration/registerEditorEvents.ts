import * as vscode from "vscode";
import { store } from "../store";

export function registerEditorEvents(
  context: vscode.ExtensionContext,
  deps: {
    timerStatusBar: { render: (fsPath?: string) => void };
    excludeFileStatusBar: { render: (fsPath?: string) => void };
    treeProvider: {
      refreshSpecific: (
        type: "total" | "files" | "file",
        fileId?: string,
      ) => void;
    };
  },
) {
  const editorChanged = vscode.window.onDidChangeActiveTextEditor((editor) => {
    const fsPath = editor?.document.uri.fsPath;
    const now = Date.now();
    const previousFile = store.getState().currentTrackingFile;

    if (fsPath) {
      store.getState().switchTimer({ now, fsPath });
      // 新しいファイルと前のファイルのみを更新
      deps.treeProvider.refreshSpecific("file", fsPath);
      if (previousFile && previousFile !== fsPath) {
        deps.treeProvider.refreshSpecific("file", previousFile);
      }
    } else {
      store.getState().stopTimer({ now });
      // 前のファイルのみを更新
      if (previousFile) {
        deps.treeProvider.refreshSpecific("file", previousFile);
      }
    }

    deps.timerStatusBar.render(
      vscode.window.activeTextEditor?.document.uri.fsPath,
    );
    deps.excludeFileStatusBar.render(
      vscode.window.activeTextEditor?.document.uri.fsPath,
    );
  });

  context.subscriptions.push(editorChanged);
}
