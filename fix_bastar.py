import re
pdf_text = open('bastar_dhokra.txt', encoding='utf-8').read().replace('\n', ' ')
pdf_text = ' '.join(pdf_text.split())
v3_match = re.search(r'V3.*?Universal Hard Prompt (.*?) Reusable Variable Template (.*?) Image-to-Image (.*?)$', pdf_text)
if v3_match:
    def escape(s): return s.strip().replace('`', '\\`')
    hard, var, i2i = v3_match.groups()
    content = f'''export const bastardhokraPromptV3 = {{
  promptHard: `{escape(hard)}`,
  promptVariable: `{escape(var)}`,
  promptI2I: `{escape(i2i)}`
}};
'''
    open('src/app/view/HomePage/compo/bastardhokraPromptV3.ts', 'w', encoding='utf-8').write(content)
    print("Fixed bastar dhokra V3")
