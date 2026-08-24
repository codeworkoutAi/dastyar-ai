import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Download, 
  Database,
  ChevronRight,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  Code2,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { Conversation } from '../types';
import { formatPersianRelativeTime, toPersianDigits } from '../lib/persianUtils';
import { getStorageUsage } from '../lib/storage';
import { Tooltip } from './Tooltip';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onOpenImageStudio: () => void;
  onOpenCodingAssistant: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  onExportSingle: (conv: Conversation) => void;
  onClearAll: () => void;
  usePersianDigits: boolean;
}

interface GroupedConversations {
  id: 'today' | 'yesterday' | 'last7Days' | 'older';
  label: string;
  items: Conversation[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onOpenImageStudio,
  onOpenCodingAssistant,
  onDeleteConversation,
  onRenameConversation,
  onTogglePin,
  onExportSingle,
  onClearAll,
  usePersianDigits,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Filter conversations based on search query
  const filtered = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesTitle = c.title.toLowerCase().includes(q);
    const matchesMessage = c.messages.some((m) => m.content.toLowerCase().includes(q));
    return matchesTitle || matchesMessage;
  });

  const pinnedConversations = filtered.filter((c) => c.isPinned);
  const regularConversations = filtered.filter((c) => !c.isPinned);

  // Group conversations by date (Today, Yesterday, Previous 7 Days, Older)
  const groupConversationsByDate = (convList: Conversation[]): GroupedConversations[] => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOf7Days = startOfToday - 6 * 24 * 60 * 1000;

    const todayItems: Conversation[] = [];
    const yesterdayItems: Conversation[] = [];
    const last7DaysItems: Conversation[] = [];
    const olderItems: Conversation[] = [];

    // Sort by latest activity timestamp
    const sorted = [...convList].sort(
      (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
    );

    for (const conv of sorted) {
      const timestamp = conv.updatedAt || conv.createdAt;
      if (timestamp >= startOfToday) {
        todayItems.push(conv);
      } else if (timestamp >= startOfYesterday) {
        yesterdayItems.push(conv);
      } else if (timestamp >= startOf7Days) {
        last7DaysItems.push(conv);
      } else {
        olderItems.push(conv);
      }
    }

    const groups: GroupedConversations[] = [
      { id: 'today', label: 'امروز', items: todayItems },
      { id: 'yesterday', label: 'دیروز', items: yesterdayItems },
      { id: 'last7Days', label: usePersianDigits ? '۷ روز گذشته' : '7 روز گذشته', items: last7DaysItems },
      { id: 'older', label: 'قدیمی‌تر', items: olderItems },
    ];

    return groups.filter((g) => g.items.length > 0);
  };

  const dateGroups = groupConversationsByDate(regularConversations);

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const storageStats = getStorageUsage();

  const handleStartRename = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const renderConversationItem = (conv: Conversation) => {
    const isActive = conv.id === activeId;
    const isEditing = editingId === conv.id;
    const isDeleting = confirmDeleteId === conv.id;
    const msgCount = conv.messages.length;
    const formattedMsgCount = usePersianDigits ? toPersianDigits(msgCount) : msgCount;

    return (
      <div
        key={conv.id}
        id={`conv-item-${conv.id}`}
        onClick={() => {
          if (!isEditing && !isDeleting) {
            onSelectConversation(conv.id);
            if (window.innerWidth < 768) {
              onClose();
            }
          }
        }}
        className={`group relative flex flex-col p-2.5 rounded-2xl cursor-pointer transition-all duration-150 border ${
          isActive
            ? 'bg-zinc-800/80 border-r-2 border-blue-500 text-zinc-100 shadow-xs'
            : 'hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 border-transparent'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename(conv.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                autoFocus
                className="w-full text-xs sm:text-sm px-3 py-1.5 rounded-xl bg-zinc-800 border border-blue-500 text-zinc-100 focus:outline-hidden"
              />
              <Tooltip content="ذخیره">
                <button
                  onClick={() => handleSaveRename(conv.id)}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-xl cursor-pointer"
                  aria-label="Save title"
                >
                  <Check className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="انصراف">
                <button
                  onClick={() => setEditingId(null)}
                  className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 p-1.5 rounded-xl cursor-pointer"
                  aria-label="Cancel rename"
                >
                  <X className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          ) : isDeleting ? (
            <div className="flex items-center justify-between w-full bg-red-950/80 border border-red-500/50 rounded-xl p-2 text-xs text-red-200" onClick={(e) => e.stopPropagation()}>
              <span>حذف این گفتگو؟</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    onDeleteConversation(conv.id);
                    setConfirmDeleteId(null);
                  }}
                  className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] cursor-pointer"
                >
                  بله
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] cursor-pointer"
                >
                  خیر
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                <span className={`text-xs sm:text-[13px] truncate ${isActive ? 'font-bold text-zinc-100' : 'text-zinc-300'}`}>
                  {conv.title}
                </span>
              </div>

              {/* Action buttons (Pin, Rename, Export, Delete) */}
              <div className="flex items-center gap-0.5 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                <Tooltip content={conv.isPinned ? 'برداشتن سنجاق' : 'سنجاق کردن'}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(conv.id);
                    }}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      conv.isPinned 
                        ? 'text-amber-400 bg-amber-400/15 opacity-100' 
                        : 'opacity-60 hover:opacity-100 hover:bg-white/10 text-zinc-400 hover:text-zinc-200'
                    }`}
                    aria-label="Pin conversation"
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>

                <Tooltip content="ویرایش عنوان">
                  <button
                    onClick={(e) => handleStartRename(e, conv)}
                    className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
                    aria-label="Rename conversation"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>

                <Tooltip content="خروجی این گفتگو">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportSingle(conv);
                    }}
                    className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
                    aria-label="Export conversation"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>

                <Tooltip content="حذف گفتگو">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(conv.id);
                    }}
                    className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              </div>
            </>
          )}
        </div>

        {/* Date, Time, and Message Count Metadata */}
        {!isEditing && !isDeleting && (
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3 opacity-60" />
              <span>{formattedMsgCount} پیام</span>
            </span>
            <span className="shrink-0 font-mono text-[10px]">
              {formatPersianRelativeTime(conv.updatedAt || conv.createdAt, usePersianDigits)}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        id="app-sidebar"
        className={`fixed md:static inset-y-0 right-0 z-50 w-72 md:w-64 bg-zinc-900 border-l border-zinc-800/80 flex flex-col transition-transform duration-200 ease-in-out shrink-0 shadow-2xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:w-0 md:border-l-0 md:overflow-hidden'
        }`}
      >
        {/* Quick Action Tools (Top of Sidebar) */}
        <div className="p-3 border-b border-zinc-800/80 space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-1 px-1">
            <span className="text-[11px] font-bold text-zinc-400">ابزارهای سریع</span>
            <Tooltip content="بستن منو">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg md:hidden text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>

          {/* 1. New Chat Button */}
          <button
            id="sidebar-new-chat-btn"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs sm:text-sm transition-all text-right shadow-xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" strokeWidth={2.4} />
            </div>
            <span className="flex-1">گفتگوی جدید</span>
          </button>

          {/* 2 & 3: Image Studio and Coding Assistant Buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              id="sidebar-image-studio-btn"
              onClick={() => {
                onOpenImageStudio();
                if (window.innerWidth < 768) onClose();
              }}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-zinc-800/50 hover:bg-purple-950/30 border border-white/5 text-zinc-200 hover:text-purple-300 text-xs font-semibold transition-all text-right hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">استودیو تصویر</span>
            </button>

            <button
              id="sidebar-code-assistant-btn"
              onClick={() => {
                onOpenCodingAssistant();
                if (window.innerWidth < 768) onClose();
              }}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-zinc-800/50 hover:bg-emerald-950/30 border border-white/5 text-zinc-200 hover:text-emerald-300 text-xs font-semibold transition-all text-right hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <Code2 className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">دستیار کد</span>
            </button>
          </div>
        </div>

        {/* Search box */}
        <div className="p-3 pb-1 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3 pointer-events-none" />
            <input
              id="sidebar-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در گفتگوها..."
              className="w-full text-xs pr-9 pl-7 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700/60 text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 p-1 text-zinc-400 hover:text-white cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* List of Conversations with Collapsible Date Groups */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Pinned Section */}
          {pinnedConversations.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-2 py-0.5 text-xs font-bold text-amber-400">
                <div className="flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5" />
                  <span>گفتگوهای سنجاق شده</span>
                  <span className="text-[10px] font-mono font-normal text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                    {usePersianDigits ? toPersianDigits(pinnedConversations.length) : pinnedConversations.length}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                {pinnedConversations.map(renderConversationItem)}
              </div>
            </div>
          )}

          {/* Date-Grouped History Sections */}
          {dateGroups.length > 0 ? (
            dateGroups.map((group) => {
              const isCollapsed = !searchQuery && !!collapsedGroups[group.id];
              return (
                <div key={group.id} className="space-y-1">
                  {/* Collapsible Date Header */}
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapse(group.id)}
                    className="w-full flex items-center justify-between px-2 py-1 rounded-lg text-xs font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors cursor-pointer select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
                      <span>{group.label}</span>
                      <span className="text-[10px] font-mono font-normal text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded-full">
                        {usePersianDigits ? toPersianDigits(group.items.length) : group.items.length}
                      </span>
                    </div>
                    <ChevronDown 
                      className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
                        isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`} 
                    />
                  </button>

                  {/* Group Items */}
                  {!isCollapsed && (
                    <div className="space-y-1 pr-0.5">
                      {group.items.map(renderConversationItem)}
                    </div>
                  )}
                </div>
              );
            })
          ) : pinnedConversations.length === 0 ? (
            <div className="text-center py-10 px-4 text-zinc-500">
              {searchQuery ? (
                <p className="text-xs">هیچ گفتگویی با عبارت «{searchQuery}» یافت نشد.</p>
              ) : (
                <div className="space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto text-blue-400 opacity-60" />
                  <p className="text-xs font-semibold text-zinc-400">تاریخچه گفتگوها خالی است</p>
                  <p className="text-[11px] text-zinc-500">یک گفتگوی جدید را آغاز کنید</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Bottom Storage & Clear panel */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2 px-1">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>حافظه محلی:</span>
            </span>
            <span className="font-mono text-xs text-zinc-300">
              {usePersianDigits ? toPersianDigits(storageStats.usedKb) : storageStats.usedKb} KB ({usePersianDigits ? toPersianDigits(storageStats.count) : storageStats.count} گفتگو)
            </span>
          </div>

          {showClearConfirm ? (
            <div className="p-2.5 bg-red-950/50 border border-red-800/80 rounded-2xl space-y-2 text-xs shadow-lg">
              <div className="flex items-center gap-1.5 text-red-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>حذف تمام تاریخچه؟</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClearAll();
                    setShowClearConfirm(false);
                  }}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-colors shadow-md cursor-pointer"
                >
                  بله، حذف کن
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </div>
          ) : (
            conversations.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full text-center text-[11px] text-zinc-400 hover:text-red-400 transition-colors py-1.5 flex items-center justify-center gap-1.5 rounded-xl hover:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاک‌سازی تاریخچه گفتگوها</span>
              </button>
            )
          )}
        </div>
      </aside>
    </>
  );
};
