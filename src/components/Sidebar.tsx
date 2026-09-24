import React, { useState, useRef, useEffect, useDeferredValue } from 'react';
import {
    AddCircleBoldIcon,
    MinimalisticMagnifierLinearIcon,
    PinBoldIcon,
    PinLinearIcon,
    TrashBinMinimalisticLinearIcon,
    PenLinearIcon,
    DownloadMinimalisticLinearIcon,
    StarsMinimalisticBoldIcon,
    CalendarLinearIcon,
    DatabaseLinearIcon,
    CheckCircleOutlineIcon as Check,
    CloseOutlineIcon as X,
    AltArrowDownOutlineIcon as ChevronDown,
    DangerTriangleOutlineIcon as AlertTriangle,
    ChatRoundDotsOutlineIcon as MessageSquare,
    CompassOutlineIcon,
    HelpLinearIcon,
    ShopLinearIcon,
} from '@solar-icons/react';
import { Conversation } from '../types';
import { formatPersianRelativeTime, toPersianDigits } from '../lib/persianUtils';
import { getStorageUsage } from '../lib/storage';
import { calculateSessionStats } from '../utils/pricing';
import { Tooltip } from './Tooltip';
import { useAuthStore } from '../store/authStore';
import { User, LogOut, ShieldCheck, Settings, ChevronUp, LayoutDashboard, Store, BookOpen, Compass, Palette, HelpCircle, MessageSquarePlus, Search, Coins, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { useChatStore } from '../store/chatStore';
import { exportToJson } from '../lib/exportUtils';

interface GroupedConversations {
    id: 'today' | 'yesterday' | 'last7Days' | 'older';
    label: string;
    items: Conversation[];
}

export const Sidebar: React.FC = React.memo(() => {
    const { sidebarOpen, setSidebarOpen, setIsImageStudioOpen, setIsExploreOpen, setIsUiGuideOpen, setIsAdminOpen, setIsSettingsOpen, setIsWalletOpen, setIsExportOpen } = useUIStore();
    const { settings } = useSettingsStore();
    const { conversations, activeId, setActiveId, createChat, deleteConversation, updateConversation, clearAllConversations } = useChatStore();
    const activeConversation = conversations.find((c) => c.id === activeId) || null;

    const { user, isAuthenticated, logout, setAuthModalOpen } = useAuthStore();
    const usePersianDigits = settings.appearance.persianNumerals;

    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter conversations based on deferred search query (React 19 non-blocking concurrent transition)
    const deferredQuery = useDeferredValue(searchQuery);
    const filtered = conversations.filter((c) => {
        if (!deferredQuery.trim()) return true;
        const q = deferredQuery.toLowerCase();
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

    const sessionStats = React.useMemo(() => {
        return calculateSessionStats(conversations || []);
    }, [conversations]);

    const handleStartRename = (e: React.MouseEvent, conv: Conversation) => {
        e.stopPropagation();
        setEditingId(conv.id);
        setEditTitle(conv.title);
    };

    const handleSaveRename = (id: string) => {
        if (editTitle.trim()) {
            updateConversation(id, c => ({ ...c, title: editTitle.trim() }));
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
                        setActiveId(conv.id);
                        if (window.innerWidth < 768) {
                            setSidebarOpen(false);
                        }
                    }
                }}
                className={`group relative flex flex-col p-2.5 rounded-card cursor-pointer transition-all duration-150 border-transparent ${isActive
                    ? 'bg-[var(--gemini-gradient-subtle)] border-[var(--color-accent-primary)]/30 text-[var(--color-text-main)] dark:text-[var(--color-text-main)] shadow-xs'
                    : 'hover:bg-[var(--color-border-subtle)] dark:hover:bg-[var(--color-border-strong)] text-[var(--color-text-muted)] dark:text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] dark:hover:text-[var(--color-text-main)]'
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
                                className="w-full text-xs sm:text-sm px-3 py-1.5 rounded-input bg-[var(--color-input-bg)] border border-[var(--color-border-strong)] text-[var(--color-text-main)] dark:text-[var(--color-text-main)] focus:outline-hidden"
                            />
                            <Tooltip content="ذخیره">
                                <button
                                    onClick={() => handleSaveRename(conv.id)}
                                    className="clay-btn-primary p-1.5 rounded-btn cursor-pointer"
                                    aria-label="Save title"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            </Tooltip>
                            <Tooltip content="انصراف">
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="bg-[var(--color-input-bg)] hover:bg-[var(--color-input-bg)]/80 text-[var(--color-text-main)] p-1.5 rounded-btn cursor-pointer"
                                    aria-label="Cancel rename"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </Tooltip>
                        </div>
                    ) : isDeleting ? (
                        <div className="flex items-center justify-between w-full bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-card p-2 text-xs text-[var(--color-error-text)]" onClick={(e) => e.stopPropagation()}>
                            <span>حذف این گفتگو؟</span>
                            <div className="flex items-center gap-1.5">
<button
                                onClick={() => {
                                    deleteConversation(conv.id);
                                    setConfirmDeleteId(null);
                                }}
                                className="px-2 py-1 rounded-btn bg-[var(--color-error-bg)] hover:bg-[var(--color-error-bg)]/80 text-[var(--color-error-text)] font-bold text-[11px] cursor-pointer"
                            >
                                بله
                            </button>
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 rounded-btn bg-[var(--color-input-bg)] hover:bg-[var(--color-input-bg)]/80 text-[var(--color-text-main)] dark:text-[var(--color-text-main)] text-[11px] cursor-pointer"
                            >
                                خیر
                            </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                                <span className={`text-xs sm:text-[13px] truncate ${isActive ? 'font-bold text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                    {conv.title}
                                </span>
                            </div>

                            {/* Action buttons (Pin, Rename, Export, Delete) */}
                            <div className="flex items-center gap-0.5 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                                <Tooltip content={conv.isPinned ? 'برداشتن سنجاق' : 'سنجاق کردن'}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateConversation(conv.id, c => ({ ...c, isPinned: !c.isPinned }));
                                        }}
                                        className={`p-1.5 rounded-btn transition-all cursor-pointer ${conv.isPinned
                                            ? 'text-amber-400 bg-amber-400/15 opacity-100'
                                            : 'opacity-60 hover:opacity-100 hover:bg-[var(--color-input-bg)] text-[var(--color-text-muted)] dark:text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] dark:hover:text-[var(--color-text-main)]'
                                            }`}
                                        aria-label="Pin conversation"
                                    >
                                        {conv.isPinned ? <PinBoldIcon className="w-3.5 h-3.5" /> : <PinLinearIcon className="w-3.5 h-3.5" />}
                                    </button>
                                </Tooltip>

                                <Tooltip content="ویرایش عنوان">
                                    <button
                                        onClick={(e) => handleStartRename(e, conv)}
                                        className="p-1.5 rounded-btn opacity-60 hover:opacity-100 hover:bg-[var(--color-input-bg)] text-[var(--color-text-muted)] dark:text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] dark:hover:text-[var(--color-text-main)] transition-all cursor-pointer"
                                        aria-label="Rename conversation"
                                    >
                                        <PenLinearIcon className="w-3.5 h-3.5" />
                                    </button>
                                </Tooltip>

                                <Tooltip content="خروجی این گفتگو">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            exportToJson([conv]);
                                        }}
                                        className="p-1.5 rounded-btn opacity-60 hover:opacity-100 hover:bg-[var(--color-input-bg)] text-[var(--color-text-muted)] dark:text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] dark:hover:text-[var(--color-text-main)] transition-all cursor-pointer"
                                        aria-label="Export conversation"
                                    >
                                        <DownloadMinimalisticLinearIcon className="w-3.5 h-3.5" />
                                    </button>
                                </Tooltip>

                                <Tooltip content="حذف گفتگو">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmDeleteId(conv.id);
                                        }}
                                        className="p-1.5 rounded-btn opacity-60 hover:opacity-100 hover:bg-[var(--color-error-bg)]/10 text-[var(--color-text-muted)] dark:text-[var(--color-text-dim)] hover:text-[var(--color-error-text)] dark:hover:text-[var(--color-error-text)] transition-all cursor-pointer"
                                        aria-label="Delete conversation"
                                    >
                                        <TrashBinMinimalisticLinearIcon className="w-3.5 h-3.5" />
                                    </button>
                                </Tooltip>
                            </div>
                        </>
                    )}
                </div>

                {/* Date, Time, and Message Count Metadata */}
                {!isEditing && !isDeleting && (
                    <div className="flex items-center justify-between text-[11px] text-zinc-700 dark:text-zinc-400 mt-1.5">
                        <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 opacity-60" />
                            <span>{formattedMsgCount} پیام</span>
                        </span>
                        <span className="shrink-0 font-medium text-[10px]">
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
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden transition-opacity"
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Container */}
            <aside
                id="sidebar-panel"
                aria-label="Sidebar Panel"
                className={`fixed md:static inset-y-0 right-0 z-40 w-72 sm:w-80 flex flex-col transition-all duration-200 ease-in-out border-l border-subtle clay-sidebar select-none ${sidebarOpen ? 'translate-x-0' : 'translate-x-[110%] opacity-0 md:opacity-100 md:translate-x-0 md:w-0 md:overflow-hidden md:border-none'
                    }`}
            >
                {/* ---------------- 1. بالای بالا: کارت کاربر و منوی پروفایل ---------------- */}
                <div className="p-3 pb-2.5 shrink-0 border-b border-[var(--card-border)]  relative" ref={userMenuRef}>
                    <div className="flex items-center justify-between gap-2">
                        {isAuthenticated ? (
<button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center justify-between p-2 rounded-btn hover:bg-[var(--color-input-bg)] dark:hover:bg-[var(--color-input-bg)]/80 transition-all cursor-pointer flex-1 text-right"
                            >
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                    <img
                                        src={user?.avatar || '/avatars/avatar-1.svg'}
                                        alt="Avatar"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            const letter = user?.name?.charAt(0).toUpperCase() || (user?.phone ? user.phone.slice(-2) : user?.email?.charAt(0).toUpperCase() || 'U');
                                            target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%232563eb"/><text x="50%" y="54%" fill="white" font-size="45" font-weight="bold" font-family="Tahoma, sans-serif" dominant-baseline="middle" text-anchor="middle">${letter}</text></svg>`;
                                        }}
                                        className="w-8 h-8 rounded-badge bg-[var(--color-input-bg)] shadow-sm object-cover shrink-0"
                                    />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate" dir={user?.name ? 'rtl' : 'ltr'}>
                                            {user?.name || user?.phone || user?.email}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                                            {user?.role === 'admin' ? 'مدیر سیستم' : 'کاربر عادی'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {user?.role === 'admin' && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-text)] dark:text-[var(--color-accent-text)] font-bold">
                                            ادمین
                                        </span>
                                    )}
                                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                        ) : (
                            <button
                                onClick={() => setAuthModalOpen(true)}
                                className="flex-1 flex items-center justify-between p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/40 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer group"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full clay-btn-primary text-white flex items-center justify-center">
                                        <User className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                        ورود / ثبت‌نام
                                    </span>
                                </div>
                            </button>
                        )}

                        {/* Mobile Close Button */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 rounded-btn text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] dark:hover:text-[var(--color-text-main)] hover:bg-[var(--color-input-bg)] dark:hover:bg-[var(--color-input-bg)]/80 transition-colors md:hidden cursor-pointer shrink-0"
                            aria-label="Close sidebar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* User Floating Dropdown Popover */}
                    {userMenuOpen && isAuthenticated && (
<div className="absolute top-full mt-1.5 right-3 left-3 p-2 clay-card !bg-[var(--sidebar-bg)] rounded-card shadow-2xl border border-[var(--card-border)] flex flex-col gap-1 z-50 animate-fadeIn">
    <div className="flex items-center gap-2.5 p-2 rounded-input mb-1">
        <img
            src={user?.avatar || '/avatars/avatar-1.svg'}
            alt="Avatar"
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                const letter = user?.name?.charAt(0).toUpperCase() || (user?.phone ? user.phone.slice(-2) : user?.email?.charAt(0).toUpperCase() || 'U');
                target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%232563eb"/><text x="50%" y="54%" fill="white" font-size="45" font-weight="bold" font-family="Tahoma, sans-serif" dominant-baseline="middle" text-anchor="middle">${letter}</text></svg>`;
            }}
            className="w-8 h-8 rounded-badge bg-[var(--color-input-bg)] shadow-sm object-cover shrink-0"
        />
        <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-[var(--color-text-main)] truncate" dir={user?.name ? 'rtl' : 'ltr'}>
                {user?.name || user?.phone || user?.email}
            </span>
            <span className="text-[10px] text-[var(--color-accent-text)] dark:text-[var(--color-accent-text)] font-bold">
                {user?.role === 'admin' ? 'مدیر سیستم' : 'کاربر عادی'}
            </span>
        </div>
    </div>

    {user?.role === 'admin' && (
        <button
            onClick={() => {
                setIsAdminOpen(true);
                setUserMenuOpen(false);
                if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className="flex items-center gap-2 w-full p-2 rounded-btn hover:bg-[var(--color-accent-primary)]/10 dark:hover:bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-text)] dark:text-[var(--color-accent-text)] text-xs font-bold transition-colors text-right cursor-pointer"
        >
            <ShieldCheck size={16} />
            <span>پنل مدیریت سیستم</span>
        </button>
    )}

    <Link
        to="/dashboard"
        onClick={() => {
            setUserMenuOpen(false);
            if (window.innerWidth < 768) setSidebarOpen(false);
        }}
        className="flex items-center gap-2 w-full p-2 rounded-btn hover:bg-[var(--color-input-bg)] dark:hover:bg-[var(--color-input-bg)]/80 text-[var(--color-text-main)] dark:text-[var(--color-text-main)] text-xs font-medium transition-colors text-right cursor-pointer"
    >
        <LayoutDashboard size={16} />
        <span>داشبورد کاربری</span>
    </Link>

                            <button
                                onClick={() => {
                                    setIsSettingsOpen(true);
                                    setUserMenuOpen(false);
                                }}
                                className="flex items-center gap-2 w-full p-2 rounded-btn hover:bg-[var(--color-input-bg)] dark:hover:bg-[var(--color-input-bg)]/80 text-[var(--color-text-main)] dark:text-[var(--color-text-main)] text-xs font-medium transition-colors text-right cursor-pointer"
                            >
                                <Settings size={16} />
                                <span>تنظیمات</span>
                            </button>

                            <div className="h-px bg-[var(--color-border-subtle)] my-0.5" />

                            <button
                                onClick={() => {
                                    logout();
                                    setUserMenuOpen(false);
                                }}
                                className="flex items-center gap-2 w-full p-2 rounded-btn hover:bg-[var(--color-error-bg)]/10 dark:hover:bg-[var(--color-error-bg)]/10 text-[var(--color-error-text)] dark:text-[var(--color-error-text)] text-xs font-bold transition-colors text-right cursor-pointer"
                            >
                                <LogOut size={16} />
                                <span>خروج از حساب</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* ---------------- 2. نوار ابزارهای سریع (آیکون‌های سه‌بعدی برجسته) ---------------- */}
                <div className="px-3 pt-2.5 pb-1 mb-3.5 shrink-0">
                    <div className="flex items-center justify-between gap-1.5 px-0.5">
                        <Tooltip content="فروشگاه محصولات" position="top" align="start">
                            <Link
                                to="/store"
                                onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false); }}
                                className="clay-icon-btn w-10 h-10 flex items-center justify-center cursor-pointer clay-icon"
                                aria-label="فروشگاه محصولات و اشتراک"
                            >
                                <Store className="w-5 h-5 text-emerald-500" strokeWidth={1.8} />
                            </Link>
                        </Tooltip>

                        <Tooltip content="وبلاگ هوش مصنوعی" position="top" align="center">
                            <Link
                                to="/blog"
                                onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false); }}
                                className="clay-icon-btn w-10 h-10 flex items-center justify-center cursor-pointer clay-icon"
                                aria-label="وبلاگ هوش مصنوعی"
                            >
                                <BookOpen className="w-5 h-5 text-blue-500" strokeWidth={1.8} />
                            </Link>
                        </Tooltip>

                        <Tooltip content="کاوش در پرامپت‌ها و ایده‌ها (HUB)" position="top" align="center">
                            <button
                                id="sidebar-explore-hub-btn"
                                onClick={() => { setIsExploreOpen(true); if (window.innerWidth < 768) setSidebarOpen(false); }}
                                className="clay-icon-btn w-10 h-10 flex items-center justify-center cursor-pointer clay-icon"
                                aria-label="کاوش در پرامپت‌ها و ایده‌ها"
                            >
                                <Compass className="w-5 h-5 text-purple-500" strokeWidth={1.8} />
                            </button>
                        </Tooltip>

                        <Tooltip content="استودیو خلق تصویر" position="top" align="center">
                            <button
                                id="sidebar-image-studio-btn"
                                onClick={() => { setIsImageStudioOpen(true); if (window.innerWidth < 768) setSidebarOpen(false); }}
                                className="clay-icon-btn w-10 h-10 flex items-center justify-center cursor-pointer clay-icon"
                                aria-label="استودیو خلق تصویر"
                            >
                                <Palette className="w-5 h-5 text-pink-500" strokeWidth={1.8} />
                            </button>
                        </Tooltip>

                        <Tooltip content="راهنمای تصویری برنامه" position="top" align="end">
                            <button
                                id="sidebar-ui-guide-btn"
                                onClick={() => { setIsUiGuideOpen(true); if (window.innerWidth < 768) setSidebarOpen(false); }}
                                className="clay-icon-btn w-10 h-10 flex items-center justify-center cursor-pointer clay-icon"
                                aria-label="راهنمای تصویری برنامه"
                            >
                                <HelpCircle className="w-5 h-5 text-amber-500" strokeWidth={1.8} />
                            </button>
                        </Tooltip>
                    </div>
                </div>

                {/* ---------------- 3. اکشن اصلی: دکمه گفتگوی جدید + سرچ ---------------- */}
                <div className="px-3 pt-0.5 pb-2 shrink-0 space-y-2.5">
                    {/* دکمه گفتگوی جدید - ظریف و زیبا */}
                    <div className="flex items-center justify-between w-full gap-2">
                        <button
                            id="sidebar-new-chat-btn"
                            onClick={() => {
                                createChat(settings.providers[settings.providers.activeProvider]?.modelName);
                                if (window.innerWidth < 768) setSidebarOpen(false);
                            }}
                            className="flex-1 flex items-center justify-between text-xs font-bold text-[var(--color-text-dim)] dark:text-[var(--color-text-dim)] hover:text-[var(--color-accent-primary)] dark:hover:text-[var(--color-accent-text)] group transition-all px-1 py-1"
                        >
                            <div className="flex items-center gap-1.5">
                                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 group-active:scale-95" strokeWidth={2.5} />
                                <span>گفتگوی جدید</span>
                            </div>
                            <span className="text-[10px] opacity-0 group-hover:opacity-100 font-mono dir-ltr font-normal px-1 py-0.5 rounded text-zinc-400 dark:text-zinc-500 transition-opacity">
                                Ctrl+K
                            </span>
                        </button>

                        {activeConversation && activeConversation.messages.length > 0 && (
                            <Tooltip content="خروجی و ذخیره گفتگو">
                                <button
                                    onClick={() => setIsExportOpen(true)}
                                    className="p-1.5 text-zinc-400 hover:text-teal-500 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                                >
                                    <DownloadMinimalisticLinearIcon className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                                </button>
                            </Tooltip>
                        )}
                    </div>

                    {/* کادر سرچ کامل و باکیفیت - مونوکروم و عریض */}
                    <div className="relative flex items-center w-full group">
                        <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-300 absolute right-3 pointer-events-none transition-colors" strokeWidth={1.75} />
                        <input
                            id="sidebar-search-input"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="جستجو در گفتگوها..."
                            className="w-full text-xs !pr-10 !pl-7 !py-2 rounded-input clay-input hover:border-[var(--color-border-strong)] dark:hover:border-[var(--color-border-strong)] text-[var(--color-text-main)] dark:text-[var(--color-text-main)] placeholder:text-[var(--color-text-dim)] dark:placeholder:text-[var(--color-text-dim)] focus:outline-hidden focus:border-[var(--color-border-strong)] dark:focus:border-[var(--color-border-strong)] focus:ring-1 focus:ring-[var(--color-border-strong)]/20 dark:focus:ring-[var(--color-border-strong)]/20 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute left-2.5 p-1 text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] dark:hover:text-[var(--color-text-main)] cursor-pointer"
                                aria-label="Clear search"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ---------------- 4. تیتر تاریخچه گفتگوها ---------------- */}
                <div className="px-4 sm:px-5 pt-2 pb-2 shrink-0 border-b border-[var(--card-border)]  mt-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-badge bg-[var(--color-accent-primary)] animate-pulse" />
                            <span className="text-xs font-bold text-[var(--color-text-main)]">تاریخچه گفتگوها</span>
                        </div>
                        {conversations.length > 0 && (
                            <span className="text-[10px] font-medium text-[var(--color-text-dim)] bg-[var(--color-input-bg)] dark:bg-[var(--color-input-bg)] px-2 py-0.5 rounded-badge border border-[var(--card-border)]">
                                {usePersianDigits ? toPersianDigits(conversations.length) : conversations.length} گفتگو
                            </span>
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
                                <PinBoldIcon className="w-3.5 h-3.5" />
                                <span>گفتگوهای سنجاق شده</span>
                                <span className="text-[10px] font-medium text-amber-400/90 bg-[var(--color-accent-primary)]/10 px-1.5 py-0.5 rounded-badge">
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
                                        className="w-full flex items-center justify-between px-2 py-1 rounded-btn text-xs font-bold text-[var(--color-text-main)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-input-bg)] dark:hover:bg-[var(--color-input-bg)]/80 transition-colors cursor-pointer select-none group"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <CalendarLinearIcon className="w-3.5 h-3.5 text-[var(--color-text-dim)] group-hover:text-[var(--color-text-main)] dark:group-hover:text-[var(--color-text-main)]" />
                                            <span>{group.label}</span>
                                            <span className="text-[10px] font-medium text-[var(--color-text-dim)] bg-[var(--color-input-bg)] dark:bg-[var(--color-input-bg)] px-1.5 py-0.5 rounded-badge">
                                                {usePersianDigits ? toPersianDigits(group.items.length) : group.items.length}
                                            </span>
                                        </div>
                                        <ChevronDown
                                            className={`w-3.5 h-3.5 text-zinc-700 dark:text-zinc-500 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'
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
                        <div className="text-center py-10 px-4 text-[var(--color-text-muted)] dark:text-[var(--color-text-dim)]">
                            {searchQuery ? (
                                <p className="text-xs">هیچ گفتگویی با عبارت «{searchQuery}» یافت نشد.</p>
                            ) : (
                                <div className="space-y-2">
                                    <StarsMinimalisticBoldIcon className="w-8 h-8 mx-auto text-[var(--color-accent-primary)] opacity-60" />
                                    <p className="text-xs font-semibold text-[var(--color-text-main)]">تاریخچه گفتگوها خالی است</p>
                                    <p className="text-[11px] text-[var(--color-text-muted)]">یک گفتگوی جدید را آغاز کنید</p>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Wallet Status Widget for Authenticated Users */}
                {user && (
                    <div className="mx-3 mb-2 p-2.5 rounded-card bg-[var(--gemini-gradient-subtle)] border border-[var(--color-accent-primary)]/20 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-btn bg-[var(--color-accent-primary)] text-white flex items-center justify-center shrink-0 shadow-sm">
                                <Coins className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] text-[var(--color-text-dim)] font-medium">کیف پول</span>
                                <span className="text-xs font-bold text-[var(--color-text-main)]">
                                    {usePersianDigits
                                        ? toPersianDigits((user?.walletBalance || 0).toLocaleString('fa-IR'))
                                        : (user?.walletBalance || 0).toLocaleString()} تومان
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setIsWalletOpen(true);
                                if (window.innerWidth < 768) setSidebarOpen(false);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white rounded-btn transition-all shadow-sm cursor-pointer"
                        >
                            شارژ
                        </button>
                    </div>
                )}

                {/* Bottom Storage & Metrics (فوتر خلوت) */}
                <div className="mx-3 mb-3 p-2 rounded-xl shrink-0 border border-transparent">
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
                        <div className="flex items-center gap-1.5 truncate">
                            <DatabaseLinearIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>حافظه: {usePersianDigits ? toPersianDigits(storageStats.usedKb) : storageStats.usedKb} KB</span>
                            {sessionStats.totalTokens > 0 && (
                                <>
                                    <span className="opacity-40">•</span>
                                    <span dir="ltr">~${sessionStats.totalCostUSDFormatted}</span>
                                </>
                            )}
                        </div>

                        {conversations.length > 0 && !showClearConfirm && (
                            <Tooltip content="پاک‌سازی تاریخچه گفتگوها">
                                <button
                                    onClick={() => setShowClearConfirm(true)}
                                    className="p-1 hover:text-red-500 transition-colors cursor-pointer rounded-md hover:bg-red-50 dark:hover:bg-red-950/30"
                                    aria-label="پاک‌سازی تاریخچه"
                                >
                                    <TrashBinMinimalisticLinearIcon className="w-3.5 h-3.5" />
                                </button>
                            </Tooltip>
                        )}
                    </div>

                    {showClearConfirm && (
                        <div className="mt-2 p-2 rounded-xl bg-red-950/40 border border-red-800/60 space-y-1.5 text-xs animate-fadeIn">
                            <div className="flex items-center gap-1.5 text-red-400 font-bold text-[11px]">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>حذف تمام تاریخچه؟</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => {
                                        clearAllConversations();
                                        setShowClearConfirm(false);
                                    }}
                                    className="flex-1 py-1 px-2 rounded-lg bg-red-600 text-white font-bold text-[10px] hover:bg-red-500 transition-colors cursor-pointer"
                                >
                                    بله، حذف کن
                                </button>
                                <button
                                    onClick={() => setShowClearConfirm(false)}
                                    className="flex-1 py-1 px-2 rounded-lg bg-zinc-200  text-zinc-700 dark:text-zinc-300 text-[10px] hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                                >
                                    انصراف
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
});
