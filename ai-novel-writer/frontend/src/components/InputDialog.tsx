import React, { useState, useEffect } from 'react';

interface InputDialogProps {
  visible: boolean;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const InputDialog: React.FC<InputDialogProps> = ({
  visible,
  title,
  placeholder = '输入名称...',
  defaultValue = '',
  onConfirm,
  onCancel
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setValue(defaultValue), 0);
      return () => clearTimeout(timer);
    }
  }, [visible, defaultValue]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#252526] border border-[#3e3e42] rounded-lg p-6 w-80">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#3e3e42] border border-[#3e3e42] rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onConfirm(value);
            } else if (e.key === 'Escape') {
              onCancel();
            }
          }}
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onConfirm(value)}
            disabled={!value.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-[#3e3e42] disabled:cursor-not-allowed rounded text-sm"
          >
            确定
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-[#3e3e42] hover:bg-[#4e4e52] rounded text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
