import { pipiliPromptV1 } from "./pipiliPromptV1";
import { pipiliPromptV2 } from "./pipiliPromptV2";
import { pipiliPromptV3 } from "./pipiliPromptV3";

export type PipiliVersion = "V1" | "V2" | "V3";

export interface PipiliPromptFamily {
  version: PipiliVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PIPILI_PROMPT_FAMILIES: Record<PipiliVersion, PipiliPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Pipili",
    ...pipiliPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Pipili",
    ...pipiliPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Pipili",
    ...pipiliPromptV3,
  },
};
