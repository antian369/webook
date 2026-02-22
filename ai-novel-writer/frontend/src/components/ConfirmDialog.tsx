import React from 'react';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#252526] border border-[#3e3e42] rounded-lg p-6 w-80">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-[#cccccc] mb-4">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
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
