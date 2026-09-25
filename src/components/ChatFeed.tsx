import React, { useEffect, useRef, useState } from 'react';
import { Message, Artifact, ModelId } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CenterChatLogo } from './CenterChatLogo';
import {
  FileCode,
  AlertCircle,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  Copy,
  Check,
  Edit3,
  X
} from 'lucide-react';

interface ChatFeedProps {
  messages: Message[];
  isStreaming: boolean;
  onOpenArtifact: (artifact: Partial<Artifact>) => void;
  onRetry: (modelId?: ModelId) => void;
  onEditAndResend?: (messageId: string, newContent: string) => void;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({
  messages,
  isStreaming,
  onOpenArtifact,
  onRetry,
  onEditAndResend,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');

  // Auto-scroll handler that respects user upward scrolling
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUpRef.current = distanceToBottom > 100;
  };

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  const startEditing = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditInput(msg.content);
  };

  const handleSaveEdit = (msgId: string) => {
    if (editInput.trim() && onEditAndResend) {
      onEditAndResend(msgId, editInput.trim());
    }
    setEditingMessageId(null);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 max-w-3xl mx-auto w-full scrollbar-thin scrollbar-thumb-[#252524]"
    >
      {messages.map((message, idx) => {
        const isUser = message.role === 'user';
        const isLastUser =
          isUser &&
          idx === [...messages].reduce((acc, m, i) => (m.role === 'user' ? i : acc), -1);

        if (isUser) {
          const isEditingThis = editingMessageId === message.id;

          return (
            <div key={message.id} className="flex justify-end group">
              <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end">
                {/* Attached files */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2 justify-end">
                    {message.attachments.map(att => (
                      <div
                        key={att.id}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#242423] text-[#E6E6E3] border border-[#353533] text-xs font-mono"
                      >
                        <FileCode className="w-3.5 h-3.5 text-[#E07A5F]" />
                        <span>{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Editing Mode */}
                {isEditingThis ? (
                  <div className="w-full p-3 rounded-2xl bg-[#222221] border border-[#3A3A38] space-y-2.5">
                    <textarea
                      value={editInput}
                      onChange={e => setEditInput(e.target.value)}
                      rows={3}
                      className="w-full bg-transparent text-[#EDEDEB] text-sm focus:outline-none resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingMessageId(null)}
                        className="px-2.5 py-1 rounded-lg text-xs text-[#8E8E8B] hover:text-white transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(message.id)}
                        className="px-3 py-1 rounded-lg bg-[#E07A5F] hover:bg-[#D3684B] text-white text-xs font-medium transition"
                      >
                        Save & Submit
                      </button>
                    </div>
                  </div>
                ) : (
                  /* User Message Bubble */
                  <div className="relative group/bubble flex items-center gap-2">
                    {/* Edit button on hover (especially convenient for latest user message) */}
                    {isLastUser && !isStreaming && onEditAndResend && (
                      <button
                        type="button"
                        onClick={() => startEditing(message)}
                        className="opacity-0 group-hover/bubble:opacity-100 p-1.5 rounded-lg text-[#787875] hover:text-white hover:bg-[#252524] transition cursor-pointer"
                        title="Edit and resend"
                        aria-label="Edit message"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="px-4 py-2.5 rounded-2xl bg-[#242423] text-[#EDEDEB] text-sm leading-relaxed shadow-xs whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }

        /* Assistant Message */
        return (
          <div key={message.id} className="group flex flex-col items-start w-full">
            {/* Network latency spinner before first token */}
            {message.status === 'streaming' && !message.content && (
              <div className="flex items-center gap-2.5 py-2 text-stone-400 text-sm">
                <div className="w-3.5 h-3.5 border-2 border-[#E07A5F] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[#8E8E8B] tracking-wide animate-pulse">
                  Connecting to stream...
                </span>
              </div>
            )}

            {/* Assistant Content text */}
            {message.content ? (
              <div className="w-full text-[#EDEDEB] text-[15px] leading-relaxed">
                <MarkdownRenderer
                  content={message.content}
                  onOpenArtifact={onOpenArtifact}
                />
              </div>
            ) : null}

            {/* Streaming pulse cursor */}
            {message.status === 'streaming' && message.content && (
              <span className="inline-block w-2 h-4 bg-[#E07A5F] ml-1 animate-pulse align-middle" />
            )}

            {/* Error display */}
            {message.status === 'error' && (
              <div className="mt-3 p-3.5 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs space-y-2 w-full">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{message.error || 'Temporary upstream issue. You can retry immediately:'}</span>
                </div>
                <button
                  onClick={() => onRetry()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E2E2D] hover:bg-[#383837] text-white text-xs font-medium transition border border-[#3A3A38] cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Action Bar (Copy, Audio, Good/Bad feedback, Regenerate, Provider Badge) */}
            {message.status !== 'streaming' && message.content && (
              <AssistantMessageActions
                content={message.content}
                provider={message.provider}
                onRetry={() => onRetry()}
              />
            )}

            {/* Claude Brand Mark under completed response or thinking pulse */}
            <div className="mt-3.5 select-none">
              <CenterChatLogo
                size={22}
                className={message.status === 'streaming' && !message.content ? 'animate-pulse' : ''}
              />
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

/* Assistant Action Icons Component */
function AssistantMessageActions({
  content,
  provider,
  onRetry,
}: {
  content: string;
  provider?: 'anthropic' | 'gemini' | 'claude';
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReadAloud = () => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  return (
    <div className="flex items-center gap-1.5 mt-2.5 text-[#8E8E8B] opacity-100 transition-opacity duration-150 select-none">
      {/* Copy */}
      <button
        type="button"
        onClick={handleCopy}
        className="p-1.5 rounded-lg hover:bg-[#242423] hover:text-[#EDEDEB] transition cursor-pointer"
        title="Copy response"
        aria-label="Copy response"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Read Aloud */}
      <button
        type="button"
        onClick={handleReadAloud}
        className={`p-1.5 rounded-lg hover:bg-[#242423] hover:text-[#EDEDEB] transition cursor-pointer ${
          isSpeaking ? 'text-[#E07A5F]' : ''
        }`}
        title={isSpeaking ? 'Stop audio' : 'Read aloud'}
        aria-label="Read response aloud"
      >
        <Volume2 className="w-3.5 h-3.5" />
      </button>

      {/* Good response */}
      <button
        type="button"
        onClick={() => setFeedback(feedback === 'good' ? null : 'good')}
        className={`p-1.5 rounded-lg hover:bg-[#242423] transition cursor-pointer ${
          feedback === 'good' ? 'text-emerald-400 bg-[#242423]' : 'hover:text-[#EDEDEB]'
        }`}
        title="Good response"
        aria-label="Mark response as good"
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>

      {/* Bad response */}
      <button
        type="button"
        onClick={() => setFeedback(feedback === 'bad' ? null : 'bad')}
        className={`p-1.5 rounded-lg hover:bg-[#242423] transition cursor-pointer ${
          feedback === 'bad' ? 'text-rose-400 bg-[#242423]' : 'hover:text-[#EDEDEB]'
        }`}
        title="Poor response"
        aria-label="Mark response as poor"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>

      {/* Regenerate */}
      <button
        type="button"
        onClick={onRetry}
        className="p-1.5 rounded-lg hover:bg-[#242423] hover:text-[#EDEDEB] transition cursor-pointer"
        title="Regenerate response"
        aria-label="Regenerate response"
      >
        <RotateCw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
