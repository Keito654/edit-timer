import * as vscode from "vscode";
import { formatTime } from "../../utils";
import { store } from "../../store";
import {
  getTimeIfIncluded,
  getTotalTime,
} from "../../features/time-tracking/selector";

export const getFloatingTimerWebView = (context: vscode.ExtensionContext) => {
  let panel: vscode.WebviewPanel | undefined;
  let pendingTimeout: NodeJS.Timeout | undefined;
  let updateInterval: NodeJS.Timeout | undefined;
  let isDisposed = false;

  /**
   * 全てのタイマーとリソースをクリーンアップする
   */
  const cleanupResources = () => {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = undefined;
    }
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      pendingTimeout = undefined;
    }
  };

  const createPanel = () => {
    // 既存のパネルがある場合は再利用
    if (panel && !isDisposed) {
      return;
    }

    // disposed状態をリセット
    isDisposed = false;

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
      },
    );

    panel.webview.html = getWebviewContent();

    // disposeイベントハンドラーを改善
    panel.onDidDispose(
      () => {
        isDisposed = true;
        cleanupResources();
        panel = undefined;
      },
      null,
      context.subscriptions,
    );

    // メッセージ処理
    const messageHandler = panel.webview.onDidReceiveMessage(
      (message: { command: string }) => {
        if (isDisposed) return; // disposed後は処理しない

        if (message.command === "toggleTracking") {
          // 既存のコマンドを呼び出してグローバルタイマーとの同期を保つ
          vscode.commands.executeCommand("editTimer.toggle");
          updateTimer();
        }
      },
      null,
      context.subscriptions,
    );

    // 可視状態の変更に応じて更新ループを制御
    const viewStateHandler = panel.onDidChangeViewState(
      (e) => {
        if (isDisposed) return; // disposed後は処理しない

        if (e.webviewPanel.visible) {
          startUpdateLoop();
        } else {
          stopUpdateLoop();
        }
      },
      undefined,
      context.subscriptions,
    );

    // WebView が読み込まれるまで少し待ってから開始（スクリプト準備のため）
    pendingTimeout = setTimeout(() => {
      if (!isDisposed && panel?.visible) {
        startUpdateLoop();
        updateTimer();
      }
    }, 1000);

    // イベントハンドラーもsubscriptionsに追加してクリーンアップを確実にする
    context.subscriptions.push(messageHandler, viewStateHandler);
  };

  const show = () => {
    if (panel && !isDisposed) {
      panel.reveal();
    } else {
      createPanel();
    }
  };

  const updateTimer = () => {
    if (isDisposed || !panel?.visible) return;
    if (panel?.webview === undefined) return;

    try {
      const now = Date.now();
      const state = store.getState();
      const totalTime = getTotalTime(state, { now });

      panel.webview.postMessage({
        command: "updateTime",
        totalTime: formatTime(totalTime),
        currentTime: state.currentTrackingFile
          ? formatTime(
              getTimeIfIncluded(state, {
                now,
                fsPath: state.currentTrackingFile,
              }),
            )
          : "00:00:00",
        isTracking: state.isTracking,
        currentFile: state.currentTrackingFile ?? "",
      });
    } catch (error) {
      // エラーが発生した場合はログ出力して更新ループを停止
      console.error("Edit Timer: Error updating floating timer", error);
      stopUpdateLoop();
    }
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
    if (updateInterval || isDisposed) return;
    updateInterval = setInterval(() => {
      if (isDisposed) {
        // disposed状態になったら自動的に停止
        stopUpdateLoop();
        return;
      }
      updateTimer();
    }, 1000);
  };

  /**
   * タイマーを1秒ごとに更新するsetIntervalを停止する
   */
  const stopUpdateLoop = () => {
    if (!updateInterval) return;
    clearInterval(updateInterval);
    updateInterval = undefined;
  };

  /**
   * リソースを完全にクリーンアップする（拡張機能終了時に使用）
   */
  const dispose = () => {
    isDisposed = true;
    cleanupResources();
    if (panel) {
      panel.dispose();
    }
    panel = undefined;
  };

  return {
    show,
    dispose, // 拡張機能終了時にクリーンアップできるようにする
  };
};
