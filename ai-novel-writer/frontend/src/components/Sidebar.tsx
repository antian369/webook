import React, { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown, Plus, RefreshCw, ChevronLeft } from 'lucide-react';
import { Project } from '../api';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  is_directory: boolean;
  children?: FileNode[];
}

interface SidebarProps {
  width: number;
  onResize: (delta: number) => void;
  files: FileNode[];
  currentProject: string;
  onFileSelect: (file: { name: string; path: string }) => void;
  projects: Project[];
  onProjectChange: (name: string) => void;
  onProjectCreated: () => void;
}

const FileTreeItem: React.FC<{
  node: FileNode;
  depth: number;
  onFileSelect: (file: { name: string; path: string }) => void;
}> = ({ node, depth, onFileSelect }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  
  const getIcon = () => {
    if (node.is_directory) return expanded ? '📂' : '📁';
    if (node.name.endsWith('.md')) return '📄';
    return '📄';
  };
  
  return (
    <div>
      <div
        className="flex items-center gap-1.5 px-3 py-1 cursor-pointer hover:bg-[#37373d] text-sm"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => {
          if (node.is_directory) {
            setExpanded(!expanded);
          } else {
            onFileSelect({ name: node.name, path: node.path });
          }
        }}
      >
        {node.is_directory && (
          <span className="text-xs opacity-60">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        <span>{getIcon()}</span>
        <span className="truncate">{node.name}</span>
      </div>
      
      {expanded && node.children?.map((child, index) => (
        <FileTreeItem
          key={`${child.path}-${index}`}
          node={child}
          depth={depth + 1}
          onFileSelect={onFileSelect}
        />
      ))}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  width,
  onResize,
  files,
  currentProject,
  onFileSelect,
  projects,
  onProjectChange,
  onProjectCreated
}) => {
  const [isResizing, setIsResizing] = useState(false);
  
  const handleMouseDown = () => {
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isResizing) {
      onResize(e.movementX);
    }
  };
  
  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div
      className="bg-[#252526] border-r border-[#3e3e42] flex flex-col relative"
      style={{ width: `${width}px`, minWidth: '200px', maxWidth: '400px' }}
    >
      {/* 项目选择 */}
      <div className="px-4 py-3 border-b border-[#3e3e42]">
        <div className="flex items-center justify-between">
          <select
            value={currentProject}
            onChange={(e) => onProjectChange(e.target.value)}
            className="bg-[#3e3e42] text-white px-2 py-1 rounded text-sm flex-1 mr-2"
          >
            {projects.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={() => {
              const name = prompt('输入项目名称:');
              if (name) {
                fetch(`http://localhost:8000/api/projects/${encodeURIComponent(name)}`, {
                  method: 'POST'
                }).then(() => onProjectCreated());
              }
            }}
            className="p-1 hover:bg-[#37373d] rounded"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      {/* 文件树操作按钮 */}
      <div className="px-3 py-2 flex gap-1 border-b border-[#3e3e42]">
        <button className="p-1 hover:bg-[#37373d] rounded" title="新建文件">
          <Plus size={14} />
        </button>
        <button className="p-1 hover:bg-[#37373d] rounded" title="刷新">
          <RefreshCw size={14} />
        </button>
        <button className="p-1 hover:bg-[#37373d] rounded" title="折叠全部">
          <ChevronLeft size={14} />
        </button>
      </div>
      
      {/* 文件树 */}
      <div className="flex-1 overflow-y-auto py-2">
        {files.map((node, index) => (
          <FileTreeItem
            key={`${node.path}-${index}`}
            node={node}
            depth={0}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>
      
      {/* 拖拽调整宽度 */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
