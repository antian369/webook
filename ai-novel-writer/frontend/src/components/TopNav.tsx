import type { FC } from 'react';
import { Search, Settings } from 'lucide-react';

export const TopNav: FC = () => {
  return (
    <nav className="h-12 bg-[#252526] border-b border-[#3e3e42] flex items-center px-4 justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md flex items-center justify-center text-white font-bold">
            ✍
          </div>
          <span className="font-bold text-white text-lg">AI Writer Studio</span>
        </div>
        
        <div className="flex gap-1 text-sm">
          <button className="px-3 py-1.5 rounded hover:bg-[#37373d] transition-colors">文件</button>
          <button className="px-3 py-1.5 rounded hover:bg-[#37373d] transition-colors">编辑</button>
          <button className="px-3 py-1.5 rounded hover:bg-[#37373d] transition-colors">视图</button>
          <button className="px-3 py-1.5 rounded hover:bg-[#37373d] transition-colors">AI</button>
          <button className="px-3 py-1.5 rounded hover:bg-[#37373d] transition-colors">版本</button>
          <button className="px-3 py-1.5 rounded hover:bg-[#37373d] transition-colors">工具</button>
          <button className="px-3 py-1.5 rounded hover:bg-[#37373d] transition-colors">帮助</button>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#3e3e42] px-3 py-1.5 rounded text-sm text-[#858585] cursor-pointer hover:border hover:border-blue-500 transition-all">
          <Search size={16} />
          <span>搜索文件、命令...</span>
          <span className="text-xs ml-4 opacity-60">⌘K</span>
        </div>
        
        <button className="p-2 rounded hover:bg-[#37373d] transition-colors">
          <Settings size={20} />
        </button>
        
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold cursor-pointer">
          作
        </div>
      </div>
    </nav>
  );
};
