import { manjushaPromptV1 } from "./manjushaPromptV1";
import { manjushaPromptV2 } from "./manjushaPromptV2";
import { manjushaPromptV3 } from "./manjushaPromptV3";

export type ManjushaVersion = "V1" | "V2" | "V3";

export interface ManjushaPromptFamily {
  version: ManjushaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const MANJUSHA_PROMPT_FAMILIES: Record<ManjushaVersion, ManjushaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Manjusha Ritual Narrative Grammar",
    ...manjushaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Manjusha Translation",
    ...manjushaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Manjusha World",
    ...manjushaPromptV3,
  },
};
