import { punjabjuttiPromptV1 } from "./punjabjuttiPromptV1";
import { punjabjuttiPromptV2 } from "./punjabjuttiPromptV2";
import { punjabjuttiPromptV3 } from "./punjabjuttiPromptV3";

export type PunjabJuttiVersion = "V1" | "V2" | "V3";

export interface PunjabJuttiPromptFamily {
  version: PunjabJuttiVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PUNJABJUTTI_PROMPT_FAMILIES: Record<PunjabJuttiVersion, PunjabJuttiPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Punjab Jutti",
    ...punjabjuttiPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Punjab Jutti",
    ...punjabjuttiPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Punjab Jutti",
    ...punjabjuttiPromptV3,
  },
};
