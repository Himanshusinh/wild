import { coastalfibercraftPromptV1 } from "./coastalfibercraftPromptV1";
import { coastalfibercraftPromptV2 } from "./coastalfibercraftPromptV2";
import { coastalfibercraftPromptV3 } from "./coastalfibercraftPromptV3";

export type CoastalfibercraftVersion = "V1" | "V2" | "V3";

export interface CoastalfibercraftPromptFamily {
  version: CoastalfibercraftVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const COASTALFIBERCRAFT_PROMPT_FAMILIES: Record<CoastalfibercraftVersion, CoastalfibercraftPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "COASTAL FIBER CRAFT", ...coastalfibercraftPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "COASTAL FIBER CRAFT", ...coastalfibercraftPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "COASTAL FIBER CRAFT", ...coastalfibercraftPromptV3 },
};
