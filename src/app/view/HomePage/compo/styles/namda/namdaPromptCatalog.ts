import { namdaPromptV1 } from "./namdaPromptV1";
import { namdaPromptV2 } from "./namdaPromptV2";
import { namdaPromptV3 } from "./namdaPromptV3";

export type NamdaVersion = "V1" | "V2" | "V3";

export interface NamdaPromptFamily {
  version: NamdaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const NAMDA_PROMPT_FAMILIES: Record<NamdaVersion, NamdaPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "NAMDA", ...namdaPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "NAMDA", ...namdaPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "NAMDA", ...namdaPromptV3 },
};
