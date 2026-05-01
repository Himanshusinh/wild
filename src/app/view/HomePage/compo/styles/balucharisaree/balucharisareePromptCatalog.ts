import { balucharisareePromptV1 } from "./balucharisareePromptV1";
import { balucharisareePromptV2 } from "./balucharisareePromptV2";
import { balucharisareePromptV3 } from "./balucharisareePromptV3";

export type BalucharisareeVersion = "V1" | "V2" | "V3";

export interface BalucharisareePromptFamily {
  version: BalucharisareeVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BALUCHARISAREE_PROMPT_FAMILIES: Record<BalucharisareeVersion, BalucharisareePromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "BALUCHARI SAREE", ...balucharisareePromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "BALUCHARI SAREE", ...balucharisareePromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "BALUCHARI SAREE", ...balucharisareePromptV3 },
};
