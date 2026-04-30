import { monpaMaskPromptV1 } from "./monpaMaskPromptV1";
import { monpaMaskPromptV2 } from "./monpaMaskPromptV2";
import { monpaMaskPromptV3 } from "./monpaMaskPromptV3";

export type MonpaMaskVersion = "V1" | "V2" | "V3";

export interface MonpaMaskPromptFamily {
  version: MonpaMaskVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const MONPA_MASK_PROMPT_FAMILIES: Record<MonpaMaskVersion, MonpaMaskPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Monpa Mask",
    ...monpaMaskPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "2D/3D Woodcraft World",
    ...monpaMaskPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "Volumetric Woodcraft World",
    ...monpaMaskPromptV3,
  },
};

