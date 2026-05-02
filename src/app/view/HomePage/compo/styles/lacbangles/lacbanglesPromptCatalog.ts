import { lacbanglesPromptV1 } from "./lacbanglesPromptV1";
import { lacbanglesPromptV2 } from "./lacbanglesPromptV2";
import { lacbanglesPromptV3 } from "./lacbanglesPromptV3";

export type LacbanglesVersion = "V1" | "V2" | "V3";

export const LACBANGLES_PROMPT_FAMILIES: Record<LacbanglesVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: lacbanglesPromptV1,
  V2: lacbanglesPromptV2,
  V3: lacbanglesPromptV3,
};
