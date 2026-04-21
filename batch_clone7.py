import os
import shutil
import re
from PyPDF2 import PdfReader

styles = [
    {
        'id': 'paithani',
        'compName': 'Paithani',
        'title': 'PAITHANI',
        'desc': 'A handwoven silk-and-zari textile defined by pallu dominance, structural borders, and intricate loom-woven motifs.',
        'name': 'Maharashtra',
        'chip1': 'AUTHENTIC', 'chip2': 'SILK', 'chip3': 'LOOM-WOVEN',
        'pdf': r'pdf_content\Next styles\Paithani - Maharashtra.pdf'
    },
    {
        'id': 'pawndum',
        'compName': 'Pawndum',
        'title': 'PAWNDUM',
        'desc': 'A traditional dark-ground wrap cloth defined by bold woven stripes, panel construction, and socially coded lower-body use.',
        'name': 'Mizoram',
        'chip1': 'AUTHENTIC', 'chip2': 'STRIPES', 'chip3': 'PANEL-CONSTRUCTION',
        'pdf': r'pdf_content\Next styles\Pawndum - Mizoram.pdf'
    },
    {
        'id': 'poshinaterracotta',
        'compName': 'PoshinaTerracotta',
        'title': 'POSHINA TERRACOTTA',
        'desc': 'A votive clay tradition where terracotta horses are offered at shrines as symbols of faith, protection, and fulfilled vows.',
        'name': 'Gujarat',
        'chip1': 'AUTHENTIC', 'chip2': 'VOTIVE', 'chip3': 'TERRACOTTA',
        'pdf': r'pdf_content\Next styles\Poshina Terracotta - Gujarat.pdf'
    },
    {
        'id': 'prestigependants',
        'compName': 'PrestigePendants',
        'title': 'PRESTIGE PENDANTS',
        'desc': 'Body-worn symbolic forms representing status, bravery, and inherited identity through visible focal signs.',
        'name': 'Nagaland',
        'chip1': 'AUTHENTIC', 'chip2': 'SYMBOLIC', 'chip3': 'PENDANTS',
        'pdf': r'pdf_content\Next styles\Prestige,trophy-pendants - Nagaland.pdf'
    },
    {
        'id': 'puanchei',
        'compName': 'Puanchei',
        'title': 'PUANCHEI',
        'desc': 'A vibrant ceremonial textile defined by bold woven bands, strong color contrasts, and rhythmic horizontal structure.',
        'name': 'Mizoram',
        'chip1': 'AUTHENTIC', 'chip2': 'CEREMONIAL', 'chip3': 'WOVEN-BANDS',
        'pdf': r'pdf_content\Next styles\Puanchei - Mizoram.pdf'
    },
    {
        'id': 'puanlaisen',
        'compName': 'Puanlaisen',
        'title': 'PUANLAISEN',
        'desc': 'A traditional woven textile defined by a dominant central red band that structures the entire cloth.',
        'name': 'Mizoram',
        'chip1': 'AUTHENTIC', 'chip2': 'RED-BAND', 'chip3': 'WOVEN',
        'pdf': r'pdf_content\Next styles\Puanlaisen stripe-ground - Mizoram.pdf'
    },
    {
        'id': 'bellmetalrituals',
        'compName': 'BellMetalRituals',
        'title': 'BELL-METAL RITUALS',
        'desc': 'A sacred object tradition defined by typology-led forms like lamps and vessels, crafted in dense bell-metal for ritual use.',
        'name': 'Kerala',
        'chip1': 'AUTHENTIC', 'chip2': 'SACRED', 'chip3': 'BELL-METAL',
        'pdf': r'pdf_content\Next styles\ritual-object systems -Kerala.pdf'
    },
    {
        'id': 'sandalwoodcarving',
        'compName': 'SandalwoodCarving',
        'title': 'SANDALWOOD CARVING',
        'desc': 'A delicate woodcraft tradition known for intricate hand-carved details, fine relief work, and precious sandalwood material.',
        'name': 'Karnataka (Mysuru)',
        'chip1': 'AUTHENTIC', 'chip2': 'CARVED', 'chip3': 'SANDALWOOD',
        'pdf': r'pdf_content\Next styles\Sandalwood Carving - Karnataka.pdf'
    },
    {
        'id': 'sankhedawoodwork',
        'compName': 'SankhedaWoodwork',
        'title': 'SANKHEDA WOODWORK',
        'desc': 'A traditional furniture craft defined by turned wooden forms, lacquered surfaces, and hand-painted motifs.',
        'name': 'Gujarat (Vadodara)',
        'chip1': 'AUTHENTIC', 'chip2': 'TURNED-WOOD', 'chip3': 'LACQUERED',
        'pdf': r'pdf_content\Next styles\Sankheda Woodwork - Gujarat.pdf'
    },
    {
        'id': 'ganjifa',
        'compName': 'Ganjifa',
        'title': 'GANJIFA',
        'desc': 'A traditional hand-painted card art defined by circular composition, symbolic figures, and structured decorative borders.',
        'name': 'Maharashtra (Sawantwadi)',
        'chip1': 'AUTHENTIC', 'chip2': 'CIRCULAR', 'chip3': 'HAND-PAINTED',
        'pdf': r'pdf_content\Next styles\Sawantwadi Ganjifa - Maharashtra.pdf'
    },
    {
        'id': 'sawantwadiwoodcraft',
        'compName': 'SawantwadiWoodcraft',
        'title': 'SAWANTWADI WOODCRAFT',
        'desc': 'A traditional miniature craft where hand-carved wooden forms are painted and arranged into playful object-world sets.',
        'name': 'Maharashtra',
        'chip1': 'AUTHENTIC', 'chip2': 'MINIATURE', 'chip3': 'HAND-CARVED',
        'pdf': r'pdf_content\Next styles\Sawantwadi woodcraft - Maharashtra.pdf'
    },
    {
        'id': 'shapheelanphee',
        'compName': 'ShapheeLanphee',
        'title': 'SHAPHEE LANPHEE',
        'desc': 'A ceremonial honour cloth defined by black field authority, red borders, and symbolic motifs representing status and tradition.',
        'name': 'Manipur',
        'chip1': 'AUTHENTIC', 'chip2': 'HONOUR-CLOTH', 'chip3': 'SYMBOLIC',
        'pdf': r'pdf_content\Next styles\Shaphee Lanphee - Manipur.pdf'
    },
    {
        'id': 'sheerfieldcloth',
        'compName': 'SheerFieldCloth',
        'title': 'SHEER FIELD CLOTH',
        'desc': 'A soft upper-wrap textile system defined by translucency, gentle drape, and poised visual presence.',
        'name': 'Manipur',
        'chip1': 'AUTHENTIC', 'chip2': 'TRANSLUCENT', 'chip3': 'DRAPE',
        'pdf': r'pdf_content\Next styles\Sheer,Poised Field -  manipur.pdf'
    },
    {
        'id': 'bodyaugmentation',
        'compName': 'BodyAugmentation',
        'title': 'BODY AUGMENTATION',
        'desc': 'A cultural system where tattoos, hair, and feathers transform the body into a symbolic and socially coded visual field.',
        'name': 'Nagaland',
        'chip1': 'AUTHENTIC', 'chip2': 'BODY-ART', 'chip3': 'SYMBOLIC',
        'pdf': r'pdf_content\Next styles\Tattoo,hair,feather augmentation - Nagaland.pdf'
    },
    {
        'id': 'tawlhlophuan',
        'compName': 'Tawlhlophuan',
        'title': 'TAWLHLOHPUAN',
        'desc': 'A traditional warrior cloth defined by joined construction, firm woven structure, and symbolic red-white seam discipline.',
        'name': 'Mizoram',
        'chip1': 'AUTHENTIC', 'chip2': 'WARRIOR', 'chip3': 'WOVEN',
        'pdf': r'pdf_content\Next styles\Tawlhlohpuan - Mizoram.pdf'
    },
    {
        'id': 'templemural',
        'compName': 'TempleMural',
        'title': 'TEMPLE MURAL',
        'desc': 'A sacred architectural painting tradition where narrative panels, divine figures, and ornamental borders are integrated into temple ceilings.',
        'name': 'Karnataka (Hampi)',
        'chip1': 'AUTHENTIC', 'chip2': 'SACRED', 'chip3': 'PAINTING',
        'pdf': r'pdf_content\Next styles\Temple Mural  - Karnataka.pdf'
    },
    {
        'id': 'togalugombeyaata',
        'compName': 'TogaluGombeyaata',
        'title': 'TOGALU GOMBEYAATA',
        'desc': 'A traditional shadow-puppetry form where translucent leather figures, light, and screen create dynamic storytelling.',
        'name': 'Karnataka',
        'chip1': 'AUTHENTIC', 'chip2': 'SHADOW-PUPPET', 'chip3': 'TRANSLUCENT',
        'pdf': r'pdf_content\Next styles\Togalu Gombeyaata - Karnataka.pdf'
    },
    {
        'id': 'nagashawl',
        'compName': 'NagaShawl',
        'title': 'NAGA SHAWL',
        'desc': 'A tribe-specific woven system where pattern, structure, and identity are governed by a single coherent visual code.',
        'name': 'Nagaland',
        'chip1': 'AUTHENTIC', 'chip2': 'TRIBE-SPECIFIC', 'chip3': 'WOVEN',
        'pdf': r'pdf_content\Next styles\Tribe-signature shawl branch - Nagaland.pdf',
        'image': 'Tribe-signature shawl branch - Nagaland.png'
    },
    {
        'id': 'wangkheiphee',
        'compName': 'WangkheiPhee',
        'title': 'WANGKHEI PHEE',
        'desc': 'A delicate woven textile defined by airy muslin-like body fields, sparse motifs, and strong geometric borders.',
        'name': 'Manipur',
        'chip1': 'AUTHENTIC', 'chip2': 'DELICATE', 'chip3': 'MUSLIN',
        'pdf': r'pdf_content\Next styles\Wangkhei Phee - Manipur.pdf'
    },
    {
        'id': 'meritshawl',
        'compName': 'MeritShawl',
        'title': 'MERIT SHAWL',
        'desc': 'An earned ceremonial textile defined by bold segmented patterns, strong contrast, and public status symbolism.',
        'name': 'Nagaland',
        'chip1': 'AUTHENTIC', 'chip2': 'CEREMONIAL', 'chip3': 'SEGMENTED',
        'pdf': r'pdf_content\Next styles\Warrior,merit shawl branch-Nagaland.pdf'
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
    
    if not (v1_match and v2_match and v3_match):
        v1_match = re.search(r'V1.*?Hard Prompt (.*?) Variable Template (.*?) Image-to-Image (.*?)(?= V2 |$)', pdf_text)
        v2_match = re.search(r'V2.*?Hard Prompt (.*?) Variable Template (.*?) Image-to-Image (.*?)(?= V3 |$)', pdf_text)
        v3_match = re.search(r'V3.*?Hard Prompt (.*?) Variable Template (.*?) Image-to-Image (.*?)$', pdf_text)
    
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

print("Batch 7 Scaffolding done")
