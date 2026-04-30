import { pilkhuwablockprintPromptV1 } from "./pilkhuwablockprintPromptV1";
import { pilkhuwablockprintPromptV2 } from "./pilkhuwablockprintPromptV2";
import { pilkhuwablockprintPromptV3 } from "./pilkhuwablockprintPromptV3";

export type PilkhuwablockprintVersion = "V1" | "V2" | "V3";

export const PILKHUWABLOCKPRINT_PROMPT_FAMILIES: Record<PilkhuwablockprintVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: pilkhuwablockprintPromptV1,
  V2: pilkhuwablockprintPromptV2,
  V3: pilkhuwablockprintPromptV3,
};
