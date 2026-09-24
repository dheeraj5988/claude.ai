import React, { useState, useEffect } from 'react';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { ChatFeed } from './components/ChatFeed';
import { ClaudeChatBox } from './components/ClaudeChatBox';
import { CoworkModal } from './components/CoworkModal';
import { ChatTitleDropdown } from './components/ChatTitleDropdown';
import { CodeSnippetModal } from './components/CodeSnippetModal';
import { SettingsModal } from './components/SettingsModal';
import { AdminPage } from './pages/AdminPage';
import { LoginModal } from './components/LoginModal';
import { CenterChatLogo } from './components/CenterChatLogo';
import { useAuth } from './context/AuthContext';
import { getRandomGreeting } from './utils/greeting';
import { AppLogoIcon } from './logos/AppLogoIcon';
import { Artifact, Attachment } from './types';
import { ClaudeToast } from './components/ClaudeToast';

export default function App() {
  const { currentUser, activeLogo } = useAuth();
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

  // Dedicated Route State: 'chat' or 'admin' (complete separate webpage, NOT a popup modal)
  const [currentRoute, setCurrentRoute] = useState<'chat' | 'admin'>(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    if (
      path === '/admin' ||
      path.startsWith('/admin') ||
      hash === '#/admin' ||
      hash === '#admin' ||
      search.includes('admin')
    ) {
      return 'admin';
    }
    return 'chat';
  });

  // Synchronize route with URL bar changes (popstate & hashchange)
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (
        path === '/admin' ||
        path.startsWith('/admin') ||
        hash === '#/admin' ||
        hash === '#admin' ||
        search.includes('admin')
      ) {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('chat');
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  const navigateTo = (route: 'chat' | 'admin') => {
    setCurrentRoute(route);
    if (route === 'admin') {
      window.history.pushState({}, '', '/admin');
    } else {
      window.history.pushState({}, '', '/');
      if (window.location.hash.includes('admin')) {
        window.location.hash = '';
      }
    }
  };

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

  // Synchronize website favicon with center logo (Claude terracotta starburst) & tab title
  useEffect(() => {
    const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><g fill="#D97757"><polygon points="46,38 56,38 65,45 68,54 64,64 54,69 44,67 36,58 37,47 43,40" /><polygon points="43,39 27,8 33,3 38,12 47,37" /><polygon points="50,37 57,5 62,3 64,10 56,37" /><polygon points="58,39 79,16 84,13 86,19 63,42" /><polygon points="64,44 94,39 98,43 93,48 66,49" /><polygon points="67,51 97,59 96,65 91,66 65,58" /><polygon points="65,60 87,79 84,84 79,83 62,65" /><polygon points="60,66 74,90 69,93 64,91 56,69" /><polygon points="53,70 51,97 45,98 43,93 47,69" /><polygon points="45,68 28,90 23,87 25,82 40,65" /><polygon points="39,63 15,75 12,71 14,66 36,58" /><polygon points="36,54 2,49 1,44 6,43 36,47" /><polygon points="37,46 11,28 14,24 19,25 39,41" /><polygon points="40,41 23,17 28,14 31,18 43,39" /></g></svg>`;
    const dataUri = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = dataUri;

    // Also update apple-touch-icon
    let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = dataUri;
  }, []);

  // Update website title shown in Chrome tab
  useEffect(() => {
    if (currentRoute === 'admin') {
      document.title = 'Admin Panel · Claude';
    } else if (activeSession && activeSession.title && activeSession.title !== 'New chat') {
      document.title = `${activeSession.title} · Claude`;
    } else {
      document.title = 'Claude';
    }
  }, [currentRoute, activeSession?.title]);

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

  // =========================================================================
  // ROUTE 1: DEDICATED ADMIN WEBPAGE (/admin)
  // Complete standalone webpage, NOT a popup modal
  // =========================================================================
  if (currentRoute === 'admin') {
    return (
      <>
        <AdminPage
          onNavigateHome={() => navigateTo('chat')}
          onShowToast={msg => setAppToastMessage(msg)}
        />
        <ClaudeToast
          message={appToastMessage}
          onClose={() => setAppToastMessage(null)}
        />
      </>
    );
  }

  // =========================================================================
  // ROUTE 2: CLAUDE USER CHAT APPLICATION (/)
  // =========================================================================
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
        onOpenAdmin={() => navigateTo('admin')}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden bg-[#141413]">
        {/* Viewport Content */}
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
            {!hasMessages ? (
              /* Hero View */
              <div className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-3xl mx-auto -mt-12">
                {/* Designed Center Chat Logo + Dynamic User Greeting */}
                <div className="flex items-center justify-center gap-3.5 mb-6 select-none text-center px-4">
                  <CenterChatLogo size={36} />
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
              /* Ongoing Conversation View */
              <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
                {/* Header: Session Title Dropdown */}
                <div className="h-10 px-4 md:px-6 flex items-center shrink-0 z-10">
                  <ChatTitleDropdown title={activeSession?.title || 'hello which model are you'} />
                </div>

                <ChatFeed
                  messages={activeSession?.messages || []}
                  isStreaming={isStreaming}
                  onOpenArtifact={handleOpenArtifact}
                  onRetry={retryLastMessage}
                />

                {/* Docked Chatbox at bottom */}
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

      {/* Login Modal (shown only when logged out in chat view) */}
      <LoginModal
        isOpen={!currentUser}
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
