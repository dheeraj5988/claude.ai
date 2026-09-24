import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatSession, Message, Artifact, ModelId, Attachment, EffortLevel } from '../types';
import { parseStreamContent } from '../utils/parser';

const STORAGE_KEY_SESSIONS = 'dheeraj_claude_sessions_v1';
const STORAGE_KEY_ACTIVE = 'dheeraj_claude_active_session_id_v1';

const DEFAULT_SEED_SESSIONS: ChatSession[] = [
  {
    id: 'sess-lws',
    title: 'LWS-Order',
    isPinned: true,
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
    messages: [],
    model: 'sonnet-5',
    effort: 'Medium',
    thinkingEnabled: true,
  },
  {
    id: 'sess-ss-web',
    title: 'SS-Website',
    isPinned: true,
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 3600000 * 4,
    messages: [],
    model: 'sonnet-5',
    effort: 'Medium',
    thinkingEnabled: true,
  },
  {
    id: 'sess-shop',
    title: 'Shop',
    isPinned: true,
    createdAt: Date.now() - 3600000 * 6,
    updatedAt: Date.now() - 3600000 * 6,
    messages: [],
    model: 'sonnet-5',
    effort: 'Medium',
    thinkingEnabled: true,
  },
  {
    id: 'sess-workbench',
    title: 'Local AI Workbench security review',
    isPinned: false,
    createdAt: Date.now() - 3600000 * 8,
    updatedAt: Date.now() - 3600000 * 8,
    messages: [],
    model: 'sonnet-5',
    effort: 'Medium',
    thinkingEnabled: true,
  },
  {
    id: 'sess-guide',
    title: 'Step by step guide needed',
    isPinned: false,
    createdAt: Date.now() - 3600000 * 10,
    updatedAt: Date.now() - 3600000 * 10,
    messages: [],
    model: 'sonnet-5',
    effort: 'Medium',
    thinkingEnabled: true,
  },
  {
    id: 'sess-screen',
    title: 'PC screen को हमेशा चालू रखना',
    isPinned: false,
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 12,
    messages: [],
    model: 'sonnet-5',
    effort: 'Medium',
    thinkingEnabled: true,
  },
  {
    id: 'sess-untitled',
    title: 'Untitled',
    isPinned: false,
    createdAt: Date.now() - 3600000 * 14,
    updatedAt: Date.now() - 3600000 * 14,
    messages: [],
    model: 'sonnet-5',
    effort: 'Medium',
    thinkingEnabled: true,
  },
  {
    id: 'sess-product',
    title: 'Asafoetida product label typo correction',
    isPinned: false,
    createdAt: Date.now() - 3600000 * 16,
    updatedAt: Date.now() - 3600000 * 16,
    messages: [],
    model: 'sonnet-5',
    effort: 'Medium',
    thinkingEnabled: true,
  },
];

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load sessions from localStorage', e);
    }
    return DEFAULT_SEED_SESSIONS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (saved) return saved;
    } catch (e) {}
    return 'sess-lws';
  });

  const [currentModel, setCurrentModel] = useState<ModelId>('sonnet-5');
  const [effort, setEffort] = useState<EffortLevel>('Medium');
  const [thinkingEnabled, setThinkingEnabled] = useState<boolean>(true);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [isArtifactPanelOpen, setIsArtifactPanelOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const abortControllerRef = useRef<AbortController | null>(null);
  const thinkingStartTimeRef = useRef<number>(0);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to localStorage', e);
    }
  }, [sessions]);

  // Sync activeSessionId to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeSessionId);
    } catch (e) {}
  }, [activeSessionId]);

  // Ensure active session exists, else initialize one
  useEffect(() => {
    if (sessions.length === 0) {
      const initialSession: ChatSession = {
        id: `chat-${Date.now()}`,
        title: 'New conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        model: 'sonnet-5',
        effort: 'Medium',
        thinkingEnabled: true,
      };
      setSessions([initialSession]);
      setActiveSessionId(initialSession.id);
    } else if (!sessions.some(s => s.id === activeSessionId)) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || null;

  // New Chat
  const createNewChat = useCallback((initialPrompt?: string) => {
    const newSession: ChatSession = {
      id: `chat-${Date.now()}`,
      title: initialPrompt ? initialPrompt.slice(0, 32) + '...' : 'New conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: currentModel,
      effort,
      thinkingEnabled,
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setActiveArtifact(null);
    setIsArtifactPanelOpen(false);
    return newSession.id;
  }, [currentModel, effort, thinkingEnabled]);

  // Delete Chat
  const deleteChat = useCallback((id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        const fallback: ChatSession = {
          id: `chat-${Date.now()}`,
          title: 'New conversation',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          model: currentModel,
          effort,
          thinkingEnabled,
        };
        setActiveSessionId(fallback.id);
        return [fallback];
      }
      if (id === activeSessionId) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeSessionId, currentModel, effort, thinkingEnabled]);

  // Rename Chat
  const renameChat = useCallback((id: string, newTitle: string) => {
    setSessions(prev =>
      prev.map(s => (s.id === id ? { ...s, title: newTitle.trim() || 'Untitled' } : s))
    );
  }, []);

  // Pin Chat
  const togglePinChat = useCallback((id: string) => {
    setSessions(prev =>
      prev.map(s => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    );
  }, []);

  // Open blank code playground
  const openBlankPlayground = useCallback(() => {
    const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>dheeraj-claude Playground</title>
</head>
<body class="bg-gradient-to-br from-slate-900 to-indigo-950 text-white min-h-screen flex items-center justify-center p-6">
  <div class="text-center max-w-md p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
    <div class="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
      ⚡
    </div>
    <h1 class="text-2xl font-bold mb-2">Welcome to dheeraj-claude!</h1>
    <p class="text-slate-300 text-sm mb-6">Write HTML, CSS, JS or ask dheeraj-claude to generate apps, games, and tools right into this canvas.</p>
    <button onclick="changeBackground()" class="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-semibold rounded-xl transition shadow-lg shadow-amber-500/25">
      Click Me
    </button>
  </div>

  <script>
    function changeBackground() {
      const colors = ['from-amber-900', 'from-emerald-900', 'from-rose-900', 'from-cyan-900', 'from-purple-900'];
      const random = colors[Math.floor(Math.random() * colors.length)];
      console.log('Action triggered! Changing theme accent to ' + random);
      document.body.className = 'bg-gradient-to-br ' + random + ' to-slate-950 text-white min-h-screen flex items-center justify-center p-6 transition-all duration-700';
    }
  </script>
</body>
</html>`;

    const blankArtifact: Artifact = {
      id: `art-playground-${Date.now()}`,
      title: 'Interactive Code Playground',
      filename: 'index.html',
      language: 'html',
      code: sampleHtml,
      type: 'web-app',
      messageId: 'playground',
      version: 1,
    };

    setActiveArtifact(blankArtifact);
    setIsArtifactPanelOpen(true);
  }, []);

  // Stop Generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Update artifact code (when user edits in the canvas editor)
  const updateArtifactCode = useCallback((artifactId: string, newCode: string) => {
    setActiveArtifact(prev => {
      if (prev && prev.id === artifactId) {
        return { ...prev, userEditedCode: newCode, code: newCode };
      }
      return prev;
    });

    setSessions(prev =>
      prev.map(sess => ({
        ...sess,
        messages: sess.messages.map(msg => ({
          ...msg,
          artifacts: msg.artifacts?.map(art =>
            art.id === artifactId ? { ...art, userEditedCode: newCode, code: newCode } : art
          ),
        })),
      }))
    );
  }, []);

  // Send Message with model support
  const sendMessage = useCallback(
    async (content: string, attachments?: Attachment[], overrideModel?: ModelId) => {
      if ((!content.trim() && (!attachments || attachments.length === 0)) || isStreaming) {
        return;
      }

      const activeModelToUse = overrideModel || currentModel;
      const userMsgId = `msg-user-${Date.now()}`;
      const assistantMsgId = `msg-asst-${Date.now() + 1}`;

      const userMessage: Message = {
        id: userMsgId,
        role: 'user',
        content: content.trim(),
        attachments,
        timestamp: Date.now(),
        status: 'completed',
      };

      const assistantPlaceholder: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        thought: '',
        isThinking: thinkingEnabled,
        timestamp: Date.now(),
        status: 'streaming',
        artifacts: [],
        modelUsed: activeModelToUse,
      };

      // Update active session messages
      setSessions(prev =>
        prev.map(sess => {
          if (sess.id !== activeSessionId) return sess;

          const isFirstMessage = sess.messages.length === 0;
          const newTitle = isFirstMessage
            ? content.slice(0, 36) || (attachments?.[0]?.name ? `Code: ${attachments[0].name}` : 'New chat')
            : sess.title;

          return {
            ...sess,
            title: newTitle,
            updatedAt: Date.now(),
            messages: [...sess.messages, userMessage, assistantPlaceholder],
          };
        })
      );

      setIsStreaming(true);
      thinkingStartTimeRef.current = Date.now();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const currentChat = sessions.find(s => s.id === activeSessionId);
        const history = currentChat ? currentChat.messages : [];
        const payloadMessages = [...history, userMessage].map(m => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments,
        }));

        let claudeApiKey: string | undefined;
        let claudeModel: string | undefined;
        let claudeFirstCount: number | undefined;
        try {
          const saved = localStorage.getItem('claude_api_settings_v2');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.apiKey) claudeApiKey = parsed.apiKey;
            if (parsed.model) claudeModel = parsed.model;
            if (parsed.firstMessagesCount) claudeFirstCount = parsed.firstMessagesCount;
          }
        } catch {}

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: payloadMessages,
            model: activeModelToUse,
            effort,
            thinkingEnabled,
            customSystemPrompt: currentChat?.customSystemPrompt,
            claudeApiKey,
            claudeModel,
            claudeFirstCount: claudeFirstCount || 2,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          let errorMsg = '';
          try {
            const errorData = await res.json();
            errorMsg = errorData.error || errorData.message || '';
          } catch (e) {
            const raw = await res.text().catch(() => '');
            if (raw.includes('<!DOCTYPE') || raw.includes('<html')) {
              errorMsg =
                'AI route /api/chat returned HTML instead of API response. Please verify vercel.json and ensure GEMINI_API_KEY is configured in your Vercel Project Settings -> Environment Variables.';
            }
          }
          throw new Error(errorMsg || `Server responded with status ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('Response body stream is not available');

        const decoder = new TextDecoder();
        let rawAccumulated = '';
        let sseBuffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          sseBuffer += chunk;

          const lines = sseBuffer.split('\n\n');
          sseBuffer = lines.pop() || '';

          for (const block of lines) {
            if (!block.trim()) continue;

            let eventType = 'chunk';
            let eventData = '';

            const blockLines = block.split('\n');
            for (const line of blockLines) {
              if (line.startsWith('event: ')) {
                eventType = line.replace('event: ', '').trim();
              } else if (line.startsWith('data: ')) {
                eventData = line.replace('data: ', '').trim();
              }
            }

            if (eventType === 'chunk' && eventData) {
              try {
                const parsed = JSON.parse(eventData);
                rawAccumulated += parsed.text || '';

                const parsedStream = parseStreamContent(rawAccumulated, assistantMsgId);
                const thoughtDuration = Math.max(
                  1,
                  Math.round((Date.now() - thinkingStartTimeRef.current) / 1000)
                );

                setSessions(prev =>
                  prev.map(sess => {
                    if (sess.id !== activeSessionId) return sess;
                    return {
                      ...sess,
                      messages: sess.messages.map(m => {
                        if (m.id !== assistantMsgId) return m;
                        return {
                          ...m,
                          content: parsedStream.cleanContent,
                          rawContent: rawAccumulated,
                          thought: parsedStream.thought,
                          thoughtDurationSeconds: thoughtDuration,
                          isThinking: parsedStream.isThinking,
                          artifacts: parsedStream.artifacts,
                          modelUsed: activeModelToUse,
                        };
                      }),
                    };
                  })
                );

                if (parsedStream.artifacts.length > 0) {
                  const latest = parsedStream.artifacts[parsedStream.artifacts.length - 1];
                  setActiveArtifact(latest);
                  setIsArtifactPanelOpen(true);
                }
              } catch (err) {
                console.warn('Error parsing SSE chunk:', err);
              }
            } else if (eventType === 'error') {
              try {
                const errParsed = JSON.parse(eventData);
                throw new Error(errParsed.message);
              } catch (e: any) {
                throw new Error(e?.message || eventData || 'Streaming error');
              }
            }
          }
        }

        // Finalize message status
        setSessions(prev =>
          prev.map(sess => {
            if (sess.id !== activeSessionId) return sess;
            return {
              ...sess,
              messages: sess.messages.map(m => {
                if (m.id !== assistantMsgId) return m;
                const parsedFinal = parseStreamContent(rawAccumulated, assistantMsgId);
                return {
                  ...m,
                  status: 'completed',
                  isThinking: false,
                  content: parsedFinal.cleanContent,
                  artifacts: parsedFinal.artifacts,
                  modelUsed: activeModelToUse,
                };
              }),
            };
          })
        );
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('User cancelled generation');
        } else {
          console.error('Chat error:', err);
          const friendlyMessage =
            err.message?.includes('high demand') || err.message?.includes('503')
              ? 'Claude models are currently experiencing high demand. Automatic failover was attempted. Please tap retry below.'
              : err.message || 'An error occurred while generating response';

          setSessions(prev =>
            prev.map(sess => {
              if (sess.id !== activeSessionId) return sess;
              return {
                ...sess,
                messages: sess.messages.map(m => {
                  if (m.id !== assistantMsgId) return m;
                  return {
                    ...m,
                    status: 'error',
                    error: friendlyMessage,
                  };
                }),
              };
            })
          );
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [activeSessionId, isStreaming, currentModel, thinkingEnabled, sessions]
  );

  // Retry or regenerate a message with a specific model
  const retryLastMessage = useCallback(
    (targetModel?: ModelId) => {
      if (!activeSession || activeSession.messages.length === 0 || isStreaming) return;
      const msgs = activeSession.messages;
      const lastUserIdx = [...msgs].reverse().findIndex(m => m.role === 'user');
      if (lastUserIdx === -1) return;

      const userMsg = msgs[msgs.length - 1 - lastUserIdx];

      // Remove the last assistant response if it failed or is being regenerated
      setSessions(prev =>
        prev.map(s => {
          if (s.id !== activeSessionId) return s;
          const filtered = s.messages.slice(0, msgs.length - 1 - lastUserIdx);
          return { ...s, messages: filtered };
        })
      );

      // Resend
      sendMessage(userMsg.content, userMsg.attachments, targetModel || currentModel);
    },
    [activeSession, isStreaming, activeSessionId, currentModel, sendMessage]
  );

  return {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    createNewChat,
    deleteChat,
    renameChat,
    togglePinChat,
    openBlankPlayground,
    currentModel,
    setCurrentModel,
    effort,
    setEffort,
    thinkingEnabled,
    setThinkingEnabled,
    isStreaming,
    stopGeneration,
    sendMessage,
    retryLastMessage,
    activeArtifact,
    setActiveArtifact,
    isArtifactPanelOpen,
    setIsArtifactPanelOpen,
    updateArtifactCode,
    theme,
    setTheme,
  };
}
