with open('src/components/ImageGenStudio.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# We will search for the Main Body Area and replace its class
pattern = r'\{/\* Main Body Area \*/\}\s*<div className=\{`flex-1 min-h-0 w-full flex items-center justify-center relative \$\{showHistory \? \'overflow-y-auto p-4 lg:p-8 custom-scrollbar\' : \'[^\`]*\'\}`\}>'

new_main_body = """{/* Main Body Area */}
 <div className={`flex-1 min-h-0 w-full flex items-center justify-center relative ${showHistory ? 'overflow-y-auto p-4 lg:p-8 custom-scrollbar' : 'overflow-hidden p-2 sm:p-4 lg:p-6 mx-3 sm:mx-4 mb-2 mt-2 sm:mt-0 rounded-3xl bg-white/60 dark:bg-zinc-900/30 backdrop-blur-sm border border-white/40 dark:border-white/5 shadow-sm'}`}>"""

if re.search(pattern, content):
    content = re.sub(pattern, new_main_body, content)
    with open('src/components/ImageGenStudio.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replaced canvas area class to soft white successfully!')
else:
    print('Could not find the Main Body Area block.')
