import { sandalwoodcarvingPromptV1 } from "./sandalwoodcarvingPromptV1";
import { sandalwoodcarvingPromptV2 } from "./sandalwoodcarvingPromptV2";
import { sandalwoodcarvingPromptV3 } from "./sandalwoodcarvingPromptV3";

export type SandalwoodCarvingVersion = "V1" | "V2" | "V3";

export interface SandalwoodCarvingPromptFamily {
  version: SandalwoodCarvingVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SANDALWOODCARVING_PROMPT_FAMILIES: Record<SandalwoodCarvingVersion, SandalwoodCarvingPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "SandalwoodCarving",
    ...sandalwoodcarvingPromptV1,
  },
  V2: {
    version: "V2",
    chip: "CARVED",
    title: "SandalwoodCarving Variations",
    ...sandalwoodcarvingPromptV2,
  },
  V3: {
    version: "V3",
    chip: "SANDALWOOD",
    title: "Dimensional SandalwoodCarving",
    ...sandalwoodcarvingPromptV3,
  },
};
