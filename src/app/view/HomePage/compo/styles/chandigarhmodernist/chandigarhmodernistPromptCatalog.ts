import { chandigarhmodernistPromptV1 } from "./chandigarhmodernistPromptV1";
import { chandigarhmodernistPromptV2 } from "./chandigarhmodernistPromptV2";
import { chandigarhmodernistPromptV3 } from "./chandigarhmodernistPromptV3";

export type ChandigarhmodernistVersion = "V1" | "V2" | "V3";

export interface ChandigarhmodernistPromptFamily {
  version: ChandigarhmodernistVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const CHANDIGARHMODERNIST_PROMPT_FAMILIES: Record<ChandigarhmodernistVersion, ChandigarhmodernistPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "CHANDIGARH MODERNIST", ...chandigarhmodernistPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "CHANDIGARH MODERNIST", ...chandigarhmodernistPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "CHANDIGARH MODERNIST", ...chandigarhmodernistPromptV3 },
};
