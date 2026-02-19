#!/bin/bash

echo "🚀 启动 AI Novel Writer..."
echo ""

# 启动后端
echo "📦 启动后端服务..."
cd backend
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -q -r requirements.txt
python main.py &
BACKEND_PID=$!
echo "✅ 后端已启动 (PID: $BACKEND_PID)"
echo ""

# 等待后端启动
sleep 2

# 启动前端
echo "⚛️  启动前端服务..."
cd ../frontend
npm install &>/dev/null
npm run dev &
FRONTEND_PID=$!
echo "✅ 前端已启动 (PID: $FRONTEND_PID)"
echo ""

echo "🎉 AI Novel Writer 已启动!"
echo "📱 前端地址: http://localhost:5173"
echo "🔌 后端地址: http://localhost:8000"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
