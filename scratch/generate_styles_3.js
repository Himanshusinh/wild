const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const styles = [
  {
    id: "sohrai",
    name: "Jharkhand",
    title: "SOHRAI",
    desc: "A ritual wall painting tradition where mud-house surfaces are transformed using natural earth pigments into living murals of animals, plants, and harvest life.",
    image: "/HomePage/creativeStyle/SOHRAI.avif",
    pdfPath: "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\pdf_content\\\\Sohrai - Jharkhand.pdf",
    componentName: "Sohrai"
  },
  {
    id: "sonowaltextile",
    name: "Assam",
    title: "SONOWAL TEXTILE",
    desc: "A community-specific handloom tradition defined by woven borders, rhythmic bands, and identity-driven textile design.",
    image: "/HomePage/creativeStyle/SONOWAL TEXTILE.avif",
    pdfPath: "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\pdf_content\\\\Sonowal - Assam.pdf",
    componentName: "SonowalTextile"
  },
  {
    id: "sufembroidery",
    name: "Gujarat",
    title: "SUF EMBROIDERY",
    desc: "A counted embroidery tradition built through triangular geometry, where patterns emerge from precise stitching rather than pre-drawn design.",
    image: "/HomePage/creativeStyle/SUF EMBROIDERY.avif",
    pdfPath: "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\pdf_content\\\\Suf embroidery - Gujarat.pdf",
    componentName: "SufEmbroidery"
  }
];

const SRC_ROOT = "c:\\\\Users\\\\asus\\\\Desktop\\\\wildmindai\\\\wild\\\\src";

function sanitizeEx(text) {
  return text.trim().replace(/\`/g, '\\`');
}

async function run() {
  for (const style of styles) {
    if (!fs.existsSync(style.pdfPath)) {
      console.warn("Missing PDF: " + style.pdfPath);
      continue;
    }
    const dataBuffer = fs.readFileSync(style.pdfPath);
    const data = await pdf(dataBuffer);
    const text = data.text;
    
    let v3Index = text.indexOf("V3 — 3D / Realistic / Cinematic Translation");
    if (v3Index === -1) v3Index = text.indexOf("V3 - 3D / Realistic / Cinematic Translation");
    if (v3Index === -1) v3Index = text.indexOf("V3"); 
    
    const v3Text = v3Index !== -1 ? text.substring(v3Index) : text;
    
    let universalIndex = v3Text.indexOf("Universal Hard Prompt");
    let variableIndex = v3Text.indexOf("Reusable Variable Template");
    if(variableIndex === -1 && v3Text.indexOf("Variable Template") !== -1) variableIndex = v3Text.indexOf("Variable Template");
    let i2iIndex = v3Text.indexOf("Image-to-Image");
    let moodIndex = v3Text.indexOf("Mood Board Prompt");
    if(moodIndex === -1 && v3Text.indexOf("Stylescape Prompt") !== -1) moodIndex = v3Text.indexOf("Stylescape Prompt");

    let promptHard = "";
    let promptVariable = "";
    let promptI2I = "";

    if (universalIndex !== -1 && variableIndex !== -1) {
      promptHard = v3Text.substring(universalIndex + "Universal Hard Prompt".length, variableIndex).trim();
    } else if (universalIndex !== -1) {
      promptHard = v3Text.substring(universalIndex + "Universal Hard Prompt".length, i2iIndex !== -1 ? i2iIndex : undefined).trim();
    } else {
      promptHard = "Create a full 3D realistic cinematic world based on " + style.title;
    }

    if (variableIndex !== -1 && i2iIndex !== -1) {
      promptVariable = v3Text.substring(variableIndex + "Reusable Variable Template".length, i2iIndex).trim();
    } else if (variableIndex !== -1) {
       promptVariable = v3Text.substring(variableIndex + "Reusable Variable Template".length).trim();
    } else {
       promptVariable = "Create [SUBJECT / SCENE / WORLD] as a full 3D realistic dimensional world generated from " + style.title + ".";
    }

    if (i2iIndex !== -1 && moodIndex !== -1) {
      promptI2I = v3Text.substring(i2iIndex + "Image-to-Image".length, moodIndex).trim();
    } else if (i2iIndex !== -1) {
      promptI2I = v3Text.substring(i2iIndex + "Image-to-Image".length).trim();
    } else {
      promptI2I = "Convert this source image into a full 3D realistic " + style.title + " world. Preserve the source image main composition.";
    }

    const uncapId = style.id;
    const catName = uncapId + "PromptCatalog";
    const v3Name = uncapId + "PromptV3";
    
    const compDir = path.join(SRC_ROOT, "app", "view", "HomePage", "compo");
    if(!fs.existsSync(compDir)) fs.mkdirSync(compDir, {recursive: true});

    fs.writeFileSync(path.join(compDir, v3Name + ".ts"), 
"export const " + v3Name + " = {\n" +
"  promptHard: `" + sanitizeEx(promptHard) + "`,\n" +
"  promptVariable: `" + sanitizeEx(promptVariable) + "`,\n" +
"  promptI2I: `" + sanitizeEx(promptI2I) + "`\n" +
"};");

    fs.writeFileSync(path.join(compDir, catName + ".ts"), 
"import { " + v3Name + " } from \"./" + v3Name + "\";\n" +
"export type " + style.componentName + "Version = \"V3\";\n" +
"export interface " + style.componentName + "PromptFamily {\n" +
"  version: " + style.componentName + "Version;\n" +
"  promptHard: string;\n" +
"  promptVariable: string;\n" +
"  promptI2I: string;\n" +
"  chip: string;\n" +
"  title: string;\n" +
"}\n" +
"export const " + uncapId.toUpperCase() + "_PROMPT_FAMILIES: Record<" + style.componentName + "Version, " + style.componentName + "PromptFamily> = {\n" +
"    V3: {\n" +
"      version: \"V3\",\n" +
"      chip: \"CINEMATIC\",\n" +
"      title: \"3D Realistic " + style.title + " World\",\n" +
"      ..." + v3Name + ",\n" +
"    },\n" +
"};");

    const compFolder = path.join(SRC_ROOT, "components", uncapId);
    if(!fs.existsSync(compFolder)) fs.mkdirSync(compFolder, {recursive: true});

    fs.writeFileSync(path.join(compFolder, 'types.ts'), 
"import type { " + style.componentName + "Version } from \"@/app/view/HomePage/compo/" + catName + "\";\n" +
"import type { WarliAspectRatioChoice } from \"@/components/warli/warliNanoAspect\";\n" +
"export type StyleFamily = " + style.componentName + "Version;\n" +
"export type InputMode = \"text\" | \"image\";\n" +
"export type ModelId = \"google/nano-banana-2\" | \"google/nano-banana-pro\";\n" +
"export type ImageCount = 1 | 2 | 4;\n" +
"export type AspectRatio = WarliAspectRatioChoice;\n" +
"export type RightPanelState = \"empty\" | \"loading\" | \"results\";\n" +
"export interface " + style.componentName + "State {\n" +
"  style: StyleFamily;\n" +
"  inputMode: InputMode;\n" +
"  sceneText: string;\n" +
"  uploadedImage: string | null;\n" +
"  imageNote: string;\n" +
"  model: ModelId;\n" +
"  resolution: string;\n" +
"  imageCount: ImageCount;\n" +
"  ratio: AspectRatio;\n" +
"  includeVariable: boolean;\n" +
"  panelState: RightPanelState;\n" +
"  generatedImages: string[];\n" +
"  assembledPrompt: string;\n" +
"}\n" +
"export const MODELS = [\n" +
"  { id: \"google/nano-banana-2\" as const, label: \"Nano Banana 2\", tag: \"Google\" },\n" +
"  { id: \"google/nano-banana-pro\" as const, label: \"Nano Banana Pro\", tag: \"Google\" },\n" +
"];\n" +
"export const IMAGE_COUNTS: ImageCount[] = [1, 2, 4];\n" +
"export const STYLE_LABELS: Record<StyleFamily, { badge: string; title: string }> = {\n" +
"  V3: { badge: \"CINEMATIC\", title: \"3D Realistic " + style.title + " World\" },\n" +
"};\n" +
"export const INITIAL_STATE: " + style.componentName + "State = {\n" +
"  style: \"V3\",\n" +
"  inputMode: \"text\",\n" +
"  sceneText: \"\",\n" +
"  uploadedImage: null,\n" +
"  imageNote: \"\",\n" +
"  model: \"google/nano-banana-2\",\n" +
"  resolution: \"1K\",\n" +
"  imageCount: 2,\n" +
"  ratio: \"auto\",\n" +
"  includeVariable: false,\n" +
"  panelState: \"empty\",\n" +
"  generatedImages: [],\n" +
"  assembledPrompt: \"\",\n" +
"};\n"
    );

    fs.writeFileSync(path.join(compFolder, style.componentName + 'Header.tsx'),
"\"use client\";\n" +
"import React from \"react\";\n" +
"import { X } from \"lucide-react\";\n" +
"import { StyleFamily, STYLE_LABELS } from \"./types\";\n" +
"interface " + style.componentName + "HeaderProps {\n" +
"  style: StyleFamily;\n" +
"  onStyleChange: (s: StyleFamily) => void;\n" +
"  onClose: () => void;\n" +
"}\n" +
"export function " + style.componentName + "Header({ style, onStyleChange, onClose }: " + style.componentName + "HeaderProps) {\n" +
"  const families: StyleFamily[] = [\"V3\"];\n" +
"  return (\n" +
"    <header className=\"flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0E0E12] px-5 py-3\">\n" +
"      <div className=\"flex items-center gap-3\">\n" +
"        <div className=\"flex items-center gap-1.5 rounded-full border border-[#2F6BFF]/25 bg-[#2F6BFF]/[0.08] px-2.5 py-[5px]\">\n" +
"          <span className=\"h-1.5 w-1.5 rounded-full bg-[#2F6BFF] shadow-[0_0_5px_rgba(47,107,255,0.8)]\" />\n" +
"          <span className=\"text-[11px] font-medium uppercase tracking-[0.06em] text-[#60a5fa] whitespace-nowrap\">\n" +
"            " + style.title + "\n" +
"          </span>\n" +
"        </div>\n" +
"        <div className=\"ml-1 flex gap-0.5 rounded-xl border border-white/10 bg-[#13131a] p-[3px]\">\n" +
"          {families.map((f) => (\n" +
"            <button key={f} type=\"button\" onClick={() => onStyleChange(f)} className={`flex items-center gap-1.5 rounded-lg px-3 py-[5px] text-[11px] font-medium transition-all duration-150 ${ style === f ? \"bg-[#1e1e28] text-white/85 shadow-[0_1px_4px_rgba(0,0,0,0.5)]\" : \"text-white/30 hover:text-white/55\" }`}>\n" +
"              <span>{f}</span>\n" +
"              <span className={`rounded-[4px] px-[5px] py-px text-[9px] font-semibold tracking-[0.04em] ${ style === f ? \"bg-[#2F6BFF]/[0.12] text-[#60a5fa]\" : \"bg-white/[0.04] text-white/20\" }`}>\n" +
"                {STYLE_LABELS[f].badge}\n" +
"              </span>\n" +
"            </button>\n" +
"          ))}\n" +
"        </div>\n" +
"      </div>\n" +
"      <button type=\"button\" aria-label=\"Close\" onClick={onClose} className=\"flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/30 transition hover:bg-white/[0.08] hover:text-white/70\">\n" +
"        <X className=\"h-4 w-4\" />\n" +
"      </button>\n" +
"    </header>\n" +
"  );\n" +
"}\n"
    );

    const modalContent = 
"\"use client\";\n" +
"import React, { useCallback, useEffect, useMemo, useReducer } from \"react\";\n" +
"import { toast } from \"sonner\";\n" +
"import { saveUpload } from \"@/lib/libraryApi\";\n" +
"import { " + uncapId.toUpperCase() + "_PROMPT_FAMILIES } from \"@/app/view/HomePage/compo/" + catName + "\";\n" +
"import { useAppDispatch, useAppSelector } from \"@/store/hooks\";\n" +
"import type { RootState } from \"@/store\";\n" +
"import { falGenerate } from \"@/store/slices/generationsApi\";\n" +
"import { setFrameSize } from \"@/store/slices/generationSlice\";\n" +
"import { downloadAllImageUrls, downloadImageUrl } from \"@/components/warli/warliDownload\";\n" +
"import { ModeToggle } from \"@/components/warli/ModeToggle\";\n" +
"import { SceneInput } from \"@/components/warli/SceneInput\";\n" +
"import { UploadZone } from \"@/components/warli/UploadZone\";\n" +
"import { ModelSelector } from \"@/components/warli/ModelSelector\";\n" +
"import { SettingsPanel } from \"@/components/warli/SettingsPanel\";\n" +
"import { OutputGrid } from \"@/components/warli/OutputGrid\";\n" +
"import { PromptPreview } from \"@/components/warli/PromptPreview\";\n" +
"import { coerceStyleModalResolution, coerceWarliAspectRatio } from \"@/components/warli/warliNanoAspect\";\n" +
"import { " + style.componentName + "Header } from \"./" + style.componentName + "Header\";\n" +
"import { FullscreenImageViewer } from \"@/components/common/FullscreenImageViewer\";\n" +
"import { INITIAL_STATE, " + style.componentName + "State, StyleFamily, InputMode, ModelId, ImageCount, AspectRatio, MODELS, STYLE_LABELS, RightPanelState } from \"./types\";\n" +
"const STYLE_TAG = \"" + style.title + "\";\n" +
"function toAbsoluteFromProxy(url: string): string {\n" +
"  try {\n" +
"    if (!url) return url;\n" +
"    if (url.startsWith(\"data:\")) return url;\n" +
"    const ZATA_PREFIX = \"https://idr01.zata.ai/devstoragev1/\";\n" +
"    const RESOURCE_SEG = \"/api/proxy/resource/\";\n" +
"    if (url.startsWith(RESOURCE_SEG)) {\n" +
"      const decoded = decodeURIComponent(url.substring(RESOURCE_SEG.length));\n" +
"      return `${ZATA_PREFIX}${decoded}`;\n" +
"    }\n" +
"    if (url.startsWith(\"http://\") || url.startsWith(\"https://\")) {\n" +
"      const u = new URL(url);\n" +
"      if (u.pathname.startsWith(RESOURCE_SEG)) {\n" +
"        const decoded = decodeURIComponent(u.pathname.substring(RESOURCE_SEG.length));\n" +
"        return `${ZATA_PREFIX}${decoded}`;\n" +
"      }\n" +
"    }\n" +
"    return url;\n" +
"  } catch {\n" +
"    return url;\n" +
"  }\n" +
"}\n" +
"async function ensureHostedImageUrl(url: string): Promise<string> {\n" +
"  const normalized = toAbsoluteFromProxy(String(url || \"\").trim());\n" +
"  if (!normalized) return normalized;\n" +
"  if (normalized.startsWith(\"http://\") || normalized.startsWith(\"https://\")) return normalized;\n" +
"  if (normalized.startsWith(\"data:\") || normalized.startsWith(\"blob:\")) {\n" +
"    const resp = await saveUpload({ url: normalized, type: \"image\" });\n" +
"    if (resp.responseStatus === \"success\" && resp.data?.url) return resp.data.url;\n" +
"    throw new Error(resp.message || \"Failed to prepare input image\");\n" +
"  }\n" +
"  return normalized;\n" +
"}\n" +
"function extractImageUrls(result: unknown): string[] {\n" +
"  const r = result as { images?: Array<{ url?: string } | string> };\n" +
"  const imgs = r?.images;\n" +
"  if (!Array.isArray(imgs)) return [];\n" +
"  return imgs.map((item) => (typeof item === \"string\" ? item : item?.url)).filter((u): u is string => Boolean(u));\n" +
"}\n" +
"type Action = | { type: \"SET_STYLE\"; payload: StyleFamily } | { type: \"SET_MODE\"; payload: InputMode } | { type: \"SET_SCENE_TEXT\"; payload: string } | { type: \"SET_UPLOADED_IMAGE\"; payload: string | null } | { type: \"SET_IMAGE_NOTE\"; payload: string } | { type: \"SET_MODEL\"; payload: ModelId } | { type: \"SET_RESOLUTION\"; payload: string } | { type: \"SET_COUNT\"; payload: ImageCount } | { type: \"SET_RATIO\"; payload: AspectRatio } | { type: \"SET_INCLUDE_VARIABLE\"; payload: boolean } | { type: \"SET_PANEL_STATE\"; payload: RightPanelState } | { type: \"SET_GENERATED_IMAGES\"; payload: string[] } | { type: \"SET_ASSEMBLED_PROMPT\"; payload: string } | { type: \"RESET\" };\n" +
"function reducer(state: " + style.componentName + "State, action: Action): " + style.componentName + "State {\n" +
"  switch (action.type) {\n" +
"    case \"SET_STYLE\": return { ...state, style: action.payload };\n" +
"    case \"SET_MODE\": return { ...state, inputMode: action.payload };\n" +
"    case \"SET_SCENE_TEXT\": return { ...state, sceneText: action.payload };\n" +
"    case \"SET_UPLOADED_IMAGE\": return { ...state, uploadedImage: action.payload };\n" +
"    case \"SET_IMAGE_NOTE\": return { ...state, imageNote: action.payload };\n" +
"    case \"SET_MODEL\": {\n" +
"      const nextModel = action.payload;\n" +
"      const nextRatio = coerceWarliAspectRatio(state.ratio, nextModel);\n" +
"      const nextResolution = coerceStyleModalResolution(state.resolution, nextModel);\n" +
"      return { ...state, model: nextModel, ratio: nextRatio, resolution: nextResolution };\n" +
"    }\n" +
"    case \"SET_RESOLUTION\": return { ...state, resolution: coerceStyleModalResolution(action.payload, state.model) };\n" +
"    case \"SET_COUNT\": return { ...state, imageCount: action.payload };\n" +
"    case \"SET_RATIO\": return { ...state, ratio: action.payload };\n" +
"    case \"SET_INCLUDE_VARIABLE\": return { ...state, includeVariable: Boolean(action.payload) };\n" +
"    case \"SET_PANEL_STATE\": return { ...state, panelState: action.payload };\n" +
"    case \"SET_GENERATED_IMAGES\": return { ...state, generatedImages: action.payload };\n" +
"    case \"SET_ASSEMBLED_PROMPT\": return { ...state, assembledPrompt: action.payload };\n" +
"    case \"RESET\": return INITIAL_STATE;\n" +
"    default: return state;\n" +
"  }\n" +
"}\n" +
"function buildPrompt(state: " + style.componentName + "State): string {\n" +
"  const family = " + uncapId.toUpperCase() + "_PROMPT_FAMILIES[state.style];\n" +
"  const aspect = coerceWarliAspectRatio(state.ratio, state.model);\n" +
"  const projectInputs = state.inputMode === \"text\" ? state.sceneText.trim() : state.imageNote.trim();\n" +
"  const projectLine = projectInputs ? `- ${projectInputs}` : \"- (none). Keep structured logic intact.\";\n" +
"  const variableBlock = state.includeVariable ? `\\n\\nREFERENCE (OPTIONAL) - VARIABLE (slot-based):\\n${family.promptVariable.trim()}\\n` : \"\";\n" +
"  return [\n" +
"    \"PRIMARY DIRECTIVE (STYLE LOCK - follow strictly):\",\n" +
"    state.inputMode === \"image\" && state.uploadedImage ? family.promptI2I.trim() : family.promptHard.trim(),\n" +
"    variableBlock.trimEnd(),\n" +
"    \"\",\n" +
"    \"PROJECT INPUTS:\",\n" +
"    projectLine,\n" +
"    \"\",\n" +
"    \"CONTENT CONSTRAINT (STRICT):\",\n" +
"    \"- Keep output in a 3D Realistic grammar.\",\n" +
"    \"\",\n" +
"    \"RENDER SETTINGS:\",\n" +
"    `- Preferred aspect ratio: ${aspect === \"auto\" ? \"auto\" : aspect}`,\n" +
"    `- Preferred resolution: ${state.resolution}`,\n" +
"    `- Preferred image count: ${state.imageCount}`,\n" +
"  ].filter(Boolean).join(\"\\n\");\n" +
"}\n" +
"export function " + style.componentName + "Modal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {\n" +
"  const dispatch = useAppDispatch();\n" +
"  const [state, dispatchLocal] = useReducer(reducer, INITIAL_STATE);\n" +
"  const [isVisible, setIsVisible] = React.useState(false);\n" +
"  const [fullscreenUrl, setFullscreenUrl] = React.useState<string | null>(null);\n" +
"  const nanoBananaGoogleSearch = useAppSelector((s: RootState) => s.generation.nanoBananaGoogleSearch);\n" +
"  const nanoBananaThinkingLevel = useAppSelector((s: RootState) => s.generation.nanoBananaThinkingLevel);\n" +
"  const nanoBananaLimitGenerations = useAppSelector((s: RootState) => s.generation.nanoBananaLimitGenerations);\n" +
"  const outputFormat = useAppSelector((s: RootState) => s.generation.outputFormat || \"jpeg\");\n" +
"  useEffect(() => {\n" +
"    if (!isOpen) { setIsVisible(false); return; }\n" +
"    dispatchLocal({ type: \"RESET\" });\n" +
"    const originalOverflow = document.body.style.overflow;\n" +
"    document.body.style.overflow = \"hidden\";\n" +
"    const openTimer = setTimeout(() => setIsVisible(true), 16);\n" +
"    const onKeyDown = (e: KeyboardEvent) => { if (e.key === \"Escape\") onClose(); };\n" +
"    window.addEventListener(\"keydown\", onKeyDown);\n" +
"    return () => { clearTimeout(openTimer); window.removeEventListener(\"keydown\", onKeyDown); document.body.style.overflow = originalOverflow; };\n" +
"  }, [isOpen, onClose]);\n" +
"  const assembledPrompt = useMemo(() => buildPrompt(state), [state]);\n" +
"  const ratioSummary = useMemo(() => { const a = coerceWarliAspectRatio(state.ratio, state.model); return a === \"auto\" ? \"auto\" : a; }, [state.ratio, state.model]);\n" +
"  const handleRatioChange = useCallback((r: AspectRatio) => { dispatchLocal({ type: \"SET_RATIO\", payload: r }); dispatch(setFrameSize(r)); }, [dispatch]);\n" +
"  const handleGenerate = useCallback(async () => {\n" +
"    const prompt = buildPrompt(state);\n" +
"    dispatchLocal({ type: \"SET_ASSEMBLED_PROMPT\", payload: prompt });\n" +
"    dispatchLocal({ type: \"SET_PANEL_STATE\", payload: \"loading\" });\n" +
"    const promptForModel = `${prompt} [Style: ${STYLE_TAG}]`;\n" +
"    let uploadedForFal: string[] = [];\n" +
"    try {\n" +
"      if (state.inputMode === \"image\" && state.uploadedImage?.trim()) {\n" +
"        const hosted = await ensureHostedImageUrl(state.uploadedImage);\n" +
"        uploadedForFal = hosted ? [hosted] : [];\n" +
"      }\n" +
"    } catch (e) {\n" +
"      toast.error(e instanceof Error ? e.message : \"Could not upload reference image\");\n" +
"      dispatchLocal({ type: \"SET_PANEL_STATE\", payload: \"empty\" });\n" +
"      return;\n" +
"    }\n" +
"    const aspect = coerceWarliAspectRatio(state.ratio, state.model);\n" +
"    const generationType = state.inputMode === \"image\" && uploadedForFal.length > 0 ? \"image-to-image\" : \"text-to-image\";\n" +
"    try {\n" +
"      const res = await dispatch(falGenerate({\n" +
"        generationType, model: state.model, prompt: promptForModel,\n" +
"        meta: { style_premium: true, style_key: \"" + uncapId + "\", style_version: state.style, source: \"homepage-" + uncapId + "-modal\" },\n" +
"        aspect_ratio: aspect as any, num_images: state.imageCount, output_format: outputFormat, resolution: state.resolution,\n" +
"        thinking_level: nanoBananaThinkingLevel, enable_web_search: nanoBananaGoogleSearch, limit_generations: nanoBananaLimitGenerations,\n" +
"        ...(uploadedForFal.length ? { image_urls: uploadedForFal } : {}),\n" +
"      }) as any).unwrap();\n" +
"      const images = extractImageUrls((res as any)?.data ?? res);\n" +
"      dispatchLocal({ type: \"SET_GENERATED_IMAGES\", payload: images });\n" +
"      dispatchLocal({ type: \"SET_PANEL_STATE\", payload: images.length ? \"results\" : \"empty\" });\n" +
"      if (!images.length) toast.error(\"No images returned\");\n" +
"    } catch (e) {\n" +
"      toast.error(e instanceof Error ? e.message : \"Generation failed\");\n" +
"      dispatchLocal({ type: \"SET_PANEL_STATE\", payload: \"empty\" });\n" +
"    }\n" +
"  }, [dispatch, nanoBananaGoogleSearch, nanoBananaLimitGenerations, nanoBananaThinkingLevel, outputFormat, state]);\n" +
"  const handleSaveAll = useCallback(async () => {\n" +
"    const urls = state.generatedImages.filter(Boolean);\n" +
"    if (!urls.length) return;\n" +
"    const t = toast.loading(\"Saving images...\");\n" +
"    try { await downloadAllImageUrls(urls, `" + uncapId + "-${state.style}`); toast.dismiss(t); toast.success(\"Downloads started\"); } \n" +
"    catch { toast.dismiss(t); toast.error(\"Save all failed\"); }\n" +
"  }, [state.generatedImages, state.style]);\n" +
"  const handleSaveImage = useCallback(async (index: number) => {\n" +
"    const url = state.generatedImages[index];\n" +
"    if (!url) return;\n" +
"    const t = toast.loading(\"Saving...\");\n" +
"    try { await downloadImageUrl(url, `" + uncapId + "-${state.style}-${index + 1}`); toast.dismiss(t); toast.success(\"Download started\"); } \n" +
"    catch { toast.dismiss(t); toast.error(\"Save failed\"); }\n" +
"  }, [state.generatedImages, state.style]);\n" +
"  if (!isOpen) return null;\n" +
"  const familyMeta = " + uncapId.toUpperCase() + "_PROMPT_FAMILIES[state.style];\n" +
"  const styleTitle = `${state.style} - ${familyMeta.chip}`;\n" +
"  return (\n" +
"    <div className=\"fixed inset-0 z-[160] flex items-center justify-center bg-black/45 p-3 sm:p-6 backdrop-blur-2xl\">\n" +
"      <div className=\"absolute inset-0\" onClick={onClose} aria-hidden />\n" +
"      <div role=\"dialog\" aria-modal=\"true\" aria-label=\"" + style.title + " Generator\" className={`relative flex w-[min(1080px,calc(100vw-24px))] h-[min(760px,calc(100vh-24px))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E12]/95 shadow-[0_24px_70px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.04] transition-all duration-300 ${isVisible ? \"opacity-100 translate-y-0 scale-100\" : \"opacity-0 translate-y-2 scale-[0.985]\"}`}>\n" +
"        <" + style.componentName + "Header style={state.style} onStyleChange={(s) => dispatchLocal({ type: \"SET_STYLE\", payload: s })} onClose={onClose} />\n" +
"        <div className=\"grid min-h-0 flex-1 overflow-hidden lg:[grid-template-columns:420px_1fr]\">\n" +
"          <aside className=\"flex flex-col overflow-hidden border-r border-white/10 bg-[#0E0E12]\">\n" +
"            <div className=\"flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar]:w-1\">\n" +
"              <div className=\"flex flex-col gap-2\">\n" +
"                <span className=\"text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25\">Input</span>\n" +
"                <ModeToggle mode={state.inputMode} onChange={(v) => dispatchLocal({ type: \"SET_MODE\", payload: v })} />\n" +
"              </div>\n" +
"              {state.inputMode === \"text\" ? (\n" +
"                <SceneInput value={state.sceneText} onChange={(v) => dispatchLocal({ type: \"SET_SCENE_TEXT\", payload: v })} />\n" +
"              ) : (\n" +
"                <div className=\"flex flex-col gap-3\">\n" +
"                  <UploadZone uploadedImage={state.uploadedImage} onUpload={(v) => dispatchLocal({ type: \"SET_UPLOADED_IMAGE\", payload: v })} />\n" +
"                  <textarea value={state.imageNote} onChange={(e) => dispatchLocal({ type: \"SET_IMAGE_NOTE\", payload: e.target.value })} rows={3} placeholder=\"Optional notes...\" className=\"w-full resize-none rounded-xl border border-white/10 bg-[#13131a] px-4 py-3 text-[13px] leading-relaxed text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-white/20\" />\n" +
"                </div>\n" +
"              )}\n" +
"              <div className=\"flex flex-col gap-2\">\n" +
"                <span className=\"text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25\">Model</span>\n" +
"                <ModelSelector value={state.model} onChange={(v) => dispatchLocal({ type: \"SET_MODEL\", payload: v })} />\n" +
"              </div>\n" +
"              <SettingsPanel model={state.model} resolution={state.resolution} imageCount={state.imageCount} ratio={state.ratio} includeBenchmark={false} includeVariable={state.includeVariable} includeRestyle={false} onCountChange={(v) => dispatchLocal({ type: \"SET_COUNT\", payload: v })} onResolutionChange={(v) => dispatchLocal({ type: \"SET_RESOLUTION\", payload: v })} onRatioChange={handleRatioChange} onIncludeBenchmarkChange={() => {}} onIncludeVariableChange={(v) => dispatchLocal({ type: \"SET_INCLUDE_VARIABLE\", payload: v })} onIncludeRestyleChange={() => {}} />\n" +
"            </div>\n" +
"            <div className=\"border-t border-white/[0.06] bg-[#0E0E12] px-5 py-3\">\n" +
"              <div className=\"flex flex-wrap gap-2 text-[11px] text-white/35\">\n" +
"                <span className=\"rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1\">{styleTitle}</span>\n" +
"                <span className=\"rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1\">{MODELS.find((m) => m.id === state.model)?.label ?? state.model}</span>\n" +
"                <span className=\"rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1\">{state.imageCount} img</span>\n" +
"                <span className=\"rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1\">{state.resolution}</span>\n" +
"                <span className=\"rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1\">{ratioSummary}</span>\n" +
"              </div>\n" +
"            </div>\n" +
"            <div className=\"border-t border-white/[0.06] bg-[#0E0E12] px-5 py-4\">\n" +
"              <button type=\"button\" onClick={() => void handleGenerate()} disabled={state.panelState === \"loading\"} className=\"w-full rounded-lg bg-[#2F6BFF] py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#2F6BFF]/90 disabled:opacity-50\">Generate " + style.title + "</button>\n" +
"            </div>\n" +
"          </aside>\n" +
"          <main className=\"flex min-h-0 flex-col overflow-hidden bg-[#0a0a0f]\">\n" +
"            <div className=\"flex items-center justify-between border-b border-white/[0.06] bg-[#0E0E12] px-5 py-3.5\">\n" +
"              <span className=\"text-xs font-medium text-white/25\">\n" +
"                {state.panelState === \"results\" ? `${state.imageCount} ${state.imageCount === 1 ? \"image\" : \"images\"} - ${STYLE_LABELS[state.style].title}` : state.panelState === \"loading\" ? \"Generating...\" : \"Output will appear here\"}\n" +
"              </span>\n" +
"              {state.panelState === \"results\" ? (\n" +
"                <div className=\"flex gap-1.5\">\n" +
"                  <button type=\"button\" onClick={() => void handleGenerate()} className=\"rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/40 transition-all hover:border-white/20 hover:text-white/70\">Regenerate</button>\n" +
"                  <button type=\"button\" onClick={() => void handleSaveAll()} disabled={!state.generatedImages.some(Boolean)} className=\"rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/40 transition-all hover:border-white/20 hover:text-white/70 disabled:pointer-events-none disabled:opacity-35\">Save all</button>\n" +
"                </div>\n" +
"              ) : null}\n" +
"            </div>\n" +
"            <div className=\"flex flex-1 flex-col overflow-y-auto p-5 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar]:w-1\">\n" +
"              {state.panelState === \"empty\" ? (\n" +
"                <div className=\"flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center\">\n" +
"                  <p className=\"text-sm font-medium text-white/20\">No output yet</p>\n" +
"                  <p className=\"max-w-[320px] text-xs leading-relaxed text-white/10\">Describe a scene (or upload an image), then Generate.</p>\n" +
"                </div>\n" +
"              ) : null}\n" +
"              {state.panelState === \"loading\" ? (\n" +
"                <div className=\"flex flex-1 flex-col items-center justify-center gap-6 p-6\">\n" +
"                  <div className={`grid w-full gap-3 ${state.imageCount === 1 ? \"grid-cols-1 max-w-lg\" : \"grid-cols-2\"}`}>\n" +
"                    {Array.from({ length: state.imageCount }).map((_, i) => (\n" +
"                      <div key={i} className=\"relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-[#111117]\">\n" +
"                        <img src=\"/styles/Logo.gif\" alt=\"Generating...\" className=\"h-16 w-16 object-contain opacity-40\" draggable={false} />\n" +
"                      </div>\n" +
"                    ))}\n" +
"                  </div>\n" +
"                  <p className=\"text-[11px] text-white/20\">Generating...</p>\n" +
"                </div>\n" +
"              ) : null}\n" +
"              {state.panelState === \"results\" ? (\n" +
"                <div className=\"flex flex-col gap-4\">\n" +
"                  <OutputGrid images={state.generatedImages} count={state.imageCount} onSaveImage={(i) => void handleSaveImage(i)} onExpandImage={(i) => { const url = state.generatedImages[i]; if (!url) return; setFullscreenUrl(url); }} />\n" +
"                  <PromptPreview prompt={assembledPrompt} />\n" +
"                </div>\n" +
"              ) : null}\n" +
"            </div>\n" +
"          </main>\n" +
"        </div>\n" +
"      </div>\n" +
"      <FullscreenImageViewer isOpen={Boolean(fullscreenUrl)} src={fullscreenUrl || \"\"} onClose={() => setFullscreenUrl(null)} />\n" +
"    </div>\n" +
"  );\n" +
"}\n";

    fs.writeFileSync(path.join(compFolder, style.componentName + 'Modal.tsx'), modalContent);

    fs.writeFileSync(path.join(compFolder, 'index.ts'), "export * from \"./" + style.componentName + "Modal\";\n");

    fs.writeFileSync(path.join(compDir, style.componentName + "FullscreenWalkthrough.tsx"), 
"\"use client\";\n" +
"import React from \"react\";\n" +
"import { " + style.componentName + "Modal } from \"@/components/" + uncapId + "\";\n" +
"export default function " + style.componentName + "FullscreenWalkthrough({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {\n" +
"  return <" + style.componentName + "Modal isOpen={isOpen} onClose={onClose} />;\n" +
"}\n"
    );

    console.log("Successfully generated files for " + style.id);
  }
}

run();
