import { baghprintPromptV1 } from "./baghprintPromptV1";
import { baghprintPromptV2 } from "./baghprintPromptV2";
import { baghprintPromptV3 } from "./baghprintPromptV3";

export type BaghPrintVersion = "V1" | "V2" | "V3";

export interface BaghPrintPromptFamily {
  version: BaghPrintVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BAGHPRINT_PROMPT_FAMILIES: Record<BaghPrintVersion, BaghPrintPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "BaghPrint",
    ...baghprintPromptV1,
  },
  V2: {
    version: "V2",
    chip: "BLOCK-PRINT",
    title: "BaghPrint Variations",
    ...baghprintPromptV2,
  },
  V3: {
    version: "V3",
    chip: "DYES",
    title: "Dimensional BaghPrint",
    ...baghprintPromptV3,
  },
};
