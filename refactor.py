
import os

target_file = r'C:\Users\Vivek Patel\Desktop\RAJDEEP\WildMind_AI\wild\src\app\view\Generation\VideoGeneration\TextToVideo\compo\InputBox.tsx'
replacement_file = r'C:\Users\Vivek Patel\Desktop\RAJDEEP\WildMind_AI\wild\replacement.txt'

with open(target_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(replacement_file, 'r', encoding='utf-8') as f:
    replacement = f.read()

# Indices are 0-based.
# Line 5159 is index 5158.
# Line 5529 is index 5528.
# We want to replace from 5158 up to and including 5528.
# Slice assignment: lines[5158:5529] = [replacement]
# Wait, replacement is a string. If I assign a list, it works.
# But replacement has minimal newlines at end?
# Let's ensure replacement ends with a newline if needed.

# Validation:
print(f"Original line 5159: {lines[5158]}")
print(f"Original line 5529: {lines[5528]}")

# Confirming content matches expectations loosely
if "className=\"flex items-start md:gap-3" not in lines[5158]:
    print("ERROR: Start line mismatch!")
    print(lines[5158])
    exit(1)

if "</div>" not in lines[5528]:
    print("ERROR: End line mismatch!")
    print(lines[5528])
    exit(1)

# Perform replacement
# We replace the slice with the new string (as a single element list or split lines)
# If we replace text, better to insert the string.
# Actually, splitting replacement into lines is better to maintain `lines` structure.
new_lines_insert = replacement.splitlines(keepends=True)
if not new_lines_insert[-1].endswith('\n'):
    new_lines_insert[-1] += '\n'

lines[5158:5529] = new_lines_insert

with open(target_file, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Successfully replaced content.")
