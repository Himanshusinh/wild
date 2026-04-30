import { agramarbleinlayPromptV1 } from "./agramarbleinlayPromptV1";
import { agramarbleinlayPromptV2 } from "./agramarbleinlayPromptV2";
import { agramarbleinlayPromptV3 } from "./agramarbleinlayPromptV3";

export type AgramarbleinlayVersion = "V1" | "V2" | "V3";

export interface AgramarbleinlayPromptFamily {
  version: AgramarbleinlayVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const AGRAMARBLEINLAY_PROMPT_FAMILIES: Record<AgramarbleinlayVersion, AgramarbleinlayPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "AGRA MARBLE INLAY", ...agramarbleinlayPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "AGRA MARBLE INLAY", ...agramarbleinlayPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "AGRA MARBLE INLAY", ...agramarbleinlayPromptV3 },
};
