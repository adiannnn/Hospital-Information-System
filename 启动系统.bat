@echo off
chcp 65001 >nul
title 智慧医院信息系统 - 一键启动
echo.
echo  =========================================
echo    智慧医院信息系统 启动中...
echo  =========================================
echo.

REM 用系统默认浏览器打开 index.html
start "" "%~dp0index.html"

echo 已在浏览器中打开系统！
echo （如果没有自动弹出浏览器，请手动双击 index.html）
echo.
timeout /t 2 >nul
