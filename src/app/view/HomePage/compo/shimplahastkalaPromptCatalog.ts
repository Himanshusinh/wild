import { shimplahastkalaPromptV3 } from "./shimplahastkalaPromptV3";
export type ShimplaHastkalaVersion = "V3";
export interface ShimplaHastkalaPromptFamily {
  version: ShimplaHastkalaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}
export const SHIMPLAHASTKALA_PROMPT_FAMILIES: Record<ShimplaHastkalaVersion, ShimplaHastkalaPromptFamily> = {
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "3D Realistic SHIMPLA HASTKALA World",
      ...shimplahastkalaPromptV3,
    },
};