import * as vscode from "vscode";
import { getTime, getTotalTime } from "../features/fileTimeTracker/selector";
import { store } from "../app/store";
import { formatTime } from "../utils";

interface FileData {
  name: string;
  time: string;
  timeMs: number;
  percent: number;
}

// クロージャを使用したTimeCardGenerator関数
export const getTimeCardWebView = () => {
  // プライベート関数をクロージャ内に定義
  const generateSVG = (
    dateStr: string,
    totalHours: number,
    totalMinutes: number,
    totalFiles: number,
    fileData: FileData[],
  ): string => {
    const width = 800;
    const height = 600;

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                </linearGradient>
                <linearGradient id="bar-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#8BC34A;stop-opacity:1" />
                </linearGradient>
                <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="16" flood-opacity="0.37"/>
                </filter>
            </defs>

            <!-- 背景 -->
            <rect width="100%" height="100%" fill="url(#bg-gradient)"/>

            <!-- カード -->
            <rect x="100" y="50" width="600" height="500" rx="20" fill="rgba(255,255,255,0.1)"
                  filter="url(#card-shadow)" style="backdrop-filter: blur(10px)"/>

            <!-- ヘッダー -->
            <text x="400" y="120" text-anchor="middle" font-family="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                  font-size="36" font-weight="bold" fill="white">Edit Timer</text>
            <text x="400" y="150" text-anchor="middle" font-family="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                  font-size="18" fill="rgba(255,255,255,0.8)">${dateStr}</text>

            <!-- サマリー -->
            <rect x="150" y="180" width="500" height="80" rx="10" fill="rgba(255,255,255,0.1)"/>

            <text x="300" y="230" text-anchor="middle" font-family="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                  font-size="32" font-weight="bold" fill="white">${totalHours}h ${totalMinutes}m</text>
            <text x="300" y="255" text-anchor="middle" font-family="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                  font-size="14" fill="rgba(255,255,255,0.8)">Total Time</text>

            <text x="500" y="230" text-anchor="middle" font-family="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                  font-size="32" font-weight="bold" fill="white">${totalFiles}</text>
            <text x="500" y="255" text-anchor="middle" font-family="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                  font-size="14" fill="rgba(255,255,255,0.8)">Files</text>

            <!-- ファイルリスト -->
            ${fileData
              .slice(0, 5)
              .map((file, index) => {
                const y = 310 + index * 60;
                return `
                    <rect x="150" y="${y - 45}" width="500" height="50" rx="8" fill="rgba(255,255,255,0.05)"/>
                    <text x="170" y="${y - 20}" font-family="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                          font-size="14" font-weight="bold" fill="white">${file.name}</text>
                    <text x="630" y="${y - 20}" text-anchor="end" font-family="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                          font-size="14" fill="white">${file.time}</text>

                    <rect x="170" y="${y - 8}" width="460" height="6" rx="3" fill="rgba(255,255,255,0.3)"/>
                    <rect x="170" y="${y - 8}" width="${file.percent * 4.6}" height="6" rx="3" fill="url(#bar-gradient)"/>
                `;
              })
              .join("")}
        </svg>`;
  };

  const getWebviewContent = (): string => {
    const today = new Date();
    const dateStr = today.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    // 合計時間の計算
    const state = store.getState();
    const now = Date.now();
    const totalTime = getTotalTime(state, { now });
    const totalFiles = state.fileTimeTracker.size;
    const fileData: FileData[] = [];

    state.fileTimeTracker.forEach((_, fsPath) =>
      fileData.push({
        name: fsPath,
        time: formatTime(getTime(state, { now, fsPath })),
        timeMs: getTime(state, { now, fsPath }) ?? 0,
        percent: 0,
      }),
    );

    // パーセンテージを計算
    if (totalTime > 0) {
      fileData.forEach((file) => {
        file.percent = Math.round((file.timeMs / totalTime) * 100);
      });
    }

    // ソート（時間の長い順）
    fileData.sort((a, b) => b.timeMs - a.timeMs);

    const totalHours = Math.floor(totalTime / 3600000);
    const totalMinutes = Math.floor((totalTime % 3600000) / 60000);

    const svgString = generateSVG(
      dateStr,
      totalHours,
      totalMinutes,
      totalFiles,
      fileData,
    );

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Time Card Preview</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .card-preview {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="card-preview">
        ${svgString}
    </div>
</body>
</html>`;
  };

  // パブリック関数を返す
  const generateTimeCard = (): void => {
    const panel = vscode.window.createWebviewPanel(
      "timeCard",
      "Time Card Preview",
      vscode.ViewColumn.One,
      {
        enableScripts: false,
        retainContextWhenHidden: false,
      },
    );

    panel.webview.html = getWebviewContent();
  };

  // パブリックAPIを含むオブジェクトを返す
  return {
    generateTimeCard,
  };
};
