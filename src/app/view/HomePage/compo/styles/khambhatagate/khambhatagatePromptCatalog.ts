import { khambhatagatePromptV1 } from "./khambhatagatePromptV1";
import { khambhatagatePromptV2 } from "./khambhatagatePromptV2";
import { khambhatagatePromptV3 } from "./khambhatagatePromptV3";

export type KhambhatAgateVersion = "V1" | "V2" | "V3";

export interface KhambhatAgatePromptFamily {
  version: KhambhatAgateVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KHAMBHATAGATE_PROMPT_FAMILIES: Record<KhambhatAgateVersion, KhambhatAgatePromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "KhambhatAgate",
    ...khambhatagatePromptV1,
  },
  V2: {
    version: "V2",
    chip: "POLISHED",
    title: "KhambhatAgate Variations",
    ...khambhatagatePromptV2,
  },
  V3: {
    version: "V3",
    chip: "TRANSLUCENCY",
    title: "Dimensional KhambhatAgate",
    ...khambhatagatePromptV3,
  },
};
