with open('src/components/ImageGenStudio.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Line 685: background of the main content
content = re.sub(r'bg-white dark:bg-black/40', 'bg-transparent', content)

# Line 841: Canvas Area
pattern_canvas = r'overflow-hidden p-2 sm:p-4 lg:p-6 mx-3 sm:mx-4 mb-2 mt-2 sm:mt-0 rounded-\[2rem\] bg-white border border-\[var\(--card-border\)\\]'
replacement_canvas = r'overflow-hidden p-2 sm:p-4 lg:p-6 mx-3 sm:mx-4 mb-2 mt-2 sm:mt-0 rounded-[2rem] clay-inset-thick'
content = re.sub(pattern_canvas, replacement_canvas, content)

# Line 983: Bottom Bar Gradient
content = re.sub(r'from-white via-white/95', 'from-[var(--card-bg)] via-[var(--card-bg)]', content)

with open('src/components/ImageGenStudio.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Restored modal colors and inset thick to ImageGenStudio')
