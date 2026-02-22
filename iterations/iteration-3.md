# 迭代 3：AI 基础能力与 Agent 架构

## 迭代目标
搭建 AI 基础架构，实现后端代理调用 x.ai API，建立可扩展的 Agent 系统基础。

**详细设计方案**：[Agent 系统设计方案](../docs/agent-system-design.md)

## 核心设计决策

### 1. 知识库检索（当前迭代不做）
- **当前**：不做复杂检索，只传递当前文件内容
- **后续**：使用 Whoosh（纯 Python，轻量级）

### 2. 目录规划使用
- 直接使用现有的 `创作区/` 目录结构
- 自动读取总纲、角色、世界背景等文件
- Agent 初始化时加载这些全局上下文

### 3. 推理技术
- **不用 ReAct/CoT**：保持简单直接调用
- 单次 LLM 调用完成写作任务
- 后续根据效果再考虑是否需要迭代优化

### 4. AI 内容保存
- **方案**：基于选中文本范围替换
- 用户选中内容 → AI 生成 → 替换选中部分
- 保持其他内容不变

## 迭代拆分

### 阶段 1：基础 AI 能力（本次迭代，2-3 天）
建立可运行的 Agent 架构，实现基础对话

**核心原则**：先跑通，再完善

### 阶段 2：多 Agent 系统（后续迭代）
- 大纲 Agent、场景 Agent、正文 Agent、润色 Agent
- Agent Router 自动路由
- Whoosh 知识库检索

## 阶段 1 任务清单

### 1. 后端 Agent 基础架构
- [ ] 创建 `backend/agent/` 目录结构
  ```
  agent/
  ├── __init__.py
  ├── core/
  │   ├── __init__.py
  │   ├── agent.py          # BaseAgent 基类
  │   └── context.py        # 上下文加载器
  ├── providers/
  │   ├── __init__.py
  │   ├── base.py           # LLM Provider 抽象
  │   └── xai.py            # x.ai 实现
  └── models.py             # 数据模型
  ```
- [ ] 实现数据模型 (Pydantic)
  - [ ] `Message` - 消息
  - [ ] `ChatRequest` - 请求
  - [ ] `ChatResponse` - 响应
  - [ ] `Reference` - 引用
- [ ] 实现 Provider 抽象基类
- [ ] 实现 XAIProvider (调用 x.ai API)
- [ ] 实现 BaseAgent
  - [ ] 系统提示词模板
  - [ ] 上下文组装
  - [ ] LLM 调用
  - [ ] 历史对话管理
- [ ] 实现 ProjectContextLoader
  - [ ] 加载总纲.md
  - [ ] 加载角色/*.md
  - [ ] 加载世界背景/*.md
  - [ ] 加载当前编辑文件

### 2. 后端 API
- [ ] `POST /api/agent/chat` - 发送消息
  - Request: `{ message, references, current_file, file_content, session_id }`
  - Response: `{ message, session_id, timestamp }`
- [ ] `GET /api/agent/history?session_id=xxx` - 获取历史
- [ ] `POST /api/agent/clear` - 清空会话

### 3. 后端配置
- [ ] 环境变量支持
  - `XAI_API_KEY` - API Key
  - `XAI_MODEL` - 模型（默认 grok-beta）
- [ ] 启动时验证配置

### 4. 前端对话功能
- [ ] 改造 ChatPanel 组件
  - [ ] 消息列表（用户/AI）
  - [ ] 输入框和发送按钮
  - [ ] 加载状态（"思考中..."）
  - [ ] 错误提示
- [ ] 调用后端 API
  - [ ] 发送消息
  - [ ] 接收响应
  - [ ] 渲染 Markdown 内容
- [ ] 快捷指令按钮
  - [ ] "生成大纲" → 发送预设提示词
  - [ ] "续写" → 发送预设提示词
  - [ ] "改写" → 发送预设提示词
  - [ ] "扩写" → 发送预设提示词

### 5. Ctrl+I 引用功能
- [ ] 编辑器增强
  - [ ] 选中文本监听
  - [ ] 显示浮动工具栏
  - [ ] 添加"引用到对话"按钮
- [ ] 快捷键支持
  - [ ] 捕获 Ctrl+I
  - [ ] 将引用添加到对话区
- [ ] 对话区引用展示
  - [ ] 引用块样式
  - [ ] 显示来源文件名
  - [ ] 支持多条引用
  - [ ] 可删除引用

### 6. AI 内容保存
- [ ] 实现文本替换逻辑
  - [ ] 记录选中文本的起止位置
  - [ ] AI 生成后替换选中部分
  - [ ] 保持其他内容不变
- [ ] 添加"应用"按钮
  - [ ] 将 AI 回复插入到编辑器
  - [ ] 标记为未保存状态

## 不做的事（后续迭代）

- ❌ 复杂知识库检索（Whoosh）
- ❌ 多 Agent 路由系统
- ❌ ReAct/CoT 推理
- ❌ 流式 SSE 响应
- ❌ 长期记忆管理
- ❌ 工具调用（文件操作等）

## 要做的重点

- ✅ 可扩展的 Agent 架构（为后续多 Agent 打基础）
- ✅ 后端代理 x.ai API
- ✅ 基础对话 + Ctrl+I 引用
- ✅ 选中内容替换保存

## 数据结构示例

### 请求示例
```json
{
  "message": "帮我把这段改写得更有张力",
  "references": [
    {
      "source": "第一章.md",
      "content": "林凡深吸一口气...",
      "line_start": 10,
      "line_end": 15
    }
  ],
  "current_file": "/path/to/chapter1.md",
  "file_content": "# 第一章...",
  "session_id": "uuid"
}
```

### 响应示例
```json
{
  "message": "改写建议：林凡深深地吸了一口气，冰冷的空气灌入胸腔...",
  "session_id": "uuid",
  "timestamp": "2025-02-22T10:00:00Z"
}
```

## 环境变量

```bash
# .env 文件
XAI_API_KEY=your_xai_api_key_here
XAI_MODEL=grok-beta
```

## 验收标准

- [ ] 后端成功调用 x.ai API 并返回结果
- [ ] 前端可以与 AI 对话（发送消息、接收回复）
- [ ] Ctrl+I 可以将选中文本引用到对话区
- [ ] AI 回复会参考引用的内容
- [ ] 快捷指令按钮可以发送预设提示词
- [ ] 可以将 AI 生成的内容应用到编辑器（替换选中部分）
- [ ] Agent 架构可扩展（代码结构支持后续添加多 Agent）

## 预估时间

**阶段 1：2-3 天**

## 风险与应对

| 风险 | 应对 |
|------|------|
| x.ai API 不稳定 | 做好错误处理，预留 OpenAI 切换接口 |
| Token 超限 | 限制上下文长度（截断文件内容） |
| 响应慢 | 显示加载状态，后续迭代加 SSE |
| 生成质量差 | 通过系统提示词优化，不引入复杂推理 |

## 后续迭代规划

### 迭代 4：多 Agent 系统
- 大纲 Agent、场景 Agent、正文 Agent、润色 Agent
- Agent Router 自动路由
- 简单关键词检索（Whoosh）

### 迭代 5：增强功能
- 流式 SSE 响应
- 长期记忆
- 工具调用（自动保存、文件操作）
