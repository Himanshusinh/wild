import { farrukhabadprintPromptV1 } from "./farrukhabadprintPromptV1";
import { farrukhabadprintPromptV2 } from "./farrukhabadprintPromptV2";
import { farrukhabadprintPromptV3 } from "./farrukhabadprintPromptV3";

export type FarrukhabadprintVersion = "V1" | "V2" | "V3";

export const FARRUKHABADPRINT_PROMPT_FAMILIES: Record<FarrukhabadprintVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: farrukhabadprintPromptV1,
  V2: farrukhabadprintPromptV2,
  V3: farrukhabadprintPromptV3,
};
