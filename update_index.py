with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

import re
content = re.sub(r'<body class="([^"]+)">', r'<body class="\1 overflow-x-hidden" style="padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right);">', content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated index.html')
