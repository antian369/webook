#!/bin/bash

echo "⚛️  启动前端服务..."
echo ""

cd "$(dirname "$0")/frontend"

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖..."
    npm install
fi

echo "✅ 启动 Vite 开发服务器..."
echo "🌐 前端地址: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

npm run dev
