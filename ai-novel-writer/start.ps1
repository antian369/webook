# 设置 UTF-8 编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "启动 AI Novel Writer..." -ForegroundColor Cyan
Write-Host ""

# 启动后端
Write-Host "启动后端服务..." -ForegroundColor Blue
$BackendDir = Join-Path $PSScriptRoot "backend"
Set-Location $BackendDir

# 创建虚拟环境（如果不存在）
$VenvDir = Join-Path $BackendDir "venv"
if (-not (Test-Path $VenvDir)) {
    python -m venv venv | Out-Null
}

# 激活虚拟环境并安装依赖
& (Join-Path $VenvDir "Scripts\Activate.ps1")
pip install -q -r requirements.txt

# 启动后端（后台作业）
$BackendJob = Start-Job -ScriptBlock {
    Set-Location $using:BackendDir
    & (Join-Path $using:VenvDir "Scripts\Activate.ps1")
    python main.py
}

Start-Sleep -Seconds 2

if ($BackendJob.State -eq "Running") {
    Write-Host "后端已启动" -ForegroundColor Green
} else {
    Write-Host "后端启动失败" -ForegroundColor Red
    Receive-Job $BackendJob
    exit 1
}
Write-Host ""

# 启动前端
Write-Host "启动前端服务..." -ForegroundColor Blue
$FrontendDir = Join-Path $PSScriptRoot "frontend"
Set-Location $FrontendDir

# 安装前端依赖（静默）
npm install --silent 2>$null

# 启动前端（后台作业）
$FrontendJob = Start-Job -ScriptBlock {
    Set-Location $using:FrontendDir
    npm run dev
}

Start-Sleep -Seconds 3

if ($FrontendJob.State -eq "Running") {
    Write-Host "前端已启动" -ForegroundColor Green
} else {
    Write-Host "前端启动失败" -ForegroundColor Red
    Receive-Job $FrontendJob
    Stop-Job $BackendJob -ErrorAction SilentlyContinue
    exit 1
}
Write-Host ""

Write-Host "AI Novel Writer 已启动!" -ForegroundColor Green
Write-Host "前端地址: http://localhost:5173" -ForegroundColor Cyan
Write-Host "后端地址: http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Gray
Write-Host ""

# 等待用户中断
try {
    while ($BackendJob.State -eq "Running" -or $FrontendJob.State -eq "Running") {
        Start-Sleep -Seconds 1
        # 检查作业状态并输出
        Receive-Job $BackendJob -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "[后端] $_" -ForegroundColor DarkGray }
        Receive-Job $FrontendJob -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "[前端] $_" -ForegroundColor DarkGray }
    }
} finally {
    Write-Host ""
    Write-Host "正在停止服务..." -ForegroundColor Yellow
    Stop-Job $BackendJob -ErrorAction SilentlyContinue
    Stop-Job $FrontendJob -ErrorAction SilentlyContinue
    Remove-Job $BackendJob -ErrorAction SilentlyContinue
    Remove-Job $FrontendJob -ErrorAction SilentlyContinue
    Write-Host "服务已停止" -ForegroundColor Green
}
