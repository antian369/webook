import React from 'react';
import { X, Save, Eye, BarChart3, RotateCcw, RotateCw } from 'lucide-react';

interface Tab {
  id: string;
  name: string;
  path: string;
}

interface EditorAreaProps {
  tabs: Tab[];
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
  return (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0">
      {/* 标签栏 */}
      <div className="h-9 bg-[#252526] flex items-end px-2 gap-0.5 overflow-x-auto">
        {tabs.map(tab => (
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="ml-1 hover:bg-[#3e3e42] rounded p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      
      {/* 工具栏 */}
      <div className="h-10 bg-[#252526] border-b border-[#3e3e42] flex items-center px-3 gap-2">
        <button className="p-1.5 hover:bg-[#37373d] rounded text-sm" title="撤销">
          <RotateCcw size={16} />
        </button>
        <button className="p-1.5 hover:bg-[#37373d] rounded text-sm" title="重做">
          <RotateCw size={16} />
        </button>
        <div className="w-px h-5 bg-[#3e3e42]" />
        <button className="p-1.5 hover:bg-[#37373d] rounded text-sm" title="Markdown 预览">
          <Eye size={16} />
        </button>
        <button className="p-1.5 hover:bg-[#37373d] rounded text-sm" title="字数统计">
          <BarChart3 size={16} />
        </button>
        <div className="flex-1" />
        <span className="text-sm text-[#858585]">📊 1,247字</span>
        <button className="p-1.5 hover:bg-[#37373d] rounded text-sm ml-2" title="保存 (Ctrl+S)">
          <Save size={16} />
        </button>
        <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center gap-1">
          <span>🤖</span>
          <span>Ctrl+I</span>
        </button>
      </div>
      
      {/* 编辑器区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 行号 */}
        <div className="w-12 bg-[#1e1e1e] border-r border-[#3e3e42] py-4 text-right text-sm text-[#858585] select-none">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="px-2 leading-7">{i + 1}</div>
          ))}
        </div>
        
        {/* 编辑器内容 */}
        <div className="flex-1 p-4 overflow-auto font-mono text-sm leading-7">
          {tabs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#858585]">
              <div className="text-center">
                <div className="text-4xl mb-4">📄</div>
                <div>从左侧选择文件开始编辑</div>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">
              <span className="text-emerald-400 font-bold"># 第一章：觉醒之日</span>
{'\n'}
              <span className="text-orange-400 font-bold">【场景一：山中小村】</span>
{'\n'}
              <span className="text-gray-300">清晨的阳光透过薄雾，洒落在大青山脚下的小村庄。炊烟袅袅升起，鸡鸣犬吠声此起彼伏。</span>
{'\n'}
              <span className="text-gray-300">林凡揉了揉惺忪的睡眼，从破旧的木床上爬起。今天是青云宗弟子来村里测试灵根的日子，也是他改变命运的机会。</span>
{'\n'}
              <span className="text-sky-300">"凡儿，快起来吃饭了！"</span>
{'\n'}
              <span className="text-gray-300">林凡应了一声，迅速穿好衣服。他今年十六岁，身材消瘦，但眼神中透着与年龄不符的坚毅。</span>
{'\n'}
              <span className="text-orange-400 font-bold">【场景二：村口广场】</span>
{'\n'}
              <span className="text-gray-300">村口的广场上已经聚集了不少村民。青云宗的仙师们乘坐飞舟降临，引得众人阵阵惊叹。</span>
{'\n'}
              <span className="text-gray-300">为首的是一位白衣青年，面容俊朗，气质出尘。他扫视了一圈人群，淡淡开口：</span>
{'\n'}
              <span className="text-sky-300">"今日我青云宗在此招收弟子，凡年龄在十六岁以下者，皆可前来测试灵根。"</span>
{'\n'}
              <span className="text-gray-300">林凡深吸一口气，握紧了拳头。他知道，这是他唯一的机会。如果测试通过，他就能踏上修仙之路，改变自己和家人的命运。</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
