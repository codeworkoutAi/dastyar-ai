import os

with open('src/components/Header.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<SettingsMinimalisticLinearIcon className="w-4 h-4 sm:w-5 sm:h-5" />',
    '<SettingsMinimalisticLinearIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 dark:text-amber-400" />'
)

content = content.replace(
    '<DownloadMinimalisticLinearIcon className="w-4 h-4 sm:w-5 sm:h-5" />',
    '<DownloadMinimalisticLinearIcon className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500 dark:text-teal-400" />'
)

content = content.replace(
    '<MenuDotsLinearIcon className="w-5 h-5" />',
    '<MenuDotsLinearIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />'
)

content = content.replace(
    'text-blue-600 dark:text-blue-400 clay-icon',
    'text-rose-500 dark:text-rose-400 clay-icon'
)

with open('src/components/Header.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/components/UIStyleToggle.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "className={`w-4 h-4 sm:w-5 sm:h-5 ${!isClay ? 'text-zinc-600 dark:text-zinc-400' : ''}`}",
    "className={`w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400`}"
)

with open('src/components/UIStyleToggle.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/components/ThemeToggle.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "<MoonIcon className=\"w-4 h-4 sm:w-5 sm:h-5\" />",
    "<MoonIcon className=\"w-4 h-4 sm:w-5 sm:h-5 text-purple-500 dark:text-purple-400\" />"
)
content = content.replace(
    "<SunIcon className=\"w-4 h-4 sm:w-5 sm:h-5\" />",
    "<SunIcon className=\"w-4 h-4 sm:w-5 sm:h-5 text-orange-500 dark:text-orange-400\" />"
)

with open('src/components/ThemeToggle.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
