import { bodyaugmentationPromptV1 } from "./bodyaugmentationPromptV1";
import { bodyaugmentationPromptV2 } from "./bodyaugmentationPromptV2";
import { bodyaugmentationPromptV3 } from "./bodyaugmentationPromptV3";

export type BodyAugmentationVersion = "V1" | "V2" | "V3";

export interface BodyAugmentationPromptFamily {
  version: BodyAugmentationVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BODYAUGMENTATION_PROMPT_FAMILIES: Record<BodyAugmentationVersion, BodyAugmentationPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "BodyAugmentation",
    ...bodyaugmentationPromptV1,
  },
  V2: {
    version: "V2",
    chip: "BODY-ART",
    title: "BodyAugmentation Variations",
    ...bodyaugmentationPromptV2,
  },
  V3: {
    version: "V3",
    chip: "SYMBOLIC",
    title: "Dimensional BodyAugmentation",
    ...bodyaugmentationPromptV3,
  },
};
