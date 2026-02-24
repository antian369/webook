# 用法：
# .\start-backend.ps1          # 正常启动（不安装依赖）
# .\start-backend.ps1 -Install # 强制安装依赖后启动

param(
    [switch]$Install
)

# 设置 UTF-8 编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "启动后端服务..." -ForegroundColor Cyan
Write-Host ""

$BackendDir = Join-Path $PSScriptRoot "backend"
Set-Location $BackendDir

# 检查虚拟环境是否存在
$VenvDir = Join-Path $BackendDir "venv"
if (-not (Test-Path $VenvDir)) {
    Write-Host "首次运行，创建虚拟环境..." -ForegroundColor Yellow
    python -m venv venv
}

# 激活虚拟环境
Write-Host "激活虚拟环境..." -ForegroundColor Blue
$ActivateScript = Join-Path $VenvDir "Scripts\Activate.ps1"
& $ActivateScript

# 如果带了 -Install 参数，强制安装依赖
if ($Install) {
    Write-Host "强制安装依赖..." -ForegroundColor Yellow
    pip install -r requirements.txt
    Write-Host ""
}

Write-Host "启动 FastAPI 服务..." -ForegroundColor Green
Write-Host "后端地址: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API 文档: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Gray
Write-Host ""

python main.py
