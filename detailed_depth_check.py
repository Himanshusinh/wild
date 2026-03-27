import os

file_path = r'c:\Users\WildMindAi\Desktop\New folder\wild\src\app\view\EditImage\compo\EditImageInterface.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

depth = 0
for i, line in enumerate(lines):
    for char in line:
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
    
    if (400 <= i + 1 <= 500) or (4200 <= i + 1 <= 4350) or (6200 <= i + 1 <= 6238):
        print(f"Line {i + 1}: Depth {depth} | {line.strip()}")

print(f"Final depth: {depth}")
