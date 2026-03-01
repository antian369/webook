import { useState, useEffect, useCallback } from 'react';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { EditorArea, type SelectionInfo } from './components/EditorArea';
import { ChatPanel } from './components/ChatPanel';
import { StatusBar } from './components/StatusBar';
import { api } from './api';
import type { Project, FileNode } from './types';
import './App.css';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<string>('');
  const [files, setFiles] = useState<FileNode[]>([]);
  const [openTabs, setOpenTabs] = useState<Array<{ id: string; name: string; path: string }>>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [chatWidth, setChatWidth] = useState(380);
  const [引用文件, set引用文件] = useState<{ name: string; path: string; content: string } | null>(null);
  const [editorSelection, setEditorSelection] = useState<SelectionInfo | null>(null);

  // 加载项目列表
  const loadProjects = useCallback(async () => {
    try {
      const data = await api.getProjects();
      setProjects(data.projects);
      if (data.projects.length > 0 && !currentProject) {
        setCurrentProject(data.projects[0].name);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }, [currentProject]);

  // 加载当前项目的文件
  const loadProjectFiles = useCallback(async (projectName: string) => {
    try {
      const data = await api.getProjectFiles(projectName);
      setFiles(data.files);
    } catch (error) {
      console.error('Failed to load project files:', error);
    }
  }, []);

  // 初始加载项目列表
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProjects();
  }, [loadProjects]);

  // 加载当前项目的文件
  useEffect(() => {
    if (currentProject) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadProjectFiles(currentProject);
    }
  }, [currentProject, loadProjectFiles]);

  const handleFileSelect = (file: { name: string; path: string }) => {
    const tabId = file.path;
    if (!openTabs.find(tab => tab.id === tabId)) {
      setOpenTabs([...openTabs, { id: tabId, name: file.name, path: file.path }]);
    }
    setActiveTab(tabId);
  };

  const handleTabClose = (tabId: string) => {
    const newTabs = openTabs.filter(tab => tab.id !== tabId);
    setOpenTabs(newTabs);
    if (activeTab === tabId && newTabs.length > 0) {
      setActiveTab(newTabs[newTabs.length - 1].id);
    }
  };

  const handleSidebarResize = (delta: number) => {
    setSidebarWidth(prev => Math.max(200, Math.min(400, prev + delta)));
  };

  const handleChatResize = (delta: number) => {
    setChatWidth(prev => Math.max(300, Math.min(500, prev + delta)));
  };

  const handle文件引用 = async (file: { name: string; path: string }) => {
    try {
      const data = await api.getFileContent(file.path);
      set引用文件({ name: file.name, path: file.path, content: data.content });
    } catch (error) {
      console.error('读取文件失败:', error);
    }
  };

  // 处理选中文本变化
  const handleSelectionChange = (selection: SelectionInfo | null) => {
    setEditorSelection(selection);
  };

  // 获取当前活动文件内容
  const getCurrentFileInfo = () => {
    const activeTabInfo = openTabs.find(tab => tab.id === activeTab);
    return {
      name: activeTabInfo?.name || '',
      path: activeTabInfo?.path || '',
      content: ''
    };
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-[#cccccc] overflow-hidden">
      <TopNav />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          width={sidebarWidth}
          onResize={handleSidebarResize}
          files={files}
          currentProject={currentProject}
          onFileSelect={handleFileSelect}
          projects={projects}
          onProjectChange={setCurrentProject}
          onProjectCreated={loadProjects}
          onFilesChanged={() => loadProjectFiles(currentProject)}
          on文件引用={handle文件引用}
        />
        
        <EditorArea
          tabs={openTabs}
          activeTab={activeTab}
          onTabSelect={setActiveTab}
          onTabClose={handleTabClose}
          onSelectionChange={handleSelectionChange}
        />
        
        <ChatPanel 
          width={chatWidth}
          onResize={handleChatResize}
          引用文件={引用文件}
          on引用文件使用={() => set引用文件(null)}
          currentFile={getCurrentFileInfo()}
          editorSelection={editorSelection}
          onClearSelection={() => setEditorSelection(null)}
          projectName={currentProject}
        />
      </div>
      
      <StatusBar 
        currentProject={currentProject}
        currentFile={openTabs.find(tab => tab.id === activeTab)?.name || ''}
      />
    </div>
  );
}

export default App;
