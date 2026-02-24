@echo off
setlocal enabledelayedexpansion

REM 设置 UTF-8 编码
chcp 65001 >nul 2>&1

REM 尝试设置 PowerShell 风格的 UTF-8 输出（如果可用）
powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8" 2>nul

echo [启动] 启动后端服务...
echo.

cd /d "%~dp0backend"

REM 检查虚拟环境是否存在
if not exist "venv" (
    echo [安装] 首次运行，创建虚拟环境...
    python -m venv venv
)

REM 激活虚拟环境
echo [配置] 激活虚拟环境...
call venv\Scripts\activate.bat

REM 检查是否需要安装依赖
if "%1"=="--install" (
    echo [安装] 强制安装依赖...
    pip install -r requirements.txt
    echo.
)

echo [启动] 启动 FastAPI 服务...
echo [地址] 后端地址: http://localhost:8000
echo [文档] API 文档: http://localhost:8000/docs
echo.
echo [提示] 按 Ctrl+C 停止服务
echo.

python main.py
pause
