import { prestigependantsPromptV1 } from "./prestigependantsPromptV1";
import { prestigependantsPromptV2 } from "./prestigependantsPromptV2";
import { prestigependantsPromptV3 } from "./prestigependantsPromptV3";

export type PrestigePendantsVersion = "V1" | "V2" | "V3";

export interface PrestigePendantsPromptFamily {
  version: PrestigePendantsVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PRESTIGEPENDANTS_PROMPT_FAMILIES: Record<PrestigePendantsVersion, PrestigePendantsPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "PrestigePendants",
    ...prestigependantsPromptV1,
  },
  V2: {
    version: "V2",
    chip: "SYMBOLIC",
    title: "PrestigePendants Variations",
    ...prestigependantsPromptV2,
  },
  V3: {
    version: "V3",
    chip: "PENDANTS",
    title: "Dimensional PrestigePendants",
    ...prestigependantsPromptV3,
  },
};
