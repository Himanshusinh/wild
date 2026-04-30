import { sikkimcarpetPromptV1 } from "./sikkimcarpetPromptV1";
import { sikkimcarpetPromptV2 } from "./sikkimcarpetPromptV2";
import { sikkimcarpetPromptV3 } from "./sikkimcarpetPromptV3";

export type SikkimCarpetVersion = "V1" | "V2" | "V3";

export interface SikkimCarpetPromptFamily {
  version: SikkimCarpetVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SIKKIMCARPET_PROMPT_FAMILIES: Record<SikkimCarpetVersion, SikkimCarpetPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Sikkim Carpet",
    ...sikkimcarpetPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Sikkim Carpet",
    ...sikkimcarpetPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Sikkim Carpet",
    ...sikkimcarpetPromptV3,
  },
};
