import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save, Eye } from 'lucide-react';
import { api } from '../api';

interface TabInfo {
  id: string;
  name: string;
  path: string;
}

interface EditorAreaProps {
  tabs: TabInfo[];
  activeTab: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

// 使用 ref 存储标签数据，避免触发重新渲染
interface TabData {
  content: string;
  isModified: boolean;
  isLoading: boolean;
  lastSavedContent: string;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  tabs,
  activeTab,
  onTabSelect,
  onTabClose
}) => {
  const [currentContent, setCurrentContent] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  
  // 使用 ref 存储所有标签数据，不触发重渲染
  const tabDataRef = useRef<Map<string, TabData>>(new Map());
  const activeTabRef = useRef<string>('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // 初始化标签数据
  useEffect(() => {
    tabs.forEach(tab => {
      if (!tabDataRef.current.has(tab.id)) {
        tabDataRef.current.set(tab.id, {
          content: '',
          isModified: false,
          isLoading: false,
          lastSavedContent: ''
        });
      }
    });
  }, [tabs]);

  // 切换标签页时加载内容
  useEffect(() => {
    if (!activeTab) {
      setCurrentContent('');
      setIsModified(false);
      setWordCount(0);
      activeTabRef.current = '';
      return;
    }

    // 如果切换到同一个标签，不做任何操作
    if (activeTab === activeTabRef.current && !isInitialLoadRef.current) {
      return;
    }

    isInitialLoadRef.current = false;
    activeTabRef.current = activeTab;

    const loadContent = async () => {
      const tabData = tabDataRef.current.get(activeTab);
      const tabInfo = tabs.find(t => t.id === activeTab);
      
      if (!tabInfo) return;

      // 如果已经有内容，直接使用
      if (tabData && tabData.content !== '') {
        setCurrentContent(tabData.content);
        setIsModified(tabData.isModified);
        setWordCount(tabData.content.length);
        return;
      }

      // 从服务器加载
      setIsLoading(true);
      try {
        const data = await api.getFileContent(tabInfo.path);
        const content = data.content || '';
        
        // 更新 ref
        tabDataRef.current.set(activeTab, {
          content,
          isModified: false,
          isLoading: false,
          lastSavedContent: content
        });
        
        setCurrentContent(content);
        setIsModified(false);
        setWordCount(content.length);
      } catch (error) {
        console.error('Failed to load file:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [activeTab]); // 只依赖 activeTab

  // 保存文件
  const saveFile = useCallback(async () => {
    if (!activeTabRef.current || !isModified) return;

    const tabInfo = tabs.find(t => t.id === activeTabRef.current);
    if (!tabInfo) return;

    try {
      await api.saveFileContent(tabInfo.path, currentContent);
      
      // 更新 ref
      const tabData = tabDataRef.current.get(activeTabRef.current);
      if (tabData) {
        tabData.isModified = false;
        tabData.lastSavedContent = currentContent;
      }
      
      setIsModified(false);
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('保存失败');
    }
  }, [currentContent, isModified, tabs]);

  // 自动保存（防抖，3秒）
  useEffect(() => {
    if (!isModified) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveFile();
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [currentContent, isModified, saveFile]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile]);

  // 处理文本变化
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setCurrentContent(newContent);
    setWordCount(newContent.length);
    
    if (activeTabRef.current) {
      const tabData = tabDataRef.current.get(activeTabRef.current);
      if (tabData) {
        const modified = newContent !== tabData.lastSavedContent;
        tabData.content = newContent;
        tabData.isModified = modified;
        setIsModified(modified);
      }
    }
  };

  // 处理关闭标签页
  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const tabData = tabDataRef.current.get(tabId);
    const tabInfo = tabs.find(t => t.id === tabId);
    
    if (tabData?.isModified) {
      const confirm = window.confirm(`"${tabInfo?.name}" 有未保存的更改，确定要关闭吗？`);
      if (!confirm) return;
    }
    
    // 清理数据
    tabDataRef.current.delete(tabId);
    onTabClose(tabId);
  };

  const activeTabInfo = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0">
      {/* 标签栏 */}
      <div className="h-9 bg-[#252526] flex items-end px-2 gap-0.5 overflow-x-auto">
        {tabs.map(tab => {
          const data = tabDataRef.current.get(tab.id);
          const isTabModified = data?.isModified || false;
          return (
            <div
              key={tab.id}
              onClick={() => onTabSelect(tab.id)}
              className={`
                flex items-center gap-2 px-3 py-2 text-sm cursor-pointer
                border-t border-l border-r border-[#3e3e42] rounded-t
                ${activeTab === tab.id 
                  ? 'bg-[#1e1e1e] text-white border-b border-b-[#1e1e1e]' 
                  : 'bg-[#2d2d30] text-[#858585] hover:bg-[#37373d]'}
              `}
              style={{ marginBottom: activeTab === tab.id ? '-1px' : '0' }}
            >
              <span>📄</span>
              <span className="truncate max-w-[150px]">{tab.name}</span>
              {isTabModified && <span className="w-2 h-2 rounded-full bg-blue-500" title="未保存" />}
              <button
                onClick={(e) => handleCloseTab(tab.id, e)}
                className="ml-1 hover:bg-[#3e3e42] rounded p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
      
      {/* 工具栏 */}
      <div className="h-10 bg-[#252526] border-b border-[#3e3e42] flex items-center px-3 gap-2">
        <button 
          className={`p-1.5 rounded text-sm flex items-center gap-1 ${
            isModified 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'hover:bg-[#37373d] text-[#858585]'
          }`}
          title="保存 (Ctrl+S)"
          onClick={saveFile}
          disabled={!isModified}
        >
          <Save size={16} />
          {isModified && <span className="text-xs">未保存</span>}
        </button>
        <div className="w-px h-5 bg-[#3e3e42]" />
        <button className="p-1.5 hover:bg-[#37373d] rounded text-sm" title="Markdown 预览">
          <Eye size={16} />
        </button>
        <div className="flex-1" />
        <span className="text-sm text-[#858585]">📝 {wordCount} 字符</span>
      </div>
      
      {/* 编辑器区域 */}
      <div className="flex-1 flex overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-[#1e1e1e]/80 flex items-center justify-center z-10">
            <div className="text-[#858585]">加载中...</div>
          </div>
        )}
        
        {tabs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[#858585]">
            <div className="text-center">
              <div className="text-4xl mb-4">📄</div>
              <div>从左侧选择文件开始编辑</div>
            </div>
          </div>
        ) : (
          <textarea
            value={currentContent}
            onChange={handleContentChange}
            className="flex-1 w-full h-full bg-[#1e1e1e] text-[#cccccc] p-4 resize-none outline-none font-mono text-sm leading-6"
            placeholder="开始写作..."
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
};
