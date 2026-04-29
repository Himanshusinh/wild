import { francotamilenvironmentPromptV1 } from "./francotamilenvironmentPromptV1";
import { francotamilenvironmentPromptV2 } from "./francotamilenvironmentPromptV2";
import { francotamilenvironmentPromptV3 } from "./francotamilenvironmentPromptV3";

export type FrancotamilenvironmentVersion = "V1" | "V2" | "V3";

export interface FrancotamilenvironmentPromptFamily {
  version: FrancotamilenvironmentVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const FRANCOTAMILENVIRONMENT_PROMPT_FAMILIES: Record<FrancotamilenvironmentVersion, FrancotamilenvironmentPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "FRANCO-TAMIL ENVIRONMENT", ...francotamilenvironmentPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "FRANCO-TAMIL ENVIRONMENT", ...francotamilenvironmentPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "FRANCO-TAMIL ENVIRONMENT", ...francotamilenvironmentPromptV3 },
};
