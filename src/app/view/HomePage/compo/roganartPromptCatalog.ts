import { roganartPromptV3 } from "./roganartPromptV3";
export type RoganArtVersion = "V3";
export interface RoganArtPromptFamily {
  version: RoganArtVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}
export const ROGANART_PROMPT_FAMILIES: Record<RoganArtVersion, RoganArtPromptFamily> = {
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "3D Realistic ROGAN ART World",
      ...roganartPromptV3,
    },
};