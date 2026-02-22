import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save, Eye } from 'lucide-react';
import { api } from '../api';

interface Tab {
  id: string;
  name: string;
  path: string;
  content: string;
  isModified: boolean;
  isLoading?: boolean;
}

interface EditorAreaProps {
  tabs: Array<{ id: string; name: string; path: string }>;
  activeTab: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  tabs,
  activeTab,
  onTabSelect,
  onTabClose
}) => {
  // 使用 Map 存储标签页数据
  const [tabDataMap, setTabDataMap] = useState<Map<string, Tab>>(new Map());
  const [currentContent, setCurrentContent] = useState('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>('');

  // 初始化或更新标签页数据
  useEffect(() => {
    setTabDataMap(prev => {
      const newMap = new Map(prev);
      
      // 添加新标签页
      tabs.forEach(tab => {
        if (!newMap.has(tab.id)) {
          newMap.set(tab.id, {
            ...tab,
            content: '',
            isModified: false,
            isLoading: true
          });
        }
      });
      
      // 清理已关闭的标签页数据（延迟清理，保留历史）
      const tabIds = new Set(tabs.map(t => t.id));
      Array.from(newMap.keys()).forEach(id => {
        if (!tabIds.has(id)) {
          newMap.delete(id);
        }
      });
      
      return newMap;
    });
  }, [tabs]);

  // 加载当前标签页的文件内容
  useEffect(() => {
    if (!activeTab) {
      setCurrentContent('');
      return;
    }

    const tabData = tabDataMap.get(activeTab);
    if (!tabData) return;

    // 如果内容已加载，直接显示
    if (tabData.content !== '' || !tabData.isLoading) {
      setCurrentContent(tabData.content);
      lastSavedContentRef.current = tabData.content;
      return;
    }

    // 加载文件内容
    const loadContent = async () => {
      try {
        const data = await api.getFileContent(tabData.path);
        const content = data.content || '';
        
        setTabDataMap(prev => {
          const newMap = new Map(prev);
          const tab = newMap.get(activeTab);
          if (tab) {
            tab.content = content;
            tab.isLoading = false;
            tab.isModified = false;
          }
          return newMap;
        });
        
        setCurrentContent(content);
        lastSavedContentRef.current = content;
      } catch (error) {
        console.error('Failed to load file:', error);
        setTabDataMap(prev => {
          const newMap = new Map(prev);
          const tab = newMap.get(activeTab);
          if (tab) {
            tab.isLoading = false;
          }
          return newMap;
        });
      }
    };

    loadContent();
  }, [activeTab, tabDataMap]);

  // 保存文件
  const saveFile = useCallback(async () => {
    if (!activeTab) return;
    
    const tabData = tabDataMap.get(activeTab);
    if (!tabData || !tabData.isModified) return;

    try {
      await api.saveFileContent(tabData.path, currentContent);
      
      setTabDataMap(prev => {
        const newMap = new Map(prev);
        const tab = newMap.get(activeTab);
        if (tab) {
          tab.content = currentContent;
          tab.isModified = false;
        }
        return newMap;
      });
      
      lastSavedContentRef.current = currentContent;
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  }, [activeTab, currentContent, tabDataMap]);

  // 自动保存（防抖，3秒）
  useEffect(() => {
    const tabData = tabDataMap.get(activeTab);
    if (!tabData?.isModified) return;

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
  }, [currentContent, activeTab, tabDataMap, saveFile]);

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
    
    if (activeTab) {
      const isModified = newContent !== lastSavedContentRef.current;
      
      setTabDataMap(prev => {
        const newMap = new Map(prev);
        const tab = newMap.get(activeTab);
        if (tab) {
          tab.isModified = isModified;
        }
        return newMap;
      });
    }
  };

  // 处理关闭标签页
  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const tab = tabDataMap.get(tabId);
    if (tab?.isModified) {
      const confirm = window.confirm(`"${tab.name}" 有未保存的更改，确定要关闭吗？`);
      if (!confirm) return;
    }
    
    onTabClose(tabId);
  };

  const activeTabData = tabDataMap.get(activeTab);
  const wordCount = currentContent.length;

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0">
      {/* 标签栏 */}
      <div className="h-9 bg-[#252526] flex items-end px-2 gap-0.5 overflow-x-auto">
        {tabs.map(tab => {
          const data = tabDataMap.get(tab.id);
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
              {data?.isModified && <span className="w-2 h-2 rounded-full bg-blue-500" title="未保存" />}
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
        {activeTabData?.isLoading && (
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
