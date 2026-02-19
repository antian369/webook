import React from 'react';

interface StatusBarProps {
  currentProject: string;
  currentFile: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ currentProject, currentFile }) => {
  return (
    <footer className="h-7 bg-[#007acc] text-white flex items-center px-4 text-xs justify-between">
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5 cursor-pointer hover:bg-white/10 px-1.5 py-0.5 rounded">
          <span>📚</span>
          <span>{currentProject || '无项目'}</span>
        </div>
        
        <div className="flex items-center gap-1.5 cursor-pointer hover:bg-white/10 px-1.5 py-0.5 rounded">
          <span>📄</span>
          <span>{currentFile || '无文件'}</span>
        </div>
        
        <div className="flex items-center gap-1.5 cursor-pointer hover:bg-white/10 px-1.5 py-0.5 rounded">
          <span>📝</span>
          <span>字数：1,247 / 3,000</span>
        </div>
        
        <div className="flex items-center gap-1.5 cursor-pointer hover:bg-white/10 px-1.5 py-0.5 rounded">
          <span>💾</span>
          <span>2分钟前保存</span>
        </div>
      </div>
      
      <div className="flex gap-3">
        <div className="flex items-center gap-1.5 cursor-pointer hover:bg-white/10 px-1.5 py-0.5 rounded">
          <span>🤖</span>
          <span>Claude 3.5 Sonnet</span>
        </div>
        
        <div className="flex items-center gap-1.5 cursor-pointer hover:bg-white/10 px-1.5 py-0.5 rounded">
          <span>📦</span>
          <span>main* (3 个未提交)</span>
        </div>
      </div>
    </footer>
  );
};
