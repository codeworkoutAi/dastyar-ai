import re

with open('src/components/Sidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add setIsExportOpen to useUIStore
content = re.sub(
    r'const \{ sidebarOpen,([^}]*)\} = useUIStore\(\);',
    r'const { sidebarOpen,\1, setIsExportOpen } = useUIStore();',
    content
)

# Add activeConversation variable definition (if not exists)
if 'const activeConversation = conversations.find' not in content:
    content = re.sub(
        r'const \{ conversations, activeId,([^}]*)\} = useChatStore\(\);',
        r'const { conversations, activeId,\1} = useChatStore();\n    const activeConversation = conversations.find(c => c.id === activeId) || null;',
        content
    )


# Replace the button block
old_btn = r'<button[^>]*id="sidebar-new-chat-btn".*?</button>'
new_btn = """<div className="flex items-center justify-between w-full gap-2">
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

content = re.sub(old_btn, new_btn, content, flags=re.DOTALL)

with open('src/components/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated Sidebar with regex')
