import { kangraPromptV1 } from "./kangraPromptV1";
import { kangraPromptV2 } from "./kangraPromptV2";
import { kangraPromptV3 } from "./kangraPromptV3";

export type KangraVersion = "V1" | "V2" | "V3";

export interface KangraPromptFamily {
  version: KangraVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KANGRA_PROMPT_FAMILIES: Record<KangraVersion, KangraPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Kangra Lyrical Miniature",
    ...kangraPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Kangra Pictorial World",
    ...kangraPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Kangra World",
    ...kangraPromptV3,
  },
};
