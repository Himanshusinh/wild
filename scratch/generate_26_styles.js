const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const styles = [
  { id: "baghembroidery", componentName: "BaghEmbroidery", title: "BAGH EMBROIDERY", v1Title: "Authentic Bagh", v2Title: "Dimensional Bagh", v3Title: "3D Cinematic Bagh", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Bagh embroidery - Punjab.pdf" },
  { id: "bagruprint", componentName: "BagruPrint", title: "BAGRU PRINT", v1Title: "Authentic Bagru", v2Title: "Dimensional Bagru", v3Title: "3D Cinematic Bagru", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Bagru - Rajasthan.pdf" },
  { id: "bandhej", componentName: "Bandhej", title: "BANDHEJ", v1Title: "Authentic Bandhej", v2Title: "Dimensional Bandhej", v3Title: "3D Cinematic Bandhej", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Bandhej - Rajasthan.pdf" },
  { id: "berhampurpatta", componentName: "BerhampurPatta", title: "BERHAMPUR PATTA", v1Title: "Authentic Berhampur Patta", v2Title: "Dimensional Berhampur Patta", v3Title: "3D Cinematic Berhampur Patta", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Berhampur Patta - Odisha.pdf" },
  { id: "bomkai", componentName: "Bomkai", title: "BOMKAI", v1Title: "Authentic Bomkai", v2Title: "Dimensional Bomkai", v3Title: "3D Cinematic Bomkai", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Bomkai - Odisha.pdf" },
  { id: "buddhistmask", componentName: "BuddhistMask", title: "BUDDHIST MASK", v1Title: "Authentic Buddhist Mask", v2Title: "Dimensional Buddhist Mask", v3Title: "3D Cinematic Buddhist Mask", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Buddhist mask and wood object - Sikkim.pdf" },
  { id: "sikkimcarpet", componentName: "SikkimCarpet", title: "SIKKIM CARPET", v1Title: "Authentic Sikkim Carpet", v2Title: "Dimensional Sikkim Carpet", v3Title: "3D Cinematic Sikkim Carpet", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\carpet, wool systems - Sikkim.pdf" },
  { id: "durrie", componentName: "Durrie", title: "DURRIE", v1Title: "Authentic Durrie", v2Title: "Dimensional Durrie", v3Title: "3D Cinematic Durrie", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Durrie   - Punjab.pdf" },
  { id: "thangka", componentName: "Thangka", title: "THANGKA", v1Title: "Authentic Thangka", v2Title: "Dimensional Thangka", v3Title: "3D Cinematic Thangka", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Himalayan sacred-image, thangk -Sikkim.pdf" },
  { id: "punjabjutti", componentName: "PunjabJutti", title: "PUNJAB JUTTI", v1Title: "Authentic Punjab Jutti", v2Title: "Dimensional Punjab Jutti", v3Title: "3D Cinematic Punjab Jutti", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\jutti surface logic - Punjab.pdf" },
  { id: "kathputli", componentName: "Kathputli", title: "KATHPUTLI", v1Title: "Authentic Kathputli", v2Title: "Dimensional Kathputli", v3Title: "3D Cinematic Kathputli", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Kathputli - Rajasthan.pdf" },
  { id: "khaddar", componentName: "Khaddar", title: "KHADDAR", v1Title: "Authentic Khaddar", v2Title: "Dimensional Khaddar", v3Title: "3D Cinematic Khaddar", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Khaddar  - Punjab.pdf" },
  { id: "khandua", componentName: "Khandua", title: "KHANDUA", v1Title: "Authentic Khandua", v2Title: "Dimensional Khandua", v3Title: "3D Cinematic Khandua", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Khandua - Odisha.pdf" },
  { id: "khes", componentName: "Khes", title: "KHES", v1Title: "Authentic Khes", v2Title: "Dimensional Khes", v3Title: "3D Cinematic Khes", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Khes - Punjab.pdf" },
  { id: "malerkotlazari", componentName: "MalerkotlaZari", title: "MALERKOTLA ZARI", v1Title: "Authentic Malerkotla Zari", v2Title: "Dimensional Malerkotla Zari", v3Title: "3D Cinematic Malerkotla Zari", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Malerkotla Zari   - Punjab.pdf" },
  { id: "molela", componentName: "Molela", title: "MOLELA", v1Title: "Authentic Molela", v2Title: "Dimensional Molela", v3Title: "3D Cinematic Molela", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Molela - Rajasthan.pdf" },
  { id: "pichhwai", componentName: "Pichhwai", title: "PICHHWAI", v1Title: "Authentic Pichhwai", v2Title: "Dimensional Pichhwai", v3Title: "3D Cinematic Pichhwai", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Nathdwara Pichhwai - Rajasthan.pdf" },
  { id: "pattachitra", componentName: "Pattachitra", title: "PATTACHITRA", v1Title: "Authentic Pattachitra", v2Title: "Dimensional Pattachitra", v3Title: "3D Cinematic Pattachitra", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Pattachitra - Odisha.pdf" },
  { id: "pipili", componentName: "Pipili", title: "PIPILI", v1Title: "Authentic Pipili", v2Title: "Dimensional Pipili", v3Title: "3D Cinematic Pipili", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Pipli  - Odisha.pdf" },
  { id: "rajasthaniminiature", componentName: "RajasthaniMiniature", title: "RAJASTHANI MINIATURE", v1Title: "Authentic Rajasthani Miniature", v2Title: "Dimensional Rajasthani Miniature", v3Title: "3D Cinematic Rajasthani Miniature", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Rajasthani Miniature - Rajasthan.pdf" },
  { id: "sambalpuribandha", componentName: "SambalpuriBandha", title: "SAMBALPURI BANDHA", v1Title: "Authentic Sambalpuri Bandha", v2Title: "Dimensional Sambalpuri Bandha", v3Title: "3D Cinematic Sambalpuri Bandha", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Sambalpuri Bandha - Odisha.pdf" },
  { id: "sanganer", componentName: "Sanganer", title: "SANGANER", v1Title: "Authentic Sanganer", v2Title: "Dimensional Sanganer", v3Title: "3D Cinematic Sanganer", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Sanganer - Rajasthan.pdf" },
  { id: "ustaart", componentName: "UstaArt", title: "USTA ART", v1Title: "Authentic Usta Art", v2Title: "Dimensional Usta Art", v3Title: "3D Cinematic Usta Art", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Usta, Thewa, Blue Pottery - Rajasthan.pdf" },
  { id: "pipiliapplique", componentName: "PipiliApplique", title: "PIPILI APPLIQUÉ", v1Title: "Authentic Pipili Appliqué", v2Title: "Dimensional Pipili Appliqué", v3Title: "3D Cinematic Pipili Appliqué", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\wild mind ai style 2.pdf" },
  { id: "saura", componentName: "Saura", title: "SAURA", v1Title: "Authentic Saura", v2Title: "Dimensional Saura", v3Title: "3D Cinematic Saura", pdfPath: "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\pdf_content\\new\\Saura - Odisha.pdf" },
];

const SRC_ROOT = "c:\\Users\\asus\\Desktop\\wildmindai\\wild\\src";

function sanitize(text) {
  return (text || "").trim().replace(/`/g, "\\`").replace(/\${/g, "\\${");
}

function extractVersionBlock(fullText, versionLabel, nextVersionLabel) {
  const headers = [versionLabel + ' — ', versionLabel + ' - ', versionLabel + '—', versionLabel + '-', versionLabel];
  let startIdx = -1;
  for (const h of headers) {
    const idx = fullText.indexOf(h);
    if (idx !== -1) { startIdx = idx; break; }
  }
  if (startIdx === -1) return fullText;

  let endIdx = fullText.length;
  if (nextVersionLabel) {
    const nextHeaders = [nextVersionLabel + ' — ', nextVersionLabel + ' - ', nextVersionLabel + '—', nextVersionLabel + '-', nextVersionLabel];
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
    console.log('Processing: ' + style.id);

    let v1 = {}, v2 = {}, v3 = {};

    if (fs.existsSync(style.pdfPath)) {
      try {
        const dataBuffer = fs.readFileSync(style.pdfPath);
        const data = await pdf(dataBuffer);
        const fullText = data.text;

        const v1Block = extractVersionBlock(fullText, "V1", "V2");
        const v2Block = extractVersionBlock(fullText, "V2", "V3");
        const v3Block = extractVersionBlock(fullText, "V3", null);

        v1 = extractPrompts(v1Block);
        v2 = extractPrompts(v2Block);
        v3 = extractPrompts(v3Block);
      } catch (e) {
        console.error('Error parsing PDF: ' + style.pdfPath, e);
      }
    } else {
      console.warn('⚠ Missing PDF: ' + style.pdfPath);
    }

    if (!v1.promptHard) {
      v1.promptHard = 'Render this scene as a flat, pattern-authentic ' + style.title + ' composition, preserving traditional motifs, geometry, and color codes exactly.';
      v1.promptVariable = 'Render [SUBJECT] as a ' + style.title + ' pattern composition.';
      v1.promptI2I = 'Convert this image into a flat ' + style.title + ' pattern artwork preserving the original composition.';
    }
    if (!v2.promptHard) {
      v2.promptHard = 'Translate this scene into a semi-dimensional ' + style.title + ' world, keeping pattern authenticity while adding depth and craft texture.';
      v2.promptVariable = 'Translate [SUBJECT] into a dimensional ' + style.title + ' craft world.';
      v2.promptI2I = 'Convert this image into a dimensional ' + style.title + ' styled world with craft textures.';
    }
    if (!v3.promptHard) {
      v3.promptHard = 'Create a full 3D realistic cinematic world based on ' + style.title + '.';
      v3.promptVariable = 'Create [SUBJECT] as a full 3D realistic dimensional world generated from ' + style.title + '.';
      v3.promptI2I = 'Convert this source image into a full 3D realistic ' + style.title + ' world.';
    }

    const compDir = path.join(SRC_ROOT, "app", "view", "HomePage", "compo");
    const compFolder = path.join(SRC_ROOT, "components", style.id);

    if(!fs.existsSync(compDir)) fs.mkdirSync(compDir, {recursive: true});
    if(!fs.existsSync(compFolder)) fs.mkdirSync(compFolder, {recursive: true});

    fs.writeFileSync(path.join(compDir, style.id + 'PromptV1.ts'),
      'export const ' + style.id + 'PromptV1 = {\n' +
      '  promptHard: `' + sanitize(v1.promptHard) + '`,\n' +
      '  promptVariable: `' + sanitize(v1.promptVariable) + '`,\n' +
      '  promptI2I: `' + sanitize(v1.promptI2I) + '`\n' +
      '};\n'
    );
    fs.writeFileSync(path.join(compDir, style.id + 'PromptV2.ts'),
      'export const ' + style.id + 'PromptV2 = {\n' +
      '  promptHard: `' + sanitize(v2.promptHard) + '`,\n' +
      '  promptVariable: `' + sanitize(v2.promptVariable) + '`,\n' +
      '  promptI2I: `' + sanitize(v2.promptI2I) + '`\n' +
      '};\n'
    );
    fs.writeFileSync(path.join(compDir, style.id + 'PromptV3.ts'),
      'export const ' + style.id + 'PromptV3 = {\n' +
      '  promptHard: `' + sanitize(v3.promptHard) + '`,\n' +
      '  promptVariable: `' + sanitize(v3.promptVariable) + '`,\n' +
      '  promptI2I: `' + sanitize(v3.promptI2I) + '`\n' +
      '};\n'
    );

    fs.writeFileSync(path.join(compDir, style.id + 'PromptCatalog.ts'),
      'import { ' + style.id + 'PromptV1 } from "./' + style.id + 'PromptV1";\n' +
      'import { ' + style.id + 'PromptV2 } from "./' + style.id + 'PromptV2";\n' +
      'import { ' + style.id + 'PromptV3 } from "./' + style.id + 'PromptV3";\n\n' +
      'export type ' + style.componentName + 'Version = "V1" | "V2" | "V3";\n\n' +
      'export interface ' + style.componentName + 'PromptFamily {\n' +
      '  version: ' + style.componentName + 'Version;\n' +
      '  promptHard: string;\n' +
      '  promptVariable: string;\n' +
      '  promptI2I: string;\n' +
      '  chip: string;\n' +
      '  title: string;\n' +
      '}\n\n' +
      'export const ' + style.id.toUpperCase() + '_PROMPT_FAMILIES: Record<' + style.componentName + 'Version, ' + style.componentName + 'PromptFamily> = {\n' +
      '  V1: {\n' +
      '    version: "V1",\n' +
      '    chip: "AUTHENTIC",\n' +
      '    title: "' + style.v1Title + '",\n' +
      '    ...' + style.id + 'PromptV1,\n' +
      '  },\n' +
      '  V2: {\n' +
      '    version: "V2",\n' +
      '    chip: "ARTISAN",\n' +
      '    title: "' + style.v2Title + '",\n' +
      '    ...' + style.id + 'PromptV2,\n' +
      '  },\n' +
      '  V3: {\n' +
      '    version: "V3",\n' +
      '    chip: "CINEMATIC",\n' +
      '    title: "' + style.v3Title + '",\n' +
      '    ...' + style.id + 'PromptV3,\n' +
      '  },\n' +
      '};\n'
    );

    fs.writeFileSync(path.join(compFolder, 'types.ts'),
      'import type { ' + style.componentName + 'Version } from "@/app/view/HomePage/compo/' + style.id + 'PromptCatalog";\n' +
      'import type { WarliAspectRatioChoice } from "@/components/warli/warliNanoAspect";\n\n' +
      'export type StyleFamily = ' + style.componentName + 'Version;\n' +
      'export type InputMode = "text" | "image";\n' +
      'export type ModelId = "google/nano-banana-2" | "google/nano-banana-pro";\n' +
      'export type ImageCount = 1 | 2 | 4;\n' +
      'export type AspectRatio = WarliAspectRatioChoice;\n' +
      'export type RightPanelState = "empty" | "loading" | "results";\n\n' +
      'export interface ' + style.componentName + 'State {\n' +
      '  style: StyleFamily;\n' +
      '  inputMode: InputMode;\n' +
      '  sceneText: string;\n' +
      '  uploadedImage: string | null;\n' +
      '  imageNote: string;\n' +
      '  model: ModelId;\n' +
      '  resolution: string;\n' +
      '  imageCount: ImageCount;\n' +
      '  ratio: AspectRatio;\n' +
      '  includeVariable: boolean;\n' +
      '  panelState: RightPanelState;\n' +
      '  generatedImages: string[];\n' +
      '  assembledPrompt: string;\n' +
      '}\n\n' +
      'export const MODELS = [\n' +
      '  { id: "google/nano-banana-2" as const, label: "Nano Banana 2", tag: "Google" },\n' +
      '  { id: "google/nano-banana-pro" as const, label: "Nano Banana Pro", tag: "Google" },\n' +
      '];\n\n' +
      'export const IMAGE_COUNTS: ImageCount[] = [1, 2, 4];\n\n' +
      'export const STYLE_LABELS: Record<StyleFamily, { badge: string; title: string }> = {\n' +
      '  V1: { badge: "AUTHENTIC", title: "' + style.v1Title + '" },\n' +
      '  V2: { badge: "ARTISAN", title: "' + style.v2Title + '" },\n' +
      '  V3: { badge: "CINEMATIC", title: "' + style.v3Title + '" },\n' +
      '};\n\n' +
      'export const INITIAL_STATE: ' + style.componentName + 'State = {\n' +
      '  style: "V1",\n' +
      '  inputMode: "text",\n' +
      '  sceneText: "",\n' +
      '  uploadedImage: null,\n' +
      '  imageNote: "",\n' +
      '  model: "google/nano-banana-2",\n' +
      '  resolution: "1K",\n' +
      '  imageCount: 2,\n' +
      '  ratio: "auto",\n' +
      '  includeVariable: false,\n' +
      '  panelState: "empty",\n' +
      '  generatedImages: [],\n' +
      '  assembledPrompt: "",\n' +
      '};\n'
    );

    fs.writeFileSync(path.join(compFolder, style.componentName + 'Header.tsx'),
      '"use client";\n' +
      'import React from "react";\n' +
      'import { X } from "lucide-react";\n' +
      'import { StyleFamily, STYLE_LABELS } from "./types";\n\n' +
      'interface ' + style.componentName + 'HeaderProps {\n' +
      '  style: StyleFamily;\n' +
      '  onStyleChange: (s: StyleFamily) => void;\n' +
      '  onClose: () => void;\n' +
      '}\n\n' +
      'export function ' + style.componentName + 'Header({ style, onStyleChange, onClose }: ' + style.componentName + 'HeaderProps) {\n' +
      '  const families: StyleFamily[] = ["V1", "V2", "V3"];\n\n' +
      '  return (\n' +
      '    <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0E0E12] px-5 py-3">\n' +
      '      <div className="flex items-center gap-3">\n' +
      '        <div className="flex items-center gap-1.5 rounded-full border border-[#2F6BFF]/25 bg-[#2F6BFF]/[0.08] px-2.5 py-[5px]">\n' +
      '          <span className="h-1.5 w-1.5 rounded-full bg-[#2F6BFF] shadow-[0_0_5px_rgba(47,107,255,0.8)]" />\n' +
      '          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#60a5fa] whitespace-nowrap">\n' +
      '            ' + style.title + '\n' +
      '          </span>\n' +
      '        </div>\n' +
      '        <div className="ml-1 flex gap-0.5 rounded-xl border border-white/10 bg-[#13131a] p-[3px]">\n' +
      '          {families.map((f) => (\n' +
      '            <button\n' +
      '              key={f}\n' +
      '              type="button"\n' +
      '              onClick={() => onStyleChange(f)}\n' +
      '              className={`flex items-center gap-1.5 rounded-lg px-3 py-[5px] text-[11px] font-medium transition-all duration-150 ${ style === f ? "bg-[#1e1e28] text-white/85 shadow-[0_1px_4px_rgba(0,0,0,0.5)]" : "text-white/30 hover:text-white/55" }`}\n' +
      '            >\n' +
      '              <span>{f}</span>\n' +
      '              <span className={`rounded-[4px] px-[5px] py-px text-[9px] font-semibold tracking-[0.04em] ${ style === f ? "bg-[#2F6BFF]/[0.12] text-[#60a5fa]" : "bg-white/[0.04] text-white/20" }`}>\n' +
      '                {STYLE_LABELS[f].badge}\n' +
      '              </span>\n' +
      '            </button>\n' +
      '          ))}\n' +
      '        </div>\n' +
      '      </div>\n' +
      '      <button type="button" aria-label="Close" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/30 transition hover:bg-white/[0.08] hover:text-white/70">\n' +
      '        <X className="h-4 w-4" />\n' +
      '      </button>\n' +
      '    </header>\n' +
      '  );\n' +
      '}\n'
    );

    const modalContent = 
'"use client";\n' +
'import React, { useCallback, useEffect, useMemo, useReducer } from "react";\n' +
'import { toast } from "sonner";\n' +
'import { saveUpload } from "@/lib/libraryApi";\n' +
'import { ' + style.id.toUpperCase() + '_PROMPT_FAMILIES } from "@/app/view/HomePage/compo/' + style.id + 'PromptCatalog";\n' +
'import { useAppDispatch, useAppSelector } from "@/store/hooks";\n' +
'import type { RootState } from "@/store";\n' +
'import { falGenerate } from "@/store/slices/generationsApi";\n' +
'import { setFrameSize } from "@/store/slices/generationSlice";\n' +
'import { downloadAllImageUrls, downloadImageUrl } from "@/components/warli/warliDownload";\n' +
'import { ModeToggle } from "@/components/warli/ModeToggle";\n' +
'import { SceneInput } from "@/components/warli/SceneInput";\n' +
'import { UploadZone } from "@/components/warli/UploadZone";\n' +
'import { ModelSelector } from "@/components/warli/ModelSelector";\n' +
'import { SettingsPanel } from "@/components/warli/SettingsPanel";\n' +
'import { OutputGrid } from "@/components/warli/OutputGrid";\n' +
'import { PromptPreview } from "@/components/warli/PromptPreview";\n' +
'import { coerceStyleModalResolution, coerceWarliAspectRatio } from "@/components/warli/warliNanoAspect";\n' +
'import { ' + style.componentName + 'Header } from "./' + style.componentName + 'Header";\n' +
'import { FullscreenImageViewer } from "@/components/common/FullscreenImageViewer";\n' +
'import { INITIAL_STATE, ' + style.componentName + 'State, StyleFamily, InputMode, ModelId, ImageCount, AspectRatio, MODELS, STYLE_LABELS, RightPanelState } from "./types";\n\n' +
'const STYLE_TAG = "' + style.title + '";\n\n' +
'function toAbsoluteFromProxy(url: string): string {\n' +
'  try {\n' +
'    if (!url) return url;\n' +
'    if (url.startsWith("data:")) return url;\n' +
'    const ZATA_PREFIX = "https://idr01.zata.ai/devstoragev1/";\n' +
'    const RESOURCE_SEG = "/api/proxy/resource/";\n' +
'    if (url.startsWith(RESOURCE_SEG)) {\n' +
'      const decoded = decodeURIComponent(url.substring(RESOURCE_SEG.length));\n' +
'      return `${ZATA_PREFIX}${decoded}`;\n' +
'    }\n' +
'    if (url.startsWith("http://") || url.startsWith("https://")) {\n' +
'      const u = new URL(url);\n' +
'      if (u.pathname.startsWith(RESOURCE_SEG)) {\n' +
'        const decoded = decodeURIComponent(u.pathname.substring(RESOURCE_SEG.length));\n' +
'        return `${ZATA_PREFIX}${decoded}`;\n' +
'      }\n' +
'    }\n' +
'    return url;\n' +
'  } catch {\n' +
'    return url;\n' +
'  }\n' +
'}\n\n' +
'async function ensureHostedImageUrl(url: string): Promise<string> {\n' +
'  const normalized = toAbsoluteFromProxy(String(url || "").trim());\n' +
'  if (!normalized) return normalized;\n' +
'  if (normalized.startsWith("http://") || normalized.startsWith("https://")) return normalized;\n' +
'  if (normalized.startsWith("data:") || normalized.startsWith("blob:")) {\n' +
'    const resp = await saveUpload({ url: normalized, type: "image" });\n' +
'    if (resp.responseStatus === "success" && resp.data?.url) return resp.data.url;\n' +
'    throw new Error(resp.message || "Failed to prepare input image");\n' +
'  }\n' +
'  return normalized;\n' +
'}\n\n' +
'function extractImageUrls(result: unknown): string[] {\n' +
'  const r = result as { images?: Array<{ url?: string } | string> };\n' +
'  const imgs = r?.images;\n' +
'  if (!Array.isArray(imgs)) return [];\n' +
'  return imgs.map((item) => (typeof item === "string" ? item : item?.url)).filter((u): u is string => Boolean(u));\n' +
'}\n\n' +
'type Action = \n' +
'  | { type: "SET_STYLE"; payload: StyleFamily }\n' +
'  | { type: "SET_MODE"; payload: InputMode }\n' +
'  | { type: "SET_SCENE_TEXT"; payload: string }\n' +
'  | { type: "SET_UPLOADED_IMAGE"; payload: string | null }\n' +
'  | { type: "SET_IMAGE_NOTE"; payload: string }\n' +
'  | { type: "SET_MODEL"; payload: ModelId }\n' +
'  | { type: "SET_RESOLUTION"; payload: string }\n' +
'  | { type: "SET_COUNT"; payload: ImageCount }\n' +
'  | { type: "SET_RATIO"; payload: AspectRatio }\n' +
'  | { type: "SET_INCLUDE_VARIABLE"; payload: boolean }\n' +
'  | { type: "SET_PANEL_STATE"; payload: RightPanelState }\n' +
'  | { type: "SET_GENERATED_IMAGES"; payload: string[] }\n' +
'  | { type: "SET_ASSEMBLED_PROMPT"; payload: string }\n' +
'  | { type: "RESET" };\n\n' +
'function reducer(state: ' + style.componentName + 'State, action: Action): ' + style.componentName + 'State {\n' +
'  switch (action.type) {\n' +
'    case "SET_STYLE": return { ...state, style: action.payload };\n' +
'    case "SET_MODE": return { ...state, inputMode: action.payload };\n' +
'    case "SET_SCENE_TEXT": return { ...state, sceneText: action.payload };\n' +
'    case "SET_UPLOADED_IMAGE": return { ...state, uploadedImage: action.payload };\n' +
'    case "SET_IMAGE_NOTE": return { ...state, imageNote: action.payload };\n' +
'    case "SET_MODEL": {\n' +
'      const nextModel = action.payload;\n' +
'      const nextRatio = coerceWarliAspectRatio(state.ratio, nextModel);\n' +
'      const nextResolution = coerceStyleModalResolution(state.resolution, nextModel);\n' +
'      return { ...state, model: nextModel, ratio: nextRatio, resolution: nextResolution };\n' +
'    }\n' +
'    case "SET_RESOLUTION": return { ...state, resolution: coerceStyleModalResolution(action.payload, state.model) };\n' +
'    case "SET_COUNT": return { ...state, imageCount: action.payload };\n' +
'    case "SET_RATIO": return { ...state, ratio: action.payload };\n' +
'    case "SET_INCLUDE_VARIABLE": return { ...state, includeVariable: Boolean(action.payload) };\n' +
'    case "SET_PANEL_STATE": return { ...state, panelState: action.payload };\n' +
'    case "SET_GENERATED_IMAGES": return { ...state, generatedImages: action.payload };\n' +
'    case "SET_ASSEMBLED_PROMPT": return { ...state, assembledPrompt: action.payload };\n' +
'    case "RESET": return INITIAL_STATE;\n' +
'    default: return state;\n' +
'  }\n' +
'}\n\n' +
'function buildPrompt(state: ' + style.componentName + 'State): string {\n' +
'  const family = ' + style.id.toUpperCase() + '_PROMPT_FAMILIES[state.style];\n' +
'  const aspect = coerceWarliAspectRatio(state.ratio, state.model);\n' +
'  const projectInputs = state.inputMode === "text" ? state.sceneText.trim() : state.imageNote.trim();\n' +
'  const projectLine = projectInputs ? `- ${projectInputs}` : "- (none). Keep structured logic intact.";\n' +
'  const variableBlock = state.includeVariable ? `\\n\\nREFERENCE (OPTIONAL) - VARIABLE (slot-based):\\n${family.promptVariable.trim()}\\n` : "";\n\n' +
'  return [\n' +
'    "PRIMARY DIRECTIVE (STYLE LOCK - follow strictly):",\n' +
'    state.inputMode === "image" && state.uploadedImage ? family.promptI2I.trim() : family.promptHard.trim(),\n' +
'    variableBlock.trimEnd(),\n' +
'    "",\n' +
'    "PROJECT INPUTS:",\n' +
'    projectLine,\n' +
'    "",\n' +
'    "CONTENT CONSTRAINT (STRICT):",\n' +
'    "- Keep output in a 3D Realistic grammar.",\n' +
'    "",\n' +
'    "RENDER SETTINGS:",\n' +
'    `- Preferred aspect ratio: ${aspect === "auto" ? "auto" : aspect}`,\n' +
'    `- Preferred resolution: ${state.resolution}`,\n' +
'    `- Preferred image count: ${state.imageCount}`,\n' +
'  ].filter(Boolean).join("\\n");\n' +
'}\n\n' +
'export function ' + style.componentName + 'Modal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {\n' +
'  const dispatch = useAppDispatch();\n' +
'  const [state, dispatchLocal] = useReducer(reducer, INITIAL_STATE);\n' +
'  const [isVisible, setIsVisible] = React.useState(false);\n' +
'  const [fullscreenUrl, setFullscreenUrl] = React.useState<string | null>(null);\n\n' +
'  const nanoBananaGoogleSearch = useAppSelector((s: RootState) => s.generation.nanoBananaGoogleSearch);\n' +
'  const nanoBananaThinkingLevel = useAppSelector((s: RootState) => s.generation.nanoBananaThinkingLevel);\n' +
'  const nanoBananaLimitGenerations = useAppSelector((s: RootState) => s.generation.nanoBananaLimitGenerations);\n' +
'  const outputFormat = useAppSelector((s: RootState) => s.generation.outputFormat || "jpeg");\n\n' +
'  useEffect(() => {\n' +
'    if (!isOpen) { setIsVisible(false); return; }\n' +
'    dispatchLocal({ type: "RESET" });\n' +
'    const originalOverflow = document.body.style.overflow;\n' +
'    document.body.style.overflow = "hidden";\n' +
'    const openTimer = setTimeout(() => setIsVisible(true), 16);\n' +
'    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };\n' +
'    window.addEventListener("keydown", onKeyDown);\n' +
'    return () => { clearTimeout(openTimer); window.removeEventListener("keydown", onKeyDown); document.body.style.overflow = originalOverflow; };\n' +
'  }, [isOpen, onClose]);\n\n' +
'  const assembledPrompt = useMemo(() => buildPrompt(state), [state]);\n' +
'  const ratioSummary = useMemo(() => { const a = coerceWarliAspectRatio(state.ratio, state.model); return a === "auto" ? "auto" : a; }, [state.ratio, state.model]);\n\n' +
'  const handleRatioChange = useCallback((r: AspectRatio) => { dispatchLocal({ type: "SET_RATIO", payload: r }); dispatch(setFrameSize(r)); }, [dispatch]);\n\n' +
'  const handleGenerate = useCallback(async () => {\n' +
'    const prompt = buildPrompt(state);\n' +
'    dispatchLocal({ type: "SET_ASSEMBLED_PROMPT", payload: prompt });\n' +
'    dispatchLocal({ type: "SET_PANEL_STATE", payload: "loading" });\n' +
'    const promptForModel = `${prompt} [Style: ${STYLE_TAG}]`;\n' +
'    let uploadedForFal: string[] = [];\n' +
'    try {\n' +
'      if (state.inputMode === "image" && state.uploadedImage?.trim()) {\n' +
'        const hosted = await ensureHostedImageUrl(state.uploadedImage);\n' +
'        uploadedForFal = hosted ? [hosted] : [];\n' +
'      }\n' +
'    } catch (e) {\n' +
'      toast.error(e instanceof Error ? e.message : "Could not upload reference image");\n' +
'      dispatchLocal({ type: "SET_PANEL_STATE", payload: "empty" });\n' +
'      return;\n' +
'    }\n' +
'    const aspect = coerceWarliAspectRatio(state.ratio, state.model);\n' +
'    const generationType = state.inputMode === "image" && uploadedForFal.length > 0 ? "image-to-image" : "text-to-image";\n' +
'    try {\n' +
'      const res = await dispatch(falGenerate({\n' +
'        generationType, model: state.model, prompt: promptForModel,\n' +
'        meta: { style_premium: true, style_key: "' + style.id + '", style_version: state.style, source: "homepage-' + style.id + '-modal" },\n' +
'        aspect_ratio: aspect as any, num_images: state.imageCount, output_format: outputFormat, resolution: state.resolution,\n' +
'        thinking_level: nanoBananaThinkingLevel, enable_web_search: nanoBananaGoogleSearch, limit_generations: nanoBananaLimitGenerations,\n' +
'        ...(uploadedForFal.length ? { image_urls: uploadedForFal } : {}),\n' +
'      }) as any).unwrap();\n' +
'      const images = extractImageUrls((res as any)?.data ?? res);\n' +
'      dispatchLocal({ type: "SET_GENERATED_IMAGES", payload: images });\n' +
'      dispatchLocal({ type: "SET_PANEL_STATE", payload: images.length ? "results" : "empty" });\n' +
'      if (!images.length) toast.error("No images returned");\n' +
'    } catch (e) {\n' +
'      toast.error(e instanceof Error ? e.message : "Generation failed");\n' +
'      dispatchLocal({ type: "SET_PANEL_STATE", payload: "empty" });\n' +
'    }\n' +
'  }, [dispatch, nanoBananaGoogleSearch, nanoBananaLimitGenerations, nanoBananaThinkingLevel, outputFormat, state]);\n\n' +
'  const handleSaveAll = useCallback(async () => {\n' +
'    const urls = state.generatedImages.filter(Boolean);\n' +
'    if (!urls.length) return;\n' +
'    const t = toast.loading("Saving images...");\n' +
'    try { await downloadAllImageUrls(urls, `' + style.id + '-${state.style}`); toast.dismiss(t); toast.success("Downloads started"); } \n' +
'    catch { toast.dismiss(t); toast.error("Save all failed"); }\n' +
'  }, [state.generatedImages, state.style]);\n\n' +
'  const handleSaveImage = useCallback(async (index: number) => {\n' +
'    const url = state.generatedImages[index];\n' +
'    if (!url) return;\n' +
'    const t = toast.loading("Saving...");\n' +
'    try { await downloadImageUrl(url, `' + style.id + '-${state.style}-${index + 1}`); toast.dismiss(t); toast.success("Download started"); } \n' +
'    catch { toast.dismiss(t); toast.error("Save failed"); }\n' +
'  }, [state.generatedImages, state.style]);\n\n' +
'  if (!isOpen) return null;\n' +
'  const familyMeta = ' + style.id.toUpperCase() + '_PROMPT_FAMILIES[state.style];\n' +
'  const styleTitle = `${state.style} - ${familyMeta.chip}`;\n\n' +
'  return (\n' +
'    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/45 p-3 sm:p-6 backdrop-blur-2xl">\n' +
'      <div className="absolute inset-0" onClick={onClose} aria-hidden />\n' +
'      <div role="dialog" aria-modal="true" aria-label="' + style.title + ' Generator" className={`relative flex w-[min(1080px,calc(100vw-24px))] h-[min(760px,calc(100vh-24px))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E12]/95 shadow-[0_24px_70px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.04] transition-all duration-300 ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-[0.985]"}`}>\n' +
'        <' + style.componentName + 'Header style={state.style} onStyleChange={(s) => dispatchLocal({ type: "SET_STYLE", payload: s })} onClose={onClose} />\n' +
'        <div className="grid min-h-0 flex-1 overflow-hidden lg:[grid-template-columns:420px_1fr]">\n' +
'          <aside className="flex flex-col overflow-hidden border-r border-white/10 bg-[#0E0E12]">\n' +
'            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar]:w-1">\n' +
'              <div className="flex flex-col gap-2">\n' +
'                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">Input</span>\n' +
'                <ModeToggle mode={state.inputMode} onChange={(v) => dispatchLocal({ type: "SET_MODE", payload: v })} />\n' +
'              </div>\n' +
'              {state.inputMode === "text" ? (\n' +
'                <SceneInput value={state.sceneText} onChange={(v) => dispatchLocal({ type: "SET_SCENE_TEXT", payload: v })} />\n' +
'              ) : (\n' +
'                <div className="flex flex-col gap-3">\n' +
'                  <UploadZone uploadedImage={state.uploadedImage} onUpload={(v) => dispatchLocal({ type: "SET_UPLOADED_IMAGE", payload: v })} />\n' +
'                  <textarea value={state.imageNote} onChange={(e) => dispatchLocal({ type: "SET_IMAGE_NOTE", payload: e.target.value })} rows={3} placeholder="Optional notes..." className="w-full resize-none rounded-xl border border-white/10 bg-[#13131a] px-4 py-3 text-[13px] leading-relaxed text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-white/20" />\n' +
'                </div>\n' +
'              )}\n' +
'              <div className="flex flex-col gap-2">\n' +
'                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">Model</span>\n' +
'                <ModelSelector value={state.model} onChange={(v) => dispatchLocal({ type: "SET_MODEL", payload: v })} />\n' +
'              </div>\n' +
'              <SettingsPanel model={state.model} resolution={state.resolution} imageCount={state.imageCount} ratio={state.ratio} includeBenchmark={false} includeVariable={state.includeVariable} includeRestyle={false} onCountChange={(v) => dispatchLocal({ type: "SET_COUNT", payload: v })} onResolutionChange={(v) => dispatchLocal({ type: "SET_RESOLUTION", payload: v })} onRatioChange={handleRatioChange} onIncludeBenchmarkChange={() => {}} onIncludeVariableChange={(v) => dispatchLocal({ type: "SET_INCLUDE_VARIABLE", payload: v })} onIncludeRestyleChange={() => {}} />\n' +
'            </div>\n' +
'            <div className="border-t border-white/[0.06] bg-[#0E0E12] px-5 py-3">\n' +
'              <div className=\"flex flex-wrap gap-2 text-[11px] text-white/35\">\n' +
'                <span className=\"rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1\">{styleTitle}</span>\n' +
'                <span className=\"rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1\">{MODELS.find((m) => m.id === state.model)?.label ?? state.model}</span>\n' +
'                <span className=\"rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1\">{state.imageCount} img</span>\n' +
'                <span className=\"rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1\">{state.resolution}</span>\n' +
'                <span className=\"rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1\">{ratioSummary}</span>\n' +
'              </div>\n' +
'            </div>\n' +
'            <div className=\"border-t border-white/[0.06] bg-[#0E0E12] px-5 py-4\">\n' +
'              <button type=\"button\" onClick={() => void handleGenerate()} disabled={state.panelState === \"loading\"} className=\"w-full rounded-lg bg-[#2F6BFF] py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#2F6BFF]/90 disabled:opacity-50\">Generate ' + style.title + '</button>\n' +
'            </div>\n' +
'          </aside>\n' +
'          <main className=\"flex min-h-0 flex-col overflow-hidden bg-[#0a0a0f]\">\n' +
'            <div className=\"flex items-center justify-between border-b border-white/[0.06] bg-[#0E0E12] px-5 py-3.5\">\n' +
'              <span className=\"text-xs font-medium text-white/25\">\n' +
'                {state.panelState === \"results\" ? `${state.imageCount} ${state.imageCount === 1 ? "image" : "images"} - ${STYLE_LABELS[state.style].title}` : state.panelState === \"loading\" ? \"Generating...\" : \"Output will appear here\"}\n' +
'              </span>\n' +
'              {state.panelState === \"results\" ? (\n' +
'                <div className=\"flex gap-1.5\">\n' +
'                  <button type=\"button\" onClick={() => void handleGenerate()} className=\"rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/40 transition-all hover:border-white/20 hover:text-white/70\">Regenerate</button>\n' +
'                  <button type=\"button\" onClick={() => void handleSaveAll()} disabled={!state.generatedImages.some(Boolean)} className=\"rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/40 transition-all hover:border-white/20 hover:text-white/70 disabled:pointer-events-none disabled:opacity-35\">Save all</button>\n' +
'                </div>\n' +
'              ) : null}\n' +
'            </div>\n' +
'            <div className=\"flex flex-1 flex-col overflow-y-auto p-5 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar]:w-1\">\n' +
'              {state.panelState === \"empty\" ? (\n' +
'                <div className=\"flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center\">\n' +
'                  <p className=\"text-sm font-medium text-white/20\">No output yet</p>\n' +
'                  <p className=\"max-w-[320px] text-xs leading-relaxed text-white/10\">Describe a scene (or upload an image), then Generate.</p>\n' +
'                </div>\n' +
'              ) : null}\n' +
'              {state.panelState === \"loading\" ? (\n' +
'                <div className=\"flex flex-1 flex-col items-center justify-center gap-6 p-6\">\n' +
'                  <div className={`grid w-full gap-3 ${state.imageCount === 1 ? "grid-cols-1 max-w-lg" : "grid-cols-2"}`}>\n' +
'                    {Array.from({ length: state.imageCount }).map((_, i) => (\n' +
'                      <div key={i} className=\"relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-[#111117]\">\n' +
'                        <img src=\"/styles/Logo.gif\" alt=\"Generating...\" className=\"h-16 w-16 object-contain opacity-40\" draggable={false} />\n' +
'                      </div>\n' +
'                    ))}\n' +
'                  </div>\n' +
'                  <p className=\"text-[11px] text-white/20\">Generating...</p>\n' +
'                </div>\n' +
'              ) : null}\n' +
'              {state.panelState === \"results\" ? (\n' +
'                <div className=\"flex flex-col gap-4\">\n' +
'                  <OutputGrid images={state.generatedImages} count={state.imageCount} onSaveImage={(i) => void handleSaveImage(i)} onExpandImage={(i) => { const url = state.generatedImages[i]; if (!url) return; setFullscreenUrl(url); }} />\n' +
'                  <PromptPreview prompt={assembledPrompt} />\n' +
'                </div>\n' +
'              ) : null}\n' +
'            </div>\n' +
'          </main>\n' +
'        </div>\n' +
'      </div>\n' +
'      <FullscreenImageViewer isOpen={Boolean(fullscreenUrl)} src={fullscreenUrl || \"\"} onClose={() => setFullscreenUrl(null)} />\n' +
'    </div>\n' +
'  );\n' +
'}\n';

    fs.writeFileSync(path.join(compFolder, style.componentName + 'Modal.tsx'), modalContent);

    fs.writeFileSync(path.join(compFolder, 'index.ts'), 'export * from "./' + style.componentName + 'Modal";\n');

    fs.writeFileSync(path.join(compDir, style.componentName + "FullscreenWalkthrough.tsx"),
'"use client";\n' +
'import React from "react";\n' +
'import { ' + style.componentName + 'Modal } from "@/components/' + style.id + '";\n' +
'export default function ' + style.componentName + 'FullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {\n' +
'  return <' + style.componentName + 'Modal isOpen={isOpen} onClose={onClose} />;\n' +
'}\n'
    );

    console.log('  ✓ Done: ' + style.id);
  }

  console.log("\\n✅ All 25 styles generated!");
}

run();
