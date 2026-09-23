import React, { useRef, useEffect } from 'react';
import {
  Paperclip,
  Camera,
  FolderPlus,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  Palette,
  Plug,
  Globe,
  RotateCcw,
  Check
} from 'lucide-react';

interface PlusActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFiles: () => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  memoryEnabled: boolean;
  onToggleMemory: () => void;
  onShowUpcoming: (featureName: string) => void;
}

export const PlusActionMenu: React.FC<PlusActionMenuProps> = ({
  isOpen,
  onClose,
  onAddFiles,
  webSearchEnabled,
  onToggleWebSearch,
  memoryEnabled,
  onToggleMemory,
  onShowUpcoming,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 mb-2 w-[270px] rounded-2xl bg-[#1E1E1D] border border-[#343432] shadow-2xl p-1.5 z-50 text-left select-none animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="space-y-0.5 text-xs">
        {/* 1. Add files or photos */}
        <button
          type="button"
          onClick={() => {
            onAddFiles();
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[#E6E6E3] hover:bg-[#2A2A29] transition group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Paperclip className="w-4 h-4 text-[#9E9E9C] group-hover:text-white" />
            <span className="font-normal text-[13px]">Add files or photos</span>
          </div>
          <span className="text-[11px] text-[#787875] font-mono">⌘ U</span>
        </button>

        {/* 2. Take a screenshot */}
        <button
          type="button"
          onClick={() => {
            onShowUpcoming('Take a screenshot');
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[#E6E6E3] hover:bg-[#2A2A29] transition group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Camera className="w-4 h-4 text-[#9E9E9C] group-hover:text-white" />
            <span className="font-normal text-[13px]">Take a screenshot</span>
          </div>
        </button>

        {/* 3. Add to project */}
        <button
          type="button"
          onClick={() => {
            onShowUpcoming('Add to project');
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[#E6E6E3] hover:bg-[#2A2A29] transition group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <FolderPlus className="w-4 h-4 text-[#9E9E9C] group-hover:text-white" />
            <span className="font-normal text-[13px]">Add to project</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#787875]" />
        </button>

        {/* 4. Add from GitHub */}
        <button
          type="button"
          onClick={() => {
            onShowUpcoming('Add from GitHub');
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[#E6E6E3] hover:bg-[#2A2A29] transition group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            {/* GitHub icon */}
            <svg
              className="w-4 h-4 text-[#9E9E9C] group-hover:text-white fill-current"
              viewBox="0 0 24 24"
            >
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span className="font-normal text-[13px]">Add from GitHub</span>
          </div>
        </button>

        {/* Separator 1 */}
        <div className="border-t border-[#2F2F2D] my-1" />

        {/* 5. Skills */}
        <button
          type="button"
          onClick={() => {
            onShowUpcoming('Skills');
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[#E6E6E3] hover:bg-[#2A2A29] transition group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#9E9E9C] group-hover:text-white" />
            <span className="font-normal text-[13px]">Skills</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#787875]" />
        </button>

        {/* 6. Connectors */}
        <button
          type="button"
          onClick={() => {
            onShowUpcoming('Connectors');
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[#E6E6E3] hover:bg-[#2A2A29] transition group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <LayoutGrid className="w-4 h-4 text-[#9E9E9C] group-hover:text-white" />
            <span className="font-normal text-[13px]">Connectors</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#787875]" />
        </button>

        {/* 7. Design system */}
        <button
          type="button"
          onClick={() => {
            onShowUpcoming('Design system');
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[#E6E6E3] hover:bg-[#2A2A29] transition group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Palette className="w-4 h-4 text-[#9E9E9C] group-hover:text-white" />
            <span className="font-normal text-[13px]">Design system</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#787875]" />
        </button>

        {/* 8. Add plugins */}
        <button
          type="button"
          onClick={() => {
            onShowUpcoming('Add plugins');
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[#E6E6E3] hover:bg-[#2A2A29] transition group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Plug className="w-4 h-4 text-[#9E9E9C] group-hover:text-white" />
            <span className="font-normal text-[13px]">Add plugins</span>
          </div>
        </button>

        {/* Separator 2 */}
        <div className="border-t border-[#2F2F2D] my-1" />

        {/* 9. Web search (Toggleable Tick Sign) */}
        <button
          type="button"
          onClick={onToggleWebSearch}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[#E6E6E3] hover:bg-[#2A2A29] transition group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-[#9E9E9C] group-hover:text-white" />
            <span className="font-normal text-[13px]">Web search</span>
          </div>
          {webSearchEnabled && (
            <Check className="w-4 h-4 text-[#3B82F6] stroke-[2.5]" />
          )}
        </button>

        {/* 10. Memory (Toggleable Tick Sign) */}
        <button
          type="button"
          onClick={onToggleMemory}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[#E6E6E3] hover:bg-[#2A2A29] transition group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4 text-[#9E9E9C] group-hover:text-white" />
            <span className="font-normal text-[13px]">Memory</span>
          </div>
          {memoryEnabled && (
            <Check className="w-4 h-4 text-[#3B82F6] stroke-[2.5]" />
          )}
        </button>
      </div>
    </div>
  );
};
