import os
import shutil
import re
from PyPDF2 import PdfReader

styles = [
    {
        'id': 'bellmetalrituals',
        'compName': 'BellMetalRituals',
        'title': 'BELL-METAL RITUALS',
        'chip1': 'AUTHENTIC',
        'chip2': 'RITUAL',
        'chip3': 'BELL-METAL',
        'pdf': r'pdf_content\Next styles\Kasaragod,Balaramapuram,Kuthampully -Kerala.pdf'
    },
    {
        'id': 'kasutiembroidery',
        'compName': 'KasutiEmbroidery',
        'title': 'KASUTI EMBROIDERY',
        'chip1': 'AUTHENTIC',
        'chip2': 'GEOMETRIC',
        'chip3': 'STITCHING',
        'pdf': r'pdf_content\Next styles\Kasuti - Karnataka.pdf'
    },
    {
        'id': 'keralamural',
        'compName': 'KeralaMural',
        'title': 'KERALA MURAL',
        'chip1': 'AUTHENTIC',
        'chip2': 'MURAL',
        'chip3': 'CODIFIED',
        'pdf': r'pdf_content\Next styles\Kerala mural painting -Kerala.pdf'
    },
    {
        'id': 'khambhatagate',
        'compName': 'KhambhatAgate',
        'title': 'KHAMBHAT AGATE',
        'chip1': 'AUTHENTIC',
        'chip2': 'POLISHED',
        'chip3': 'TRANSLUCENCY',
        'pdf': r'pdf_content\Next styles\Khambhat Agate (Akik) Carving - Gujarat.pdf'
    },
    {
        'id': 'kinhalcraft',
        'compName': 'KinhalCraft',
        'title': 'KINHAL CRAFT',
        'chip1': 'AUTHENTIC',
        'chip2': 'WOODEN',
        'chip3': 'PAINTED',
        'pdf': r'pdf_content\Next styles\Kinhal - Karnataka.pdf'
    },
    {
        'id': 'kolhapurjewellery',
        'compName': 'KolhapurJewellery',
        'title': 'KOLHAPUR JEWELLERY',
        'chip1': 'AUTHENTIC',
        'chip2': 'ORNAMENT',
        'chip3': 'UNITS',
        'pdf': r'pdf_content\Next styles\Kolhapur jewellery - Maharashtra.pdf'
    },
    {
        'id': 'kolhapurichappal',
        'compName': 'KolhapuriChappal',
        'title': 'KOLHAPURI CHAPPAL',
        'chip1': 'AUTHENTIC',
        'chip2': 'LEATHER',
        'chip3': 'FOOTWEAR',
        'pdf': r'pdf_content\Next styles\Kolhapuri Chappal  - Maharashtra.pdf'
    },
    {
        'id': 'kolhapurisaaj',
        'compName': 'KolhapuriSaaj',
        'title': 'KOLHAPURI SAAJ',
        'chip1': 'AUTHENTIC',
        'chip2': 'NECKLACE',
        'chip3': 'PENDANTS',
        'pdf': r'pdf_content\Next styles\Kolhapuri Saaj - Maharashtra.pdf'
    },
    {
        'id': 'lambaniembroidery',
        'compName': 'LambaniEmbroidery',
        'title': 'LAMBANI EMBROIDERY',
        'chip1': 'AUTHENTIC',
        'chip2': 'PATCHWORK',
        'chip3': 'MIRRORS',
        'pdf': r'pdf_content\Next styles\Lambani embroidery - Karnataka.pdf'
    },
    {
        'id': 'leathertoys',
        'compName': 'LeatherToys',
        'title': 'LEATHER TOYS',
        'chip1': 'AUTHENTIC',
        'chip2': 'LEATHER',
        'chip3': 'PAINTED',
        'pdf': r'pdf_content\Next styles\Leather Toys of Indore - Madhya Prad….pdf'
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

export const {style["id"].upper().replace("-", "_")}_PROMPT_FAMILIES: Record<{style["compName"]}Version, {style["compName"]}PromptFamily> = {{
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
            content = content.replace('ASHARIKANDI_PROMPT_FAMILIES', style["id"].upper().replace("-", "_") + '_PROMPT_FAMILIES')
            content = content.replace('Asharikandi', style["compName"])
            content = content.replace('asharikandi', style["id"])
            content = content.replace('ASHARIKANDI', style["id"].upper().replace("-", "_"))
            
            with open(new_path, 'w', encoding='utf-8') as f:
                f.write(content)
                
    # Create Walkthrough compo
    with open('src/app/view/HomePage/compo/AsharikandiFullscreenWalkthrough.tsx', 'r', encoding='utf-8') as f:
        wt_content = f.read()
        wt_content = wt_content.replace('Asharikandi', style["compName"]).replace('asharikandi', style["id"])
    with open(f'src/app/view/HomePage/compo/{style["compName"]}FullscreenWalkthrough.tsx', 'w', encoding='utf-8') as f:
        f.write(wt_content)

print("Batch 6 Scaffolding done")
