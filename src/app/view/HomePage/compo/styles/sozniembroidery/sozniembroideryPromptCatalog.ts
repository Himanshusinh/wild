import { sozniembroideryPromptV1 } from "./sozniembroideryPromptV1";
import { sozniembroideryPromptV2 } from "./sozniembroideryPromptV2";
import { sozniembroideryPromptV3 } from "./sozniembroideryPromptV3";

export type SozniembroideryVersion = "V1" | "V2" | "V3";

export interface SozniembroideryPromptFamily {
  version: SozniembroideryVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SOZNIEMBROIDERY_PROMPT_FAMILIES: Record<SozniembroideryVersion, SozniembroideryPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "SOZNI EMBROIDERY", ...sozniembroideryPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "SOZNI EMBROIDERY", ...sozniembroideryPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "SOZNI EMBROIDERY", ...sozniembroideryPromptV3 },
};
