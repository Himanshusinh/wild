import { neoAgrarianBrutalismPromptV3 } from "./neoAgrarianBrutalismPromptV3";

export type NeoAgrarianBrutalismVersion = "V3";

export interface NeoAgrarianBrutalismPromptFamily {
  version: NeoAgrarianBrutalismVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const NEO_AGRARIAN_BRUTALISM_PROMPT_FAMILIES: Record<NeoAgrarianBrutalismVersion, NeoAgrarianBrutalismPromptFamily> = {
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "3D Realistic Neo-Agrarian Brutalism World",
      ...neoAgrarianBrutalismPromptV3,
    },
};
