import React, { useState, useMemo } from 'react';
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
  Search,
  Archive,
  ArchiveRestore,
  PanelLeftClose,
  SlidersHorizontal,
  LogOut,
  Shield,
  Info,
  AlertTriangle,
  FolderKanban
} from 'lucide-react';
import { ChatSession } from '../types';
import { useAuth } from '../context/AuthContext';
import { ClaudeSunburst } from './ClaudeSunburst';
import { formatRelativeTime } from '../utils/formatDate';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive?: (id: string) => void;
  onOpenPlayground: () => void;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
  onOpenAdmin?: () => void;
  onOpenAbout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onTogglePin,
  onToggleArchive,
  onOpenPlayground: _onOpenPlayground,
  isOpen,
  onClose,
  onShowToast,
  onOpenAdmin,
  onOpenAbout,
}) => {
  const { currentUser, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [archivedOpen, setArchivedOpen] = useState(false);

  // Filter and sort sessions by updatedAt descending
  const filteredSessions = useMemo(() => {
    let list = [...sessions].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        s =>
          s.title.toLowerCase().includes(q) ||
          s.messages.some(m => m.content.toLowerCase().includes(q))
      );
    }
    return list;
  }, [sessions, searchQuery]);

  // Grouping into Today, Yesterday, Previous 7 Days, Older, Pinned, Archived
  const { pinned, today, yesterday, prev7Days, older, archived } = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const startOfYesterday = startOfToday - oneDay;
    const startOf7Days = startOfToday - 7 * oneDay;

    const pinnedArr: ChatSession[] = [];
    const archivedArr: ChatSession[] = [];
    const todayArr: ChatSession[] = [];
    const yesterdayArr: ChatSession[] = [];
    const prev7DaysArr: ChatSession[] = [];
    const olderArr: ChatSession[] = [];

    for (const sess of filteredSessions) {
      if (sess.archived) {
        archivedArr.push(sess);
        continue;
      }
      if (sess.isPinned) {
        pinnedArr.push(sess);
        continue;
      }

      const t = sess.updatedAt || sess.createdAt;
      if (t >= startOfToday) {
        todayArr.push(sess);
      } else if (t >= startOfYesterday) {
        yesterdayArr.push(sess);
      } else if (t >= startOf7Days) {
        prev7DaysArr.push(sess);
      } else {
        olderArr.push(sess);
      }
    }

    return {
      pinned: pinnedArr,
      today: todayArr,
      yesterday: yesterdayArr,
      prev7Days: prev7DaysArr,
      older: olderArr,
      archived: archivedArr,
    };
  }, [filteredSessions]);

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

  const handleConfirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteChat(id);
    setDeleteConfirmId(null);
    onShowToast?.('Conversation deleted.');
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-[#1C1C1B] border border-[#3A3A38] p-5 shadow-2xl text-[#EDEDEB] space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold text-white">Delete conversation?</h3>
            </div>
            <p className="text-xs text-[#AEAEA9] leading-relaxed">
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#C4C4C2] hover:bg-[#282827] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={e => handleConfirmDelete(deleteConfirmId, e)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 flex flex-col border-r border-[#262624] bg-[#161615] text-[#EDEDEB] transition-transform duration-200 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Conversation navigation"
      >
        {/* Top: Brand Header */}
        <div className="px-3.5 pt-3.5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ClaudeSunburst size={24} />
            <div className="flex flex-col">
              <span className="font-serif text-[18px] font-medium tracking-tight text-[#EDEDEB] leading-none">
                Claude
              </span>
              <span className="text-[10px] text-[#8E8E8B] tracking-wide mt-0.5">Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenAbout?.()}
              title="About Claude & Model Routing"
              className="p-1.5 rounded-lg text-[#8E8E8B] hover:text-[#EDEDEB] hover:bg-[#282827] transition cursor-pointer"
              aria-label="About Claude"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-[#8E8E8B] hover:text-white hover:bg-[#282827] transition cursor-pointer"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Chat Button & Search Input */}
        <div className="px-3 pb-2 space-y-2">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#282827] hover:bg-[#323230] text-[#EDEDEB] border border-[#383836] font-normal text-sm transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#E07A5F]" />
            <span>New Chat</span>
          </button>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#787875] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[#1E1E1D] border border-[#2D2D2B] text-xs text-[#EDEDEB] placeholder-[#6E6E6B] focus:outline-none focus:border-[#4A4A47] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-[#787875] hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Workspace Quick Links */}
        <div className="px-2 py-1 space-y-0.5 text-xs font-normal text-[#C4C4C2]">
          <button
            onClick={() => onShowToast?.('Projects is upcoming in this panel.')}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:text-white hover:bg-[#222221] transition cursor-pointer text-left"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[#9E9E9C] shrink-0" />
            <span>Projects</span>
          </button>

          <button
            type="button"
            onClick={() => onShowToast?.('Artifacts is upcoming in this panel.')}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:text-white hover:bg-[#222221] transition cursor-pointer text-left"
          >
            <svg
              className="w-3.5 h-3.5 text-[#9E9E9C] shrink-0"
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

          <button
            onClick={() => onShowToast?.('Scheduled tasks is upcoming in this panel.')}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:text-white hover:bg-[#222221] transition cursor-pointer text-left"
          >
            <Clock className="w-3.5 h-3.5 text-[#9E9E9C] shrink-0" />
            <span>Scheduled</span>
          </button>

          <button
            onClick={() => onShowToast?.('Customization is upcoming in this panel.')}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:text-white hover:bg-[#222221] transition cursor-pointer text-left"
          >
            <Briefcase className="w-3.5 h-3.5 text-[#9E9E9C] shrink-0" />
            <span>Customize</span>
          </button>
        </div>

        {/* Scrollable Conversation List by Groups */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-thin scrollbar-thumb-[#2E2E2C]">
          {/* Pinned Group */}
          {pinned.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setPinnedOpen(!pinnedOpen)}
                className="w-full flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#8E8E8B] hover:text-[#C4C4C2] transition text-left cursor-pointer group uppercase tracking-wider"
              >
                <span>Pinned ({pinned.length})</span>
                {pinnedOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
              {pinnedOpen && (
                <div className="space-y-0.5 mt-1">
                  {pinned.map(sess => renderSessionItem(sess))}
                </div>
              )}
            </div>
          )}

          {/* Today Group */}
          {today.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-semibold text-[#787875] uppercase tracking-wider">
                Today
              </div>
              <div className="space-y-0.5 mt-0.5">
                {today.map(sess => renderSessionItem(sess))}
              </div>
            </div>
          )}

          {/* Yesterday Group */}
          {yesterday.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-semibold text-[#787875] uppercase tracking-wider">
                Yesterday
              </div>
              <div className="space-y-0.5 mt-0.5">
                {yesterday.map(sess => renderSessionItem(sess))}
              </div>
            </div>
          )}

          {/* Previous 7 Days Group */}
          {prev7Days.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-semibold text-[#787875] uppercase tracking-wider">
                Previous 7 Days
              </div>
              <div className="space-y-0.5 mt-0.5">
                {prev7Days.map(sess => renderSessionItem(sess))}
              </div>
            </div>
          )}

          {/* Older Group */}
          {older.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-semibold text-[#787875] uppercase tracking-wider">
                Older
              </div>
              <div className="space-y-0.5 mt-0.5">
                {older.map(sess => renderSessionItem(sess))}
              </div>
            </div>
          )}

          {/* Empty search fallback */}
          {filteredSessions.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-[#6E6E6B]">
              No conversations found.
            </div>
          )}

          {/* Archived Section (Collapsible) */}
          {archived.length > 0 && (
            <div className="pt-2 border-t border-[#252523]">
              <button
                type="button"
                onClick={() => setArchivedOpen(!archivedOpen)}
                className="w-full flex items-center justify-between px-2.5 py-1 text-xs text-[#787875] hover:text-[#C4C4C2] transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archived ({archived.length})</span>
                </span>
                {archivedOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
              {archivedOpen && (
                <div className="space-y-0.5 mt-1 opacity-75">
                  {archived.map(sess => renderSessionItem(sess))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom User Bar */}
        {currentUser && (
          <div className="p-2 border-t border-[#252524] relative">
            {userMenuOpen && (
              <div className="absolute bottom-full left-2 right-2 mb-1.5 rounded-2xl bg-[#1C1C1B] border border-[#343432] shadow-2xl p-1.5 z-50 text-left animate-in fade-in duration-100">
                <div className="px-3 py-2 text-xs text-[#8E8E8B] truncate border-b border-[#282827] mb-1">
                  <div className="font-medium text-[#EDEDEB]">{currentUser.name || currentUser.id}</div>
                  <div className="text-[11px] text-[#787875]">{currentUser.email}</div>
                  <div className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] bg-[#2A2A28] text-[#C4C4C2]">
                    Role: {currentUser.role || 'user'}
                  </div>
                </div>

                {/* About & Multi-Provider transparency */}
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenAbout?.();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-normal text-[#EDEDEB] hover:bg-[#282827] transition cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-[#E07A5F]" />
                  <span>About & Routing Info</span>
                </button>

                {/* Admin Portal (if admin or demo) */}
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenAdmin?.();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-normal text-[#EDEDEB] hover:bg-[#282827] transition cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Dashboard (/admin)</span>
                </button>

                {/* Log out */}
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                    onShowToast?.('Logged out successfully');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-normal text-rose-400 hover:bg-[#282827] transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sign out</span>
                </button>
              </div>
            )}

            <div
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-[#222221] transition cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-[#E07A5F] flex items-center justify-center text-white shrink-0 shadow-xs font-bold text-xs">
                  {(currentUser.name || currentUser.id || 'T')[0].toUpperCase()}
                </div>

                <div className="flex items-center gap-1.5 text-sm font-medium text-[#EDEDEB] truncate">
                  <span>{currentUser.name || currentUser.id}</span>
                  <span className="text-xs text-[#787875]">·</span>
                  <span className="text-xs font-normal text-[#9E9E9C]">{currentUser.plan || 'Pro'}</span>
                </div>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-[#787875] shrink-0 transition-transform ${
                  userMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>
        )}
      </aside>
    </>
  );

  function renderSessionItem(sess: ChatSession) {
    const isActive = sess.id === activeSessionId;
    const isEditing = editingId === sess.id;

    if (isEditing) {
      return (
        <form
          key={sess.id}
          onSubmit={e => saveEditing(sess.id, e)}
          className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#242423] border border-[#3E3E3C]"
        >
          <input
            type="text"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-xs text-[#EDEDEB] focus:outline-none"
          />
          <button
            type="button"
            onClick={e => saveEditing(sess.id, e)}
            className="p-1 text-emerald-400 hover:text-emerald-300"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={cancelEditing}
            className="p-1 text-[#8E8E8B] hover:text-[#EDEDEB]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      );
    }

    return (
      <div
        key={sess.id}
        onClick={() => {
          onSelectSession(sess.id);
          if (window.innerWidth < 1024) onClose();
        }}
        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer ${
          isActive
            ? 'bg-[#252524] text-white font-medium shadow-xs'
            : 'text-[#C4C4C2] hover:bg-[#20201F] hover:text-white'
        }`}
      >
        <div className="flex flex-col truncate pr-2 select-none flex-1 text-left">
          <span className="truncate">{sess.title}</span>
          <span className="text-[10px] text-[#6E6E6B] group-hover:text-[#8E8E8B] transition-colors">
            {formatRelativeTime(sess.updatedAt || sess.createdAt)}
          </span>
        </div>

        {/* Action icons shown on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Pin */}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onTogglePin(sess.id);
            }}
            className={`p-1 rounded hover:bg-[#2E2E2D] ${
              sess.isPinned ? 'text-[#E07A5F]' : 'text-[#8E8E8B] hover:text-white'
            }`}
            title={sess.isPinned ? 'Unpin chat' : 'Pin chat'}
            aria-label={sess.isPinned ? 'Unpin chat' : 'Pin chat'}
          >
            <Pin className="w-3 h-3" />
          </button>

          {/* Archive / Unarchive */}
          {onToggleArchive && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onToggleArchive(sess.id);
                onShowToast?.(sess.archived ? 'Chat restored' : 'Chat archived');
              }}
              className="p-1 rounded text-[#8E8E8B] hover:text-white hover:bg-[#2E2E2D]"
              title={sess.archived ? 'Unarchive' : 'Archive'}
              aria-label={sess.archived ? 'Unarchive' : 'Archive'}
            >
              {sess.archived ? <ArchiveRestore className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
            </button>
          )}

          {/* Rename */}
          <button
            type="button"
            onClick={e => startEditing(sess.id, sess.title, e)}
            className="p-1 rounded text-[#8E8E8B] hover:text-white hover:bg-[#2E2E2D]"
            title="Rename"
            aria-label="Rename conversation"
          >
            <Edit2 className="w-3 h-3" />
          </button>

          {/* Delete with confirmation dialog */}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setDeleteConfirmId(sess.id);
            }}
            className="p-1 rounded text-[#8E8E8B] hover:text-rose-400 hover:bg-[#2E2E2D]"
            title="Delete"
            aria-label="Delete conversation"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }
};
