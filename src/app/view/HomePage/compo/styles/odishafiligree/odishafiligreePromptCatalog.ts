import { odishafiligreePromptV1 } from "./odishafiligreePromptV1";
import { odishafiligreePromptV2 } from "./odishafiligreePromptV2";
import { odishafiligreePromptV3 } from "./odishafiligreePromptV3";

export type OdishafiligreeVersion = "V1" | "V2" | "V3";

export const ODISHAFILIGREE_PROMPT_FAMILIES: Record<OdishafiligreeVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: odishafiligreePromptV1,
  V2: odishafiligreePromptV2,
  V3: odishafiligreePromptV3,
};
