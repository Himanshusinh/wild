import { srikalahastiPromptV1 } from "./srikalahastiPromptV1";
import { srikalahastiPromptV2 } from "./srikalahastiPromptV2";
import { srikalahastiPromptV3 } from "./srikalahastiPromptV3";

export type SrikalahastiVersion = "V1" | "V2" | "V3";

export interface SrikalahastiPromptFamily {
  version: SrikalahastiVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SRIKALAHASTI_PROMPT_FAMILIES: Record<SrikalahastiVersion, SrikalahastiPromptFamily> =
  {
    V1: {
      version: "V1",
      chip: "AUTHENTIC",
      title: "Srikalahasti Kalamkari",
      ...srikalahastiPromptV1,
    },
    V2: {
      version: "V2",
      chip: "ARTISAN",
      title: "Dimensional Translation",
      ...srikalahastiPromptV2,
    },
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "Volumetric World",
      ...srikalahastiPromptV3,
    },
  };

