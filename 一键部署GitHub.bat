@echo off
chcp 65001 >nul
title 智慧医院信息系统 - 一键部署到 GitHub

echo.
echo  ===============================================
echo    智慧医院信息系统 - GitHub Pages 一键部署
echo  ===============================================
echo.

REM 切换到脚本所在目录
cd /d "%~dp0"

REM 检查 Git
where git >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Git，请先安装 https://git-scm.com/
    pause
    exit /b 1
)

REM 检查 vendor 目录（本地化依赖）
if not exist "vendor\vue.global.prod.js" (
    echo [错误] vendor 目录不存在！请确认项目完整。
    pause
    exit /b 1
)

echo [1/4] 本地文件检查通过
echo.

REM 初始化或重新绑定仓库
git init 2>nul
git remote remove origin 2>nul
git remote add origin https://github.com/adiannn/Hospital-Information-System.git

echo [2/4] 远程仓库已绑定: https://github.com/adiannn/Hospital-Information-System.git
echo.

REM 添加所有文件
git add -A
git commit -m "部署: 本地化所有依赖，GitHub Pages 可正常访问" 2>nul

echo [3/4] 代码已暂存并提交
echo.

REM 强制推送（覆盖远程仓库）
echo [4/4] 正在推送到 GitHub...
echo.
git push -u origin main --force

if errorlevel 1 (
    echo.
    echo [提示] 推送失败，可能需要认证。
    echo.
    echo  请在弹出的窗口中:
    echo  - 用户名: adiannnn（你的 GitHub 用户名）
    echo  - 密码:   粘贴你的 GitHub Personal Access Token（不是 GitHub 登录密码！）
    echo.
    echo  如果还没创建 Token，访问:
    echo  https://github.com/settings/tokens  → Generate new token → 勾选 repo 权限
    echo.
    pause
    exit /b 1
)

echo.
echo  ===============================================
echo    推送成功！等待 1-2 分钟 GitHub Pages 部署
echo  ===============================================
echo.
echo  访问地址: https://adiannn.github.io/Hospital-Information-System/
echo.
echo  其他电脑也能通过这个网址访问了！
echo.
echo  （如果打不开，检查: GitHub 仓库 → Settings → Pages → Source 选 main 分支 / root）
echo.
pause
