@echo off
setlocal enabledelayedexpansion

REM 设置 UTF-8 编码
chcp 65001 >nul 2>&1

REM 尝试设置 PowerShell 风格的 UTF-8 输出（如果可用）
powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8" 2>nul

echo [启动] 启动 AI Novel Writer...
echo [信息] 正在同时启动前后端服务，请稍候...
echo.

start "后端服务" cmd /k "chcp 65001 >nul && cd /d "%~dp0backend" && if not exist venv (echo [安装] 创建虚拟环境... ^&^& python -m venv venv) ^&^& call venv\Scripts\activate.bat ^&^& pip install -q -r requirements.txt ^&^& echo [启动] 后端启动完成 ^&^& echo [地址] 后端地址: http://localhost:8000 ^&^& python main.py"

timeout /t 3 /nobreak >nul

start "前端服务" cmd /k "chcp 65001 >nul && cd /d "%~dp0frontend" ^&^& npm install --silent 2^>nul ^&^& echo [启动] 前端启动完成 ^&^& echo [地址] 前端地址: http://localhost:5173 ^&^& npm run dev"

timeout /t 2 /nobreak >nul

echo [完成] AI Novel Writer 已启动!
echo [前端] 地址: http://localhost:5173
echo [后端] 地址: http://localhost:8000
echo.
echo [提示] 关闭命令窗口即可停止服务
echo.
pause
