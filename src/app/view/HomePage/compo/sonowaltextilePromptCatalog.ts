import { sonowaltextilePromptV1 } from "./sonowaltextilePromptV1";
import { sonowaltextilePromptV2 } from "./sonowaltextilePromptV2";
import { sonowaltextilePromptV3 } from "./sonowaltextilePromptV3";

export type SonowalTextileVersion = "V1" | "V2" | "V3";

export interface SonowalTextilePromptFamily {
  version: SonowalTextileVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SONOWALTEXTILE_PROMPT_FAMILIES: Record<SonowalTextileVersion, SonowalTextilePromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Sonowal Handloom Surface",
    ...sonowaltextilePromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Sonowal World",
    ...sonowaltextilePromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Sonowal World",
    ...sonowaltextilePromptV3,
  },
};
