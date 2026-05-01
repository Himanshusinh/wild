import { sambalpuribandhaPromptV1 } from "./sambalpuribandhaPromptV1";
import { sambalpuribandhaPromptV2 } from "./sambalpuribandhaPromptV2";
import { sambalpuribandhaPromptV3 } from "./sambalpuribandhaPromptV3";

export type SambalpuriBandhaVersion = "V1" | "V2" | "V3";

export interface SambalpuriBandhaPromptFamily {
  version: SambalpuriBandhaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SAMBALPURIBANDHA_PROMPT_FAMILIES: Record<SambalpuriBandhaVersion, SambalpuriBandhaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Sambalpuri Bandha",
    ...sambalpuribandhaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Sambalpuri Bandha",
    ...sambalpuribandhaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Sambalpuri Bandha",
    ...sambalpuribandhaPromptV3,
  },
};
