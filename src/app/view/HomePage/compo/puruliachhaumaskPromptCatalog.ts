import { puruliachhaumaskPromptV1 } from "./puruliachhaumaskPromptV1";
import { puruliachhaumaskPromptV2 } from "./puruliachhaumaskPromptV2";
import { puruliachhaumaskPromptV3 } from "./puruliachhaumaskPromptV3";

export type PuruliachhaumaskVersion = "V1" | "V2" | "V3";

export interface PuruliachhaumaskPromptFamily {
  version: PuruliachhaumaskVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PURULIACHHAUMASK_PROMPT_FAMILIES: Record<PuruliachhaumaskVersion, PuruliachhaumaskPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "PURULIA CHHAU MASK", ...puruliachhaumaskPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "PURULIA CHHAU MASK", ...puruliachhaumaskPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "PURULIA CHHAU MASK", ...puruliachhaumaskPromptV3 },
};
