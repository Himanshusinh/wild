import { puancheiPromptV1 } from "./puancheiPromptV1";
import { puancheiPromptV2 } from "./puancheiPromptV2";
import { puancheiPromptV3 } from "./puancheiPromptV3";

export type PuancheiVersion = "V1" | "V2" | "V3";

export interface PuancheiPromptFamily {
  version: PuancheiVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PUANCHEI_PROMPT_FAMILIES: Record<PuancheiVersion, PuancheiPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Puanchei",
    ...puancheiPromptV1,
  },
  V2: {
    version: "V2",
    chip: "CEREMONIAL",
    title: "Puanchei Variations",
    ...puancheiPromptV2,
  },
  V3: {
    version: "V3",
    chip: "WOVEN-BANDS",
    title: "Dimensional Puanchei",
    ...puancheiPromptV3,
  },
};
