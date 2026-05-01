import { templemuralPromptV1 } from "./templemuralPromptV1";
import { templemuralPromptV2 } from "./templemuralPromptV2";
import { templemuralPromptV3 } from "./templemuralPromptV3";

export type TempleMuralVersion = "V1" | "V2" | "V3";

export interface TempleMuralPromptFamily {
  version: TempleMuralVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const TEMPLEMURAL_PROMPT_FAMILIES: Record<TempleMuralVersion, TempleMuralPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "TempleMural",
    ...templemuralPromptV1,
  },
  V2: {
    version: "V2",
    chip: "SACRED",
    title: "TempleMural Variations",
    ...templemuralPromptV2,
  },
  V3: {
    version: "V3",
    chip: "PAINTING",
    title: "Dimensional TempleMural",
    ...templemuralPromptV3,
  },
};
