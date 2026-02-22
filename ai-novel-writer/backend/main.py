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


@app.post("/api/files/create")
async def create_file_or_folder(path: str, type: str = "file"):
    """创建文件或文件夹
    
    Args:
        path: 文件或文件夹的完整路径
        type: "file" 或 "directory"
    """
    target_path = Path(path)
    
    # 安全检查
    try:
        target_path.relative_to(NOVELS_DIR)
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # 检查是否已存在
    if target_path.exists():
        raise HTTPException(status_code=400, detail=f"Path already exists: {target_path.name}")
    
    try:
        if type == "directory":
            # 创建文件夹
            target_path.mkdir(parents=True, exist_ok=True)
            return {
                "message": "Folder created successfully",
                "path": str(target_path),
                "type": "directory"
            }
        else:
            # 创建文件
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_text("", encoding='utf-8')
            return {
                "message": "File created successfully",
                "path": str(target_path),
                "type": "file"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating {type}: {str(e)}")


@app.post("/api/files/rename")
async def rename_file_or_folder(old_path: str, new_path: str):
    """重命名或移动文件/文件夹"""
    old_target = Path(old_path)
    new_target = Path(new_path)
    
    # 安全检查
    try:
        old_target.relative_to(NOVELS_DIR)
        new_target.relative_to(NOVELS_DIR)
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # 检查源文件是否存在
    if not old_target.exists():
        raise HTTPException(status_code=404, detail=f"Source not found: {old_target.name}")
    
    # 检查目标是否已存在
    if new_target.exists():
        raise HTTPException(status_code=400, detail=f"Target already exists: {new_target.name}")
    
    try:
        # 确保目标父目录存在
        new_target.parent.mkdir(parents=True, exist_ok=True)
        
        # 重命名/移动
        old_target.rename(new_target)
        
        return {
            "message": "Renamed successfully",
            "old_path": str(old_target),
            "new_path": str(new_target)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error renaming: {str(e)}")


@app.delete("/api/files/delete")
async def delete_file_or_folder(path: str):
    """删除文件或文件夹"""
    target_path = Path(path)
    
    # 安全检查
    try:
        target_path.relative_to(NOVELS_DIR)
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # 检查是否存在
    if not target_path.exists():
        raise HTTPException(status_code=404, detail=f"Path not found: {target_path.name}")
    
    try:
        import shutil
        
        if target_path.is_dir():
            # 递归删除文件夹
            shutil.rmtree(target_path)
            message = "Folder deleted successfully"
        else:
            # 删除文件
            target_path.unlink()
            message = "File deleted successfully"
        
        return {
            "message": message,
            "path": str(target_path)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
