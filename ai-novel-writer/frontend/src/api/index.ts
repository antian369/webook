import type { FileNode, Project } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export const api = {
  // 健康检查
  health: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  // 获取项目列表
  getProjects: async (): Promise<{ projects: Project[] }> => {
    const response = await fetch(`${API_BASE_URL}/api/projects`);
    return response.json();
  },

  // 创建项目
  createProject: async (name: string) => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${encodeURIComponent(name)}`, {
      method: 'POST',
    });
    return response.json();
  },

  // 获取项目文件树
  getProjectFiles: async (projectName: string): Promise<{ project: string; files: FileNode[] }> => {
    const response = await fetch(`${API_BASE_URL}/api/projects/${encodeURIComponent(projectName)}/files`);
    return response.json();
  },

  // 获取文件内容
  getFileContent: async (path: string): Promise<{ path: string; content: string; size: number }> => {
    const response = await fetch(`${API_BASE_URL}/api/files/content?path=${encodeURIComponent(path)}`);
    return response.json();
  },

  // 保存文件内容
  saveFileContent: async (path: string, content: string) => {
    const response = await fetch(`${API_BASE_URL}/api/files/content?path=${encodeURIComponent(path)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    
    return response.json();
  },

  // 创建文件或文件夹
  createFileOrFolder: async (path: string, type: 'file' | 'directory' = 'file') => {
    const response = await fetch(`${API_BASE_URL}/api/files/create?path=${encodeURIComponent(path)}&type=${type}`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create');
    }
    return response.json();
  },

  // 重命名文件或文件夹
  renameFileOrFolder: async (oldPath: string, newPath: string) => {
    const response = await fetch(`${API_BASE_URL}/api/files/rename?old_path=${encodeURIComponent(oldPath)}&new_path=${encodeURIComponent(newPath)}`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to rename');
    }
    return response.json();
  },

  // 删除文件或文件夹
  deleteFileOrFolder: async (path: string) => {
    const response = await fetch(`${API_BASE_URL}/api/files/delete?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete');
    }
    return response.json();
  },
};
