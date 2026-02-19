import React, { useState } from 'react';
import { Settings, Send } from 'lucide-react';

interface ChatPanelProps {
  width: number;
  onResize: (delta: number) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ width, onResize }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [messages] = useState([
    {
      type: 'agent',
      content: '你好！我是你的 AI 创作助手。我已加载当前章节的上下文信息，包括：\n\n• 第一章大纲\n• 主角林凡的角色设定\n• 修仙体系基础设定\n\n有什么我可以帮你的吗？'
    },
    {
      type: 'user',
      content: '帮我把场景二的测试过程写得更详细一些，增加一些紧张感和戏剧性'
    },
    {
      type: 'agent',
      content: '好的！我来扩写场景二的测试过程，增加更多细节和戏剧张力：\n\n1. 加入林凡等待测试时的心理描写\n2. 描写测试石反应时的异象细节\n3. 增加其他角色（白衣青年、围观村民）的反应\n4. 强化"天品灵根"的震撼效果\n\n需要我现在就生成具体内容吗？'
    }
  ]);
  
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
      className="bg-[#252526] border-l border-[#3e3e42] flex flex-col relative"
      style={{ width: `${width}px`, minWidth: '300px', maxWidth: '500px' }}
    >
      {/* 头部 */}
      <div className="px-4 py-3 border-b border-[#3e3e42] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
            🤖
          </div>
          <div>
            <div className="font-semibold text-sm">创作助手</div>
            <div className="text-xs text-emerald-400">● 在线</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-[#3e3e42] rounded text-xs text-[#858585] cursor-pointer">
            3个上下文
          </div>
          <button className="p-1.5 hover:bg-[#37373d] rounded">
            <Settings size={16} />
          </button>
        </div>
      </div>
      
      {/* 对话历史 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${
                msg.type === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-[#3e3e42] rounded-bl-sm'
              }`}
            >
              {msg.content.split('\n').map((line, i) => (
                <div key={i}>{line || ' '}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* 输入区域 */}
      <div className="p-4 border-t border-[#3e3e42]">
        {/* 上下文标签 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <div className="px-2 py-1 bg-[#3e3e42] border border-[#3e3e42] rounded text-xs flex items-center gap-1.5">
            <span>📄 第一章大纲</span>
            <span className="cursor-pointer opacity-60 hover:opacity-100">×</span>
          </div>
          <div className="px-2 py-1 bg-[#3e3e42] border border-[#3e3e42] rounded text-xs flex items-center gap-1.5">
            <span>👤 林凡设定</span>
            <span className="cursor-pointer opacity-60 hover:opacity-100">×</span>
          </div>
          <div className="px-2 py-1 bg-[#3e3e42] border border-[#3e3e42] rounded text-xs flex items-center gap-1.5">
            <span>🌍 修仙体系</span>
            <span className="cursor-pointer opacity-60 hover:opacity-100">×</span>
          </div>
        </div>
        
        {/* 输入框 */}
        <div className="bg-[#3e3e42] border border-[#3e3e42] rounded-lg p-3">
          <textarea
            placeholder="输入指令或问题...&#10;按 Enter 发送，Shift+Enter 换行"
            className="w-full bg-transparent border-none text-sm resize-none outline-none min-h-[60px]"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-[#858585]">Enter 发送 · Shift+Enter 换行 · @ 引用</span>
            <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center gap-1">
              <Send size={14} />
              发送
            </button>
          </div>
        </div>
        
        {/* 快捷操作 */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <button className="px-3 py-1.5 bg-[#3e3e42] border border-[#3e3e42] hover:border-blue-500 rounded text-xs transition-colors">
            📝 生成大纲
          </button>
          <button className="px-3 py-1.5 bg-[#3e3e42] border border-[#3e3e42] hover:border-blue-500 rounded text-xs transition-colors">
            ✏️ 续写
          </button>
          <button className="px-3 py-1.5 bg-[#3e3e42] border border-[#3e3e42] hover:border-blue-500 rounded text-xs transition-colors">
            🔄 改写
          </button>
          <button className="px-3 py-1.5 bg-[#3e3e42] border border-[#3e3e42] hover:border-blue-500 rounded text-xs transition-colors">
            ➕ 扩写
          </button>
          <button className="px-3 py-1.5 bg-[#3e3e42] border border-[#3e3e42] hover:border-blue-500 rounded text-xs transition-colors">
            💡 头脑风暴
          </button>
        </div>
      </div>
      
      {/* 拖拽调整宽度 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
