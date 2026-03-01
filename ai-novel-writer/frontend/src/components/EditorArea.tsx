import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Save, WrapText } from 'lucide-react';
import { api } from '../api';

interface TabInfo {
  id: string;
  name: string;
  path: string;
}

export interface SelectionInfo {
  text: string;
  startLine: number;
  endLine: number;
  fileName: string;
  filePath: string;
}

interface EditorAreaProps {
  tabs: TabInfo[];
  activeTab: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onSelectionChange?: (selection: SelectionInfo | null) => void;
}

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
  onTabClose,
  onSelectionChange
}) => {
  const [currentContent, setCurrentContent] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [showFloatToolbar, setShowFloatToolbar] = useState(false);
  const [floatToolbarPos, setFloatToolbarPos] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const [wordWrap, setWordWrap] = useState(false);
  
  const tabDataRef = useRef<Map<string, TabData>>(new Map());
  const activeTabRef = useRef<string>('');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const toolbarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    if (activeTab === activeTabRef.current && !isInitialLoadRef.current) {
      return;
    }

    isInitialLoadRef.current = false;
    activeTabRef.current = activeTab;

    const loadContent = async () => {
      const tabData = tabDataRef.current.get(activeTab);
      const tabInfo = tabs.find(t => t.id === activeTab);
      
      if (!tabInfo) return;

      if (tabData && tabData.content !== '') {
        setCurrentContent(tabData.content);
        setIsModified(tabData.isModified);
        setWordCount(tabData.content.length);
        return;
      }

      setIsLoading(true);
      try {
        const data = await api.getFileContent(tabInfo.path);
        const content = data.content || '';
        
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
  }, [activeTab, tabs]);

  // 保存文件
  const saveFile = useCallback(async () => {
    if (!activeTabRef.current || !isModified) return;

    const tabInfo = tabs.find(t => t.id === activeTabRef.current);
    if (!tabInfo) return;

    try {
      await api.saveFileContent(tabInfo.path, currentContent);
      
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

  // 自动保存
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        if (selection) {
          onSelectionChange?.(selection);
          setShowFloatToolbar(false);
          if (textareaRef.current) {
            const end = textareaRef.current.selectionEnd;
            textareaRef.current.selectionStart = end;
            textareaRef.current.selectionEnd = end;
            textareaRef.current.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile, selection, onSelectionChange]);

  // 计算行号（基于实际渲染高度）
  const calculateLineNumbers = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || !currentContent) return [];

    const lines = currentContent.split('\n');
    const result: number[] = [];

    lines.forEach((_, lineIndex) => {
      const lineNum = lineIndex + 1;
      
      if (wordWrap) {
        // 计算这行会占用多少显示行（基于文本实际测量）
        const lineText = lines[lineIndex];
        const testDiv = document.createElement('div');
        testDiv.style.cssText = getComputedStyle(textarea).cssText;
        testDiv.style.position = 'absolute';
        testDiv.style.visibility = 'hidden';
        testDiv.style.height = 'auto';
        testDiv.style.whiteSpace = 'pre-wrap';
        testDiv.style.wordWrap = 'break-word';
        testDiv.style.width = `${textarea.clientWidth - 32}px`;
        testDiv.textContent = lineText || ' ';
        document.body.appendChild(testDiv);
        
        const lineHeight = 24; // 基础行高
        const actualHeight = testDiv.clientHeight;
        const wrapCount = Math.max(1, Math.round(actualHeight / lineHeight));
        
        document.body.removeChild(testDiv);
        
        // 添加行号（只有第一行显示数字，其他显示空）
        for (let i = 0; i < wrapCount; i++) {
          result.push(i === 0 ? lineNum : 0); // 0 表示不显示行号
        }
      } else {
        result.push(lineNum);
      }
    });

    return result;
  }, [currentContent, wordWrap]);

  // 获取字符位置对应的行号
  const getLineNumberFromPosition = (content: string, position: number): number => {
    const lines = content.substring(0, position).split('\n');
    return lines.length;
  };

  // 处理文本选择 - 在鼠标位置显示引用按钮
  const handleTextSelection = (e?: React.MouseEvent) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end);

    if (text && text.trim()) {
      const startLine = getLineNumberFromPosition(textarea.value, start);
      const endLine = getLineNumberFromPosition(textarea.value, end);
      
      const activeTabInfo = tabs.find(t => t.id === activeTab);
      
      const newSelection: SelectionInfo = {
        text: text.trim(),
        startLine,
        endLine,
        fileName: activeTabInfo?.name || '未知文件',
        filePath: activeTabInfo?.path || ''
      };
      
      setSelection(newSelection);
      
      // 在鼠标位置显示引用按钮（如果有鼠标事件），否则使用上次记录的鼠标位置
      const mouseX = e?.clientX ?? mousePosRef.current.x;
      const mouseY = e?.clientY ?? mousePosRef.current.y;
      
      setFloatToolbarPos({
        x: mouseX + 10,
        y: mouseY - 40
      });
      setShowFloatToolbar(true);
      
      // 自动隐藏工具栏
      if (toolbarTimerRef.current) {
        clearTimeout(toolbarTimerRef.current);
      }
      toolbarTimerRef.current = setTimeout(() => {
        setShowFloatToolbar(false);
      }, 5000);
    } else {
      setSelection(null);
      setShowFloatToolbar(false);
    }
  };

  // 记录鼠标位置
  const handleMouseMove = (e: React.MouseEvent) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  // 点击引用按钮
  const handleQuoteClick = () => {
    if (selection) {
      onSelectionChange?.(selection);
      setShowFloatToolbar(false);
      if (textareaRef.current) {
        const end = textareaRef.current.selectionEnd;
        textareaRef.current.selectionStart = end;
        textareaRef.current.selectionEnd = end;
        textareaRef.current.focus();
      }
    }
  };

  // 处理滚动同步
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
  };

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
    
    setSelection(null);
    setShowFloatToolbar(false);
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
    
    tabDataRef.current.delete(tabId);
    onTabClose(tabId);
  };

  // 计算行号
  const lineNumbers = useMemo(() => {
    return calculateLineNumbers();
  }, [calculateLineNumbers]);

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
        <button 
          className={`p-1.5 rounded text-sm ${
            wordWrap 
              ? 'bg-blue-600 text-white' 
              : 'hover:bg-[#37373d] text-[#858585]'
          }`}
          title="自动换行"
          onClick={() => setWordWrap(!wordWrap)}
        >
          <WrapText size={16} />
        </button>
        <div className="flex-1" />
        <span className="text-sm text-[#858585]">📝 {wordCount} 字符</span>
      </div>
      
      {/* 编辑器区域 */}
      <div className="flex-1 flex overflow-hidden relative" ref={editorContainerRef}>
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
          <div className="flex flex-1 overflow-hidden">
            {/* 行号区域 */}
            <div
              ref={lineNumbersRef}
              className="w-12 bg-[#1e1e1e] border-r border-[#3e3e42] overflow-hidden select-none py-4 pr-2 text-right"
              style={{ 
                fontFamily: 'monospace',
                fontSize: '14px'
              }}
            >
              {lineNumbers.map((num, i) => (
                <div 
                  key={i} 
                  className={num > 0 ? 'text-[#858585]' : 'text-transparent'}
                  style={{ 
                    height: '24px',
                    lineHeight: '24px'
                  }}
                >
                  {num > 0 ? num : '.'}
                </div>
              ))}
            </div>
            
            {/* 文本编辑区域 */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={currentContent}
                onChange={handleContentChange}
                onMouseUp={handleTextSelection}
                onMouseMove={handleMouseMove}
                onKeyUp={() => handleTextSelection()}
                onScroll={handleScroll}
                className="w-full h-full bg-[#1e1e1e] text-[#cccccc] p-4 resize-none outline-none font-mono text-sm"
                style={{ 
                  lineHeight: '24px',
                  whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                  overflowWrap: wordWrap ? 'break-word' : 'normal',
                  overflowX: wordWrap ? 'hidden' : 'auto'
                }}
                placeholder="开始写作...&#10;选中文字后按 Ctrl+I 引用到对话"
                spellCheck={false}
              />
              
              {/* 浮动工具栏 - 在选区结束位置显示 */}
              {showFloatToolbar && selection && (
                <div
                  className="fixed bg-[#252526] border border-[#3e3e42] rounded shadow-lg p-1 z-50"
                  style={{
                    left: `${floatToolbarPos.x}px`,
                    top: `${floatToolbarPos.y}px`,
                  }}
                >
                  <button
                    onClick={handleQuoteClick}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white"
                    title="Ctrl+I"
                  >
                    📋 引用
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
