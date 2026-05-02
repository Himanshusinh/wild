import { odishastonecarvingPromptV1 } from "./odishastonecarvingPromptV1";
import { odishastonecarvingPromptV2 } from "./odishastonecarvingPromptV2";
import { odishastonecarvingPromptV3 } from "./odishastonecarvingPromptV3";

export type OdishastonecarvingVersion = "V1" | "V2" | "V3";

export const ODISHASTONECARVING_PROMPT_FAMILIES: Record<OdishastonecarvingVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: odishastonecarvingPromptV1,
  V2: odishastonecarvingPromptV2,
  V3: odishastonecarvingPromptV3,
};
