import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Mic,
  AudioLines,
  ChevronDown,
  ArrowUp,
  Square
} from 'lucide-react';
import { ModelSelectorDropdown } from './ModelSelectorDropdown';
import { PlusActionMenu } from './PlusActionMenu';
import { FileCard } from './FileCard';
import { ClaudeToast } from './ClaudeToast';
import { EffortLevel, ModelId, Attachment } from '../types';

interface ClaudeChatBoxProps {
  onSendMessage: (text: string, attachments?: Attachment[]) => void;
  isStreaming: boolean;
  onStop: () => void;
  currentModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  effort: EffortLevel;
  onSelectEffort: (effort: EffortLevel) => void;
  thinkingEnabled?: boolean;
  onToggleThinking?: () => void;
  onOpenCoworkModal: () => void;
  onOpenSnippetModal?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  isDocked?: boolean;
}

export const ClaudeChatBox: React.FC<ClaudeChatBoxProps> = ({
  onSendMessage,
  isStreaming,
  onStop,
  currentModel,
  onSelectModel,
  effort,
  onSelectEffort,
  thinkingEnabled = true,
  onToggleThinking,
  onOpenCoworkModal,
  placeholder,
  autoFocus = false,
  isDocked = false,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isMicActive, setIsMicActive] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Model name formatting for button label
  const getModelLabel = () => {
    switch (currentModel) {
      case 'fable-5-1':
        return 'Fable 5.1';
      case 'opus-5-5':
        return 'Opus 5.5';
      case 'haiku-4-5':
        return 'Haiku 4.5';
      case 'sonnet-5':
      default:
        return 'Sonnet 5';
    }
  };

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, isDocked ? 160 : 220)}px`;
    }
  }, [input, isDocked]);

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isStreaming) return;
    onSendMessage(input, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = event => {
        const content = (event.target?.result as string) || '';
        const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
        const lineCount = content ? content.split('\n').length : 14;

        const newAttachment: Attachment = {
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          language: ext,
          content,
          size: file.size,
          lineCount,
          type: 'file',
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const showUpcomingToast = (featureName: string) => {
    setToastMessage(`This feature is upcoming: ${featureName}`);
  };

  const hasContent = input.trim().length > 0 || attachments.length > 0;

  // ==========================================
  // DOCKED CONVERSATION MODE (Screenshots 7 & 8)
  // ==========================================
  if (isDocked) {
    return (
      <div className="w-full relative">
        {/* Toast Notification */}
        <ClaudeToast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          className="hidden"
          accept=".js,.ts,.jsx,.tsx,.html,.css,.json,.py,.md,.txt,.sql,.sh,.c,.cpp,.png,.jpg,.jpeg,.svg,.pdf"
        />

        {/* Uploaded File Cards if any */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map(att => (
              <FileCard
                key={att.id}
                attachment={att}
                onRemove={() => removeAttachment(att.id)}
              />
            ))}
          </div>
        )}

        {/* Single-row Input Pill Bar matching Screenshots 7 & 8 */}
        <div className="w-full rounded-2xl bg-[#1E1E1D] border border-[#343432] focus-within:border-[#4A4A47] transition shadow-lg px-3.5 py-2.5 flex items-center gap-2.5">
          {/* + Button */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setPlusMenuOpen(!plusMenuOpen)}
              className="w-7 h-7 rounded-lg text-[#9E9E9C] hover:text-white flex items-center justify-center transition hover:bg-[#282827] cursor-pointer"
              title="Add files or options"
            >
              <Plus className="w-4 h-4 stroke-[2]" />
            </button>

            <PlusActionMenu
              isOpen={plusMenuOpen}
              onClose={() => setPlusMenuOpen(false)}
              onAddFiles={() => fileInputRef.current?.click()}
              webSearchEnabled={webSearchEnabled}
              onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
              memoryEnabled={memoryEnabled}
              onToggleMemory={() => setMemoryEnabled(!memoryEnabled)}
              onShowUpcoming={showUpcomingToast}
            />
          </div>

          {/* Text Area */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || 'Write a message...'}
              rows={1}
              className="w-full bg-transparent text-[#EDEDEB] placeholder-[#787875] text-sm focus:outline-none resize-none leading-relaxed max-h-36 py-1 block"
            />
          </div>

          {/* Right Controls: Mic, Waveform, Send / Stop */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!hasContent && !isStreaming && (
              <>
                <button
                  type="button"
                  onClick={() => setIsMicActive(!isMicActive)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    isMicActive ? 'text-rose-400 bg-rose-500/20' : 'text-[#8E8E8B] hover:text-white hover:bg-[#2A2A29]'
                  }`}
                  title="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsVoiceActive(!isVoiceActive)}
                  className={`flex items-center gap-0.5 p-1.5 rounded-lg transition cursor-pointer ${
                    isVoiceActive ? 'text-amber-400 bg-amber-500/20' : 'text-[#8E8E8B] hover:text-white hover:bg-[#2A2A29]'
                  }`}
                  title="Audio output mode"
                >
                  <AudioLines className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              </>
            )}

            {isStreaming && (
              <button
                type="button"
                onClick={onStop}
                className="w-7 h-7 rounded-lg bg-[#DE7959] text-white flex items-center justify-center hover:bg-[#C9684A] transition cursor-pointer"
                title="Stop response"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            )}

            {hasContent && !isStreaming && (
              <button
                type="button"
                onClick={handleSend}
                className="w-7 h-7 rounded-lg bg-[#EDEDEB] text-[#141413] flex items-center justify-center hover:bg-white transition cursor-pointer"
                title="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Line Under Input Box matching Screenshot 7 & 8 */}
        <div className="flex items-center justify-between px-2 pt-2 select-none">
          {/* Left Text */}
          <div className="text-xs text-[#787875] tracking-tight">
            Claude is AI and can make mistakes. Please double-check responses.
          </div>

          {/* Right Model Selection Trigger with slightly increased font size */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="flex items-center gap-1.5 px-1 py-0.5 text-[13px] md:text-sm text-[#C4C4C2] hover:text-white transition cursor-pointer"
            >
              <span className="font-normal">{getModelLabel()}</span>
              <span className="text-[#8E8E8B]">{effort}</span>
            </button>

            {/* Model dropdown opens UPWARD */}
            <ModelSelectorDropdown
              currentModel={currentModel}
              onSelectModel={onSelectModel}
              effort={effort}
              onSelectEffort={onSelectEffort}
              thinkingEnabled={thinkingEnabled}
              onToggleThinking={onToggleThinking}
              isOpen={modelDropdownOpen}
              onClose={() => setModelDropdownOpen(false)}
              onShowToast={showUpcomingToast}
              dropDirection="up"
            />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // HERO VIEW MODE (Welcome / Empty State)
  // ==========================================
  return (
    <div className="w-full relative">
      {/* Toast Notification */}
      <ClaudeToast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />

      <div className="w-full rounded-2xl bg-[#1E1E1D] border border-[#343432] shadow-2xl focus-within:border-[#4A4A47] transition flex flex-col">
        {/* Uploaded File Cards */}
        {attachments.length > 0 && (
          <div className="p-3 pb-0 flex flex-wrap gap-2.5">
            {attachments.map(att => (
              <FileCard
                key={att.id}
                attachment={att}
                onRemove={() => removeAttachment(att.id)}
              />
            ))}
          </div>
        )}

        {/* Text Area */}
        <div className="px-4 pt-3.5 pb-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'How can I help you today?'}
            rows={2}
            className="w-full bg-transparent text-[#EDEDEB] placeholder-[#787875] text-base focus:outline-none resize-none leading-relaxed max-h-56 py-1 block"
          />
        </div>

        {/* Bottom Toolbar Row */}
        <div className="px-3 pb-3 pt-1 flex items-center justify-between">
          {/* Left Controls: Plus Button with Menu & [ Chat | Cowork ] Toggle */}
          <div className="flex items-center gap-2 relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
              accept=".js,.ts,.jsx,.tsx,.html,.css,.json,.py,.md,.txt,.sql,.sh,.c,.cpp,.png,.jpg,.jpeg,.svg,.pdf"
            />

            {/* + Button Container */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                className="w-7 h-7 rounded-lg text-[#9E9E9C] hover:text-white flex items-center justify-center transition hover:bg-[#282827] cursor-pointer"
                title="Add files or options"
              >
                <Plus className="w-4 h-4 stroke-[2]" />
              </button>

              <PlusActionMenu
                isOpen={plusMenuOpen}
                onClose={() => setPlusMenuOpen(false)}
                onAddFiles={() => fileInputRef.current?.click()}
                webSearchEnabled={webSearchEnabled}
                onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
                memoryEnabled={memoryEnabled}
                onToggleMemory={() => setMemoryEnabled(!memoryEnabled)}
                onShowUpcoming={showUpcomingToast}
              />
            </div>

            {/* [ Chat | Cowork ] Pill */}
            <div className="flex items-center bg-[#282827] rounded-xl p-0.5 border border-[#333332]">
              <button
                type="button"
                className="bg-[#383837] text-white px-3 py-1 rounded-lg text-xs font-medium transition shadow-xs"
              >
                Chat
              </button>
              <button
                type="button"
                onClick={onOpenCoworkModal}
                className="text-[#9E9E9C] hover:text-white px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer"
                title="Cowork (Upcoming)"
              >
                Cowork
              </button>
            </div>
          </div>

          {/* Right Controls: Model & Effort Dropdown, Mic, Voice Waves, Send */}
          <div className="flex items-center gap-1.5 relative">
            {/* Model & Effort Selector Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-[#C4C4C2] hover:text-white hover:bg-[#2A2A29] transition cursor-pointer"
              >
                <span className="font-normal">{getModelLabel()}</span>
                <span className="text-[#8E8E8B]">{effort}</span>
              </button>

              <ModelSelectorDropdown
                currentModel={currentModel}
                onSelectModel={onSelectModel}
                effort={effort}
                onSelectEffort={onSelectEffort}
                thinkingEnabled={thinkingEnabled}
                onToggleThinking={onToggleThinking}
                isOpen={modelDropdownOpen}
                onClose={() => setModelDropdownOpen(false)}
                onShowToast={showUpcomingToast}
                dropDirection="down"
              />
            </div>

            {!hasContent && !isStreaming && (
              <>
                <button
                  type="button"
                  onClick={() => setIsMicActive(!isMicActive)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    isMicActive ? 'text-rose-400 bg-rose-500/20' : 'text-[#9E9E9C] hover:text-white hover:bg-[#2A2A29]'
                  }`}
                  title="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsVoiceActive(!isVoiceActive)}
                  className={`flex items-center gap-0.5 p-1.5 rounded-lg transition cursor-pointer ${
                    isVoiceActive ? 'text-amber-400 bg-amber-500/20' : 'text-[#9E9E9C] hover:text-white hover:bg-[#2A2A29]'
                  }`}
                  title="Audio output mode"
                >
                  <AudioLines className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              </>
            )}

            {isStreaming && (
              <button
                type="button"
                onClick={onStop}
                className="w-7 h-7 rounded-lg bg-[#DE7959] text-white flex items-center justify-center hover:bg-[#C9684A] transition cursor-pointer"
                title="Stop response"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            )}

            {hasContent && !isStreaming && (
              <button
                type="button"
                onClick={handleSend}
                className="w-7 h-7 rounded-lg bg-[#EDEDEB] text-[#141413] flex items-center justify-center hover:bg-white transition cursor-pointer"
                title="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
