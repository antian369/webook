# 设置 UTF-8 编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "启动前端服务..." -ForegroundColor Cyan
Write-Host ""

$FrontendDir = Join-Path $PSScriptRoot "frontend"
Set-Location $FrontendDir

# 检查 node_modules 是否存在
$NodeModulesDir = Join-Path $FrontendDir "node_modules"
if (-not (Test-Path $NodeModulesDir)) {
    Write-Host "安装依赖..." -ForegroundColor Yellow
    npm install
}

Write-Host "启动 Vite 开发服务器..." -ForegroundColor Green
Write-Host "前端地址: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Gray
Write-Host ""

npm run dev
