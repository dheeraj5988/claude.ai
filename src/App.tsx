import React, { useState, useEffect } from 'react';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { ChatFeed } from './components/ChatFeed';
import { ClaudeChatBox } from './components/ClaudeChatBox';
import { ClaudeSunburst } from './components/ClaudeSunburst';
import { CoworkModal } from './components/CoworkModal';
import { ArtifactPanel } from './components/ArtifactPanel';
import { CodeSnippetModal } from './components/CodeSnippetModal';
import { SettingsModal } from './components/SettingsModal';
import { Artifact, Attachment } from './types';
import {
  PanelRightOpen,
  PanelRightClose,
  ChevronDown
} from 'lucide-react';

import { ClaudeToast } from './components/ClaudeToast';

export default function App() {
  const {
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
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coworkModalOpen, setCoworkModalOpen] = useState(false);
  const [snippetModalOpen, setSnippetModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [appToastMessage, setAppToastMessage] = useState<string | null>(null);

  // Always enforce dark theme matching the screenshot
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        createNewChat();
      }
      if (e.key === 'Escape') {
        if (coworkModalOpen) setCoworkModalOpen(false);
        if (snippetModalOpen) setSnippetModalOpen(false);
        if (settingsModalOpen) setSettingsModalOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewChat, coworkModalOpen, snippetModalOpen, settingsModalOpen]);

  // Handle opening an artifact in canvas
  const handleOpenArtifact = (partialArtifact: Partial<Artifact>) => {
    if (!partialArtifact.code) {
      for (const msg of activeSession?.messages || []) {
        const found = msg.artifacts?.find(
          a => a.id === partialArtifact.id || a.title === partialArtifact.title
        );
        if (found) {
          setActiveArtifact(found);
          setIsArtifactPanelOpen(true);
          return;
        }
      }
    }

    const fullArtifact: Artifact = {
      id: partialArtifact.id || `art-${Date.now()}`,
      title: partialArtifact.title || 'Code Artifact',
      filename: partialArtifact.filename || 'app.html',
      language: partialArtifact.language || 'html',
      code: partialArtifact.code || '',
      type: partialArtifact.type || 'web-app',
      messageId: partialArtifact.messageId || 'adhoc',
      version: partialArtifact.version || 1,
    };

    setActiveArtifact(fullArtifact);
    setIsArtifactPanelOpen(true);
  };

  const handleOpenDirectInCanvas = (code: string, language: string, filename: string) => {
    const isWebApp = language === 'html' || language === 'svg' || filename.endsWith('.html');
    const artifact: Artifact = {
      id: `art-direct-${Date.now()}`,
      title: filename,
      filename,
      language,
      code,
      type: isWebApp ? (language === 'svg' ? 'svg' : 'web-app') : 'code',
      messageId: 'direct',
      version: 1,
    };
    setActiveArtifact(artifact);
    setIsArtifactPanelOpen(true);
  };

  const hasMessages = (activeSession?.messages.length || 0) > 0;
  const hasAnyArtifacts =
    (activeSession?.messages.some(m => (m.artifacts?.length || 0) > 0) ?? false) ||
    activeArtifact !== null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#141413] text-[#EDEDEB] font-sans antialiased selection:bg-[#DE7959]/30">
      {/* Sidebar for Chat History */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={id => setActiveSessionId(id)}
        onNewChat={() => createNewChat()}
        onDeleteChat={deleteChat}
        onRenameChat={renameChat}
        onTogglePin={togglePinChat}
        onOpenPlayground={openBlankPlayground}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onShowToast={msg => setAppToastMessage(msg)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden bg-[#141413]">
        {/* Floating Canvas Toggle (only shown when an Artifact is active) */}
        {hasAnyArtifacts && (
          <div className="absolute top-3 right-4 z-30">
            <button
              onClick={() => setIsArtifactPanelOpen(!isArtifactPanelOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition border cursor-pointer ${
                isArtifactPanelOpen
                  ? 'bg-[#DE7959] text-white border-[#DE7959]'
                  : 'bg-[#1F1F1E] text-[#C4C4C2] border-[#323230] hover:bg-[#282827]'
              }`}
              title="Toggle Artifact Canvas"
            >
              {isArtifactPanelOpen ? (
                <PanelRightClose className="w-3.5 h-3.5" />
              ) : (
                <PanelRightOpen className="w-3.5 h-3.5" />
              )}
              <span>Canvas</span>
            </button>
          </div>
        )}

        {/* Viewport Content */}
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
            {!hasMessages ? (
              /* SCREENSHOT 1: Center-aligned Hero View */
              <div className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-3xl mx-auto -mt-12">
                {/* Coral Star + Moonlit chat? Header */}
                <div className="flex items-center justify-center gap-3 mb-6 select-none">
                  <ClaudeSunburst size={30} />
                  <h1 className="font-serif text-3xl md:text-4xl text-[#EDEDEB] tracking-tight font-normal">
                    Moonlit chat?
                  </h1>
                </div>

                {/* Center-aligned Claude Chat Box */}
                <ClaudeChatBox
                  onSendMessage={sendMessage}
                  isStreaming={isStreaming}
                  onStop={stopGeneration}
                  currentModel={currentModel}
                  onSelectModel={setCurrentModel}
                  effort={effort}
                  onSelectEffort={setEffort}
                  thinkingEnabled={thinkingEnabled}
                  onToggleThinking={() => setThinkingEnabled(!thinkingEnabled)}
                  onOpenCoworkModal={() => setCoworkModalOpen(true)}
                  autoFocus
                />
              </div>
            ) : (
              /* Ongoing Conversation View matching Screenshots 7 & 8 */
              <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
                {/* Header: Session Title Dropdown matching Screenshots 7 & 8 */}
                <div className="h-10 px-4 md:px-6 flex items-center shrink-0 z-10">
                  <button
                    type="button"
                    onClick={() => {
                      const newTitle = prompt('Rename conversation:', activeSession?.title);
                      if (newTitle && newTitle.trim()) {
                        renameChat(activeSession.id, newTitle.trim());
                      }
                    }}
                    className="flex items-center gap-1.5 text-sm font-normal text-[#C4C4C2] hover:text-white px-2 py-1 rounded-lg hover:bg-[#1E1E1D] transition cursor-pointer select-none"
                    title="Rename conversation"
                  >
                    <span className="truncate max-w-sm">{activeSession?.title || 'Model identification'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8E8E8B]" />
                  </button>
                </div>

                <ChatFeed
                  messages={activeSession?.messages || []}
                  isStreaming={isStreaming}
                  onOpenArtifact={handleOpenArtifact}
                  onRetry={retryLastMessage}
                />

                {/* Docked Chatbox at bottom matching Screenshots 7 & 8 */}
                <div className="px-3 md:px-6 pb-3 pt-1 w-full max-w-3xl mx-auto">
                  <ClaudeChatBox
                    onSendMessage={sendMessage}
                    isStreaming={isStreaming}
                    onStop={stopGeneration}
                    currentModel={currentModel}
                    onSelectModel={setCurrentModel}
                    effort={effort}
                    onSelectEffort={setEffort}
                    thinkingEnabled={thinkingEnabled}
                    onToggleThinking={() => setThinkingEnabled(!thinkingEnabled)}
                    onOpenCoworkModal={() => setCoworkModalOpen(true)}
                    isDocked={true}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Artifacts Canvas Panel */}
          <ArtifactPanel
            artifact={activeArtifact}
            isOpen={isArtifactPanelOpen}
            onClose={() => setIsArtifactPanelOpen(false)}
            onUpdateCode={updateArtifactCode}
            onQuickPrompt={prompt => sendMessage(prompt)}
          />
        </div>
      </div>

      {/* Cowork "Upcoming" Modal */}
      <CoworkModal
        isOpen={coworkModalOpen}
        onClose={() => setCoworkModalOpen(false)}
      />

      {/* Code Snippet Attachment Modal */}
      <CodeSnippetModal
        isOpen={snippetModalOpen}
        onClose={() => setSnippetModalOpen(false)}
        onAddAttachment={(att: Attachment) => {
          sendMessage(`Code snippet: \`${att.name}\` (${att.language})`, [att]);
        }}
        onOpenInCanvas={handleOpenDirectInCanvas}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        customSystemPrompt={activeSession?.customSystemPrompt || ''}
        onSaveSystemPrompt={prompt => {
          if (activeSession) {
            activeSession.customSystemPrompt = prompt;
          }
        }}
        onClearAllChats={() => {
          localStorage.removeItem('dheeraj_claude_sessions_v1');
          localStorage.removeItem('dheeraj_claude_active_session_id_v1');
          window.location.reload();
        }}
      />
      {/* Claude Toast for Sidebar & General Notices */}
      <ClaudeToast
        message={appToastMessage}
        onClose={() => setAppToastMessage(null)}
      />
    </div>
  );
}
