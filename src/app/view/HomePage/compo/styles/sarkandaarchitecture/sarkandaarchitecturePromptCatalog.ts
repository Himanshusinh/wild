import { sarkandaarchitecturePromptV1 } from "./sarkandaarchitecturePromptV1";
import { sarkandaarchitecturePromptV2 } from "./sarkandaarchitecturePromptV2";
import { sarkandaarchitecturePromptV3 } from "./sarkandaarchitecturePromptV3";

export type SarkandaArchitectureVersion = "V1" | "V2" | "V3";

export interface SarkandaArchitecturePromptFamily {
  version: SarkandaArchitectureVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SARKANDAARCHITECTURE_PROMPT_FAMILIES: Record<SarkandaArchitectureVersion, SarkandaArchitecturePromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Sarkanda Reed Shelter",
    ...sarkandaarchitecturePromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Sarkanda World",
    ...sarkandaarchitecturePromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Sarkanda World",
    ...sarkandaarchitecturePromptV3,
  },
};
