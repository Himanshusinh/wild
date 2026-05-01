import { ajrakhPromptV1 } from "./ajrakhPromptV1";
import { ajrakhPromptV2 } from "./ajrakhPromptV2";
import { ajrakhPromptV3 } from "./ajrakhPromptV3";

export type AjrakhVersion = "V1" | "V2" | "V3";

export interface AjrakhPromptFamily {
  version: AjrakhVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const AJRAKH_PROMPT_FAMILIES: Record<AjrakhVersion, AjrakhPromptFamily> =
  {
    V1: {
      version: "V1",
      chip: "AUTHENTIC",
      title: "Ajrakh Resist Block Print",
      ...ajrakhPromptV1,
    },
    V2: {
      version: "V2",
      chip: "ARTISAN",
      title: "Dimensional Ajrakh Textile Field",
      ...ajrakhPromptV2,
    },
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "3D Realistic Ajrakh World",
      ...ajrakhPromptV3,
    },
  };
