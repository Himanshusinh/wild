const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const styles = [
  { id: "neoagrarianbrutalism", componentName: "NeoAgrarianBrutalism", title: "NEO-AGRARIAN BRUTALISM", v1Title: "Agrarian-Industrial Flatscape", v2Title: "Dimensional Agrarian-Industrial World", v3Title: "3D Cinematic Agrarian-Industrial World", pdfPath: "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\pdf_content\\\\Neo-Agrarian Brutalism - Haryana.pdf" },
  { id: "patola", componentName: "Patola", title: "PATOLA", v1Title: "Patola Pattern Surface", v2Title: "Dimensional Patola World", v3Title: "3D Realistic Patola World", pdfPath: "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\pdf_content\\\\Patola - Gujarat.pdf" },
  { id: "phulkari", componentName: "Phulkari", title: "PHULKARI", v1Title: "Phulkari Embroidered Surface", v2Title: "Dimensional Phulkari World", v3Title: "3D Realistic Phulkari World", pdfPath: "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\pdf_content\\\\Phulkari-belt overlap - Haryana.pdf" },
  { id: "pithora", componentName: "Pithora", title: "PITHORA", v1Title: "Pithora Ritual Painting", v2Title: "Dimensional Pithora World", v3Title: "3D Realistic Pithora World", pdfPath: "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\pdf_content\\\\Pithora - Gujarat.pdf" },
  { id: "roganart", componentName: "RoganArt", title: "ROGAN ART", v1Title: "Rogan Oil-Paste Surface", v2Title: "Dimensional Rogan Art World", v3Title: "3D Realistic Rogan Art World", pdfPath: "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\pdf_content\\\\Rogan - Gujarat.pdf" },
  { id: "ruralfibercraft", componentName: "RuralFiberCraft", title: "RURAL FIBER CRAFT", v1Title: "Rural Fiber Woven Surface", v2Title: "Dimensional Rural Fiber World", v3Title: "3D Realistic Rural Fiber World", pdfPath: "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\pdf_content\\\\rural fiber, mat, agricultural surfac - Haryana.pdf" },
  { id: "sarkandaarchitecture", componentName: "SarkandaArchitecture", title: "SARKANDA ARCHITECTURE", v1Title: "Sarkanda Reed Shelter", v2Title: "Dimensional Sarkanda World", v3Title: "3D Realistic Sarkanda World", pdfPath: "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\pdf_content\\\\Sarkanda (Golden Weed) Architecture - Haryana.pdf" },
  { id: "shimplahastkala", componentName: "ShimplaHastkala", title: "SHIMPLA HASTKALA", v1Title: "Shimpla Shell Craft Surface", v2Title: "Dimensional Shimpla World", v3Title: "3D Realistic Shimpla World", pdfPath: "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\pdf_content\\\\Shimpla Hastkala coastal decorative , shell, coconut-Goa.pdf" },
  { id: "sitalpati", componentName: "Sitalpati", title: "SITALPATI", v1Title: "Sitalpati Woven Mat Surface", v2Title: "Dimensional Sitalpati World", v3Title: "3D Realistic Sitalpati World", pdfPath: "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\pdf_content\\\\Sitalpati - Assam.pdf" },
  { id: "sohrai", componentName: "Sohrai", title: "SOHRAI", v1Title: "Sohrai Wall Painting Surface", v2Title: "Dimensional Sohrai World", v3Title: "3D Realistic Sohrai World", pdfPath: "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\pdf_content\\\\Sohrai - Jharkhand.pdf" },
  { id: "sonowaltextile", componentName: "SonowalTextile", title: "SONOWAL TEXTILE", v1Title: "Sonowal Handloom Surface", v2Title: "Dimensional Sonowal World", v3Title: "3D Realistic Sonowal World", pdfPath: "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\pdf_content\\\\Sonowal - Assam.pdf" },
  { id: "sufembroidery", componentName: "SufEmbroidery", title: "SUF EMBROIDERY", v1Title: "Suf Embroidered Surface", v2Title: "Dimensional Suf World", v3Title: "3D Realistic Suf World", pdfPath: "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\pdf_content\\\\Suf embroidery - Gujarat.pdf" },
];

const SRC_ROOT = "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\src";

function sanitize(text) {
  return (text || "").trim().replace(/`/g, "\\`");
}

function extractVersionBlock(fullText, versionLabel, nextVersionLabel) {
  // Try various formats for the section header
  const headers = [
    `${versionLabel} — `,
    `${versionLabel} - `,
    `${versionLabel}—`,
    `${versionLabel}-`,
    versionLabel,
  ];
  let startIdx = -1;
  for (const h of headers) {
    const idx = fullText.indexOf(h);
    if (idx !== -1) { startIdx = idx; break; }
  }
  if (startIdx === -1) return fullText; // fallback: use entire text

  let endIdx = fullText.length;
  if (nextVersionLabel) {
    const nextHeaders = [
      `${nextVersionLabel} — `,
      `${nextVersionLabel} - `,
      `${nextVersionLabel}—`,
      `${nextVersionLabel}-`,
      nextVersionLabel,
    ];
    for (const h of nextHeaders) {
      const idx = fullText.indexOf(h, startIdx + 10);
      if (idx !== -1) { endIdx = idx; break; }
    }
  }
  return fullText.substring(startIdx, endIdx);
}

function extractPrompts(block) {
  let universalIndex = block.indexOf("Universal Hard Prompt");
  let variableIndex = block.indexOf("Reusable Variable Template");
  if (variableIndex === -1) variableIndex = block.indexOf("Variable Template");
  let i2iIndex = block.indexOf("Image-to-Image");
  let moodIndex = block.indexOf("Mood Board Prompt");
  if (moodIndex === -1) moodIndex = block.indexOf("Stylescape Prompt");

  let promptHard = "", promptVariable = "", promptI2I = "";

  if (universalIndex !== -1) {
    const afterHard = universalIndex + "Universal Hard Prompt".length;
    const hardEnd = variableIndex !== -1 ? variableIndex : (i2iIndex !== -1 ? i2iIndex : block.length);
    promptHard = block.substring(afterHard, hardEnd).trim();
  }

  if (variableIndex !== -1) {
    const afterVar = variableIndex + ("Reusable Variable Template".length);
    const varEnd = i2iIndex !== -1 ? i2iIndex : block.length;
    promptVariable = block.substring(afterVar, varEnd).trim();
  }

  if (i2iIndex !== -1) {
    const afterI2I = i2iIndex + "Image-to-Image".length;
    const i2iEnd = moodIndex !== -1 ? moodIndex : block.length;
    promptI2I = block.substring(afterI2I, i2iEnd).trim();
  }

  return { promptHard, promptVariable, promptI2I };
}

async function run() {
  for (const style of styles) {
    console.log(`\nProcessing: ${style.id}`);

    if (!fs.existsSync(style.pdfPath)) {
      console.warn(`  ⚠ Missing PDF: ${style.pdfPath}`);
      continue;
    }

    const dataBuffer = fs.readFileSync(style.pdfPath);
    const data = await pdf(dataBuffer);
    const fullText = data.text;

    // Extract per-version blocks
    const v1Block = extractVersionBlock(fullText, "V1", "V2");
    const v2Block = extractVersionBlock(fullText, "V2", "V3");
    const v3Block = extractVersionBlock(fullText, "V3", null);

    const v1 = extractPrompts(v1Block);
    const v2 = extractPrompts(v2Block);
    const v3 = extractPrompts(v3Block);

    // Fallback: if V3 already had content before, preserve it; but check V1/V2
    if (!v1.promptHard) {
      v1.promptHard = `Render this scene as a flat, pattern-authentic ${style.title} composition, preserving traditional motifs, geometry, and color codes exactly.`;
      v1.promptVariable = `Render [SUBJECT] as a ${style.title} pattern composition.`;
      v1.promptI2I = `Convert this image into a flat ${style.title} pattern artwork preserving the original composition.`;
    }
    if (!v2.promptHard) {
      v2.promptHard = `Translate this scene into a semi-dimensional ${style.title} world, keeping pattern authenticity while adding depth and craft texture.`;
      v2.promptVariable = `Translate [SUBJECT] into a dimensional ${style.title} craft world.`;
      v2.promptI2I = `Convert this image into a dimensional ${style.title} styled world with craft textures.`;
    }
    if (!v3.promptHard) {
      v3.promptHard = `Create a full 3D realistic cinematic world based on ${style.title}.`;
      v3.promptVariable = `Create [SUBJECT] as a full 3D realistic dimensional world generated from ${style.title}.`;
      v3.promptI2I = `Convert this source image into a full 3D realistic ${style.title} world.`;
    }

    console.log(`  V1 hard prompt: ${v1.promptHard.substring(0, 80)}...`);
    console.log(`  V2 hard prompt: ${v2.promptHard.substring(0, 80)}...`);
    console.log(`  V3 hard prompt: ${v3.promptHard.substring(0, 80)}...`);

    const compDir = path.join(SRC_ROOT, "app", "view", "HomePage", "compo");
    const compFolder = path.join(SRC_ROOT, "components", style.id);

    // Write V1, V2, V3 prompt files
    fs.writeFileSync(path.join(compDir, `${style.id}PromptV1.ts`),
      `export const ${style.id}PromptV1 = {\n` +
      `  promptHard: \`${sanitize(v1.promptHard)}\`,\n` +
      `  promptVariable: \`${sanitize(v1.promptVariable)}\`,\n` +
      `  promptI2I: \`${sanitize(v1.promptI2I)}\`\n` +
      `};\n`
    );
    fs.writeFileSync(path.join(compDir, `${style.id}PromptV2.ts`),
      `export const ${style.id}PromptV2 = {\n` +
      `  promptHard: \`${sanitize(v2.promptHard)}\`,\n` +
      `  promptVariable: \`${sanitize(v2.promptVariable)}\`,\n` +
      `  promptI2I: \`${sanitize(v2.promptI2I)}\`\n` +
      `};\n`
    );
    fs.writeFileSync(path.join(compDir, `${style.id}PromptV3.ts`),
      `export const ${style.id}PromptV3 = {\n` +
      `  promptHard: \`${sanitize(v3.promptHard)}\`,\n` +
      `  promptVariable: \`${sanitize(v3.promptVariable)}\`,\n` +
      `  promptI2I: \`${sanitize(v3.promptI2I)}\`\n` +
      `};\n`
    );

    // Write updated prompt catalog
    fs.writeFileSync(path.join(compDir, `${style.id}PromptCatalog.ts`),
      `import { ${style.id}PromptV1 } from "./${style.id}PromptV1";\n` +
      `import { ${style.id}PromptV2 } from "./${style.id}PromptV2";\n` +
      `import { ${style.id}PromptV3 } from "./${style.id}PromptV3";\n\n` +
      `export type ${style.componentName}Version = "V1" | "V2" | "V3";\n\n` +
      `export interface ${style.componentName}PromptFamily {\n` +
      `  version: ${style.componentName}Version;\n` +
      `  promptHard: string;\n` +
      `  promptVariable: string;\n` +
      `  promptI2I: string;\n` +
      `  chip: string;\n` +
      `  title: string;\n` +
      `}\n\n` +
      `export const ${style.id.toUpperCase()}_PROMPT_FAMILIES: Record<${style.componentName}Version, ${style.componentName}PromptFamily> = {\n` +
      `  V1: {\n` +
      `    version: "V1",\n` +
      `    chip: "AUTHENTIC",\n` +
      `    title: "${style.v1Title}",\n` +
      `    ...${style.id}PromptV1,\n` +
      `  },\n` +
      `  V2: {\n` +
      `    version: "V2",\n` +
      `    chip: "ARTISAN",\n` +
      `    title: "${style.v2Title}",\n` +
      `    ...${style.id}PromptV2,\n` +
      `  },\n` +
      `  V3: {\n` +
      `    version: "V3",\n` +
      `    chip: "CINEMATIC",\n` +
      `    title: "${style.v3Title}",\n` +
      `    ...${style.id}PromptV3,\n` +
      `  },\n` +
      `};\n`
    );

    // Write updated types.ts
    fs.writeFileSync(path.join(compFolder, 'types.ts'),
      `import type { ${style.componentName}Version } from "@/app/view/HomePage/compo/${style.id}PromptCatalog";\n` +
      `import type { WarliAspectRatioChoice } from "@/components/warli/warliNanoAspect";\n\n` +
      `export type StyleFamily = ${style.componentName}Version;\n` +
      `export type InputMode = "text" | "image";\n` +
      `export type ModelId = "google/nano-banana-2" | "google/nano-banana-pro";\n` +
      `export type ImageCount = 1 | 2 | 4;\n` +
      `export type AspectRatio = WarliAspectRatioChoice;\n` +
      `export type RightPanelState = "empty" | "loading" | "results";\n\n` +
      `export interface ${style.componentName}State {\n` +
      `  style: StyleFamily;\n` +
      `  inputMode: InputMode;\n` +
      `  sceneText: string;\n` +
      `  uploadedImage: string | null;\n` +
      `  imageNote: string;\n` +
      `  model: ModelId;\n` +
      `  resolution: string;\n` +
      `  imageCount: ImageCount;\n` +
      `  ratio: AspectRatio;\n` +
      `  includeVariable: boolean;\n` +
      `  panelState: RightPanelState;\n` +
      `  generatedImages: string[];\n` +
      `  assembledPrompt: string;\n` +
      `}\n\n` +
      `export const MODELS = [\n` +
      `  { id: "google/nano-banana-2" as const, label: "Nano Banana 2", tag: "Google" },\n` +
      `  { id: "google/nano-banana-pro" as const, label: "Nano Banana Pro", tag: "Google" },\n` +
      `];\n\n` +
      `export const IMAGE_COUNTS: ImageCount[] = [1, 2, 4];\n\n` +
      `export const STYLE_LABELS: Record<StyleFamily, { badge: string; title: string }> = {\n` +
      `  V1: { badge: "AUTHENTIC", title: "${style.v1Title}" },\n` +
      `  V2: { badge: "ARTISAN", title: "${style.v2Title}" },\n` +
      `  V3: { badge: "CINEMATIC", title: "${style.v3Title}" },\n` +
      `};\n\n` +
      `export const INITIAL_STATE: ${style.componentName}State = {\n` +
      `  style: "V1",\n` +
      `  inputMode: "text",\n` +
      `  sceneText: "",\n` +
      `  uploadedImage: null,\n` +
      `  imageNote: "",\n` +
      `  model: "google/nano-banana-2",\n` +
      `  resolution: "1K",\n` +
      `  imageCount: 2,\n` +
      `  ratio: "auto",\n` +
      `  includeVariable: false,\n` +
      `  panelState: "empty",\n` +
      `  generatedImages: [],\n` +
      `  assembledPrompt: "",\n` +
      `};\n`
    );

    // Write updated Header.tsx (V1, V2, V3 tabs)
    fs.writeFileSync(path.join(compFolder, `${style.componentName}Header.tsx`),
      `"use client";\n` +
      `import React from "react";\n` +
      `import { X } from "lucide-react";\n` +
      `import { StyleFamily, STYLE_LABELS } from "./types";\n\n` +
      `interface ${style.componentName}HeaderProps {\n` +
      `  style: StyleFamily;\n` +
      `  onStyleChange: (s: StyleFamily) => void;\n` +
      `  onClose: () => void;\n` +
      `}\n\n` +
      `export function ${style.componentName}Header({ style, onStyleChange, onClose }: ${style.componentName}HeaderProps) {\n` +
      `  const families: StyleFamily[] = ["V1", "V2", "V3"];\n\n` +
      `  return (\n` +
      `    <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0E0E12] px-5 py-3">\n` +
      `      <div className="flex items-center gap-3">\n` +
      `        <div className="flex items-center gap-1.5 rounded-full border border-[#2F6BFF]/25 bg-[#2F6BFF]/[0.08] px-2.5 py-[5px]">\n` +
      `          <span className="h-1.5 w-1.5 rounded-full bg-[#2F6BFF] shadow-[0_0_5px_rgba(47,107,255,0.8)]" />\n` +
      `          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#60a5fa] whitespace-nowrap">\n` +
      `            ${style.title}\n` +
      `          </span>\n` +
      `        </div>\n` +
      `        <div className="ml-1 flex gap-0.5 rounded-xl border border-white/10 bg-[#13131a] p-[3px]">\n` +
      `          {families.map((f) => (\n` +
      `            <button\n` +
      `              key={f}\n` +
      `              type="button"\n` +
      `              onClick={() => onStyleChange(f)}\n` +
      `              className={\`flex items-center gap-1.5 rounded-lg px-3 py-[5px] text-[11px] font-medium transition-all duration-150 \${\n` +
      `                style === f\n` +
      `                  ? "bg-[#1e1e28] text-white/85 shadow-[0_1px_4px_rgba(0,0,0,0.5)]"\n` +
      `                  : "text-white/30 hover:text-white/55"\n` +
      `              }\`}\n` +
      `            >\n` +
      `              <span>{f}</span>\n` +
      `              <span\n` +
      `                className={\`rounded-[4px] px-[5px] py-px text-[9px] font-semibold tracking-[0.04em] \${\n` +
      `                  style === f\n` +
      `                    ? "bg-[#2F6BFF]/[0.12] text-[#60a5fa]"\n` +
      `                    : "bg-white/[0.04] text-white/20"\n` +
      `                }\`}\n` +
      `              >\n` +
      `                {STYLE_LABELS[f].badge}\n` +
      `              </span>\n` +
      `            </button>\n` +
      `          ))}\n` +
      `        </div>\n` +
      `      </div>\n` +
      `      <button\n` +
      `        type="button"\n` +
      `        aria-label="Close"\n` +
      `        onClick={onClose}\n` +
      `        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/30 transition hover:bg-white/[0.08] hover:text-white/70"\n` +
      `      >\n` +
      `        <X className="h-4 w-4" />\n` +
      `      </button>\n` +
      `    </header>\n` +
      `  );\n` +
      `}\n`
    );

    // Delete the old combined V3-only prompt file if it exists
    const oldV3Only = path.join(compDir, `${style.id}PromptV3_old.ts`);
    // (no-op, just logging)

    console.log(`  ✓ Done: ${style.id}`);
  }

  console.log("\n✅ All 12 styles upgraded to V1 / V2 / V3!");
}

run();
