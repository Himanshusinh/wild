import { sarkandaarchitecturePromptV3 } from "./sarkandaarchitecturePromptV3";
export type SarkandaArchitectureVersion = "V3";
export interface SarkandaArchitecturePromptFamily {
  version: SarkandaArchitectureVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}
export const SARKANDAARCHITECTURE_PROMPT_FAMILIES: Record<SarkandaArchitectureVersion, SarkandaArchitecturePromptFamily> = {
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "3D Realistic SARKANDA ARCHITECTURE World",
      ...sarkandaarchitecturePromptV3,
    },
};