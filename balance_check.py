import os

file_path = r'c:\Users\WildMindAi\Desktop\New folder\wild\src\app\view\EditImage\compo\EditImageInterface.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Braces: O={content.count('{')}, C={content.count('}')}")
print(f"Parens: O={content.count('(')}, C={content.count(')')}")
print(f"Square: O={content.count('[')}, C={content.count(']')}")
print(f"Angle:  O={content.count('<')}, C={content.count('>')}")
