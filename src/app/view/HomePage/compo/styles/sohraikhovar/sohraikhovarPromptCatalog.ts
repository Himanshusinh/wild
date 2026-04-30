import { sohraikhovarPromptV1 } from "./sohraikhovarPromptV1";
import { sohraikhovarPromptV2 } from "./sohraikhovarPromptV2";
import { sohraikhovarPromptV3 } from "./sohraikhovarPromptV3";

export type SohraiKhovarVersion = "V1" | "V2" | "V3";

export interface SohraiKhovarPromptFamily {
  version: SohraiKhovarVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SOHRAIKHOVAR_PROMPT_FAMILIES: Record<SohraiKhovarVersion, SohraiKhovarPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "SohraiKhovar",
    ...sohraikhovarPromptV1,
  },
  V2: {
    version: "V2",
    chip: "MURAL",
    title: "SohraiKhovar Variations",
    ...sohraikhovarPromptV2,
  },
  V3: {
    version: "V3",
    chip: "RITUAL",
    title: "Dimensional SohraiKhovar",
    ...sohraikhovarPromptV3,
  },
};
