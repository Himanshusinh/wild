import { rammanmaskPromptV1 } from "./rammanmaskPromptV1";
import { rammanmaskPromptV2 } from "./rammanmaskPromptV2";
import { rammanmaskPromptV3 } from "./rammanmaskPromptV3";

export type RammanmaskVersion = "V1" | "V2" | "V3";

export interface RammanmaskPromptFamily {
  version: RammanmaskVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const RAMMANMASK_PROMPT_FAMILIES: Record<RammanmaskVersion, RammanmaskPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "RAMMAN MASK", ...rammanmaskPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "RAMMAN MASK", ...rammanmaskPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "RAMMAN MASK", ...rammanmaskPromptV3 },
};
