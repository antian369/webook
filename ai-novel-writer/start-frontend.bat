@echo off
setlocal enabledelayedexpansion

REM 设置 UTF-8 编码
chcp 65001 >nul 2>&1

REM 尝试设置 PowerShell 风格的 UTF-8 输出（如果可用）
powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8" 2>nul

echo [启动] 启动前端服务...
echo.

cd /d "%~dp0frontend"

REM 检查 node_modules 是否存在
if not exist "node_modules" (
    echo [安装] 安装依赖...
    npm install
)

echo [启动] 启动 Vite 开发服务器...
echo [地址] 前端地址: http://localhost:5173
echo.
echo [提示] 按 Ctrl+C 停止服务
echo.

npm run dev
pause
