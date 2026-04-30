import { therukoothuPromptV1 } from "./therukoothuPromptV1";
import { therukoothuPromptV2 } from "./therukoothuPromptV2";
import { therukoothuPromptV3 } from "./therukoothuPromptV3";

export type TherukoothuVersion = "V1" | "V2" | "V3";

export const THERUKOOTHU_PROMPT_FAMILIES: Record<TherukoothuVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: therukoothuPromptV1,
  V2: therukoothuPromptV2,
  V3: therukoothuPromptV3,
};
