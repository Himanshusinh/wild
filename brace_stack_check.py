import os

file_path = r'c:\Users\WildMindAi\Desktop\New folder\wild\src\app\view\EditImage\compo\EditImageInterface.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    for char in line:
        if char == '{':
            stack.append(i + 1)
        elif char == '}':
            if stack:
                stack.pop()
            else:
                print(f"Extra closing brace at line {i + 1}")

if stack:
    print(f"Unclosed braces starting at lines: {stack}")
else:
    print("All braces balanced.")
