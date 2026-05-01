import { mataNiPachediPromptV1 } from "./mataNiPachediPromptV1";
import { mataNiPachediPromptV2 } from "./mataNiPachediPromptV2";
import { mataNiPachediPromptV3 } from "./mataNiPachediPromptV3";

export type MataNiPachediVersion = "V1" | "V2" | "V3";

export interface MataNiPachediPromptFamily {
  version: MataNiPachediVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const MATA_NI_PACHEDI_PROMPT_FAMILIES: Record<MataNiPachediVersion, MataNiPachediPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Mata ni Pachedi Shrine Grammar",
    ...mataNiPachediPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Mata ni Pachedi Translation",
    ...mataNiPachediPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Mata ni Pachedi World",
    ...mataNiPachediPromptV3,
  },
};
