import { rajasthaniminiaturePromptV1 } from "./rajasthaniminiaturePromptV1";
import { rajasthaniminiaturePromptV2 } from "./rajasthaniminiaturePromptV2";
import { rajasthaniminiaturePromptV3 } from "./rajasthaniminiaturePromptV3";

export type RajasthaniMiniatureVersion = "V1" | "V2" | "V3";

export interface RajasthaniMiniaturePromptFamily {
  version: RajasthaniMiniatureVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const RAJASTHANIMINIATURE_PROMPT_FAMILIES: Record<RajasthaniMiniatureVersion, RajasthaniMiniaturePromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Rajasthani Miniature",
    ...rajasthaniminiaturePromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Rajasthani Miniature",
    ...rajasthaniminiaturePromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Rajasthani Miniature",
    ...rajasthaniminiaturePromptV3,
  },
};
