# AGENTS.md

本文档为 AI 编程助手提供开发指南。

## 项目概述

AI Novel Writer 是一款桌面级 AI 辅助小说创作应用。

- **前端**: React 19 + TypeScript + Vite + TailwindCSS
- **后端**: Python + FastAPI
- **AI 集成**: xAI API 提供 AI 对话能力

## 项目结构

```
webook/
├── ai-novel-writer/
│   ├── frontend/           # React + TypeScript 前端
│   │   ├── src/
│   │   │   ├── api/        # API 客户端函数
│   │   │   ├── components/ # React 组件
│   │   │   ├── types/      # TypeScript 类型定义
│   │   │   ├── App.tsx     # 主应用组件
│   │   │   └── main.tsx    # 入口文件
│   │   └── package.json
│   ├── backend/            # Python FastAPI 后端
│   │   ├── agent/          # AI Agent 实现
│   │   │   ├── core/       # 核心逻辑
│   │   │   ├── models.py   # Pydantic 数据模型
│   │   │   └── providers/  # LLM 提供商实现
│   │   └── main.py         # FastAPI 应用
│   └── novels/             # 用户小说项目（gitignore）
├── iterations/             # 迭代规划目录
└── docs/                  # 文档目录
```

## 迭代规划

每次开发以迭代为单位进行，迭代文档存放在 `iterations/` 目录：
- 迭代文档记录该轮开发的目标、功能、进度等
- 开发前请先阅读最新的迭代文档了解当前任务

## 构建、检测和测试命令

### 前端（在 `ai-novel-writer/frontend/` 目录下）

```bash
# 安装依赖
npm install

# 启动开发服务器 (http://localhost:5173)
npm run dev

# 运行 ESLint 检测
npm run lint

# 构建生产版本（先进行 TypeScript 检查，再构建）
npm run build

# 预览生产构建
npm run preview
```

### 后端（在 `ai-novel-writer/backend/` 目录下）

```bash
# 安装依赖
pip install -r requirements.txt

# 启动开发服务器 (http://localhost:8000)
python main.py
# 或
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 代码风格指南

### TypeScript/React

#### 导入
- 类型导入使用 `import type`
- 分组导入：外部库优先，然后是内部模块
```typescript
import React, { useState, useEffect } from 'react';
import { SomeIcon } from 'lucide-react';
import type { Project, FileNode } from '../types';
import { api } from '../api';
import { ComponentName } from './ComponentName';
```

#### 组件
- 使用函数组件配合 `React.FC<PropsType>` 模式
- 在文件顶部定义 props 接口
- 函数签名中解构 props
```typescript
interface ComponentProps {
  width: number;
  onResize: (delta: number) => void;
}

export const ComponentName: React.FC<ComponentProps> = ({
  width,
  onResize
}) => {
  // 组件内容
};
```

#### State 和 Hooks
- useState 使用 const 和数组解构
- Hook 放在组件顶部
- 作为 props 传递的事件处理使用 useCallback

#### 错误处理
- 异步操作使用 try-catch
- 通过 state 向用户展示错误，而非仅控制台输出
```typescript
try {
  await api.someFunction();
} catch (error) {
  setError(error instanceof Error ? error.message : '操作失败');
}
```

#### 命名规范
- **组件/接口/类型**: PascalCase（如 `ChatPanel`、`FileNode`）
- **变量/函数**: camelCase（如 `sessionId`、`loadProjects`）
- **常量**: UPPER_SNAKE_CASE 或 camelCase
- **CSS 类**: 使用 TailwindCSS 工具类

#### 文件组织
- 每个文件一个组件
- 使用命名导出
- 相关组件放在子目录

### Python

#### 导入
- 分组导入：标准库、第三方库、本地模块
```python
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from agent import NovelAgent
```

#### 类和函数
- 类名使用 PascalCase，函数/变量使用 snake_case
- 为类和公共函数添加文档字符串
```python
class ChatSession(BaseModel):
    """对话会话"""
    session_id: str
    title: Optional[str] = None
```

#### 错误处理
- API 错误使用 `HTTPException` 并设置适当的状态码
- 提供描述性错误信息
```python
if not file_path.exists():
    raise HTTPException(status_code=404, detail="文件不存在")
```

#### 类型提示
- 函数参数和返回值始终使用类型提示
- 可空类型使用 `Optional[T]`
- 使用 Pydantic 模型进行数据验证

## 重要说明

### API 通信
- 前端 API 基础 URL: `http://localhost:8000`
- 后端 CORS 配置允许 `localhost:5173` 和 `localhost:3000`

### 文件操作
- 用户文件存储在 `ai-novel-writer/novels/`
- 对话历史存储在 `ai-novel-writer/chat_history/` 为 JSON 文件

### 环境变量
后端需要以下环境变量（设置在 `.env` 文件中）：
- `XAI_API_KEY`: xAI/Grok 的 API 密钥
- `XAI_MODEL`: 模型名称（默认: `grok-4-1-fast-reasoning`）

## 常见模式

### 添加新的 API 端点

1. **后端**: 在 `main.py` 添加路由
```python
@app.get("/api/resource")
async def get_resource():
    # 实现逻辑
    return {"data": value}
```

2. **前端**: 在 `api/index.ts` 添加函数
```typescript
getResource: async () => {
  const response = await fetch(`${API_BASE_URL}/api/resource`);
  if (!response.ok) {
    throw new Error('获取资源失败');
  }
  return response.json();
}
```

### 添加新组件

1. 在 `src/components/ComponentName.tsx` 创建文件
2. 定义 props 接口
3. 命名导出组件
4. 在父组件中导入使用

## AI 助手注意事项

- 修改前端代码后务必运行 `npm run lint`
- 务必运行 `npm run build` 验证 TypeScript 编译无错误
- 添加新依赖时，同时更新 `package.json`（前端）或 `requirements.txt`（后端）
- 代码中使用中文注释和用户可见字符串
- **除非用户明确要求，否则不要添加注释**
- **除非用户明确要求，否则不要自动提交 git，提交前需确认**
