import { nagashawlPromptV1 } from "./nagashawlPromptV1";
import { nagashawlPromptV2 } from "./nagashawlPromptV2";
import { nagashawlPromptV3 } from "./nagashawlPromptV3";

export type NagaShawlVersion = "V1" | "V2" | "V3";

export interface NagaShawlPromptFamily {
  version: NagaShawlVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const NAGASHAWL_PROMPT_FAMILIES: Record<NagaShawlVersion, NagaShawlPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "NagaShawl",
    ...nagashawlPromptV1,
  },
  V2: {
    version: "V2",
    chip: "TRIBE-SPECIFIC",
    title: "NagaShawl Variations",
    ...nagashawlPromptV2,
  },
  V3: {
    version: "V3",
    chip: "WOVEN",
    title: "Dimensional NagaShawl",
    ...nagashawlPromptV3,
  },
};
