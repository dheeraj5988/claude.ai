import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Pencil, Trash2, ChevronRight } from 'lucide-react';

interface ChatTitleDropdownProps {
  title: string;
}

export const ChatTitleDropdown: React.FC<ChatTitleDropdownProps> = ({ title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      {/* Title & Chevron Button matching Screenshots */}
      <div className="flex items-center gap-1.5 text-sm font-normal text-[#EDEDEB] select-none">
        <span className="truncate max-w-sm md:max-w-md">{title || 'hello which model are you'}</span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1 rounded-lg transition cursor-pointer flex items-center justify-center ${
            isOpen ? 'bg-[#282827] text-white' : 'text-[#8E8E8B] hover:text-[#EDEDEB] hover:bg-[#1E1E1D]'
          }`}
          title="Chat options"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dropdown Menu matching Screenshot 1 (all features disabled) */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-56 rounded-2xl bg-[#1C1C1B] border border-[#343432] shadow-2xl p-1.5 z-50 text-left select-none animate-in fade-in duration-100">
          <div className="space-y-0.5">
            {/* 1. Pin */}
            <div
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#EDEDEB] hover:bg-[#282827] transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <svg
                  className="w-4 h-4 text-[#A0A09D]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="17" x2="12" y2="22"></line>
                  <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                </svg>
                <span className="text-sm font-normal">Pin</span>
              </div>
              <span className="text-xs text-[#787875] font-mono">P</span>
            </div>

            {/* 2. Rename */}
            <div
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#EDEDEB] hover:bg-[#282827] transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Pencil className="w-4 h-4 text-[#A0A09D]" />
                <span className="text-sm font-normal">Rename</span>
              </div>
              <span className="text-xs text-[#787875] font-mono">R</span>
            </div>

            {/* 3. Add to project */}
            <div
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#EDEDEB] hover:bg-[#282827] transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <svg
                  className="w-4 h-4 text-[#A0A09D]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="4" width="16" height="5" rx="2" />
                  <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
                  <path d="M10 13h4" />
                </svg>
                <span className="text-sm font-normal">Add to project</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#787875]" />
            </div>

            {/* 4. Share chat */}
            <div
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#EDEDEB] hover:bg-[#282827] transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <svg
                  className="w-4 h-4 text-[#A0A09D]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span className="text-sm font-normal">Share chat</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#2B2B2A] my-1" />

            {/* 5. Delete (Red) */}
            <div
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#EF4444] hover:bg-[#282827] transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4 text-[#EF4444]" />
                <span className="text-sm font-normal">Delete</span>
              </div>
              <span className="text-xs text-[#787875] font-mono">D</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
