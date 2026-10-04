# 一键配置 VSCode 运行 HIS 系统
# 双击此文件（或在 PowerShell 里执行）即可

$ErrorActionPreference = "Continue"
$projectRoot = $PSScriptRoot
$vscodeDir = Join-Path $projectRoot ".vscode"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   智慧医院信息系统 - VSCode 配置向导" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 创建 .vscode 目录
if (-not (Test-Path $vscodeDir)) {
    New-Item -ItemType Directory -Path $vscodeDir | Out-Null
    Write-Host "[✓] 创建 .vscode 目录" -ForegroundColor Green
}

# 2. 写入 tasks.json
$tasksJson = @'
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "🚀 启动 HIS 服务器",
            "type": "shell",
            "command": "python -m http.server 8080",
            "isBackground": true,
            "options": { "cwd": "${workspaceFolder}" },
            "problemMatcher": [],
            "detail": "启动本地服务器"
        }
    ]
}
'@
Set-Content -Path (Join-Path $vscodeDir "tasks.json") -Value $tasksJson -Encoding UTF8
Write-Host "[✓] 写入 tasks.json" -ForegroundColor Green

# 3. 写入 launch.json
$launchJson = @'
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "chrome",
            "request": "launch",
            "name": "🚀 在 VSCode 中打开 HIS (Chrome)",
            "url": "http://localhost:8080",
            "webRoot": "${workspaceFolder}",
            "preLaunchTask": "🚀 启动 HIS 服务器"
        },
        {
            "type": "msedge",
            "request": "launch",
            "name": "🚀 在 VSCode 中打开 HIS (Edge)",
            "url": "http://localhost:8080",
            "webRoot": "${workspaceFolder}",
            "preLaunchTask": "🚀 启动 HIS 服务器"
        }
    ]
}
'@
Set-Content -Path (Join-Path $vscodeDir "launch.json") -Value $launchJson -Encoding UTF8
Write-Host "[✓] 写入 launch.json" -ForegroundColor Green

# 4. 启动 VSCode 打开项目
Write-Host ""
Write-Host "正在用 VSCode 打开项目..." -ForegroundColor Yellow
Start-Process code $projectRoot

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  配置完成！接下来在 VSCode 里：" -ForegroundColor Green
Write-Host ""
Write-Host "  方式 A - 按 F5（推荐）" -ForegroundColor White
Write-Host "    1. 按 F5 或点左侧 '运行和调试'" -ForegroundColor Gray
Write-Host "    2. 选择 '🚀 在 VSCode 中打开 HIS (Edge)'" -ForegroundColor Gray
Write-Host "    3. 自动启动服务器 + 内置浏览器打开系统" -ForegroundColor Gray
Write-Host ""
Write-Host "  方式 B - Live Server 扩展（最快）" -ForegroundColor White
Write-Host "    1. 安装 Live Server 扩展" -ForegroundColor Gray
Write-Host "    2. 右键 index.html → 'Open with Live Server'" -ForegroundColor Gray
Write-Host ""
Write-Host "  方式 C - 直接打开（最简单）" -ForegroundColor White
Write-Host "    双击 index.html 或 启动系统.bat" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Start-Sleep 3
