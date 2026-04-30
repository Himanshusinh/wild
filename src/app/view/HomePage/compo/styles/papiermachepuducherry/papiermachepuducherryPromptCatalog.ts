import { papiermachepuducherryPromptV1 } from "./papiermachepuducherryPromptV1";
import { papiermachepuducherryPromptV2 } from "./papiermachepuducherryPromptV2";
import { papiermachepuducherryPromptV3 } from "./papiermachepuducherryPromptV3";

export type PapiermachepuducherryVersion = "V1" | "V2" | "V3";

export interface PapiermachepuducherryPromptFamily {
  version: PapiermachepuducherryVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PAPIERMACHEPUDUCHERRY_PROMPT_FAMILIES: Record<PapiermachepuducherryVersion, PapiermachepuducherryPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "PAPIER-MACHE", ...papiermachepuducherryPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "PAPIER-MACHE", ...papiermachepuducherryPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "PAPIER-MACHE", ...papiermachepuducherryPromptV3 },
};
