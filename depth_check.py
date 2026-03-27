import os

file_path = r'c:\Users\WildMindAi\Desktop\New folder\wild\src\app\view\EditImage\compo\EditImageInterface.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

depth = 0
for i, line in enumerate(lines):
    old_depth = depth
    for char in line:
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
    
    if depth < 0:
        print(f"Brace depth negative at line {i + 1}")
        depth = 0
    elif depth == 0 and old_depth > 0:
        print(f"Block closed at line {i + 1}")

print(f"Final depth: {depth}")
