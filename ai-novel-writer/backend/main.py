from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path
from typing import List, Dict, Any
import os

app = FastAPI(
    title="AI Novel Writer API",
    description="Backend API for AI Novel Writer",
    version="0.1.0"
)

# 配置 CORS，允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # 前端开发服务器地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 小说项目根目录
NOVELS_DIR = Path(__file__).parent.parent / "novels"
NOVELS_DIR.mkdir(exist_ok=True)


@app.get("/")
async def root():
    """根路径，返回 API 信息"""
    return {
        "message": "AI Novel Writer API",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "novels_dir": str(NOVELS_DIR),
        "novels_dir_exists": NOVELS_DIR.exists()
    }


@app.get("/api/projects")
async def list_projects():
    """获取所有小说项目列表"""
    projects = []
    if NOVELS_DIR.exists():
        for item in NOVELS_DIR.iterdir():
            if item.is_dir():
                projects.append({
                    "id": item.name,
                    "name": item.name,
                    "path": str(item),
                    "created_at": item.stat().st_ctime
                })
    return {"projects": projects}


@app.post("/api/projects/{project_name}")
async def create_project(project_name: str):
    """创建新的小说项目"""
    project_path = NOVELS_DIR / project_name
    
    if project_path.exists():
        raise HTTPException(status_code=400, detail="Project already exists")
    
    # 创建项目目录结构
    (project_path / "创作区").mkdir(parents=True)
    (project_path / "创作区" / "总纲").mkdir()
    (project_path / "创作区" / "角色").mkdir()
    (project_path / "创作区" / "世界背景").mkdir()
    (project_path / "创作区" / "正文").mkdir()
    (project_path / "归档区").mkdir()
    
    # 创建默认文件
    (project_path / "创作区" / "总纲.md").write_text("# 总纲\\n\\n请在这里编写小说总纲...")
    
    return {
        "message": "Project created successfully",
        "project": {
            "id": project_name,
            "name": project_name,
            "path": str(project_path)
        }
    }


def build_file_tree(path: Path, relative_to: Path = None) -> List[Dict[str, Any]]:
    """递归构建文件树"""
    if relative_to is None:
        relative_to = path
    
    items = []
    
    try:
        for item in sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name)):
            relative_path = item.relative_to(relative_to)
            node = {
                "name": item.name,
                "path": str(item),
                "relative_path": str(relative_path),
                "type": "directory" if item.is_dir() else "file",
                "is_directory": item.is_dir()
            }
            
            if item.is_dir():
                children = build_file_tree(item, relative_to)
                if children:
                    node["children"] = children
            
            items.append(node)
    except PermissionError:
        pass
    
    return items


@app.get("/api/projects/{project_name}/files")
async def get_project_files(project_name: str):
    """获取项目的文件树"""
    project_path = NOVELS_DIR / project_name
    
    if not project_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    
    file_tree = build_file_tree(project_path)
    
    return {
        "project": project_name,
        "files": file_tree
    }


@app.get("/api/files/content")
async def get_file_content(path: str):
    """获取文件内容"""
    file_path = Path(path)
    
    # 安全检查：确保文件在项目目录内
    try:
        file_path.relative_to(NOVELS_DIR)
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    if file_path.is_dir():
        raise HTTPException(status_code=400, detail="Path is a directory")
    
    try:
        content = file_path.read_text(encoding='utf-8')
        return {
            "path": str(file_path),
            "content": content,
            "size": file_path.stat().st_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")


@app.post("/api/files/content")
async def save_file_content(path: str, content: str):
    """保存文件内容"""
    file_path = Path(path)
    
    # 安全检查
    try:
        file_path.relative_to(NOVELS_DIR)
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # 确保父目录存在
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # 写入文件
        file_path.write_text(content, encoding='utf-8')
        
        return {
            "message": "File saved successfully",
            "path": str(file_path),
            "size": file_path.stat().st_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
