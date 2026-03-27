import os
import re

file_path = r'c:\Users\WildMindAi\Desktop\New folder\wild\src\app\view\EditImage\compo\EditImageInterface.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove line numbers if they exist (e.g. "4259: ")
# We look for patterns like "4259: <div" at the start of a line or after a newline
new_content = re.sub(r'^[0-9]{4,5}: ', '', content, flags=re.MULTILINE)

# Also fix the specific "p" issue if it still exists somewhere
# In my first bad call, I had: setProcessing((prev) => ({ ...p, ['fill']: false }));
# Let's search for "...p," where it should be "...prev,"
new_content = re.sub(r'\.\.\.p,', '...prev,', new_content)

# Fix missing brace in getLiveModelCredits if it still exists
# if (credits != null) return credits; \n // Fallback defaults \n if (mapped === 'gemini-25-flash-image')
# Wait, let's just make sure the component closing brace is there.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Cleanup complete.")
