import re

text = open('pdf_text.txt', encoding='utf-8').read()
words = text.split()
text = ' '.join(words)

# split by V1, V2, V3
v1_match = re.search(r'V1.*?Universal Hard Prompt (.*?) Reusable Variable Template (.*?) Image-to-Image (.*?)(?= V2 |$)', text)
v2_match = re.search(r'V2.*?Universal Hard Prompt (.*?) Reusable Variable Template (.*?) Image-to-Image (.*?)(?= V3 |$)', text)
v3_match = re.search(r'V3.*?Universal Hard Prompt (.*?) Reusable Variable Template (.*?) Image-to-Image (.*?)(?=$)', text)

def escape(s):
    return s.strip().replace('`', '\\`')

for v_num, match in [('1', v1_match), ('2', v2_match), ('3', v3_match)]:
    if match:
        hard, var, i2i = map(escape, match.groups())
        content = f'''export const asharikandiPromptV{v_num} = {{
  promptHard: `{hard}`,
  promptVariable: `{var}`,
  promptI2I: `{i2i}`
}};
'''
        open(f'src/app/view/HomePage/compo/asharikandiPromptV{v_num}.ts', 'w', encoding='utf-8').write(content)

catalog = '''import { asharikandiPromptV1 } from "./asharikandiPromptV1";
import { asharikandiPromptV2 } from "./asharikandiPromptV2";
import { asharikandiPromptV3 } from "./asharikandiPromptV3";

export type AsharikandiVersion = "V1" | "V2" | "V3";

export interface AsharikandiPromptFamily {
  version: AsharikandiVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const ASHARIKANDI_PROMPT_FAMILIES: Record<AsharikandiVersion, AsharikandiPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Asharikandi Terracotta",
    ...asharikandiPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Artisan Clay Craft",
    ...asharikandiPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "Dimensional Earthen World",
    ...asharikandiPromptV3,
  },
};
'''
open('src/app/view/HomePage/compo/asharikandiPromptCatalog.ts', 'w', encoding='utf-8').write(catalog)
print("Done")
