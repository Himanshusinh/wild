import fs from "fs";
import path from "path";

const root = path.resolve(
  "src/app/view/Generation/ImageGeneration/TextToImage/compo",
);
const inputPath = path.join(root, "InputBox.tsx");
const namesPath = path.resolve("inputbox-root-bindings.txt");
const outPath = path.join(root, "inputBox/generation/handleGenerateCore.ts");

const lines = fs.readFileSync(inputPath, "utf8").split(/\r?\n/);
const body = lines.slice(3537, 7799).join("\n");
const scopeNames = [
  ...new Set([
    ...fs
      .readFileSync(namesPath, "utf8")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
    "validateAndReserveCredits",
    "handleGenerationSuccess",
    "handleGenerationFailure",
    "creditBalance",
    "clearCreditsError",
    "refreshCredits",
    "credits",
    "planCode",
    "setIsEnhancing",
    "setIsGeneratingLocally",
    "setLocalGeneratingEntries",
  ]),
];

const skipDestruct = new Set([
  "extractQueueFailureMessage",
  "error", // avoid shadowing catch (error) / param noise; add manually if needed
]);

const used = [];
for (const name of scopeNames) {
  if (skipDestruct.has(name)) continue;
  if (!/^[A-Za-z_$][\w$]*$/.test(name)) continue;
  if (name === "generationId" || name === "overridePrompt") continue;
  const re = new RegExp(`\\b${name.replace(/\$/g, "\\$")}\\b`);
  if (re.test(body)) used.push(name);
}

const importBlock = `// @ts-nocheck
import { getSignInUrl } from "@/routes/routes";
import type { HistoryEntry } from "@/types/history";
import {
  setPrompt,
  generateImages,
  generateMiniMaxImages,
  setUploadedImages,
  setSelectedCharacter,
  addSelectedCharacter,
  removeSelectedCharacter,
  clearSelectedCharacters,
  setSelectedModel,
  addActiveGeneration,
  updateActiveGeneration,
  removeActiveGeneration,
  setImageCount,
  setFrameSize,
  setStyle,
  setOutputFormat,
  setNanoBananaResolution,
  setNanoBananaGoogleSearch,
  setNanoBananaImageSearch,
  setNanoBananaThinkingLevel,
  setNanoBananaLimitGenerations,
} from "@/store/slices/generationSlice";
import { downloadFileWithNaming } from "@/utils/downloadUtils";
import {
  runwayGenerate,
  runwayStatus,
  bflGenerate,
  falGenerate,
  replicateGenerate,
} from "@/store/slices/generationsApi";
import { addNotification } from "@/store/slices/uiSlice";
import {
  removeHistoryEntry,
  addHistoryEntry,
  updateHistoryEntry,
} from "@/store/slices/historySlice";
import axiosInstance, { getApiClient } from "@/lib/axiosInstance";
import {
  incrementFreeTurboUsedOptimistic,
  decrementFreeTurboUsedOptimistic,
} from "@/store/slices/creditsSlice";
import {
  saveAutoResumeIntent,
  getAutoResumeIntent,
  clearAutoResumeIntent,
} from "@/lib/autoResume";
import { qlog, qwarn, qerr } from "@/lib/queueDebug";
import toast from "react-hot-toast";
import { enhancePromptAPI } from "@/lib/api/geminiApi";
import { waitForRunwayCompletion } from "@/lib/runwayService";
import { uploadGeneratedImage } from "@/lib/imageUpload";
import { extractFalErrorDetails, showFalErrorToast } from "@/lib/falToast";
import {
  extractReplicateErrorDetails,
  showReplicateErrorToast,
} from "@/lib/replicateToast";
import { getIsPublic } from "@/lib/publicFlag";
import {
  getImageGenerationCreditCost,
  formatCredits,
} from "@/utils/creditValidation";
import { saveUpload } from "@/lib/libraryApi";
import { toResourceProxy, toZataPath, toDirectUrl } from "@/lib/thumb";
import { updateFirebaseHistory, saveHistoryEntry } from "../historyApi";
import {
  getInputImageLimitForModel,
  normalizeIncomingImageModel,
} from "../modelImageLimits";
import { INDIAN_STYLE_LOOKUP, getIndianBasePrompt } from "../indianStylePrompts";
import {
  convertFrameSizeToRunwayRatio,
  coerceRunwayRatio,
  mapRunwayStatus,
} from "../runwayFrameUtils";
import {
  convertFrameSizeToZTurboDimensions,
  convertFrameSizeToFluxProDimensions,
} from "../frameDimensionUtils";
import { extractQueueFailureMessage } from "./generationQueue";
`;

const header = `${importBlock}

export type InputBoxGenerationRuntime = Record<string, any>;

export function bindHandleGenerate(getRuntime: () => InputBoxGenerationRuntime) {
  return async function handleGenerate(
    generationId?: string,
    overridePrompt?: string,
  ): Promise<void> {
    const {
${used.map((n) => `      ${n},`).join("\n")}
    } = getRuntime();

`;

const footer = `
  };
}
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, header + body + footer, "utf8");
console.log("Wrote", outPath, "destructured keys:", used.length);
