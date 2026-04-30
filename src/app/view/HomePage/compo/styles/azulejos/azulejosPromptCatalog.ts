import { azulejosPromptV1 } from "./azulejosPromptV1";
import { azulejosPromptV2 } from "./azulejosPromptV2";
import { azulejosPromptV3 } from "./azulejosPromptV3";

export type AzulejosVersion = "V1" | "V2" | "V3";

export interface AzulejosPromptFamily {
  version: AzulejosVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const AZULEJOS_PROMPT_FAMILIES: Record<AzulejosVersion, AzulejosPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Azulejos",
    ...azulejosPromptV1,
  },
  V2: {
    version: "V2",
    chip: "GLAZED",
    title: "Azulejos Variations",
    ...azulejosPromptV2,
  },
  V3: {
    version: "V3",
    chip: "ARCHITECTURAL",
    title: "Dimensional Azulejos",
    ...azulejosPromptV3,
  },
};
