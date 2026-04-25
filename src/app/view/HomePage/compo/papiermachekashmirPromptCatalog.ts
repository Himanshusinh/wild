import { papiermachekashmirPromptV1 } from "./papiermachekashmirPromptV1";
import { papiermachekashmirPromptV2 } from "./papiermachekashmirPromptV2";
import { papiermachekashmirPromptV3 } from "./papiermachekashmirPromptV3";

export type PapiermachekashmirVersion = "V1" | "V2" | "V3";

export interface PapiermachekashmirPromptFamily {
  version: PapiermachekashmirVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PAPIERMACHEKASHMIR_PROMPT_FAMILIES: Record<PapiermachekashmirVersion, PapiermachekashmirPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "PAPIER-MACHE", ...papiermachekashmirPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "PAPIER-MACHE", ...papiermachekashmirPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "PAPIER-MACHE", ...papiermachekashmirPromptV3 },
};
