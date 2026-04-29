import { indoportugueseenvironmentPromptV1 } from "./indoportugueseenvironmentPromptV1";
import { indoportugueseenvironmentPromptV2 } from "./indoportugueseenvironmentPromptV2";
import { indoportugueseenvironmentPromptV3 } from "./indoportugueseenvironmentPromptV3";

export type IndoportugueseenvironmentVersion = "V1" | "V2" | "V3";

export interface IndoportugueseenvironmentPromptFamily {
  version: IndoportugueseenvironmentVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const INDOPORTUGUESEENVIRONMENT_PROMPT_FAMILIES: Record<IndoportugueseenvironmentVersion, IndoportugueseenvironmentPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "INDO-PORTUGUESE ENVIRONMENT", ...indoportugueseenvironmentPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "INDO-PORTUGUESE ENVIRONMENT", ...indoportugueseenvironmentPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "INDO-PORTUGUESE ENVIRONMENT", ...indoportugueseenvironmentPromptV3 },
};
