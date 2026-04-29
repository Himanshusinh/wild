import os
import shutil
import re
from PyPDF2 import PdfReader

styles = [
    {
        'id': 'bastarwoodcraft',
        'compName': 'BastarWoodcraft',
        'title': 'BASTAR WOODCRAFT',
        'chip1': 'AUTHENTIC',
        'chip2': 'CARVED',
        'chip3': 'SYMBOLIC',
        'pdf': r'pdf_content\Bastar woodcraft - Chhattisgarh.pdf'
    },
    {
        'id': 'bhagalpursilk',
        'compName': 'BhagalpurSilk',
        'title': 'BHAGALPUR SILK',
        'chip1': 'AUTHENTIC',
        'chip2': 'HANDLOOM',
        'chip3': 'TUSSAR',
        'pdf': r'pdf_content\Bhagalpur silk -bihar.pdf'
    },
    {
        'id': 'chambaminiature',
        'compName': 'ChambaMiniature',
        'title': 'CHAMBA MINIATURE',
        'chip1': 'AUTHENTIC',
        'chip2': 'COURT ART',
        'chip3': 'NARRATIVE',
        'pdf': r'pdf_content\Chamba miniature - Himachal Pradesh.pdf'
    },
    {
        'id': 'exposedlaterite',
        'compName': 'ExposedLaterite',
        'title': 'EXPOSED LATERITE',
        'chip1': 'AUTHENTIC',
        'chip2': 'MASONRY',
        'chip3': 'CHIRA',
        'pdf': r'pdf_content\Exposed Laterite (Chira) - Goa.pdf'
    }
]

def escape(s):
    return s.strip().replace('`', '\\`')

def read_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    text = '\\n'.join([page.extract_text() for page in reader.pages])
    return text

for style in styles:
    pdf_text = read_pdf(style['pdf']).replace('\\n', ' ')
    pdf_text = ' '.join(pdf_text.split())
    
    # robust extraction using regular expressions
    v1_match = re.search(r'V1.*?Universal Hard Prompt (.*?) Reusable Variable Template (.*?) Image-to-Image (.*?)(?= V2 |$)', pdf_text)
    v2_match = re.search(r'V2.*?Universal Hard Prompt (.*?) Reusable Variable Template (.*?) Image-to-Image (.*?)(?= V3 |$)', pdf_text)
    v3_match = re.search(r'V3.*?Universal Hard Prompt (.*?) Reusable Variable Template (.*?) Image-to-Image (.*?)$', pdf_text)
    
    matches = [v1_match, v2_match, v3_match]
    
    for idx, match in enumerate(matches):
        if not match:
            print(f"Warning: Missing V{idx+1} for {style['id']}")
            continue
            
        hard, var, i2i = map(escape, match.groups())
        content = f'''export const {style['id']}PromptV{idx+1} = {{
  promptHard: `{hard}`,
  promptVariable: `{var}`,
  promptI2I: `{i2i}`
}};
'''
        open(f'src/app/view/HomePage/compo/{style["id"]}PromptV{idx+1}.ts', 'w', encoding='utf-8').write(content)

    catalog = f'''import {{ {style["id"]}PromptV1 }} from "./{style["id"]}PromptV1";
import {{ {style["id"]}PromptV2 }} from "./{style["id"]}PromptV2";
import {{ {style["id"]}PromptV3 }} from "./{style["id"]}PromptV3";

export type {style["compName"]}Version = "V1" | "V2" | "V3";

export interface {style["compName"]}PromptFamily {{
  version: {style["compName"]}Version;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}}

export const {style["id"].upper()}_PROMPT_FAMILIES: Record<{style["compName"]}Version, {style["compName"]}PromptFamily> = {{
  V1: {{
    version: "V1",
    chip: "{style["chip1"]}",
    title: "{style["compName"]}",
    ...{style["id"]}PromptV1,
  }},
  V2: {{
    version: "V2",
    chip: "{style["chip2"]}",
    title: "{style["compName"]} Variations",
    ...{style["id"]}PromptV2,
  }},
  V3: {{
    version: "V3",
    chip: "{style["chip3"]}",
    title: "Dimensional {style["compName"]}",
    ...{style["id"]}PromptV3,
  }},
}};
'''
    open(f'src/app/view/HomePage/compo/{style["id"]}PromptCatalog.ts', 'w', encoding='utf-8').write(catalog)

    # Scaffolding the components
    src_dir = 'src/components/asharikandi'
    dst_dir = f'src/components/{style["id"]}'
    
    if os.path.exists(dst_dir):
        shutil.rmtree(dst_dir)
    
    shutil.copytree(src_dir, dst_dir)
    
    for root, dirs, files in os.walk(dst_dir):
        for file in files:
            old_path = os.path.join(root, file)
            new_file = file.replace('Asharikandi', style["compName"]).replace('asharikandi', style["id"])
            new_path = os.path.join(root, new_file)
            if old_path != new_path:
                os.rename(old_path, new_path)
            
            with open(new_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            content = content.replace('Asharikandi Terracotta', style["title"])
            content = content.replace('ASHARIKANDI TERRACOTTA', style["title"])
            content = content.replace('ASHARIKANDI_PROMPT_FAMILIES', style["id"].upper() + '_PROMPT_FAMILIES')
            content = content.replace('Asharikandi', style["compName"])
            content = content.replace('asharikandi', style["id"])
            content = content.replace('ASHARIKANDI', style["id"].upper())
            
            with open(new_path, 'w', encoding='utf-8') as f:
                f.write(content)
                
    # Create Walkthrough compo
    with open('src/app/view/HomePage/compo/AsharikandiFullscreenWalkthrough.tsx', 'r', encoding='utf-8') as f:
        wt_content = f.read()
        wt_content = wt_content.replace('Asharikandi', style["compName"]).replace('asharikandi', style["id"])
    with open(f'src/app/view/HomePage/compo/{style["compName"]}FullscreenWalkthrough.tsx', 'w', encoding='utf-8') as f:
        f.write(wt_content)

print("Batch Scaffolding done")
