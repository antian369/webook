const API_BASE_URL = 'http://localhost:8000';

export interface FileNode {
  name: string;
  path: string;
  relative_path: string;
  type: 'file' | 'directory';
  is_directory: boolean;
  children?: FileNode[];
}

export interface Project {
  id: string;
  name: string;
  path: string;
  created_at: number;
}

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
    return response.json();
  },
};
