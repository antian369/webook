import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Loader2, X, Edit2, RefreshCw, Plus, History, Trash2 } from 'lucide-react';
import { api } from '../api';

interface ChatPanelProps {
  width: number;
  onResize: (delta: number) => void;
  currentFile?: { name: string; path: string; content: string } | null;
  selectedText?: string;
  onClearSelection?: () => void;
  onApplyAIContent?: (content: string) => void;
  引用文件?: { name: string; path: string; content: string } | null;
  on引用文件使用?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Reference {
  source: string;
  content: string;
}

interface SessionInfo {
  session_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  width,
  onResize,
  currentFile,
  selectedText,
  onClearSelection,
  onApplyAIContent,
  引用文件,
  on引用文件使用
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => Math.random().toString(36).substring(7));
  const [references, setReferences] = useState<Reference[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionList, setSessionList] = useState<SessionInfo[]>([]);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 监听外部引用文件
  useEffect(() => {
    if (引用文件) {
      setReferences(prev => {
        if (prev.some(r => r.source === 引用文件.name && r.content === 引用文件.content)) {
          return prev;
        }
        return [...prev, { source: 引用文件.name, content: 引用文件.content }];
      });
      on引用文件使用?.();
    }
  }, [引用文件]);

  // 添加引用
  const addReference = useCallback((source: string, content: string) => {
    setReferences(prev => {
      // 避免重复引用
      if (prev.some(r => r.content === content)) return prev;
      return [...prev, { source, content }];
    });
  }, []);

  // 移除引用
  const removeReference = (index: number) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  };

  // 添加快捷指令
  const sendQuickCommand = (command: string) => {
    let prompt = '';
    switch (command) {
      case 'outline':
        prompt = '请为当前章节生成一个详细的大纲，包括场景划分和关键情节';
        break;
      case 'continue':
        prompt = '请根据上文续写接下来的内容，保持风格一致';
        break;
      case 'rewrite':
        prompt = '请改写以下内容，使其更加生动有张力';
        break;
      case 'expand':
        prompt = '请扩写以下内容，增加细节描写';
        break;
      case 'brainstorm':
        prompt = '请针对当前情节提供一些创意建议和灵感';
        break;
    }
    setInput(prompt);
    textareaRef.current?.focus();
  };

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // 添加用户消息到列表
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      // 如果有选中文本但没有添加到引用，自动添加
      let finalReferences = references;
      if (selectedText && !references.some(r => r.content === selectedText)) {
        const newRef = { source: currentFile?.name || '选中文本', content: selectedText };
        finalReferences = [...references, newRef];
        setReferences(finalReferences);
        onClearSelection?.();
      }

      const response = await api.agentChat({
        message: userMessage,
        sessionId,
        references: finalReferences,
        currentFile: currentFile?.path,
        fileContent: currentFile?.content
      });

      // 添加 AI 回复
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.message, 
        timestamp: new Date() 
      }]);

      // 清空引用（已使用过）
      setReferences([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 开始新对话
  const startNewChat = () => {
    setSessionId(Math.random().toString(36).substring(7));
    setMessages([]);
    setReferences([]);
    setError(null);
    setShowHistory(false);
  };

  // 加载历史对话列表
  const loadSessionList = async () => {
    try {
      const data = await api.getAgentSessions();
      setSessionList(data.sessions || []);
    } catch (err) {
      console.error('加载会话列表失败:', err);
      setSessionList([]);
    }
    setShowHistory(true);
  };

  // 切换会话并加载历史消息
  const switchSession = async (sid: string) => {
    if (sid === sessionId) {
      setShowHistory(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const data = await api.getAgentHistory(sid);
      setSessionId(sid);
      setMessages(data.messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date()
      })));
      setError(null);
      setShowHistory(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载历史失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 编辑会话标题
  const startEditTitle = (sid: string, currentTitle: string | null) => {
    setEditingTitleId(sid);
    setEditingTitleValue(currentTitle || '');
  };

  // 保存会话标题
  const saveTitle = async (sid: string) => {
    if (!editingTitleValue.trim()) return;
    
    try {
      await api.updateSessionTitle(sid, editingTitleValue.trim());
      setSessionList(prev => prev.map(s => 
        s.session_id === sid ? { ...s, title: editingTitleValue.trim() } : s
      ));
    } catch (err) {
      console.error('更新标题失败:', err);
    }
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  // 编辑消息
  const editMessage = (index: number) => {
    const msg = messages[index];
    if (msg.role === 'user') {
      setInput(msg.content);
      textareaRef.current?.focus();
    }
  };

  // 重试消息
  const retryMessage = async (index: number) => {
    const msg = messages[index];
    if (msg.role === 'user') {
      setInput(msg.content);
      // 删除这条消息和后面的所有消息
      setMessages(prev => prev.slice(0, index));
      await sendMessage();
    }
  };

  // 拖拽调整大小
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // 右侧边栏拖拽条在左侧，向左移动(负值)应该让面板变宽，所以取反
      onResize(-e.movementX);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onResize]);

  return (
    <div
      className="bg-[#252526] border-l border-[#3e3e42] flex flex-col relative"
      style={{ width: `${width}px`, minWidth: '300px', maxWidth: '500px' }}
    >
      {/* 头部 */}
      <div className="px-4 py-3 border-b border-[#3e3e42] flex items-center justify-between">
        <div className="text-sm font-medium">AI 对话</div>
        <div className="flex items-center gap-2">
          <button
            onClick={startNewChat}
            className="p-1.5 text-xs text-[#858585] hover:text-white hover:bg-[#37373d] rounded flex items-center gap-1"
            title="新对话"
          >
            <Plus size={14} />
            新对话
          </button>
          <button
            onClick={loadSessionList}
            className="p-1.5 text-xs text-[#858585] hover:text-white hover:bg-[#37373d] rounded flex items-center gap-1"
            title="历史对话"
          >
            <History size={14} />
            历史
          </button>
          <div className="px-2 py-1 bg-[#3e3e42] rounded text-xs text-[#858585]">
            {references.length}个引用
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-4 py-2 bg-red-900/50 border-b border-red-800 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* 历史对话面板 */}
      {showHistory && (
        <div className="border-b border-[#3e3e42] bg-[#2d2d30]">
          <div className="px-4 py-2 flex items-center justify-between border-b border-[#3e3e42]">
            <span className="text-sm font-medium">历史对话</span>
            <button
              onClick={() => setShowHistory(false)}
              className="text-[#858585] hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {sessionList.length === 0 ? (
              <div className="px-4 py-3 text-xs text-[#858585]">暂无历史对话</div>
            ) : (
              sessionList.map((session) => (
                <div
                  key={session.session_id}
                  className={`flex items-center px-4 py-2 text-sm hover:bg-[#37373d] ${
                    session.session_id === sessionId ? 'bg-[#37373d] text-blue-400' : 'text-[#cccccc]'
                  }`}
                >
                  {editingTitleId === session.session_id ? (
                    <input
                      type="text"
                      value={editingTitleValue}
                      onChange={(e) => setEditingTitleValue(e.target.value)}
                      onBlur={() => saveTitle(session.session_id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTitle(session.session_id);
                        if (e.key === 'Escape') setEditingTitleId(null);
                      }}
                      className="flex-1 bg-[#1e1e1e] px-2 py-0.5 rounded text-sm outline-none"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <button
                        onClick={() => switchSession(session.session_id)}
                        className="flex-1 text-left truncate"
                      >
                        {session.title || session.session_id.slice(0, 8)}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditTitle(session.session_id, session.title);
                        }}
                        className="ml-1 p-1 text-[#858585] hover:text-white"
                        title="编辑标题"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('确定要删除这个对话吗？')) {
                            try {
                              await api.deleteSession(session.session_id);
                              setSessionList(prev => prev.filter(s => s.session_id !== session.session_id));
                              if (session.session_id === sessionId) {
                                startNewChat();
                              }
                            } catch (err) {
                              console.error('删除失败:', err);
                            }
                          }
                        }}
                        className="ml-1 p-1 text-[#858585] hover:text-red-400"
                        title="删除对话"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 对话历史 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-[#858585] mt-8">
            <div className="text-4xl mb-4">🤖</div>
            <div className="text-sm mb-2">我是你的 AI 创作助手</div>
            <div className="text-xs">发送消息开始对话，或使用 Ctrl+I 引用编辑器中的文本</div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className="group relative max-w-[85%]">
                <div
                  className={`p-3 rounded-lg text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-[#3e3e42] rounded-bl-sm'
                  }`}
                >
                  {msg.content.split('\n').map((line, i) => (
                    <div key={i}>{line || ' '}</div>
                  ))}
                  {msg.role === 'assistant' && onApplyAIContent && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <button
                        onClick={() => onApplyAIContent(msg.content)}
                        className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded"
                      >
                        ✓ 应用此内容
                      </button>
                    </div>
                  )}
                </div>
                {/* 操作按钮 */}
                <div className={`absolute ${msg.role === 'user' ? 'left-0' : 'right-0'} top-0 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 p-1`}>
                  {msg.role === 'user' && (
                    <>
                      <button
                        onClick={() => editMessage(index)}
                        className="p-1 bg-[#3e3e42] hover:bg-[#4e4e52] rounded text-[#858585] hover:text-white"
                        title="编辑"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => retryMessage(index)}
                        className="p-1 bg-[#3e3e42] hover:bg-[#4e4e52] rounded text-[#858585] hover:text-white"
                        title="重试"
                      >
                        <RefreshCw size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-2">
            <div className="bg-[#3e3e42] rounded-lg p-3 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm text-[#858585]">思考中...</span>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-[#3e3e42]">
        {/* 引用标签 */}
        {references.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {references.map((ref, index) => (
              <div key={index} className="px-2 py-1 bg-[#3e3e42] border border-blue-500/50 rounded text-xs flex items-center gap-1.5 max-w-full">
                <span className="truncate">📄 {ref.source}</span>
                <button
                  onClick={() => removeReference(index)}
                  className="text-[#858585] hover:text-white ml-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 快速添加选中引用 */}
        {selectedText && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-blue-900/30 rounded border border-blue-500/30">
            <span className="text-xs text-blue-300 flex-1 truncate">
              选中了 {selectedText.length} 个字符
            </span>
            <button
              onClick={() => {
                addReference(currentFile?.name || '选中文本', selectedText);
                onClearSelection?.();
              }}
              className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
            >
              添加到引用
            </button>
          </div>
        )}

        {/* 输入框 */}
        <div className="bg-[#3e3e42] border border-[#3e3e42] rounded-lg p-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入指令或问题...&#10;按 Enter 发送，Shift+Enter 换行"
            className="w-full bg-transparent border-none text-sm resize-none outline-none min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-[#858585]">
              {isLoading ? '发送中...' : 'Enter 发送 · Shift+Enter 换行'}
            </span>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-[#3e3e42] disabled:cursor-not-allowed rounded text-sm flex items-center gap-1"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              发送
            </button>
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={() => sendQuickCommand('outline')}
            className="px-3 py-1.5 bg-[#3e3e42] border border-[#3e3e42] hover:border-blue-500 rounded text-xs transition-colors"
          >
            📝 生成大纲
          </button>
          <button
            onClick={() => sendQuickCommand('continue')}
            className="px-3 py-1.5 bg-[#3e3e42] border border-[#3e3e42] hover:border-blue-500 rounded text-xs transition-colors"
          >
            ✏️ 续写
          </button>
          <button
            onClick={() => sendQuickCommand('rewrite')}
            className="px-3 py-1.5 bg-[#3e3e42] border border-[#3e3e42] hover:border-blue-500 rounded text-xs transition-colors"
          >
            🔄 改写
          </button>
          <button
            onClick={() => sendQuickCommand('expand')}
            className="px-3 py-1.5 bg-[#3e3e42] border border-[#3e3e42] hover:border-blue-500 rounded text-xs transition-colors"
          >
            ➕ 扩写
          </button>
          <button
            onClick={() => sendQuickCommand('brainstorm')}
            className="px-3 py-1.5 bg-[#3e3e42] border border-[#3e3e42] hover:border-blue-500 rounded text-xs transition-colors"
          >
            💡 头脑风暴
          </button>
        </div>
      </div>

      {/* 拖拽调整宽度 */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10 transition-colors ${
          isResizing ? 'bg-blue-500' : 'hover:bg-blue-500/50'
        }`}
        onMouseDown={handleMouseDown}
        style={{ marginLeft: '-4px' }}
      />
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  );
};
