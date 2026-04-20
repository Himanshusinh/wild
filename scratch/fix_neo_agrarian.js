const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

// Special case: neoAgrarianBrutalism has a different folder casing
const style = {
  id: 'neoagrarianbrutalism',
  correctId: 'neoAgrarianBrutalism',
  componentName: 'NeoAgrarianBrutalism',
  v1Title: 'Agrarian-Industrial Flatscape',
  v2Title: 'Dimensional Agrarian-Industrial World',
  v3Title: '3D Cinematic Agrarian-Industrial World',
  pdfPath: path.join('c:', 'Users', 'asus', 'Desktop', 'wildmindai', 'wild', 'pdf_content', 'Neo-Agrarian Brutalism - Haryana.pdf'),
};

const base = path.join('c:', 'Users', 'asus', 'Desktop', 'wildmindai', 'wild', 'src', 'app', 'view', 'HomePage', 'compo');

function sanitize(text) {
  return (text || '').trim().replace(/`/g, '\\`');
}

function extractVersionBlock(fullText, versionLabel, nextVersionLabel) {
  const headers = [`${versionLabel} — `, `${versionLabel} - `, `${versionLabel}—`, `${versionLabel}-`, versionLabel];
  let startIdx = -1;
  for (const h of headers) {
    const idx = fullText.indexOf(h);
    if (idx !== -1) { startIdx = idx; break; }
  }
  if (startIdx === -1) return fullText;
  let endIdx = fullText.length;
  if (nextVersionLabel) {
    const nextHeaders = [`${nextVersionLabel} — `, `${nextVersionLabel} - `, `${nextVersionLabel}—`, `${nextVersionLabel}-`, nextVersionLabel];
    for (const h of nextHeaders) {
      const idx = fullText.indexOf(h, startIdx + 10);
      if (idx !== -1) { endIdx = idx; break; }
    }
  }
  return fullText.substring(startIdx, endIdx);
}

function extractPrompts(block) {
  let universalIndex = block.indexOf('Universal Hard Prompt');
  let variableIndex = block.indexOf('Reusable Variable Template');
  if (variableIndex === -1) variableIndex = block.indexOf('Variable Template');
  let i2iIndex = block.indexOf('Image-to-Image');
  let moodIndex = block.indexOf('Mood Board Prompt');
  if (moodIndex === -1) moodIndex = block.indexOf('Stylescape Prompt');

  let promptHard = '', promptVariable = '', promptI2I = '';
  if (universalIndex !== -1) {
    const hardEnd = variableIndex !== -1 ? variableIndex : (i2iIndex !== -1 ? i2iIndex : block.length);
    promptHard = block.substring(universalIndex + 'Universal Hard Prompt'.length, hardEnd).trim();
  }
  if (variableIndex !== -1) {
    const varEnd = i2iIndex !== -1 ? i2iIndex : block.length;
    promptVariable = block.substring(variableIndex + 'Reusable Variable Template'.length, varEnd).trim();
  }
  if (i2iIndex !== -1) {
    const i2iEnd = moodIndex !== -1 ? moodIndex : block.length;
    promptI2I = block.substring(i2iIndex + 'Image-to-Image'.length, i2iEnd).trim();
  }
  return { promptHard, promptVariable, promptI2I };
}

async function run() {
  const dataBuffer = fs.readFileSync(style.pdfPath);
  const data = await pdf(dataBuffer);
  const fullText = data.text;

  const v1Block = extractVersionBlock(fullText, 'V1', 'V2');
  const v2Block = extractVersionBlock(fullText, 'V2', 'V3');
  const v3Block = extractVersionBlock(fullText, 'V3', null);

  const v1 = extractPrompts(v1Block);
  const v2 = extractPrompts(v2Block);
  const v3 = extractPrompts(v3Block);

  const cId = style.correctId;

  fs.writeFileSync(path.join(base, `${cId}PromptV1.ts`),
    `export const ${cId}PromptV1 = {\n` +
    `  promptHard: \`${sanitize(v1.promptHard)}\`,\n` +
    `  promptVariable: \`${sanitize(v1.promptVariable)}\`,\n` +
    `  promptI2I: \`${sanitize(v1.promptI2I)}\`\n` +
    `};\n`
  );
  fs.writeFileSync(path.join(base, `${cId}PromptV2.ts`),
    `export const ${cId}PromptV2 = {\n` +
    `  promptHard: \`${sanitize(v2.promptHard)}\`,\n` +
    `  promptVariable: \`${sanitize(v2.promptVariable)}\`,\n` +
    `  promptI2I: \`${sanitize(v2.promptI2I)}\`\n` +
    `};\n`
  );
  fs.writeFileSync(path.join(base, `${cId}PromptV3.ts`),
    `export const ${cId}PromptV3 = {\n` +
    `  promptHard: \`${sanitize(v3.promptHard)}\`,\n` +
    `  promptVariable: \`${sanitize(v3.promptVariable)}\`,\n` +
    `  promptI2I: \`${sanitize(v3.promptI2I)}\`\n` +
    `};\n`
  );

  const comp = style.componentName;
  const catalog = [
    `import { ${cId}PromptV1 } from "./${cId}PromptV1";`,
    `import { ${cId}PromptV2 } from "./${cId}PromptV2";`,
    `import { ${cId}PromptV3 } from "./${cId}PromptV3";`,
    '',
    `export type ${comp}Version = "V1" | "V2" | "V3";`,
    '',
    `export interface ${comp}PromptFamily {`,
    `  version: ${comp}Version;`,
    `  promptHard: string;`,
    `  promptVariable: string;`,
    `  promptI2I: string;`,
    `  chip: string;`,
    `  title: string;`,
    `}`,
    '',
    `export const NEO_AGRARIAN_BRUTALISM_PROMPT_FAMILIES: Record<${comp}Version, ${comp}PromptFamily> = {`,
    `  V1: { version: "V1", chip: "AUTHENTIC", title: "${style.v1Title}", ...${cId}PromptV1 },`,
    `  V2: { version: "V2", chip: "ARTISAN", title: "${style.v2Title}", ...${cId}PromptV2 },`,
    `  V3: { version: "V3", chip: "CINEMATIC", title: "${style.v3Title}", ...${cId}PromptV3 },`,
    `};`,
    ''
  ].join('\n');
  fs.writeFileSync(path.join(base, `${cId}PromptCatalog.ts`), catalog);

  // Also fix types.ts
  const compFolder = path.join('c:', 'Users', 'asus', 'Desktop', 'wildmindai', 'wild', 'src', 'components', 'neoAgrarianBrutalism');
  const typesContent = [
    `import type { ${comp}Version } from "@/app/view/HomePage/compo/${cId}PromptCatalog";`,
    `import type { WarliAspectRatioChoice } from "@/components/warli/warliNanoAspect";`,
    '',
    `export type StyleFamily = ${comp}Version;`,
    `export type InputMode = "text" | "image";`,
    `export type ModelId = "google/nano-banana-2" | "google/nano-banana-pro";`,
    `export type ImageCount = 1 | 2 | 4;`,
    `export type AspectRatio = WarliAspectRatioChoice;`,
    `export type RightPanelState = "empty" | "loading" | "results";`,
    '',
    `export interface ${comp}State {`,
    `  style: StyleFamily;`,
    `  inputMode: InputMode;`,
    `  sceneText: string;`,
    `  uploadedImage: string | null;`,
    `  imageNote: string;`,
    `  model: ModelId;`,
    `  resolution: string;`,
    `  imageCount: ImageCount;`,
    `  ratio: AspectRatio;`,
    `  includeVariable: boolean;`,
    `  panelState: RightPanelState;`,
    `  generatedImages: string[];`,
    `  assembledPrompt: string;`,
    `}`,
    '',
    `export const MODELS = [`,
    `  { id: "google/nano-banana-2" as const, label: "Nano Banana 2", tag: "Google" },`,
    `  { id: "google/nano-banana-pro" as const, label: "Nano Banana Pro", tag: "Google" },`,
    `];`,
    '',
    `export const IMAGE_COUNTS: ImageCount[] = [1, 2, 4];`,
    '',
    `export const STYLE_LABELS: Record<StyleFamily, { badge: string; title: string }> = {`,
    `  V1: { badge: "AUTHENTIC", title: "${style.v1Title}" },`,
    `  V2: { badge: "ARTISAN", title: "${style.v2Title}" },`,
    `  V3: { badge: "CINEMATIC", title: "${style.v3Title}" },`,
    `};`,
    '',
    `export const INITIAL_STATE: ${comp}State = {`,
    `  style: "V1",`,
    `  inputMode: "text",`,
    `  sceneText: "",`,
    `  uploadedImage: null,`,
    `  imageNote: "",`,
    `  model: "google/nano-banana-2",`,
    `  resolution: "1K",`,
    `  imageCount: 2,`,
    `  ratio: "auto",`,
    `  includeVariable: false,`,
    `  panelState: "empty",`,
    `  generatedImages: [],`,
    `  assembledPrompt: "",`,
    `};`,
    ''
  ].join('\n');
  fs.writeFileSync(path.join(compFolder, 'types.ts'), typesContent);

  console.log('Done: neoAgrarianBrutalism V1/V2/V3 files written with correct casing.');
  console.log('V1:', v1.promptHard.substring(0, 80));
  console.log('V2:', v2.promptHard.substring(0, 80));
  console.log('V3:', v3.promptHard.substring(0, 80));
}

run();
