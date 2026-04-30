import { uppadaPromptV1 } from "./uppadaPromptV1";
import { uppadaPromptV2 } from "./uppadaPromptV2";
import { uppadaPromptV3 } from "./uppadaPromptV3";

export type UppadaVersion = "V1" | "V2" | "V3";

export interface UppadaPromptFamily {
  version: UppadaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const UPPADA_PROMPT_FAMILIES: Record<UppadaVersion, UppadaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Uppada Jamdani",
    ...uppadaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Translation",
    ...uppadaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "Volumetric World",
    ...uppadaPromptV3,
  },
};

