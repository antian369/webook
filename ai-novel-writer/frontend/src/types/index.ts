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

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  isModified: boolean;
}

export interface Tab {
  id: string;
  name: string;
  path: string;
  isModified: boolean;
}
