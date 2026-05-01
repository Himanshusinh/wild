import { katabappliquePromptV1 } from "./katabappliquePromptV1";
import { katabappliquePromptV2 } from "./katabappliquePromptV2";
import { katabappliquePromptV3 } from "./katabappliquePromptV3";

export type KatabAppliqueVersion = "V1" | "V2" | "V3";

export interface KatabAppliquePromptFamily {
  version: KatabAppliqueVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KATABAPPLIQUE_PROMPT_FAMILIES: Record<KatabAppliqueVersion, KatabAppliquePromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "KatabApplique",
    ...katabappliquePromptV1,
  },
  V2: {
    version: "V2",
    chip: "APPLIQUÉ",
    title: "KatabApplique Variations",
    ...katabappliquePromptV2,
  },
  V3: {
    version: "V3",
    chip: "GEOMETRIC",
    title: "Dimensional KatabApplique",
    ...katabappliquePromptV3,
  },
};
