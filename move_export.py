import os

with open('src/components/Sidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'const { sidebarOpen, setSidebarOpen, setIsImageStudioOpen, setIsExploreOpen, setIsUiGuideOpen, setIsAdminOpen, setIsSettingsOpen, setIsWalletOpen } = useUIStore();',
    'const { sidebarOpen, setSidebarOpen, setIsImageStudioOpen, setIsExploreOpen, setIsUiGuideOpen, setIsAdminOpen, setIsSettingsOpen, setIsWalletOpen, setIsExportOpen } = useUIStore();'
)

new_chat_button = """                    {/* دکمه گفتگوی جدید - چسبیده به لیست */}
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
                    </div>"""

old_chat_button = """                    {/* دکمه گفتگوی جدید - چسبیده به لیست */}
                    <button
                        id="sidebar-new-chat-btn"
                        onClick={() => {
                            createChat(settings.providers[settings.providers.activeProvider]?.modelName);
                            if (window.innerWidth < 768) setSidebarOpen(false);
                        }}
                        className="w-full flex items-center justify-between text-xs font-bold text-[var(--color-text-dim)] dark:text-[var(--color-text-dim)] hover:text-[var(--color-accent-primary)] dark:hover:text-[var(--color-accent-text)] group transition-all px-1 py-1"
                    >
                        <div className="flex items-center gap-1.5">
                            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 group-active:scale-95" strokeWidth={2.5} />
                            <span>گفتگوی جدید</span>
                        </div>
                        <span className="text-[10px] opacity-0 group-hover:opacity-100 font-mono dir-ltr font-normal px-1 py-0.5 rounded text-zinc-400 dark:text-zinc-500 transition-opacity">
                            Ctrl+K
                        </span>
                    </button>"""

content = content.replace(old_chat_button, new_chat_button)

# Also make sure activeConversation is available
if 'const activeConversation = conversations.find((c) => c.id === activeId);' not in content and 'const activeConversation = conversations.find(c => c.id === activeId);' not in content:
    content = content.replace(
        'const { conversations, activeId, setActiveId, createChat, deleteConversation, updateConversation, clearAllConversations } = useChatStore();',
        'const { conversations, activeId, setActiveId, createChat, deleteConversation, updateConversation, clearAllConversations } = useChatStore();\n    const activeConversation = conversations.find((c) => c.id === activeId) || null;'
    )

with open('src/components/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated Sidebar.tsx')

# Now remove it from Header.tsx
with open('src/components/Header.tsx', 'r', encoding='utf-8') as f:
    header_content = f.read()

export_button_block = """  {/* Export Button */}
  {activeConversation && activeConversation.messages.length > 0 && (
  <Tooltip content="خروجی و ذخیره گفتگو">
  <button
  id="header-export-btn"
  onClick={() => setIsExportOpen(true)}
  className="clay-icon-btn w-11 h-11 flex items-center justify-center rounded-xl sm:rounded-2xl cursor-pointer clay-icon"
  aria-label="Export Chat"
  >
  <DownloadMinimalisticLinearIcon className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500 dark:text-teal-400" />
  </button>
  </Tooltip>
  )}"""

header_content = header_content.replace(export_button_block, "")

# Remove from mobile menu too
mobile_export_block = """  {activeConversation && activeConversation.messages.length > 0 && (
  <button onClick={() => { setIsExportOpen(true); setShowMobileMenu(false); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors text-right cursor-pointer">
  <DownloadMinimalisticLinearIcon className="w-4 h-4 text-emerald-400" />
  <span className="text-xs font-bold text-[var(--text-main)]">خروجی گفتگو</span>
  </button>
  )}"""
header_content = header_content.replace(mobile_export_block, "")

with open('src/components/Header.tsx', 'w', encoding='utf-8') as f:
    f.write(header_content)

print('Updated Header.tsx')
