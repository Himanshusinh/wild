import { ceremonialemblemPromptV1 } from "./ceremonialemblemPromptV1";
import { ceremonialemblemPromptV2 } from "./ceremonialemblemPromptV2";
import { ceremonialemblemPromptV3 } from "./ceremonialemblemPromptV3";

export type CeremonialEmblemVersion = "V1" | "V2" | "V3";

export interface CeremonialEmblemPromptFamily {
  version: CeremonialEmblemVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const CEREMONIALEMBLEM_PROMPT_FAMILIES: Record<CeremonialEmblemVersion, CeremonialEmblemPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "CeremonialEmblem",
    ...ceremonialemblemPromptV1,
  },
  V2: {
    version: "V2",
    chip: "SYMBOLIC",
    title: "CeremonialEmblem Variations",
    ...ceremonialemblemPromptV2,
  },
  V3: {
    version: "V3",
    chip: "AUTHORITY",
    title: "Dimensional CeremonialEmblem",
    ...ceremonialemblemPromptV3,
  },
};
