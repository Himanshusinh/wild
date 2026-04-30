import { rockgardenassemblagePromptV1 } from "./rockgardenassemblagePromptV1";
import { rockgardenassemblagePromptV2 } from "./rockgardenassemblagePromptV2";
import { rockgardenassemblagePromptV3 } from "./rockgardenassemblagePromptV3";

export type RockgardenassemblageVersion = "V1" | "V2" | "V3";

export interface RockgardenassemblagePromptFamily {
  version: RockgardenassemblageVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const ROCKGARDENASSEMBLAGE_PROMPT_FAMILIES: Record<RockgardenassemblageVersion, RockgardenassemblagePromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "ROCK GARDEN ASSEMBLAGE", ...rockgardenassemblagePromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "ROCK GARDEN ASSEMBLAGE", ...rockgardenassemblagePromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "ROCK GARDEN ASSEMBLAGE", ...rockgardenassemblagePromptV3 },
};
