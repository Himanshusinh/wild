import { bagruprintPromptV1 } from "./bagruprintPromptV1";
import { bagruprintPromptV2 } from "./bagruprintPromptV2";
import { bagruprintPromptV3 } from "./bagruprintPromptV3";

export type BagruPrintVersion = "V1" | "V2" | "V3";

export interface BagruPrintPromptFamily {
  version: BagruPrintVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BAGRUPRINT_PROMPT_FAMILIES: Record<BagruPrintVersion, BagruPrintPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Bagru",
    ...bagruprintPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Bagru",
    ...bagruprintPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Bagru",
    ...bagruprintPromptV3,
  },
};
