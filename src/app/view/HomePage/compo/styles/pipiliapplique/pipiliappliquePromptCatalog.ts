import { pipiliappliquePromptV1 } from "./pipiliappliquePromptV1";
import { pipiliappliquePromptV2 } from "./pipiliappliquePromptV2";
import { pipiliappliquePromptV3 } from "./pipiliappliquePromptV3";

export type PipiliAppliqueVersion = "V1" | "V2" | "V3";

export interface PipiliAppliquePromptFamily {
  version: PipiliAppliqueVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PIPILIAPPLIQUE_PROMPT_FAMILIES: Record<PipiliAppliqueVersion, PipiliAppliquePromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Pipili Appliqué",
    ...pipiliappliquePromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Pipili Appliqué",
    ...pipiliappliquePromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Pipili Appliqué",
    ...pipiliappliquePromptV3,
  },
};
