#!/bin/bash

# 用法：
# ./start-backend.sh          # 正常启动（不安装依赖）
# ./start-backend.sh --install # 强制安装依赖后启动

echo "🚀 启动后端服务..."
echo ""

cd "$(dirname "$0")/backend"

# 检查虚拟环境是否存在
if [ ! -d "venv" ]; then
    echo "📦 首次运行，创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "🔌 激活虚拟环境..."
source venv/bin/activate

# 如果带了 --install 参数，强制安装依赖
if [ "$1" = "--install" ]; then
    echo "📥 强制安装依赖..."
    pip install -r requirements.txt
    echo ""
fi

echo "✅ 启动 FastAPI 服务..."
echo "🌐 后端地址: http://localhost:8000"
echo "📚 API 文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

python main.py
