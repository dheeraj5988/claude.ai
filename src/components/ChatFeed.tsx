import React, { useEffect, useRef, useState } from 'react';
import { Message, Artifact, ModelId } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ThinkingBox } from './ThinkingBox';
import { ClaudeSunburst } from './ClaudeSunburst';
import {
  FileCode,
  ExternalLink,
  Code2,
  AlertCircle,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  Volume2
} from 'lucide-react';

interface ChatFeedProps {
  messages: Message[];
  isStreaming: boolean;
  onOpenArtifact: (artifact: Partial<Artifact>) => void;
  onRetry: (modelId?: ModelId) => void;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({
  messages,
  isStreaming,
  onOpenArtifact,
  onRetry,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 max-w-3xl mx-auto w-full scrollbar-thin scrollbar-thumb-[#252524]">
      {messages.map((message) => {
        const isUser = message.role === 'user';

        if (isUser) {
          return (
            <div key={message.id} className="flex justify-end">
              {/* Attachments preview if user sent files/code */}
              <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end">
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2 justify-end">
                    {message.attachments.map(att => (
                      <div
                        key={att.id}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#242423] text-[#E6E6E3] border border-[#353533] text-xs font-mono"
                      >
                        <FileCode className="w-3.5 h-3.5 text-amber-500" />
                        <span>{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* User Message Bubble matching Screenshot 1 & 7 */}
                <div className="px-4 py-2.5 rounded-2xl bg-[#242423] text-[#EDEDEB] text-sm leading-relaxed shadow-xs whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            </div>
          );
        }

        /* Assistant Message matching Screenshot 1, 7 & 8 */
        return (
          <div key={message.id} className="group flex flex-col items-start w-full">
            {/* Thinking Block if any */}
            {(message.thought || message.isThinking) && (
              <div className="w-full mb-3">
                <ThinkingBox
                  thought={message.thought || ''}
                  isThinking={message.isThinking}
                  durationSeconds={message.thoughtDurationSeconds}
                />
              </div>
            )}

            {/* Assistant Content text */}
            <div className="w-full text-[#EDEDEB] text-[15px] leading-relaxed">
              <MarkdownRenderer
                content={message.content}
                onOpenArtifact={onOpenArtifact}
              />
            </div>

            {/* Artifact Cards if any */}
            {message.artifacts && message.artifacts.length > 0 && (
              <div className="mt-3 space-y-2 w-full">
                {message.artifacts.map(art => (
                  <div
                    key={art.id}
                    onClick={() => onOpenArtifact(art)}
                    className="p-3.5 rounded-2xl bg-[#1F1F1E] hover:bg-[#282827] border border-[#363634] flex items-center justify-between cursor-pointer transition group shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-xs text-[#E6E6E3] flex items-center gap-2">
                          <span>{art.title || art.filename}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A2A29] text-[#A0A09D] uppercase font-mono">
                            {art.language}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8E8E8B]">
                          Click to open and interact in Artifact Canvas
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[#DE7959] text-xs font-medium group-hover:translate-x-1 transition-transform">
                      <span>Canvas</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Streaming pulse cursor */}
            {message.status === 'streaming' && !message.isThinking && (
              <span className="inline-block w-2 h-4 bg-[#DE7959] ml-1 animate-pulse align-middle" />
            )}

            {/* Error display */}
            {message.status === 'error' && (
              <div className="mt-3 p-3.5 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs space-y-2 w-full">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{message.error || 'Temporary upstream spike. You can retry immediately:'}</span>
                </div>
                <button
                  onClick={() => onRetry()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2E2E2D] hover:bg-[#383837] text-white text-xs font-medium transition border border-[#3A3A38] cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* 5 Response Action Buttons with Tooltips (Shown on hover) */}
            {message.status !== 'streaming' && message.content && (
              <AssistantMessageActions
                content={message.content}
                onRetry={() => onRetry()}
              />
            )}

            {/* Terracotta Claude Sunburst Asterisk under message matching Screenshot 7 & 8 */}
            <div className="mt-3 select-none">
              <ClaudeSunburst size={22} />
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

/* Assistant Action Icons Component matching Screenshots 1 through 6 */
function AssistantMessageActions({
  content,
  onRetry,
}: {
  content: string;
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
    <div className="flex items-center gap-1 mt-2.5 text-[#8E8E8B] opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none">
      {/* 1. Copy Button (Screenshot 2) */}
      <div className="relative group/btn flex items-center justify-center">
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-lg hover:bg-[#242423] hover:text-[#EDEDEB] transition cursor-pointer"
        >
          {/* Overlapping rectangle copy icon matching Screenshot 2 */}
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
        {/* Tooltip: Copy */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/btn:flex items-center px-2 py-1 rounded-md bg-[#1E1E1D] border border-[#353533] text-xs text-[#EDEDEB] whitespace-nowrap shadow-md pointer-events-none z-30 animate-in fade-in duration-100">
          {copied ? 'Copied!' : 'Copy'}
        </div>
      </div>

      {/* 2. Read aloud Button (Screenshot 3) */}
      <div className="relative group/btn flex items-center justify-center">
        <button
          type="button"
          onClick={handleReadAloud}
          className={`p-1.5 rounded-lg hover:bg-[#242423] hover:text-[#EDEDEB] transition cursor-pointer ${
            isSpeaking ? 'text-[#3B82F6]' : ''
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
        {/* Tooltip: Read aloud */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/btn:flex items-center px-2 py-1 rounded-md bg-[#1E1E1D] border border-[#353533] text-xs text-[#EDEDEB] whitespace-nowrap shadow-md pointer-events-none z-30 animate-in fade-in duration-100">
          {isSpeaking ? 'Stop reading' : 'Read aloud'}
        </div>
      </div>

      {/* 3. Good response Button (Screenshot 4) */}
      <div className="relative group/btn flex items-center justify-center">
        <button
          type="button"
          onClick={() => setFeedback(feedback === 'good' ? null : 'good')}
          className={`p-1.5 rounded-lg hover:bg-[#242423] hover:text-[#EDEDEB] transition cursor-pointer ${
            feedback === 'good' ? 'text-[#3B82F6]' : ''
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>
        {/* Tooltip: Good response */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/btn:flex items-center px-2 py-1 rounded-md bg-[#1E1E1D] border border-[#353533] text-xs text-[#EDEDEB] whitespace-nowrap shadow-md pointer-events-none z-30 animate-in fade-in duration-100">
          Good response
        </div>
      </div>

      {/* 4. Bad response Button (Screenshot 5) */}
      <div className="relative group/btn flex items-center justify-center">
        <button
          type="button"
          onClick={() => setFeedback(feedback === 'bad' ? null : 'bad')}
          className={`p-1.5 rounded-lg hover:bg-[#242423] hover:text-[#EDEDEB] transition cursor-pointer ${
            feedback === 'bad' ? 'text-rose-400' : ''
          }`}
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
        {/* Tooltip: Bad response */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/btn:flex items-center px-2 py-1 rounded-md bg-[#1E1E1D] border border-[#353533] text-xs text-[#EDEDEB] whitespace-nowrap shadow-md pointer-events-none z-30 animate-in fade-in duration-100">
          Bad response
        </div>
      </div>

      {/* 5. Retry Button (Screenshot 6) */}
      <div className="relative group/btn flex items-center justify-center">
        <button
          type="button"
          onClick={onRetry}
          className="p-1.5 rounded-lg hover:bg-[#242423] hover:text-[#EDEDEB] transition cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        {/* Tooltip: Retry */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/btn:flex items-center px-2 py-1 rounded-md bg-[#1E1E1D] border border-[#353533] text-xs text-[#EDEDEB] whitespace-nowrap shadow-md pointer-events-none z-30 animate-in fade-in duration-100">
          Retry
        </div>
      </div>
    </div>
  );
}
