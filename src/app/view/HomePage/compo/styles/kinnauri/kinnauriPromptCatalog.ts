import { kinnauriPromptV1 } from "./kinnauriPromptV1";
import { kinnauriPromptV2 } from "./kinnauriPromptV2";
import { kinnauriPromptV3 } from "./kinnauriPromptV3";

export type KinnauriVersion = "V1" | "V2" | "V3";

export interface KinnauriPromptFamily {
  version: KinnauriVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KINNAURI_PROMPT_FAMILIES: Record<KinnauriVersion, KinnauriPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Kinnauri Shawl Weaving Logic",
    ...kinnauriPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Kinnauri Textile Translation",
    ...kinnauriPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Kinnauri Textile World",
    ...kinnauriPromptV3,
  },
};
