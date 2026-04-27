import { walnutcarvingPromptV1 } from "./walnutcarvingPromptV1";
import { walnutcarvingPromptV2 } from "./walnutcarvingPromptV2";
import { walnutcarvingPromptV3 } from "./walnutcarvingPromptV3";

export type WalnutcarvingVersion = "V1" | "V2" | "V3";

export interface WalnutcarvingPromptFamily {
  version: WalnutcarvingVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const WALNUTCARVING_PROMPT_FAMILIES: Record<WalnutcarvingVersion, WalnutcarvingPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "WALNUT CARVING", ...walnutcarvingPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "WALNUT CARVING", ...walnutcarvingPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "WALNUT CARVING", ...walnutcarvingPromptV3 },
};
