import * as vscode from "vscode";
import { store } from "../store";
import { switchTimer } from "../features/timer/timerSlice";

export function registerEditorEvents(
  context: vscode.ExtensionContext,
  deps: {
    timerStatusBar: { render: (fsPath?: string) => void };
    excludeFileStatusBar: { render: (fsPath?: string) => void };
  },
) {
  const editorChanged = vscode.window.onDidChangeActiveTextEditor((editor) => {
    const fsPath = editor?.document.uri.fsPath;
    const now = Date.now();
    store.dispatch(
      switchTimer({
        now,
        fsPath,
      }),
    );

    deps.timerStatusBar.render(
      vscode.window.activeTextEditor?.document.uri.fsPath,
    );
    deps.excludeFileStatusBar.render(
      vscode.window.activeTextEditor?.document.uri.fsPath,
    );
  });

  context.subscriptions.push(editorChanged);
}
