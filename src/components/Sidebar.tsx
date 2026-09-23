import React, { useState } from 'react';
import {
  Plus,
  Clock,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  PanelLeftClose,
  SlidersHorizontal,
  MessageSquare,
  Code
} from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  onOpenPlayground: () => void;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onTogglePin,
  onOpenPlayground,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [chatsTasksOpen, setChatsTasksOpen] = useState(false);

  const pinnedSessions = sessions.filter(s => s.isPinned);
  const recentSessions = sessions.filter(s => !s.isPinned);

  const startEditing = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const saveEditing = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar container - Exact style from Screenshot */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 flex flex-col border-r border-[#262624] bg-[#161615] text-[#EDEDEB] transition-transform duration-200 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Claude Brand & Icons matching Screenshot 8 */}
        <div className="px-3.5 pt-3.5 pb-2 flex items-center justify-between">
          <span className="font-serif text-[19px] font-normal tracking-tight text-[#EDEDEB] select-none">
            Claude
          </span>
          <div className="flex items-center gap-0.5 bg-[#232322] border border-[#343432] rounded-lg p-0.5 text-[#8E8E8B]">
            <button
              onClick={() => onShowToast?.('Chat history')}
              className="p-1 rounded hover:text-white hover:bg-[#2C2C2B] transition cursor-pointer"
              title="Chats"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                onOpenPlayground();
                if (window.innerWidth < 1024) onClose();
              }}
              className="p-1 rounded hover:text-white hover:bg-[#2C2C2B] transition cursor-pointer"
              title="Artifact Canvas"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Top: + New Button */}
        <div className="px-3 pb-2 flex items-center justify-between">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="flex-1 flex items-center gap-2.5 py-2 px-3 rounded-xl bg-[#282827] hover:bg-[#323230] text-[#EDEDEB] border border-[#383836] font-normal text-sm transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C4C4C2]" />
            <span>New</span>
          </button>

          <button
            onClick={onClose}
            className="lg:hidden ml-2 p-2 rounded-xl text-[#8E8E8B] hover:text-white hover:bg-[#282827]"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* Top Navigation Items matching Screenshot */}
        <div className="px-2 py-1 space-y-0.5 text-sm font-normal text-[#C4C4C2]">
          {/* Projects */}
          <button
            onClick={() => onShowToast?.('Projects is upcoming in this panel.')}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:text-white hover:bg-[#222221] transition cursor-pointer text-left"
          >
            <svg
              className="w-4 h-4 text-[#9E9E9C] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="4" width="16" height="5" rx="2" />
              <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
              <path d="M10 13h4" />
            </svg>
            <span>Projects</span>
          </button>

          {/* Artifacts */}
          <button
            onClick={() => {
              onOpenPlayground();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:text-white hover:bg-[#222221] transition cursor-pointer text-left"
          >
            <svg
              className="w-4 h-4 text-[#9E9E9C] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="9" cy="12" r="5" />
              <circle cx="15" cy="12" r="5" />
            </svg>
            <span>Artifacts</span>
          </button>

          {/* Scheduled */}
          <button
            onClick={() => onShowToast?.('Scheduled tasks is upcoming in this panel.')}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:text-white hover:bg-[#222221] transition cursor-pointer text-left"
          >
            <Clock className="w-4 h-4 text-[#9E9E9C] shrink-0" />
            <span>Scheduled</span>
          </button>

          {/* Customize */}
          <button
            onClick={() => onShowToast?.('Custom instructions & persona is active in settings.')}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:text-white hover:bg-[#222221] transition cursor-pointer text-left"
          >
            <Briefcase className="w-4 h-4 text-[#9E9E9C] shrink-0" />
            <span>Customize</span>
          </button>

          {/* More */}
          <button
            onClick={() => onShowToast?.('More workspace tools are coming soon.')}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:text-white hover:bg-[#222221] transition cursor-pointer text-left"
          >
            <ChevronDown className="w-4 h-4 text-[#9E9E9C] shrink-0" />
            <span>More</span>
          </button>
        </div>

        {/* Scrollable Chats Sections */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-thin scrollbar-thumb-[#2E2E2C]">
          {/* 1. Pinned Section */}
          <div>
            <button
              type="button"
              onClick={() => setPinnedOpen(!pinnedOpen)}
              className="w-full flex items-center gap-1.5 px-2.5 py-1 text-xs font-normal text-[#787875] hover:text-[#C4C4C2] transition text-left cursor-pointer group"
            >
              <span>Pinned</span>
              {pinnedOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#787875] group-hover:text-[#C4C4C2]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#787875] group-hover:text-[#C4C4C2]" />
              )}
            </button>

            {pinnedOpen && (
              <div className="space-y-0.5 mt-1 animate-in fade-in duration-100">
                {pinnedSessions.length === 0 ? (
                  <div className="px-2.5 py-1.5 text-xs text-[#5E5E5B] italic">
                    No pinned chats
                  </div>
                ) : (
                  pinnedSessions.map((sess, idx) => renderSessionItem(sess, true, idx))
                )}
              </div>
            )}
          </div>

          {/* 2. Chats and tasks Section */}
          <div>
            <div className="px-2.5 py-1 flex items-center justify-between text-xs font-normal text-[#787875]">
              <button
                type="button"
                onClick={() => setChatsTasksOpen(!chatsTasksOpen)}
                className="flex items-center gap-1.5 text-xs font-normal text-[#787875] hover:text-[#C4C4C2] transition cursor-pointer group"
              >
                <span>Chats and tasks</span>
                {chatsTasksOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#787875] group-hover:text-[#C4C4C2]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#787875] group-hover:text-[#C4C4C2]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onShowToast?.('Sort and filter tasks')}
                className="p-1 rounded hover:text-white hover:bg-[#242423] transition cursor-pointer"
                title="Filter tasks"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#787875]" />
              </button>
            </div>

            {chatsTasksOpen && (
              <div className="space-y-0.5 mt-1 animate-in fade-in duration-100">
                {recentSessions.length === 0 ? (
                  <div className="px-2.5 py-1.5 text-xs text-[#5E5E5B] italic">
                    No recent chats
                  </div>
                ) : (
                  recentSessions.map((sess, idx) => renderSessionItem(sess, false, idx))
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );

  function renderSessionItem(sess: ChatSession, isPinnedGroup: boolean, index: number) {
    const isActive = sess.id === activeSessionId;
    const isEditing = editingId === sess.id;

    // In the screenshot, top pinned items have solid blue dot, others have hollow ring
    const showSolidBlueDot = isPinnedGroup && index < 2;

    return (
      <div
        key={sess.id}
        onClick={() => {
          onSelectSession(sess.id);
          if (window.innerWidth < 1024) onClose();
        }}
        className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm font-normal cursor-pointer transition select-none ${
          isActive
            ? 'bg-[#252524] text-white font-medium'
            : 'text-[#C4C4C2] hover:bg-[#20201F] hover:text-white'
        }`}
      >
        {/* Dot / Ring Indicator matching Screenshot */}
        {showSolidBlueDot ? (
          <span className="w-2 h-2 rounded-full bg-[#3B82F6] shrink-0" />
        ) : (
          <span
            className={`w-2 h-2 rounded-full border shrink-0 ${
              isActive ? 'border-[#3B82F6]' : 'border-[#787875]'
            }`}
          />
        )}

        {isEditing ? (
          <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') saveEditing(sess.id, e);
                if (e.key === 'Escape') cancelEditing(e as any);
              }}
              autoFocus
              className="flex-1 px-1.5 py-0.5 text-xs bg-[#242423] border border-[#3B82F6] rounded text-[#EDEDEB] focus:outline-none"
            />
            <button
              onClick={e => saveEditing(sess.id, e)}
              className="p-1 text-[#3B82F6] hover:text-blue-400"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={cancelEditing} className="p-1 text-[#787875] hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 truncate">{sess.title}</span>

            {/* Action buttons on hover */}
            <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
              <button
                onClick={e => {
                  e.stopPropagation();
                  onTogglePin(sess.id);
                }}
                className={`p-1 rounded hover:bg-[#2E2E2D] ${
                  sess.isPinned ? 'text-[#3B82F6]' : 'text-[#787875] hover:text-white'
                }`}
                title={sess.isPinned ? 'Unpin chat' : 'Pin chat'}
              >
                <Pin className="w-3 h-3" />
              </button>

              <button
                onClick={e => startEditing(sess.id, sess.title, e)}
                className="p-1 rounded hover:bg-[#2E2E2D] text-[#787875] hover:text-white"
                title="Rename chat"
              >
                <Edit2 className="w-3 h-3" />
              </button>

              <button
                onClick={e => {
                  e.stopPropagation();
                  onDeleteChat(sess.id);
                }}
                className="p-1 rounded hover:bg-[#2E2E2D] text-[#787875] hover:text-rose-400"
                title="Delete chat"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
};
