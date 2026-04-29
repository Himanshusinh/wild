import { ladakhtextilesystemPromptV1 } from "./ladakhtextilesystemPromptV1";
import { ladakhtextilesystemPromptV2 } from "./ladakhtextilesystemPromptV2";
import { ladakhtextilesystemPromptV3 } from "./ladakhtextilesystemPromptV3";

export type LadakhtextilesystemVersion = "V1" | "V2" | "V3";

export interface LadakhtextilesystemPromptFamily {
  version: LadakhtextilesystemVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const LADAKHTEXTILESYSTEM_PROMPT_FAMILIES: Record<LadakhtextilesystemVersion, LadakhtextilesystemPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "LADAKH TEXTILE SYSTEM", ...ladakhtextilesystemPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "LADAKH TEXTILE SYSTEM", ...ladakhtextilesystemPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "LADAKH TEXTILE SYSTEM", ...ladakhtextilesystemPromptV3 },
};
