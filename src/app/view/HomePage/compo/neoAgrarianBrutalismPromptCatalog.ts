import { neoAgrarianBrutalismPromptV1 } from "./neoAgrarianBrutalismPromptV1";
import { neoAgrarianBrutalismPromptV2 } from "./neoAgrarianBrutalismPromptV2";
import { neoAgrarianBrutalismPromptV3 } from "./neoAgrarianBrutalismPromptV3";

export type NeoAgrarianBrutalismVersion = "V1" | "V2" | "V3";

export interface NeoAgrarianBrutalismPromptFamily {
  version: NeoAgrarianBrutalismVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const NEO_AGRARIAN_BRUTALISM_PROMPT_FAMILIES: Record<NeoAgrarianBrutalismVersion, NeoAgrarianBrutalismPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "Agrarian-Industrial Flatscape", ...neoAgrarianBrutalismPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "Dimensional Agrarian-Industrial World", ...neoAgrarianBrutalismPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "3D Cinematic Agrarian-Industrial World", ...neoAgrarianBrutalismPromptV3 },
};
