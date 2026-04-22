import { molelaPromptV1 } from "./molelaPromptV1";
import { molelaPromptV2 } from "./molelaPromptV2";
import { molelaPromptV3 } from "./molelaPromptV3";

export type MolelaVersion = "V1" | "V2" | "V3";

export interface MolelaPromptFamily {
  version: MolelaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const MOLELA_PROMPT_FAMILIES: Record<MolelaVersion, MolelaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Molela",
    ...molelaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Molela",
    ...molelaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Molela",
    ...molelaPromptV3,
  },
};
