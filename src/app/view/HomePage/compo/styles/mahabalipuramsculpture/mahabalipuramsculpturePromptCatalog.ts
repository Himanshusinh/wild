import { mahabalipuramsculpturePromptV1 } from "./mahabalipuramsculpturePromptV1";
import { mahabalipuramsculpturePromptV2 } from "./mahabalipuramsculpturePromptV2";
import { mahabalipuramsculpturePromptV3 } from "./mahabalipuramsculpturePromptV3";

export type MahabalipuramsculptureVersion = "V1" | "V2" | "V3";

export const MAHABALIPURAMSCULPTURE_PROMPT_FAMILIES: Record<MahabalipuramsculptureVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: mahabalipuramsculpturePromptV1,
  V2: mahabalipuramsculpturePromptV2,
  V3: mahabalipuramsculpturePromptV3,
};
