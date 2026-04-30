import { needleworkPromptV1 } from "./needleworkPromptV1";
import { needleworkPromptV2 } from "./needleworkPromptV2";
import { needleworkPromptV3 } from "./needleworkPromptV3";

export type NeedleworkVersion = "V1" | "V2" | "V3";

export interface NeedleworkPromptFamily {
  version: NeedleworkVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const NEEDLEWORK_PROMPT_FAMILIES: Record<NeedleworkVersion, NeedleworkPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "NEEDLE WORK", ...needleworkPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "NEEDLE WORK", ...needleworkPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "NEEDLE WORK", ...needleworkPromptV3 },
};
