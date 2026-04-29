import { likhaiwoodcarvingPromptV1 } from "./likhaiwoodcarvingPromptV1";
import { likhaiwoodcarvingPromptV2 } from "./likhaiwoodcarvingPromptV2";
import { likhaiwoodcarvingPromptV3 } from "./likhaiwoodcarvingPromptV3";

export type LikhaiwoodcarvingVersion = "V1" | "V2" | "V3";

export interface LikhaiwoodcarvingPromptFamily {
  version: LikhaiwoodcarvingVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const LIKHAIWOODCARVING_PROMPT_FAMILIES: Record<LikhaiwoodcarvingVersion, LikhaiwoodcarvingPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "LIKHAI WOOD CARVING", ...likhaiwoodcarvingPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "LIKHAI WOOD CARVING", ...likhaiwoodcarvingPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "LIKHAI WOOD CARVING", ...likhaiwoodcarvingPromptV3 },
};
