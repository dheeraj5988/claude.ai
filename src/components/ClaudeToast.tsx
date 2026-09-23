import React, { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

interface ClaudeToastProps {
  message: string | null;
  onClose: () => void;
}

export const ClaudeToast: React.FC<ClaudeToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#212120] border border-[#3A3A38] shadow-2xl text-xs text-[#E6E6E3]">
        <Sparkles className="w-3.5 h-3.5 text-[#DE7959] shrink-0" />
        <span className="font-normal">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 p-0.5 rounded text-[#8E8E8B] hover:text-white"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
