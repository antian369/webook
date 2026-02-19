# AI Novel Writer

AI 驱动的小说创作平台，采用类 IDE 的界面设计。

## ⚠️ 项目守则

**AI 助手不会运行前端或后端程序。**

开发过程中：
- AI 只负责编写代码和修改文件
- 所有的程序运行（前端 dev server、后端 API 服务等）由用户自行启动
- 用户需要自己打开浏览器访问应用界面
- 如需测试，用户自己执行启动命令

这样可以避免端口冲突和进程管理混乱。

## 🎯 迭代 1 完成的功能

✅ 基础框架搭建（Python FastAPI + React TypeScript）
✅ IDE 五栏布局（顶部导航、左侧目录、中间编辑区、右侧对话区、底部状态栏）
✅ 本地文件系统操作
✅ 项目管理和文件树展示
✅ 标签页系统
✅ 拖拽调整面板宽度
✅ 暗色主题界面

## 📁 项目结构

```
ai-novel-writer/
├── backend/              # Python FastAPI 后端
│   ├── app/             # 应用模块
│   ├── main.py          # 主入口
│   └── requirements.txt
├── frontend/            # React TypeScript 前端
│   ├── src/
│   │   ├── api/         # API 接口
│   │   ├── components/  # React 组件
│   │   └── types/       # TypeScript 类型
│   └── package.json
├── novels/              # 小说项目存储目录
├── start.sh             # 同时启动前后端
├── start-backend.sh     # 单独启动后端
└── start-frontend.sh    # 单独启动前端
```

## 🚀 快速开始

### 方法一：使用启动脚本（推荐）

```bash
chmod +x start.sh
./start.sh
```

### 方法二：分别启动（开发调试）

使用单独的启动脚本：

**终端 1 - 启动后端：**
```bash
./start-backend.sh
```

后端服务将运行在：**http://localhost:8000**

**终端 2 - 启动前端：**
```bash
./start-frontend.sh
```

前端服务将运行在：**http://localhost:5173**（如果被占用会自动切换端口）

---

### 方法三：手动启动（高级）

如果需要更细粒度的控制，可以手动执行：

**手动启动后端：**
```bash
cd backend
source venv/bin/activate
python main.py
```

**手动启动前端：**
```bash
cd frontend
npm run dev
```

## 🌐 访问地址

- **前端界面**: http://localhost:5173
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs

## 📚 API 接口

### 项目相关
- `GET /api/projects` - 获取项目列表
- `POST /api/projects/{name}` - 创建新项目
- `GET /api/projects/{name}/files` - 获取项目文件树

### 文件相关
- `GET /api/files/content?path=xxx` - 获取文件内容
- `POST /api/files/content?path=xxx` - 保存文件内容

## 🎨 界面说明

### 1. 顶部导航栏
- Logo 和菜单
- 全局搜索（Ctrl+K）
- 设置和用户头像

### 2. 左侧目录区
- 项目选择下拉框
- 文件树展示
- 支持展开/折叠目录
- 可拖拽调整宽度

### 3. 中间编辑区
- 标签页管理
- 工具栏（保存、预览等）
- 代码编辑器（带行号）
- Markdown 语法高亮

### 4. 右侧 AI 对话区
- AI 助手对话界面
- 上下文管理
- 快捷操作按钮
- 可拖拽调整宽度

### 5. 底部状态栏
- 当前项目/文件信息
- 字数统计
- AI 状态
- Git 状态（预留）

## 🛠️ 技术栈

### 后端
- **Python 3.8+**
- **FastAPI** - Web 框架
- **Uvicorn** - ASGI 服务器
- 本地文件系统操作

### 前端
- **React 18** + **TypeScript**
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库

## 📝 开发计划

### 迭代 2（进行中）
- [ ] 实现真实的文件 CRUD 操作
- [ ] 集成 Monaco Editor
- [ ] 文件内容编辑和保存
- [ ] 自动保存功能

### 迭代 3
- [ ] AI 对话功能
- [ ] Ctrl+I 引用功能
- [ ] AI API 集成

### 迭代 4
- [ ] 章节归档功能
- [ ] 版本历史（简化版）
- [ ] Diff 对比

### 迭代 5
- [ ] 全局搜索
- [ ] 设置页面
- [ ] 导出功能

## 🤝 贡献

欢迎提交 Issue 和 PR！

## 📄 许可证

MIT License
