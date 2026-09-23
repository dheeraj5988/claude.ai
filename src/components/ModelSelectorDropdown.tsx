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

export const MAIN_MODELS = [
  {
    id: 'fable-5-1' as const,
    name: 'Fable 5.1',
    requiresCredits: true,
    subtitle: 'For your toughest challenges',
  },
  {
    id: 'opus-5-5' as const,
    name: 'Opus 5.5',
    subtitle: 'Most capable for ambitious work',
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

export const MORE_MODELS: { id: ModelId; name: string; requiresCredits?: boolean }[] = [
  {
    id: 'fable-5',
    name: 'Fable 5',
    requiresCredits: true,
  },
  {
    id: 'opus-5',
    name: 'Opus 5',
  },
  {
    id: 'opus-4-8',
    name: 'Opus 4.8',
  },
  {
    id: 'opus-4-7',
    name: 'Opus 4.7',
  },
  {
    id: 'opus-4-6',
    name: 'Opus 4.6',
  },
  {
    id: 'opus-3',
    name: 'Opus 3',
  },
  {
    id: 'sonnet-4-6',
    name: 'Sonnet 4.6',
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
  // Default to 'more-models' flyout open matching Screenshot 1!
  const [activeSubmenu, setActiveSubmenu] = useState<'effort' | 'more-models' | null>('more-models');
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

  // Adjust flyout side if near edge of screen
  useEffect(() => {
    if (isOpen && modelBoxRef.current) {
      const rect = modelBoxRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.right;
      if (spaceRight < 330) {
        setFlyoutSide('left');
      } else {
        setFlyoutSide('right');
      }
    }
  }, [isOpen, activeSubmenu]);

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
      {/* 1. MAIN MODEL SELECTION BOX (Screenshot 1) */}
      <div
        ref={modelBoxRef}
        className="w-[310px] rounded-2xl bg-[#1C1C1B] border border-[#343432] shadow-2xl p-2.5 text-left relative"
      >
        <div className="space-y-1">
          {MAIN_MODELS.map(m => {
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-sm text-[#E6E6E3] group-hover:text-white">
                      {m.name}
                    </span>
                    {m.requiresCredits && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-[#282827] text-[#9E9E9C] border border-[#3A3A38] font-normal flex items-center gap-1">
                        <Info className="w-3 h-3 text-[#8E8E8B]" />
                        <span>Requires usage credits</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#8E8E8B] mt-0.5 leading-snug">
                    {m.subtitle}
                  </div>
                </div>

                <div className="shrink-0 flex items-center pt-0.5">
                  {m.requiresCredits ? (
                    <span
                      onClick={e => {
                        e.stopPropagation();
                        onShowToast?.('Usage credits are required for Fable models.');
                      }}
                      className="px-2.5 py-1 rounded-md bg-[#0C1D38] hover:bg-[#122A4E] text-[#4D92FF] text-xs font-medium transition cursor-pointer"
                    >
                      Buy credits
                    </span>
                  ) : isSelected ? (
                    <Check className="w-4 h-4 text-[#3B82F6] stroke-[2.5]" />
                  ) : null}
                </div>
              </button>
            );
          })}

          {/* Divider */}
          <div className="border-t border-[#2F2F2D] my-1" />

          {/* Effort Row */}
          <button
            type="button"
            onClick={() => setActiveSubmenu(activeSubmenu === 'effort' ? null : 'effort')}
            className={`w-full text-left px-2.5 py-2 rounded-xl transition flex items-center justify-between cursor-pointer ${
              activeSubmenu === 'effort'
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

          {/* More Models Row (Screenshot 1) */}
          <button
            type="button"
            onClick={() => setActiveSubmenu(activeSubmenu === 'more-models' ? null : 'more-models')}
            className={`w-full text-left px-2.5 py-2 rounded-xl transition flex items-center justify-between cursor-pointer ${
              activeSubmenu === 'more-models'
                ? 'bg-[#2A2A29] text-white'
                : 'text-[#E6E6E3] hover:bg-[#2A2A29]'
            }`}
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

      {/* 2. MORE MODELS PANEL - FLYOUT (Screenshot 1) */}
      {activeSubmenu === 'more-models' && (
        <div
          className={`absolute w-[290px] rounded-2xl bg-[#1C1C1B] border border-[#343432] shadow-2xl p-2.5 text-left animate-in fade-in duration-100 ${
            isUp ? 'bottom-0' : 'top-0'
          } ${
            flyoutSide === 'right' ? 'left-full ml-2' : 'right-full mr-2'
          }`}
        >
          <div className="space-y-0.5">
            {MORE_MODELS.map(m => {
              const isSelected = currentModel === m.id;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onSelectModel(m.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left hover:bg-[#2A2A29] transition group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-normal text-[#E6E6E3] group-hover:text-white">
                      {m.name}
                    </span>
                    {m.requiresCredits && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-[#282827] text-[#9E9E9C] border border-[#3A3A38] font-normal flex items-center gap-1">
                        <Info className="w-3 h-3 text-[#8E8E8B]" />
                        <span>Requires usage credits</span>
                      </span>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center">
                    {m.requiresCredits ? (
                      <span
                        onClick={e => {
                          e.stopPropagation();
                          onShowToast?.('Usage credits are required for Fable models.');
                        }}
                        className="px-2.5 py-1 rounded-md bg-[#0C1D38] hover:bg-[#122A4E] text-[#4D92FF] text-xs font-medium transition cursor-pointer"
                      >
                        Buy credits
                      </span>
                    ) : isSelected ? (
                      <Check className="w-4 h-4 text-[#3B82F6] stroke-[2.5]" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. EFFORT PANEL - FLYOUT */}
      {activeSubmenu === 'effort' && (
        <div
          className={`absolute w-[310px] rounded-2xl bg-[#1C1C1B] border border-[#343432] shadow-2xl p-3 text-left animate-in fade-in duration-100 ${
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
