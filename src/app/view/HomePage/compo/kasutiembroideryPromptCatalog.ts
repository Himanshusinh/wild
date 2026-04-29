import { kasutiembroideryPromptV1 } from "./kasutiembroideryPromptV1";
import { kasutiembroideryPromptV2 } from "./kasutiembroideryPromptV2";
import { kasutiembroideryPromptV3 } from "./kasutiembroideryPromptV3";

export type KasutiEmbroideryVersion = "V1" | "V2" | "V3";

export interface KasutiEmbroideryPromptFamily {
  version: KasutiEmbroideryVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KASUTIEMBROIDERY_PROMPT_FAMILIES: Record<KasutiEmbroideryVersion, KasutiEmbroideryPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "KasutiEmbroidery",
    ...kasutiembroideryPromptV1,
  },
  V2: {
    version: "V2",
    chip: "GEOMETRIC",
    title: "KasutiEmbroidery Variations",
    ...kasutiembroideryPromptV2,
  },
  V3: {
    version: "V3",
    chip: "STITCHING",
    title: "Dimensional KasutiEmbroidery",
    ...kasutiembroideryPromptV3,
  },
};
