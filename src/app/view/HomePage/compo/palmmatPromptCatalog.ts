import { palmmatPromptV1 } from "./palmmatPromptV1";
import { palmmatPromptV2 } from "./palmmatPromptV2";
import { palmmatPromptV3 } from "./palmmatPromptV3";

export type PalmmatVersion = "V1" | "V2" | "V3";

export interface PalmmatPromptFamily {
  version: PalmmatVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PALMMAT_PROMPT_FAMILIES: Record<PalmmatVersion, PalmmatPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "PALM MAT", ...palmmatPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "PALM MAT", ...palmmatPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "PALM MAT", ...palmmatPromptV3 },
};
