import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Layers,
  Sliders,
  Check,
  Code2,
  PanelRightOpen,
  PanelRightClose
} from 'lucide-react';
import { ModelId, ModelOption } from '../types';
import { ClaudeSunburst } from './ClaudeSunburst';

interface HeaderProps {
  currentModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  isArtifactPanelOpen: boolean;
  onToggleArtifactPanel: () => void;
  hasArtifacts: boolean;
  onOpenSettings: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'fable-5-1',
    name: 'Fable 5.1',
    subtitle: 'For your toughest challenges',
  },
  {
    id: 'opus-5-5',
    name: 'Opus 5.5',
    subtitle: 'Most capable for ambitious work',
  },
  {
    id: 'sonnet-5',
    name: 'Sonnet 5',
    subtitle: 'Most efficient for everyday tasks',
  },
  {
    id: 'haiku-4-5',
    name: 'Haiku 4.5',
    subtitle: 'Fastest for quick answers',
  },
  {
    id: 'fable-5',
    name: 'Fable 5',
    subtitle: 'Pinnacle intelligence',
  },
  {
    id: 'opus-5',
    name: 'Opus 5',
    subtitle: 'Ambitious reasoning',
  },
  {
    id: 'opus-4-8',
    name: 'Opus 4.8',
    subtitle: 'Deep architecture',
  },
  {
    id: 'opus-4-7',
    name: 'Opus 4.7',
    subtitle: 'System engineering',
  },
  {
    id: 'opus-4-6',
    name: 'Opus 4.6',
    subtitle: 'Deep algorithmic solutions',
  },
  {
    id: 'opus-3',
    name: 'Opus 3',
    subtitle: 'Foundational reasoning',
  },
  {
    id: 'sonnet-4-6',
    name: 'Sonnet 4.6',
    subtitle: 'Efficient software development',
  },
];

export const Header: React.FC<HeaderProps> = ({
  currentModel,
  onSelectModel,
  isArtifactPanelOpen,
  onToggleArtifactPanel,
  hasArtifacts,
  onOpenSettings,
  onToggleSidebar,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = AVAILABLE_MODELS.find(m => m.id === currentModel) || AVAILABLE_MODELS[1];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-12 border-b border-[#2A2A28] bg-[#141413] flex items-center justify-between px-3 md:px-4 z-30 select-none">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-[#8E8E8B] hover:text-white hover:bg-[#1F1F1E] transition"
          title="Toggle sidebar"
        >
          <Layers className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <ClaudeSunburst size={20} />
          <span className="font-serif font-medium text-[#EDEDEB] text-base tracking-tight">
            Claude
          </span>
        </div>

        {/* Model dropdown */}
        <div className="relative ml-2" ref={dropdownRef}>
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs text-[#C4C4C2] hover:text-white bg-[#1F1F1E] border border-[#323230] transition"
          >
            <span>{selectedModel.name}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {modelDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-[#212120] border border-[#363634] shadow-2xl p-1.5 z-50 animate-in fade-in duration-100">
              {AVAILABLE_MODELS.map(m => {
                const isSel = m.id === currentModel;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectModel(m.id);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between ${
                      isSel ? 'bg-[#2A2A29] text-white' : 'text-[#C4C4C2] hover:bg-[#282827]'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-xs">{m.name}</div>
                      <div className="text-[11px] text-[#8E8E8B]">{m.subtitle}</div>
                    </div>
                    {isSel && <Check className="w-4 h-4 text-[#3B82F6]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {hasArtifacts && (
          <button
            onClick={onToggleArtifactPanel}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs transition border ${
              isArtifactPanelOpen
                ? 'bg-[#DE7959] text-white border-[#DE7959]'
                : 'bg-[#1F1F1E] text-[#C4C4C2] border-[#323230]'
            }`}
          >
            {isArtifactPanelOpen ? (
              <PanelRightClose className="w-3.5 h-3.5" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5" />
            )}
            <span>Canvas</span>
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-[#8E8E8B] hover:text-white hover:bg-[#1F1F1E] transition"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
