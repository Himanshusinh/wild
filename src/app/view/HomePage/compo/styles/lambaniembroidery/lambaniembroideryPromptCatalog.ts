import { lambaniembroideryPromptV1 } from "./lambaniembroideryPromptV1";
import { lambaniembroideryPromptV2 } from "./lambaniembroideryPromptV2";
import { lambaniembroideryPromptV3 } from "./lambaniembroideryPromptV3";

export type LambaniEmbroideryVersion = "V1" | "V2" | "V3";

export interface LambaniEmbroideryPromptFamily {
  version: LambaniEmbroideryVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const LAMBANIEMBROIDERY_PROMPT_FAMILIES: Record<LambaniEmbroideryVersion, LambaniEmbroideryPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "LambaniEmbroidery",
    ...lambaniembroideryPromptV1,
  },
  V2: {
    version: "V2",
    chip: "PATCHWORK",
    title: "LambaniEmbroidery Variations",
    ...lambaniembroideryPromptV2,
  },
  V3: {
    version: "V3",
    chip: "MIRRORS",
    title: "Dimensional LambaniEmbroidery",
    ...lambaniembroideryPromptV3,
  },
};
