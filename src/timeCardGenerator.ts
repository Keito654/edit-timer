import * as vscode from "vscode";
import * as path from "path";
import type { TimeTracker } from "./timeTracker";

interface FileData {
  name: string;
  time: string;
  timeMs: number;
  percent: number;
}

export class TimeCardGenerator {
  static generateTimeCard = (
    _context: vscode.ExtensionContext,
    timeTracker: TimeTracker
  ) => {
    // タイムカード用のWebviewパネルを作成
    const panel = vscode.window.createWebviewPanel(
      "timeCard",
      "Time Card Preview",
      vscode.ViewColumn.One,
      {
        enableScripts: false, // スクリプト不要
        retainContextWhenHidden: false,
      }
    );

    // タイムカードのHTMLコンテンツを生成
    panel.webview.html = this.getWebviewContent(timeTracker);
  };

  private static getWebviewContent = (timeTracker: TimeTracker): string => {
    const fileTimers = timeTracker.getFileTimers();
    const today = new Date();
    const dateStr = today.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    // 合計時間の計算
    let totalTime = 0;
    let totalFiles = 0;
    const fileData: FileData[] = [];

    for (const [filePath, timer] of fileTimers) {
      totalTime += timer.totalTime;
      totalFiles++;
      const hours = Math.floor(timer.totalTime / 3600000);
      const minutes = Math.floor((timer.totalTime % 3600000) / 60000);
      fileData.push({
        name: path.basename(filePath),
        time: `${hours}h ${minutes}m`,
        timeMs: timer.totalTime,
        percent: 0,
      });
    }

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

    const svgString = this.generateSVG(
      dateStr,
      totalHours,
      totalMinutes,
      totalFiles,
      fileData
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

  private static generateSVG = (
    dateStr: string,
    totalHours: number,
    totalMinutes: number,
    totalFiles: number,
    fileData: FileData[]
  ): string => {
    const width = 800;
    const height = 600;

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
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

    return svg;
  };
}
