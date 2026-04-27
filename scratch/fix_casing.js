const fs = require('fs');
const path = require('path');
const base = path.join('c:', 'Users', 'asus', 'Desktop', 'wildmindai', 'wild', 'src', 'app', 'view', 'HomePage', 'compo');

const id = 'neoagrarianbrutalism';
const correctId = 'neoAgrarianBrutalism';
const componentName = 'NeoAgrarianBrutalism';
const v1Title = 'Agrarian-Industrial Flatscape';
const v2Title = 'Dimensional Agrarian-Industrial World';
const v3Title = '3D Cinematic Agrarian-Industrial World';

// Read the generated lowercase files and re-export with correct names
const v1Content = fs.readFileSync(path.join(base, id + 'PromptV1.ts'), 'utf8').replace(new RegExp(id + 'PromptV1', 'g'), correctId + 'PromptV1');
const v2Content = fs.readFileSync(path.join(base, id + 'PromptV2.ts'), 'utf8').replace(new RegExp(id + 'PromptV2', 'g'), correctId + 'PromptV2');
const v3Content = fs.readFileSync(path.join(base, id + 'PromptV3.ts'), 'utf8').replace(new RegExp(id + 'PromptV3', 'g'), correctId + 'PromptV3');

fs.writeFileSync(path.join(base, correctId + 'PromptV1.ts'), v1Content);
fs.writeFileSync(path.join(base, correctId + 'PromptV2.ts'), v2Content);
fs.writeFileSync(path.join(base, correctId + 'PromptV3.ts'), v3Content);

// Remove lowercase duplicates
try { fs.unlinkSync(path.join(base, id + 'PromptV1.ts')); } catch(e) {}
try { fs.unlinkSync(path.join(base, id + 'PromptV2.ts')); } catch(e) {}
try { fs.unlinkSync(path.join(base, id + 'PromptV3.ts')); } catch(e) {}

// Write catalog with correct export name
const catalog = [
  `import { ${correctId}PromptV1 } from "./${correctId}PromptV1";`,
  `import { ${correctId}PromptV2 } from "./${correctId}PromptV2";`,
  `import { ${correctId}PromptV3 } from "./${correctId}PromptV3";`,
  ``,
  `export type ${componentName}Version = "V1" | "V2" | "V3";`,
  ``,
  `export interface ${componentName}PromptFamily {`,
  `  version: ${componentName}Version;`,
  `  promptHard: string;`,
  `  promptVariable: string;`,
  `  promptI2I: string;`,
  `  chip: string;`,
  `  title: string;`,
  `}`,
  ``,
  `export const NEO_AGRARIAN_BRUTALISM_PROMPT_FAMILIES: Record<${componentName}Version, ${componentName}PromptFamily> = {`,
  `  V1: { version: "V1", chip: "AUTHENTIC", title: "${v1Title}", ...${correctId}PromptV1 },`,
  `  V2: { version: "V2", chip: "ARTISAN", title: "${v2Title}", ...${correctId}PromptV2 },`,
  `  V3: { version: "V3", chip: "CINEMATIC", title: "${v3Title}", ...${correctId}PromptV3 },`,
  `};`,
  ``
].join('\n');

fs.writeFileSync(path.join(base, correctId + 'PromptCatalog.ts'), catalog);

// Fix types.ts import in component folder
const compFolder = path.join('c:', 'Users', 'asus', 'Desktop', 'wildmindai', 'wild', 'src', 'components', 'neoAgrarianBrutalism');
let types = fs.readFileSync(path.join(compFolder, 'types.ts'), 'utf8');
types = types.replace(new RegExp(id + 'PromptCatalog', 'g'), correctId + 'PromptCatalog');
types = types.replace(new RegExp('NEOAGRARIANBRUTALISM_PROMPT_FAMILIES', 'g'), 'NEO_AGRARIAN_BRUTALISM_PROMPT_FAMILIES');
fs.writeFileSync(path.join(compFolder, 'types.ts'), types);

console.log('Fixed neoAgrarianBrutalism casing.');
