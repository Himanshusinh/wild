import { coircraftlakshadweepPromptV1 } from "./coircraftlakshadweepPromptV1";
import { coircraftlakshadweepPromptV2 } from "./coircraftlakshadweepPromptV2";
import { coircraftlakshadweepPromptV3 } from "./coircraftlakshadweepPromptV3";

export type CoircraftlakshadweepVersion = "V1" | "V2" | "V3";

export interface CoircraftlakshadweepPromptFamily {
  version: CoircraftlakshadweepVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const COIRCRAFTLAKSHADWEEP_PROMPT_FAMILIES: Record<CoircraftlakshadweepVersion, CoircraftlakshadweepPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "COIR CRAFT", ...coircraftlakshadweepPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "COIR CRAFT", ...coircraftlakshadweepPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "COIR CRAFT", ...coircraftlakshadweepPromptV3 },
};
