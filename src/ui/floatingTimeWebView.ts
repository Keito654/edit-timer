import * as vscode from "vscode";
import { formatTime } from "../utils";
import { store } from "../app/store";
import { getTime, getTotalTime } from "../features/fileTimeTracker/selector";

export const getFloatingTimerWebView = (context: vscode.ExtensionContext) => {
  let panel: vscode.WebviewPanel | undefined;
  let pendingTimeout: NodeJS.Timeout | undefined;
  let updateInterval: NodeJS.Timeout | undefined;

  const createPanel = () => {
    panel = vscode.window.createWebviewPanel(
      "timeTrackerFloatingTimer",
      "Floating Timer",
      {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true,
      },
      {
        enableScripts: true,
        retainContextWhenHidden: false,
        localResourceRoots: [],
      }
    );

    panel.webview.html = getWebviewContent();

    panel.onDidDispose(
      () => {
        stopUpdateLoop();
        clearTimeout(pendingTimeout);
        pendingTimeout = undefined;
        panel = undefined;
      },
      null,
      context.subscriptions
    );

    // メッセージ処理
    panel.webview.onDidReceiveMessage(
      (message: { command: string }) => {
        if (message.command === "toggleTracking") {
          store.getState().switchTracking({
            now: Date.now(),
            fsPath: vscode.window.activeTextEditor?.document.uri.fsPath,
          });
          vscode.commands.executeCommand(
            "setContext",
            "editTimer.isTracking",
            store.getState().isTracking
          );
          updateTimer();
        }
      },
      null,
      context.subscriptions
    );

    // 可視状態の変更に応じて更新ループを制御
    panel.onDidChangeViewState(
      (e) => {
        if (e.webviewPanel.visible) {
          startUpdateLoop();
        } else {
          stopUpdateLoop();
        }
      },
      undefined,
      context.subscriptions
    );

    // WebView が読み込まれるまで少し待ってから開始（スクリプト準備のため）
    pendingTimeout = setTimeout(() => {
      if (panel?.visible) {
        startUpdateLoop();
        updateTimer();
      }
    }, 1000);
  };

  const show = () => {
    if (panel) {
      panel.reveal();
    } else {
      createPanel();
    }
  };

  const updateTimer = () => {
    if (!panel?.visible) return;
    if (panel?.webview === undefined) return;

    const now = Date.now();
    const state = store.getState();
    const totalTime = getTotalTime(state, { now });

    panel.webview.postMessage({
      command: "updateTime",
      totalTime: formatTime(totalTime),
      currentTime: state.currentTrackingFile
        ? formatTime(getTime(state, { now, fsPath: state.currentTrackingFile }))
        : "00:00:00",
      isTracking: state.isTracking,
      currentFile: state.currentTrackingFile ?? "",
    });
  };

  const getWebviewContent = (): string => {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Floating Timer</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: transparent;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .timer-container {
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(10px);
            border-radius: 10px;
            padding: 15px 20px;
            color: white;
            min-width: 200px;
            text-align: center;
            transition: all 0.3s ease;
        }
        .timer-container.hidden {
            opacity: 0.3;
            transform: scale(0.9);
        }
        .timer-label {
            font-size: 12px;
            color: #aaa;
            margin-bottom: 4px;
        }
        .timer-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .current-file {
            font-size: 14px;
            color: #fff;
            margin-bottom: 8px;
        }
        .controls {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .control-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 5px;
            color: white;
            padding: 5px 10px;
            cursor: pointer;
            transition: background 0.3s ease;
        }
        .control-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        .control-btn.active {
            background: #4CAF50;
        }
    </style>
</head>
<body>
    <div class="timer-container" id="timerContainer">
        <div class="timer-label">合計時間</div>
        <div class="timer-value" id="totalTime">00:00:00</div>
        <div class="timer-label">ファイル時間: <span id="currentFileName">作業中のファイルはありません。</span></div>
        <div class="timer-value" id="currentTime">00:00:00</div>
        <div class="controls">
            <button class="control-btn" id="toggleBtn">⏸️ Pause</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const container = document.getElementById('timerContainer');
        const toggleBtn = document.getElementById('toggleBtn');
        const totalTimeDisplay = document.getElementById('totalTime');
        const currentTimeDisplay = document.getElementById('currentTime');
        const currentFileNameDisplay = document.getElementById('currentFileName');

        toggleBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'toggleTracking' });
        });

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateTime':
                    totalTimeDisplay.textContent = message.totalTime;
                    currentTimeDisplay.textContent = message.currentTime;
                    currentFileNameDisplay.textContent = message.currentFile;

                    if (message.isTracking) {
                        toggleBtn.textContent = '⏸️ Pause';
                        toggleBtn.classList.add('active');
                    } else {
                        toggleBtn.textContent = '▶️ Resume';
                        toggleBtn.classList.remove('active');
                    }
                    break;
            }
        });
    </script>
</body>
</html>`;
  };

  /**
   * タイマーを1秒ごとに更新するsetIntervalを起動する
   */
  const startUpdateLoop = () => {
    if (updateInterval) return;
    updateInterval = setInterval(() => updateTimer(), 1000);
  };

  /**
   * タイマーを1秒ごとに更新するsetIntervalを停止する
   */
  const stopUpdateLoop = () => {
    if (!updateInterval) return;
    clearInterval(updateInterval);
    updateInterval = undefined;
  };

  return {
    show,
  };
};
