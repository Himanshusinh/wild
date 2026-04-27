import { kolhapurjewelleryPromptV1 } from "./kolhapurjewelleryPromptV1";
import { kolhapurjewelleryPromptV2 } from "./kolhapurjewelleryPromptV2";
import { kolhapurjewelleryPromptV3 } from "./kolhapurjewelleryPromptV3";

export type KolhapurJewelleryVersion = "V1" | "V2" | "V3";

export interface KolhapurJewelleryPromptFamily {
  version: KolhapurJewelleryVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KOLHAPURJEWELLERY_PROMPT_FAMILIES: Record<KolhapurJewelleryVersion, KolhapurJewelleryPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "KolhapurJewellery",
    ...kolhapurjewelleryPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ORNAMENT",
    title: "KolhapurJewellery Variations",
    ...kolhapurjewelleryPromptV2,
  },
  V3: {
    version: "V3",
    chip: "UNITS",
    title: "Dimensional KolhapurJewellery",
    ...kolhapurjewelleryPromptV3,
  },
};
