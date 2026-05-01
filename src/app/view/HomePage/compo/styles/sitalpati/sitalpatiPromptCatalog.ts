import { sitalpatiPromptV1 } from "./sitalpatiPromptV1";
import { sitalpatiPromptV2 } from "./sitalpatiPromptV2";
import { sitalpatiPromptV3 } from "./sitalpatiPromptV3";

export type SitalpatiVersion = "V1" | "V2" | "V3";

export interface SitalpatiPromptFamily {
  version: SitalpatiVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SITALPATI_PROMPT_FAMILIES: Record<SitalpatiVersion, SitalpatiPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Sitalpati Woven Mat Surface",
    ...sitalpatiPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Sitalpati World",
    ...sitalpatiPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Sitalpati World",
    ...sitalpatiPromptV3,
  },
};
