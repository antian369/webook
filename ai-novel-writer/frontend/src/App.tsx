import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { EditorArea } from './components/EditorArea';
import { ChatPanel } from './components/ChatPanel';
import { StatusBar } from './components/StatusBar';
import { api } from './api';
import type { Project } from './types';
import './App.css';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<string>('');
  const [files, setFiles] = useState<any[]>([]);
  const [openTabs, setOpenTabs] = useState<Array<{ id: string; name: string; path: string }>>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [chatWidth, setChatWidth] = useState(380);

  // 加载项目列表
  useEffect(() => {
    loadProjects();
  }, []);

  // 加载当前项目的文件
  useEffect(() => {
    if (currentProject) {
      loadProjectFiles(currentProject);
    }
  }, [currentProject]);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data.projects);
      if (data.projects.length > 0 && !currentProject) {
        setCurrentProject(data.projects[0].name);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadProjectFiles = async (projectName: string) => {
    try {
      const data = await api.getProjectFiles(projectName);
      setFiles(data.files);
    } catch (error) {
      console.error('Failed to load project files:', error);
    }
  };

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
    setSidebarWidth(Math.max(200, Math.min(400, sidebarWidth + delta)));
  };

  const handleChatResize = (delta: number) => {
    setChatWidth(Math.max(300, Math.min(500, chatWidth - delta)));
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
        />
        
        <EditorArea
          tabs={openTabs}
          activeTab={activeTab}
          onTabSelect={setActiveTab}
          onTabClose={handleTabClose}
        />
        
        <ChatPanel 
          width={chatWidth}
          onResize={handleChatResize}
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
