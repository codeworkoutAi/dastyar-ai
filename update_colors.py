import re
with open("src/index.css", "r", encoding="utf-8") as f:
    content = f.read()

# Replace Claymorphism dark block
clay_target = """[data-theme="dark"], .dark {
  --bg-main: #1E1F20;
  --header-bg: rgba(30, 31, 32, 0.92);
  --sidebar-bg: #1E1F20;
  --card-bg: #1E1F20; 
  --card-border: var(--border-subtle);
  
  --btn-bg: #262626; 
  --btn-hover: #333333; /* Slightly lighter for hover */
  
  --input-bg: #1c1c1c; /* Soft sunken effect */"""

clay_replace = """[data-theme="dark"], .dark {
  --bg-main: #212121;
  --header-bg: rgba(33, 33, 33, 0.92);
  --sidebar-bg: #171717;
  --card-bg: #212121; 
  --card-border: var(--border-subtle);
  
  --btn-bg: #2F2F2F; 
  --btn-hover: #3D3D3D; /* Slightly lighter for hover */
  
  --input-bg: #171717; /* Soft sunken effect */"""

content = content.replace(clay_target, clay_replace)

# Replace Neumorphism dark block
neu_target = """  html[data-ui-style="neumorphic"].dark,
  html.dark[data-ui-style="neumorphic"],
  html[data-ui-style="neumorphic"][data-theme="dark"] {
    /* Neumorphic dark: Original Dark Gray (#1E1F20) */
    --bg-main:    #1E1F20;
    --sidebar-bg: #1E1F20;
    --card-bg:    #1E1F20;
    --input-bg:   #1E1F20;
    --btn-bg:     #1E1F20;
    --btn-hover:  #282A2C;
    --header-bg:  rgba(30, 31, 32, 0.92);
    --bubble-user-bg: #282A2C;"""

neu_replace = """  html[data-ui-style="neumorphic"].dark,
  html.dark[data-ui-style="neumorphic"],
  html[data-ui-style="neumorphic"][data-theme="dark"] {
    /* Neumorphic dark: ChatGPT Style Gray */
    --bg-main:    #212121;
    --sidebar-bg: #171717;
    --card-bg:    #212121;
    --input-bg:   #171717;
    --btn-bg:     #212121;
    --btn-hover:  #2F2F2F;
    --header-bg:  rgba(33, 33, 33, 0.92);
    --bubble-user-bg: #2F2F2F;"""

content = content.replace(neu_target, neu_replace)

with open("src/index.css", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
