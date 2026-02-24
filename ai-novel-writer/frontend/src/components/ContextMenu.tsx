import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  isDirectory: boolean;
  onClose: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
  on引用?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  visible,
  isDirectory,
  onClose,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  on引用
}) => {
  if (!visible) return null;

  return (
    <>
      {/* 点击背景关闭菜单 */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* 菜单 */}
      <div 
        className="fixed z-50 bg-[#252526] border border-[#3e3e42] rounded shadow-lg py-1 min-w-[160px]"
        style={{ left: x, top: y }}
      >
        {isDirectory && (
          <>
            <button
              onClick={() => { onNewFile(); onClose(); }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-[#37373d] flex items-center gap-2"
            >
              <span>📄</span>
              <span>新建文件</span>
            </button>
            <button
              onClick={() => { onNewFolder(); onClose(); }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-[#37373d] flex items-center gap-2"
            >
              <span>📁</span>
              <span>新建文件夹</span>
            </button>
            <div className="border-t border-[#3e3e42] my-1" />
          </>
        )}
        
        {!isDirectory && on引用 && (
          <>
            <button
              onClick={() => { on引用(); onClose(); }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-[#37373d] flex items-center gap-2"
            >
              <span>📎</span>
              <span>引用</span>
            </button>
            <div className="border-t border-[#3e3e42] my-1" />
          </>
        )}
        
        <button
          onClick={() => { onRename(); onClose(); }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-[#37373d] flex items-center gap-2"
        >
          <span>✏️</span>
          <span>重命名</span>
        </button>
        
        <div className="border-t border-[#3e3e42] my-1" />
        
        <button
          onClick={() => { onDelete(); onClose(); }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-[#37373d] text-red-400 flex items-center gap-2"
        >
          <span>🗑️</span>
          <span>删除</span>
        </button>
      </div>
    </>
  );
};
