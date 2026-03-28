import os

file_path = r'c:\Users\WildMindAi\Desktop\New folder\wild\src\app\view\EditImage\compo\EditImageInterface.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

depth = 0
output = []
for i, line in enumerate(lines):
    for char in line:
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
    
    if (400 <= i + 1 <= 460) or (4250 <= i + 1 <= 4350) or (6200 <= i + 1 <= 6238):
        output.append(f"Line {i + 1}: Depth {depth} | {line.strip()}")

with open('depth_log.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(output))
    f.write(f"\nFinal depth: {depth}")
