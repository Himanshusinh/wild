import { indoportuguesePromptV1 } from "./indoportuguesePromptV1";
import { indoportuguesePromptV2 } from "./indoportuguesePromptV2";
import { indoportuguesePromptV3 } from "./indoportuguesePromptV3";

export type IndoPortugueseVersion = "V1" | "V2" | "V3";

export interface IndoPortuguesePromptFamily {
  version: IndoPortugueseVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const INDOPORTUGUESE_PROMPT_FAMILIES: Record<IndoPortugueseVersion, IndoPortuguesePromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "IndoPortuguese",
    ...indoportuguesePromptV1,
  },
  V2: {
    version: "V2",
    chip: "COLOR-BLOCKED",
    title: "IndoPortuguese Variations",
    ...indoportuguesePromptV2,
  },
  V3: {
    version: "V3",
    chip: "FAÇADE",
    title: "Dimensional IndoPortuguese",
    ...indoportuguesePromptV3,
  },
};
