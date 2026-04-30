import { gabbaPromptV1 } from "./gabbaPromptV1";
import { gabbaPromptV2 } from "./gabbaPromptV2";
import { gabbaPromptV3 } from "./gabbaPromptV3";

export type GabbaVersion = "V1" | "V2" | "V3";

export interface GabbaPromptFamily {
  version: GabbaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const GABBA_PROMPT_FAMILIES: Record<GabbaVersion, GabbaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Gabba Kashmiri Patchwork",
    ...gabbaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Gabba Textile",
    ...gabbaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Gabba World",
    ...gabbaPromptV3,
  },
};
