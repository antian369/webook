import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Plus, RefreshCw, ChevronLeft } from 'lucide-react';
import type { Project, FileNode } from '../types';
import { api } from '../api';
import { ContextMenu } from './ContextMenu';
import { InputDialog } from './InputDialog';
import { ConfirmDialog } from './ConfirmDialog';

interface SidebarProps {
  width: number;
  onResize: (delta: number) => void;
  files: FileNode[];
  currentProject: string;
  onFileSelect: (file: { name: string; path: string }) => void;
  projects: Project[];
  onProjectChange: (name: string) => void;
  onProjectCreated: () => void;
  onFilesChanged: () => void;
}

// 文件树项组件
const FileTreeItem: React.FC<{
  node: FileNode;
  depth: number;
  onFileSelect: (file: { name: string; path: string }) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (path: string) => void;
}> = ({ node, depth, onFileSelect, onContextMenu, expandedNodes, onToggleExpand }) => {
  const expanded = expandedNodes.has(node.path);
  
  const getIcon = () => {
    if (node.is_directory) return expanded ? '📂' : '📁';
    if (node.name.endsWith('.md')) return '📄';
    return '📄';
  };
  
  return (
    <div>
      <div
        className="flex items-center gap-1.5 px-3 py-1 cursor-pointer hover:bg-[#37373d] text-sm select-none"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => {
          if (node.is_directory) {
            onToggleExpand(node.path);
          } else {
            onFileSelect({ name: node.name, path: node.path });
          }
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          onContextMenu(e, node);
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
          onContextMenu={onContextMenu}
          expandedNodes={expandedNodes}
          onToggleExpand={onToggleExpand}
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
  onProjectCreated,
  onFilesChanged
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    node: FileNode | null;
  }>({ visible: false, x: 0, y: 0, node: null });
  
  // 对话框状态
  const [inputDialog, setInputDialog] = useState<{
    visible: boolean;
    title: string;
    placeholder: string;
    defaultValue: string;
    action: 'newFile' | 'newFolder' | 'rename' | null;
  }>({ visible: false, title: '', placeholder: '', defaultValue: '', action: null });
  
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({ visible: false, title: '', message: '' });

  const handleMouseDown = () => {
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
      onResize(e.movementX);
    }
  }, [isResizing, onResize]);
  
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);
  
  const handleToggleExpand = (path: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };
  
  // 右键菜单处理
  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      node
    });
  };
  
  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };
  
  // 新建文件
  const handleNewFile = () => {
    if (!contextMenu.node) return;
    setInputDialog({
      visible: true,
      title: '新建文件',
      placeholder: '输入文件名（如：章节大纲.md）',
      defaultValue: '',
      action: 'newFile'
    });
  };

  // 新建文件夹
  const handleNewFolder = () => {
    if (!contextMenu.node) return;
    setInputDialog({
      visible: true,
      title: '新建文件夹',
      placeholder: '输入文件夹名',
      defaultValue: '',
      action: 'newFolder'
    });
  };
  
  // 重命名
  const handleRename = () => {
    if (!contextMenu.node) return;
    setInputDialog({
      visible: true,
      title: '重命名',
      placeholder: '输入新名称',
      defaultValue: contextMenu.node.name,  // 默认带上当前文件名
      action: 'rename'
    });
  };
  
  // 删除
  const handleDelete = () => {
    if (!contextMenu.node) return;
    setConfirmDialog({
      visible: true,
      title: '确认删除',
      message: `确定要删除 "${contextMenu.node.name}" 吗？此操作不可恢复。`
    });
  };
  
  // 处理文件名：校验扩展名，如果没有则添加默认扩展名
  const processFileName = (fileName: string): string => {
    const trimmed = fileName.trim();
    if (!trimmed) return '';
    
    // 如果没有扩展名，添加默认 .txt
    if (!trimmed.includes('.')) {
      return `${trimmed}.txt`;
    }
    
    // 检查扩展名是否合法（只允许 .txt 和 .md）
    const ext = trimmed.split('.').pop()?.toLowerCase();
    if (ext !== 'txt' && ext !== 'md') {
      throw new Error('只支持 .txt 和 .md 文件格式');
    }
    
    return trimmed;
  };
  
  // 处理输入对话框确认
  const handleInputConfirm = async (value: string) => {
    if (!contextMenu.node || !inputDialog.action) return;
    
    try {
      const parentPath = contextMenu.node.is_directory 
        ? contextMenu.node.path 
        : contextMenu.node.path.substring(0, contextMenu.node.path.lastIndexOf('/'));
      
      if (inputDialog.action === 'newFile') {
        // 处理文件名（添加默认扩展名、校验）
        const fileName = processFileName(value);
        if (!fileName) {
          alert('文件名不能为空');
          return;
        }
        const newPath = `${parentPath}/${fileName}`;
        await api.createFileOrFolder(newPath, 'file');
      } else if (inputDialog.action === 'newFolder') {
        const newPath = `${parentPath}/${value.trim()}`;
        await api.createFileOrFolder(newPath, 'directory');
      } else if (inputDialog.action === 'rename') {
        const oldPath = contextMenu.node.path;
        // 如果是文件，也处理扩展名
        let newName = value.trim();
        if (!contextMenu.node.is_directory) {
          newName = processFileName(newName);
          if (!newName) {
            alert('文件名不能为空');
            return;
          }
        }
        const newPath = `${parentPath}/${newName}`;
        await api.renameFileOrFolder(oldPath, newPath);
      }
      
      onFilesChanged();
    } catch (error) {
      alert(error instanceof Error ? error.message : '操作失败');
    }
    
    setInputDialog(prev => ({ ...prev, visible: false }));
  };
  
  // 处理删除确认
  const handleDeleteConfirm = async () => {
    if (!contextMenu.node) return;
    
    try {
      await api.deleteFileOrFolder(contextMenu.node.path);
      onFilesChanged();
    } catch (error) {
      alert(error instanceof Error ? error.message : '删除失败');
    }
    
    setConfirmDialog(prev => ({ ...prev, visible: false }));
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
                api.createProject(name).then(() => onProjectCreated());
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
        <button 
          className="p-1 hover:bg-[#37373d] rounded" 
          title="刷新"
          onClick={onFilesChanged}
        >
          <RefreshCw size={14} />
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
            onContextMenu={handleContextMenu}
            expandedNodes={expandedNodes}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>
      
      {/* 拖拽调整宽度 */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50"
        onMouseDown={handleMouseDown}
      />
      
      {/* 右键菜单 */}
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        visible={contextMenu.visible}
        isDirectory={contextMenu.node?.is_directory || false}
        onClose={closeContextMenu}
        onNewFile={handleNewFile}
        onNewFolder={handleNewFolder}
        onRename={handleRename}
        onDelete={handleDelete}
      />
      
      {/* 输入对话框 */}
      <InputDialog
        visible={inputDialog.visible}
        title={inputDialog.title}
        placeholder={inputDialog.placeholder}
        defaultValue={inputDialog.defaultValue}
        onConfirm={handleInputConfirm}
        onCancel={() => setInputDialog(prev => ({ ...prev, visible: false }))}
      />
      
      {/* 确认对话框 */}
      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, visible: false }))}
      />
    </div>
  );
};
