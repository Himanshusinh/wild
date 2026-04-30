import { woodtemplecarvingPromptV1 } from "./woodtemplecarvingPromptV1";
import { woodtemplecarvingPromptV2 } from "./woodtemplecarvingPromptV2";
import { woodtemplecarvingPromptV3 } from "./woodtemplecarvingPromptV3";

export type WoodTempleCarvingVersion = "V1" | "V2" | "V3";

export interface WoodTempleCarvingPromptFamily {
  version: WoodTempleCarvingVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const WOODTEMPLECARVING_PROMPT_FAMILIES: Record<WoodTempleCarvingVersion, WoodTempleCarvingPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "WoodTempleCarving",
    ...woodtemplecarvingPromptV1,
  },
  V2: {
    version: "V2",
    chip: "SACRED",
    title: "WoodTempleCarving Variations",
    ...woodtemplecarvingPromptV2,
  },
  V3: {
    version: "V3",
    chip: "RELIEF",
    title: "Dimensional WoodTempleCarving",
    ...woodtemplecarvingPromptV3,
  },
};
