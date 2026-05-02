import { tanjorepaintingPromptV1 } from "./tanjorepaintingPromptV1";
import { tanjorepaintingPromptV2 } from "./tanjorepaintingPromptV2";
import { tanjorepaintingPromptV3 } from "./tanjorepaintingPromptV3";

export type TanjorepaintingVersion = "V1" | "V2" | "V3";

export const TANJOREPAINTING_PROMPT_FAMILIES: Record<TanjorepaintingVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: tanjorepaintingPromptV1,
  V2: tanjorepaintingPromptV2,
  V3: tanjorepaintingPromptV3,
};
