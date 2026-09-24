with open('src/components/SettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# 1. Fix the right sidebar (remove clay-surface-inset)
content = re.sub(
    r'w-full sm:w-64 clay-surface-inset',
    r'w-full sm:w-64 bg-transparent',
    content
)

# 2. Fix the bottom action bar (remove clay-surface-inset clay-surface backdrop-blur)
content = re.sub(
    r'p-4 border-t border-\[var\(--card-border\)\] clay-surface-inset clay-surface backdrop-blur',
    r'p-4 border-t border-[var(--card-border)] bg-transparent',
    content
)

# 3. Fix the Test Connection button
# From: w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm border border-zinc-300  clay-surface clay-icon-btn
# To: w-auto mx-auto sm:mx-0 px-4 py-2 sm:py-2.5 rounded-xl font-medium text-sm border border-zinc-300 bg-transparent hover:bg-black/5 dark:hover:bg-white/5
content = re.sub(
    r'className="w-full sm:w-auto px-5 py-2\.5 rounded-xl font-medium text-sm border border-zinc-300\s*clay-surface clay-icon-btn',
    r'className="w-auto px-4 py-2 sm:py-2.5 rounded-xl font-medium text-sm border border-zinc-300 bg-transparent hover:bg-black/5 dark:hover:bg-white/5',
    content
)

# 4. Remove any other clay-surface-inset in SettingsModal just to be safe
content = re.sub(r'\s*clay-surface-inset', '', content)

with open('src/components/SettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed SettingsModal layout issues')
