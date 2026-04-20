import os
import shutil

src_dir = 'src/components/idumishmi'
dst_dir = 'src/components/asharikandi'

if os.path.exists(dst_dir):
    shutil.rmtree(dst_dir)

shutil.copytree(src_dir, dst_dir)

def rename_and_replace(path):
    for root, dirs, files in os.walk(path):
        for file in files:
            old_path = os.path.join(root, file)
            new_file = file.replace('IduMishmi', 'Asharikandi').replace('iduMishmi', 'asharikandi')
            new_path = os.path.join(root, new_file)
            if old_path != new_path:
                os.rename(old_path, new_path)
            
            with open(new_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # replacements
            content = content.replace('IduMishmi', 'Asharikandi')
            content = content.replace('iduMishmi', 'asharikandi')
            content = content.replace('idumishmi', 'asharikandi')
            content = content.replace('IDU_MISHMI', 'ASHARIKANDI')
            content = content.replace('IDU MISHMI', 'ASHARIKANDI TERRACOTTA')
            content = content.replace('Idu Mishmi', 'Asharikandi Terracotta')
            
            with open(new_path, 'w', encoding='utf-8') as f:
                f.write(content)

rename_and_replace(dst_dir)

with open('src/app/view/HomePage/compo/IduMishmiFullscreenWalkthrough.tsx', 'r', encoding='utf-8') as f:
    wt_content = f.read()
    wt_content = wt_content.replace('IduMishmi', 'Asharikandi').replace('idumishmi', 'asharikandi')
with open('src/app/view/HomePage/compo/AsharikandiFullscreenWalkthrough.tsx', 'w', encoding='utf-8') as f:
    f.write(wt_content)

print("Scaffolding done")
