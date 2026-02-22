import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Save, Eye } from 'lucide-react';
import { api } from '../api';

interface Tab {
  id: string;
  name: string;
  path: string;
  content?: string;
  isModified?: boolean;
}

interface EditorAreaProps {
  tabs: Tab[];
  activeTab: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabsChange?: (tabs: Tab[]) => void;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  tabs,
  activeTab,
  onTabSelect,
  onTabClose,
  onTabsChange
}) => {
  const [localTabs, setLocalTabs] = useState<Tab[]>(tabs);
  const [isLoading, setIsLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 同步外部 tabs 到本地
  useEffect(() => {
    setLocalTabs(tabs.map(tab => ({
      ...tab,
      content: tab.content || '',
      isModified: tab.isModified || false
    })));
  }, [tabs]);

  // 加载文件内容
  useEffect(() => {
    const loadFileContent = async () => {
      if (!activeTab) return;
      
      const activeTabData = localTabs.find(tab => tab.id === activeTab);
      if (!activeTabData || activeTabData.content !== '') return;
      
      setIsLoading(true);
      try {
        const data = await api.getFileContent(activeTabData.path);
        updateTabContent(activeTab, data.content, false);
      } catch (error) {
        console.error('Failed to load file:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFileContent();
  }, [activeTab]);

  // 更新标签页内容
  const updateTabContent = (tabId: string, content: string, isModified: boolean) => {
    setLocalTabs(prev => {
      const newTabs = prev.map(tab =>
        tab.id === tabId ? { ...tab, content, isModified } : tab
      );
      onTabsChange?.(newTabs);
      return newTabs;
    });
    
    // 更新字数统计
    setWordCount(content.length);
  };

  // 保存文件
  const saveFile = useCallback(async () => {
    const activeTabData = localTabs.find(tab => tab.id === activeTab);
    if (!activeTabData || !activeTabData.isModified) return;

    try {
      await api.saveFileContent(activeTabData.path, activeTabData.content || '');
      updateTabContent(activeTab, activeTabData.content || '', false);
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('保存失败');
    }
  }, [localTabs, activeTab]);

  // 自动保存（防抖，3秒）
  useEffect(() => {
    const activeTabData = localTabs.find(tab => tab.id === activeTab);
    if (!activeTabData?.isModified) return;

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
  }, [localTabs, activeTab, saveFile]);

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
    updateTabContent(activeTab, newContent, true);
  };

  // 处理关闭标签页
  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const tab = localTabs.find(t => t.id === tabId);
    if (tab?.isModified) {
      const confirm = window.confirm(`"${tab.name}" 有未保存的更改，确定要关闭吗？`);
      if (!confirm) return;
    }
    
    onTabClose(tabId);
  };

  const activeTabData = localTabs.find(tab => tab.id === activeTab);

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0">
      {/* 标签栏 */}
      <div className="h-9 bg-[#252526] flex items-end px-2 gap-0.5 overflow-x-auto">
        {localTabs.map(tab => (
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
            {tab.isModified && <span className="w-2 h-2 rounded-full bg-blue-500" />}
            <button
              onClick={(e) => handleCloseTab(tab.id, e)}
              className="ml-1 hover:bg-[#3e3e42] rounded p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      
      {/* 工具栏 */}
      <div className="h-10 bg-[#252526] border-b border-[#3e3e42] flex items-center px-3 gap-2">
        <button 
          className={`p-1.5 rounded text-sm flex items-center gap-1 ${
            activeTabData?.isModified 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'hover:bg-[#37373d] text-[#858585]'
          }`}
          title="保存 (Ctrl+S)"
          onClick={saveFile}
          disabled={!activeTabData?.isModified}
        >
          <Save size={16} />
          {activeTabData?.isModified && <span className="text-xs">未保存</span>}
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
        
        {localTabs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[#858585]">
            <div className="text-center">
              <div className="text-4xl mb-4">📄</div>
              <div>从左侧选择文件开始编辑</div>
            </div>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={activeTabData?.content || ''}
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
