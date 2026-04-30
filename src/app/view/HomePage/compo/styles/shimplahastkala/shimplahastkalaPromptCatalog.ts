import { shimplahastkalaPromptV1 } from "./shimplahastkalaPromptV1";
import { shimplahastkalaPromptV2 } from "./shimplahastkalaPromptV2";
import { shimplahastkalaPromptV3 } from "./shimplahastkalaPromptV3";

export type ShimplaHastkalaVersion = "V1" | "V2" | "V3";

export interface ShimplaHastkalaPromptFamily {
  version: ShimplaHastkalaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SHIMPLAHASTKALA_PROMPT_FAMILIES: Record<ShimplaHastkalaVersion, ShimplaHastkalaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Shimpla Shell Craft Surface",
    ...shimplahastkalaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Shimpla World",
    ...shimplahastkalaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Shimpla World",
    ...shimplahastkalaPromptV3,
  },
};
