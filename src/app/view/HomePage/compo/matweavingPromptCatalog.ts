import { matweavingPromptV1 } from "./matweavingPromptV1";
import { matweavingPromptV2 } from "./matweavingPromptV2";
import { matweavingPromptV3 } from "./matweavingPromptV3";

export type MatweavingVersion = "V1" | "V2" | "V3";

export interface MatweavingPromptFamily {
  version: MatweavingVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const MATWEAVING_PROMPT_FAMILIES: Record<MatweavingVersion, MatweavingPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "MAT WEAVING", ...matweavingPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "MAT WEAVING", ...matweavingPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "MAT WEAVING", ...matweavingPromptV3 },
};
