import React, { useState, useEffect } from 'react';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { ChatFeed } from './components/ChatFeed';
import { ClaudeChatBox } from './components/ClaudeChatBox';
import { ClaudeSunburst } from './components/ClaudeSunburst';
import { CoworkModal } from './components/CoworkModal';
import { ChatTitleDropdown } from './components/ChatTitleDropdown';
import { CodeSnippetModal } from './components/CodeSnippetModal';
import { SettingsModal } from './components/SettingsModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { LoginModal } from './components/LoginModal';
import { useAuth } from './context/AuthContext';
import { getRandomGreeting } from './utils/greeting';
import { Artifact, Attachment } from './types';
import { ClaudeToast } from './components/ClaudeToast';

export default function App() {
  const { currentUser } = useAuth();
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
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [appToastMessage, setAppToastMessage] = useState<string | null>(null);

  // Dynamic greeting tailored to user and time of day, changing on each new chat
  const [dynamicGreeting, setDynamicGreeting] = useState(() =>
    getRandomGreeting(currentUser?.name || currentUser?.id || 'Aashish')
  );

  const hasMessages = (activeSession?.messages || []).length > 0;

  useEffect(() => {
    if (!hasMessages) {
      setDynamicGreeting(
        getRandomGreeting(currentUser?.name || currentUser?.id || 'Aashish')
      );
    }
  }, [activeSessionId, currentUser?.name, currentUser?.id, hasMessages]);

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
        onOpenAdmin={() => setAdminModalOpen(true)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden bg-[#141413]">
        {/* Viewport Content */}
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
            {!hasMessages ? (
              /* SCREENSHOT 1: Center-aligned Hero View */
              <div className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-3xl mx-auto -mt-12">
                {/* Coral Star + Dynamic User Greeting matching prompt instructions */}
                <div className="flex items-center justify-center gap-3 mb-6 select-none text-center px-4">
                  <ClaudeSunburst size={32} />
                  <h1 className="font-serif text-3xl md:text-4xl text-[#EDEDEB] tracking-tight font-normal">
                    {dynamicGreeting}
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
                {/* Header: Session Title Dropdown matching Screenshots 1 & 2 */}
                <div className="h-10 px-4 md:px-6 flex items-center shrink-0 z-10">
                  <ChatTitleDropdown title={activeSession?.title || 'hello which model are you'} />
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
      {/* Admin Panel Modal (Protected with password Dheeraj@10) */}
      <AdminPanelModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onShowToast={msg => setAppToastMessage(msg)}
      />

      {/* Login Modal (shown when logged out) */}
      <LoginModal
        isOpen={!currentUser}
        onOpenAdmin={() => setAdminModalOpen(true)}
        onShowToast={msg => setAppToastMessage(msg)}
      />

      {/* Claude Toast for Sidebar & General Notices */}
      <ClaudeToast
        message={appToastMessage}
        onClose={() => setAppToastMessage(null)}
      />
    </div>
  );
}
