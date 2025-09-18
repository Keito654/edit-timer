import * as vscode from "vscode";
import { getTime, getTotalTime } from "../../features/time-tracking/selector";
import { store } from "../../store";

export const getTimeCardWebView = () => {
  let currentPanel: vscode.WebviewPanel | undefined;

  interface FileData {
    path: string;
    time: number;
  }

  const generateTimeCard = () => {
    // 既存のパネルがあれば閉じる
    if (currentPanel) {
      currentPanel.dispose();
    }

    currentPanel = vscode.window.createWebviewPanel(
      "timeCard",
      "Time Card",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [],
        retainContextWhenHidden: false,
      },
    );

    // パネルが閉じられた時の処理
    currentPanel.onDidDispose(() => {
      currentPanel = undefined;
    });

    currentPanel.webview.html = getWebviewContent();
  };

  /**
   * リソースクリーンアップ（拡張機能終了時用）
   */
  const dispose = () => {
    if (currentPanel) {
      currentPanel.dispose();
      currentPanel = undefined;
    }
  };

  const getWebviewContent = (): string => {
    const state = store.getState();
    const now = Date.now();

    // 除外されていないファイルのみを取得
    const files: FileData[] = [];
    for (const [fsPath] of state.fileTimeTracker) {
      if (state.excludeFiles.has(fsPath)) {
        continue;
      }

      const time = getTime(state, { now, fsPath });
      if (time && time > 0) {
        files.push({
          path: fsPath,
          time,
        });
      }
    }

    // 時間順にソート
    files.sort((a, b) => b.time - a.time);

    const totalTime = getTotalTime(state, { now });

    // 上位10ファイルまで表示
    const topFiles = files.slice(0, 10);

    const formatDuration = (ms: number): string => {
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((ms % (1000 * 60)) / 1000);
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    const getFileName = (path: string): string => {
      return path.split("/").pop() ?? path;
    };

    // SVGカードの生成
    const cardWidth = 800;
    const cardHeight = 600;
    const padding = 40;
    const titleHeight = 60;
    const itemHeight = 35;

    const generateFileRows = (): string => {
      return topFiles
        .map((file, index) => {
          const y = titleHeight + padding + index * itemHeight;
          const fileName = getFileName(file.path);
          const duration = formatDuration(file.time);

          return `
          <g>
            <rect x="${padding}" y="${y - 25}" width="${cardWidth - 2 * padding}" height="30" 
                  fill="${index % 2 === 0 ? "#f8f9fa" : "#ffffff"}" stroke="#e9ecef" stroke-width="1"/>
            <text x="${padding + 10}" y="${y - 5}" font-family="'SF Pro Text', -apple-system, sans-serif" 
                  font-size="14" fill="#495057" font-weight="500">
              ${fileName.length > 60 ? fileName.substring(0, 57) + "..." : fileName}
            </text>
            <text x="${cardWidth - padding - 10}" y="${y - 5}" font-family="'SF Mono', monospace" 
                  font-size="14" fill="#495057" text-anchor="end" font-weight="600">
              ${duration}
            </text>
          </g>
        `;
        })
        .join("");
    };

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Time Card</title>
        <style>
            body {
                margin: 0;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .card-container {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
        </style>
    </head>
    <body>
        <div class="card-container">
            <svg width="${cardWidth}" height="${cardHeight}" xmlns="http://www.w3.org/2000/svg">
                <!-- グラデーション定義 -->
                <defs>
                    <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                    </linearGradient>
                </defs>
                
                <!-- ヘッダー -->
                <rect width="${cardWidth}" height="${titleHeight}" fill="url(#headerGradient)"/>
                
                <!-- タイトル -->
                <text x="${cardWidth / 2}" y="35" font-family="'SF Pro Display', -apple-system, sans-serif" 
                      font-size="24" font-weight="700" fill="white" text-anchor="middle">
                    Edit Timer Report
                </text>
                
                <!-- 総時間 -->
                <text x="${cardWidth / 2}" y="${titleHeight + 35}" font-family="'SF Pro Display', -apple-system, sans-serif" 
                      font-size="20" font-weight="600" fill="#343a40" text-anchor="middle">
                    Total Time: ${formatDuration(totalTime)}
                </text>
                
                <!-- ファイルリスト -->
                ${generateFileRows()}
                
                <!-- フッター -->
                <text x="${cardWidth / 2}" y="${cardHeight - 20}" font-family="'SF Pro Text', -apple-system, sans-serif" 
                      font-size="12" fill="#6c757d" text-anchor="middle">
                    Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
                </text>
            </svg>
        </div>
    </body>
    </html>`;
  };

  // パブリックAPIを含むオブジェクトを返す
  return {
    generateTimeCard,
    dispose, // 拡張機能終了時にクリーンアップできるようにする
  };
};
