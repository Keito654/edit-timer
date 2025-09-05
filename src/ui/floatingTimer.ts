import * as vscode from 'vscode';
import { TimeTracker } from '../core/timeTracker';
import { formatTime } from '../utils';

export class FloatingTimer {
  private context: vscode.ExtensionContext;
  private panel: vscode.WebviewPanel | undefined;
  private pendingTimeout: NodeJS.Timeout | undefined;
  private updateInterval: NodeJS.Timeout | undefined;
  private timeTracker: TimeTracker;

  public constructor(context: vscode.ExtensionContext, timeTracker: TimeTracker) {
    this.timeTracker = timeTracker;
    this.context = context;
  }

  /** FloatingTimerを起動する */
  public show() {
    if (!this.panel) {
      this.createPanel();
    } else {
      this.panel.reveal();
    }
  }

  private createPanel() {
    this.panel = vscode.window.createWebviewPanel(
      'timeTrackerFloatingTimer',
      'Floating Timer',
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

    this.panel.webview.html = this.getWebviewContent();

    this.panel.onDidDispose(
      () => {
        this.stopUpdateLoop();
        clearTimeout(this.pendingTimeout);
        this.pendingTimeout = undefined;
        this.panel = undefined;
      },
      null,
      this.context.subscriptions,
    );

    // メッセージ処理
    this.panel.webview.onDidReceiveMessage(
      (message: { command: string }) => {
        if (message.command === 'toggleTracking') {
          this.timeTracker.toggle();
          this.updateTimer();
        }
      },
      null,
      this.context.subscriptions,
    );

    // 可視状態の変更に応じて更新ループを制御
    this.panel.onDidChangeViewState(
      (e) => {
        if (e.webviewPanel.visible) {
          this.startUpdateLoop();
        } else {
          this.stopUpdateLoop();
        }
      },
      undefined,
      this.context.subscriptions,
    );

    // WebView が読み込まれるまで少し待ってから開始（スクリプト準備のため）
    this.pendingTimeout = setTimeout(() => {
      if (this.panel?.visible) {
        this.startUpdateLoop();
        this.updateTimer();
      }
    }, 1000);
  }

  private updateTimer() {
    if (!this.panel?.visible) return;
    if (this.panel?.webview === undefined) return;

    const { totalTime, currentFileTime, currentFile } = this.timeTracker.getCurrentTime();

    this.panel.webview.postMessage({
      command: 'updateTime',
      totalTime: formatTime(totalTime),
      currentTime: currentFileTime ? formatTime(currentFileTime) : '00:00:00',
      isTracking: this.timeTracker.getIsTracking(),
      currentFile: currentFile,
    });
  }

  private getWebviewContent(): string {
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
  }

  /**
   * タイマーを1秒ごとに更新するsetIntervalを起動する
   */
  private startUpdateLoop() {
    if (this.updateInterval) return;
    this.updateInterval = setInterval(() => this.updateTimer(), 1000);
  }

  /**
   * タイマーを1秒ごとに更新するsetIntervalを停止する
   */
  private stopUpdateLoop() {
    if (!this.updateInterval) return;
    clearInterval(this.updateInterval);
    this.updateInterval = undefined;
  }
}
