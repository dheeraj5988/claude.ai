import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  ChevronRight,
  Info,
  AlertTriangle
} from 'lucide-react';
import { EffortLevel, ModelId } from '../types';

interface ModelSelectorDropdownProps {
  currentModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  effort: EffortLevel;
  onSelectEffort: (effort: EffortLevel) => void;
  thinkingEnabled?: boolean;
  onToggleThinking?: () => void;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
  dropDirection?: 'up' | 'down';
}

export const CLAUDE_MODELS_REDESIGN = [
  {
    id: 'fable-5-1' as const,
    name: 'Fable 5.1',
    infoBadge: 'Pro or Max',
    subtitle: 'For your toughest challenges',
    upgradeBadge: 'Upgrade',
  },
  {
    id: 'opus-5-5' as const,
    name: 'Opus 5.5',
    badge: 'Pro',
    subtitle: 'Most capable for ambitious work',
    upgradeBadge: 'Upgrade',
  },
  {
    id: 'sonnet-5' as const,
    name: 'Sonnet 5',
    subtitle: 'Most efficient for everyday tasks',
  },
  {
    id: 'haiku-4-5' as const,
    name: 'Haiku 4.5',
    subtitle: 'Fastest for quick answers',
  },
];

export const ModelSelectorDropdown: React.FC<ModelSelectorDropdownProps> = ({
  currentModel,
  onSelectModel,
  effort,
  onSelectEffort,
  thinkingEnabled = true,
  onToggleThinking,
  isOpen,
  onClose,
  onShowToast,
  dropDirection = 'down',
}) => {
  const [effortPanelOpen, setEffortPanelOpen] = useState(true);
  const [flyoutSide, setFlyoutSide] = useState<'right' | 'left'>('right');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modelBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Lock model box in place, and adjust effort flyout side if near screen edge
  useEffect(() => {
    if (isOpen && modelBoxRef.current) {
      const rect = modelBoxRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.right;
      if (spaceRight < 325) {
        setFlyoutSide('left');
      } else {
        setFlyoutSide('right');
      }
    }
  }, [isOpen, effortPanelOpen]);

  if (!isOpen) return null;

  const isUp = dropDirection === 'up';

  return (
    <div
      ref={dropdownRef}
      className={`absolute right-0 z-50 select-none ${
        isUp ? 'bottom-full mb-2' : 'top-full mt-2'
      }`}
      style={{ width: '310px' }}
    >
      {/* 1. MODEL SELECTION BOX - COMPLETELY LOCKED IN POSITION */}
      <div
        ref={modelBoxRef}
        className="w-[310px] rounded-2xl bg-[#1E1E1D] border border-[#343432] shadow-2xl p-2.5 text-left relative"
      >
        <div className="space-y-1">
          {CLAUDE_MODELS_REDESIGN.map(m => {
            const isSelected = currentModel === m.id;

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onSelectModel(m.id);
                  onClose();
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-[#2A2A29] transition group flex items-start justify-between cursor-pointer"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm text-[#E6E6E3] group-hover:text-white">
                      {m.name}
                    </span>
                    {m.infoBadge && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#2D2D2C] text-[#A0A09D] font-normal flex items-center gap-1">
                        <Info className="w-3 h-3 text-[#8E8E8B]" />
                        <span>{m.infoBadge}</span>
                      </span>
                    )}
                    {m.badge && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#2D2D2C] text-[#A0A09D] font-normal">
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#8E8E8B] mt-0.5 leading-snug">
                    {m.subtitle}
                  </div>
                </div>

                <div className="shrink-0 flex items-center pt-0.5">
                  {isSelected && (
                    <Check className="w-4 h-4 text-[#3B82F6] stroke-[2.5]" />
                  )}
                  {!isSelected && m.upgradeBadge && (
                    <span
                      onClick={e => {
                        e.stopPropagation();
                        onShowToast?.(`${m.name} is included in Pro or Max plans.`);
                      }}
                      className="text-xs text-[#3B82F6] hover:underline font-medium cursor-pointer"
                    >
                      {m.upgradeBadge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {/* Divider */}
          <div className="border-t border-[#2F2F2D] my-1" />

          {/* Effort Row */}
          <button
            type="button"
            onClick={() => setEffortPanelOpen(!effortPanelOpen)}
            className={`w-full text-left px-2.5 py-2 rounded-xl transition flex items-center justify-between cursor-pointer ${
              effortPanelOpen
                ? 'bg-[#2A2A29] text-white'
                : 'text-[#E6E6E3] hover:bg-[#2A2A29]'
            }`}
          >
            <span className="text-sm font-normal">Effort</span>
            <div className="flex items-center gap-1 text-xs text-[#8E8E8B]">
              <span>{effort}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-70" />
            </div>
          </button>

          {/* Divider */}
          <div className="border-t border-[#2F2F2D] my-1" />

          {/* More Models Row */}
          <button
            type="button"
            onClick={() => onShowToast?.('More models are coming soon.')}
            className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#2A2A29] transition flex items-center justify-between cursor-pointer text-[#E6E6E3]"
          >
            <span className="text-sm font-normal">More models</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#8E8E8B]" />
          </button>

          {/* Footer Text */}
          <div className="px-2 pt-2 pb-1 text-[11px] text-[#8E8E8B] leading-relaxed">
            Fable 5.1 is included in Max plans, or available with usage credits on Pro.{' '}
            <span
              onClick={() => onShowToast?.('Fable 5.1 plan credits details.')}
              className="underline text-[#A0A09D] hover:text-white cursor-pointer"
            >
              Learn more
            </span>
          </div>
        </div>
      </div>

      {/* 2. EFFORT PANEL - FLYOUT (ABSOLUTE POSITIONED, ZERO SHIFT TO MODEL BOX) */}
      {effortPanelOpen && (
        <div
          className={`absolute w-[310px] rounded-2xl bg-[#1E1E1D] border border-[#343432] shadow-2xl p-3 text-left animate-in fade-in duration-100 ${
            isUp ? 'bottom-0' : 'top-0'
          } ${
            flyoutSide === 'right' ? 'left-full ml-2' : 'right-full mr-2'
          }`}
        >
          {/* Top Description */}
          <div className="text-[13px] text-[#8E8E8B] leading-snug px-1 pt-0.5 pb-2.5 font-normal">
            Higher effort means more thorough responses, but takes longer and uses your limits faster.
          </div>

          <div className="space-y-0.5">
            {/* 1. Low */}
            <button
              type="button"
              onClick={() => onSelectEffort('Low')}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left hover:bg-[#2A2A29] transition group cursor-pointer"
            >
              <span className="text-sm font-normal text-[#E6E6E3]">Low</span>
              {effort === 'Low' && (
                <Check className="w-4 h-4 text-[#3B82F6] stroke-[2.5]" />
              )}
            </button>

            {/* 2. Medium (Default) */}
            <button
              type="button"
              onClick={() => onSelectEffort('Medium')}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left hover:bg-[#2A2A29] transition group cursor-pointer"
            >
              <div className="flex items-center">
                <span className="text-sm font-normal text-[#E6E6E3]">Medium</span>
                <span className="ml-2 text-[11px] font-normal px-1.5 py-0.5 rounded bg-[#2D2D2C] text-[#9E9E9C]">
                  Default
                </span>
              </div>
              {effort === 'Medium' && (
                <Check className="w-4 h-4 text-[#3B82F6] stroke-[2.5]" />
              )}
            </button>

            {/* 3. High */}
            <button
              type="button"
              onClick={() => onSelectEffort('High')}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left hover:bg-[#2A2A29] transition group cursor-pointer"
            >
              <span className="text-sm font-normal text-[#E6E6E3]">High</span>
              {effort === 'High' && (
                <Check className="w-4 h-4 text-[#3B82F6] stroke-[2.5]" />
              )}
            </button>

            {/* 4. Extra */}
            <button
              type="button"
              onClick={() => onSelectEffort('Extra')}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left hover:bg-[#2A2A29] transition group cursor-pointer"
            >
              <span className="text-sm font-normal text-[#E6E6E3]">Extra</span>
              {effort === 'Extra' && (
                <Check className="w-4 h-4 text-[#3B82F6] stroke-[2.5]" />
              )}
            </button>

            {/* 5. Max (⚠️ 3.5× or more usage) */}
            <button
              type="button"
              onClick={() => onSelectEffort('Max')}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left hover:bg-[#2A2A29] transition group cursor-pointer"
            >
              <div className="flex items-center">
                <span className="text-sm font-normal text-[#E6E6E3]">Max</span>
                <span className="ml-2 text-[11px] font-normal px-1.5 py-0.5 rounded bg-[#291B0B] text-[#D97706] border border-[#52330A] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-[#D97706] shrink-0" />
                  <span>3.5× or more usage</span>
                </span>
              </div>
              {effort === 'Max' && (
                <Check className="w-4 h-4 text-[#3B82F6] stroke-[2.5]" />
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-[#2F2F2D] my-2" />

          {/* Thinking Switch */}
          <div className="flex items-center justify-between px-2 py-1.5">
            <div>
              <div className="text-sm font-medium text-[#E6E6E3]">Thinking</div>
              <div className="text-xs text-[#8E8E8B] mt-0.5">
                Can think for more complex tasks
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleThinking}
              className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                thinkingEnabled ? 'bg-[#3B82F6]' : 'bg-[#383837]'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                  thinkingEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
