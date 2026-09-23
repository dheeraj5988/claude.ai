import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Code2,
  X,
  FileCode,
  ChevronDown
} from 'lucide-react';
import { Attachment, ModelId } from '../types';
import { AVAILABLE_MODELS } from './Header';

interface MessageComposerProps {
  onSendMessage: (text: string, attachments?: Attachment[]) => void;
  isStreaming: boolean;
  onStop: () => void;
  currentModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  thinkingEnabled?: boolean;
  onToggleThinking?: () => void;
  onOpenSnippetModal?: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  isStreaming,
  onStop,
  currentModel,
  onSelectModel,
  onOpenSnippetModal,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);

  const selectedModel = AVAILABLE_MODELS.find(m => m.id === currentModel) || AVAILABLE_MODELS[1];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setModelPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [input]);

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
        const content = event.target?.result as string;
        const ext = file.name.split('.').pop()?.toLowerCase() || 'text';
        const newAttachment: Attachment = {
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          language: ext,
          content,
          size: file.size,
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

  return (
    <div className="w-full max-w-3xl mx-auto px-3 md:px-4 pb-4 pt-1">
      <div className="relative rounded-2xl bg-[#1F1F1E] border border-[#323230] shadow-md transition-all">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0">
            {attachments.map(att => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#282827] text-[#E6E6E3] border border-[#3A3A38] text-xs font-mono"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-500" />
                <span className="truncate max-w-[160px]">{att.name}</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="p-0.5 rounded hover:bg-[#383837] text-[#8E8E8B] hover:text-white ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Reply to ${selectedModel.name}...`}
          rows={1}
          className="w-full px-4 pt-3.5 pb-2 bg-transparent text-[#E6E6E3] placeholder-[#767573] text-[15px] resize-none focus:outline-none max-h-60 leading-relaxed font-sans"
        />

        <div className="px-3 pb-2.5 pt-1 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
              accept=".js,.ts,.jsx,.tsx,.html,.css,.json,.py,.md,.txt,.sql,.sh,.c,.cpp"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-[#8E8E8B] hover:text-white hover:bg-[#282827] transition"
              title="Attach code file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {onOpenSnippetModal && (
              <button
                type="button"
                onClick={onOpenSnippetModal}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[#8E8E8B] hover:text-white hover:bg-[#282827] transition"
              >
                <Code2 className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Add Code</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" ref={modelPickerRef}>
              <button
                type="button"
                onClick={() => setModelPickerOpen(!modelPickerOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-[#C4C4C2] bg-[#282827] hover:bg-[#323231] border border-[#3A3A38] transition"
              >
                <span>{selectedModel.name}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {modelPickerOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-64 rounded-2xl bg-[#212120] border border-[#363634] shadow-2xl p-1.5 z-50 animate-in fade-in duration-100">
                  {AVAILABLE_MODELS.map(m => {
                    const isSel = m.id === currentModel;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onSelectModel(m.id);
                          setModelPickerOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                          isSel
                            ? 'bg-[#2A2A29] text-white'
                            : 'text-[#C4C4C2] hover:bg-[#282827]'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-[11px] text-[#8E8E8B]">{m.subtitle}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="w-7 h-7 rounded-xl bg-white text-black flex items-center justify-center hover:opacity-90 active:scale-95 transition"
                title="Stop generation"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() && attachments.length === 0}
                className="w-7 h-7 rounded-xl bg-white disabled:opacity-30 text-black flex items-center justify-center hover:opacity-90 active:scale-95 transition"
                title="Send message"
              >
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
