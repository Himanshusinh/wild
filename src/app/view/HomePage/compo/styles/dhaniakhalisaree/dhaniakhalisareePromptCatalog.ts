import { dhaniakhalisareePromptV1 } from "./dhaniakhalisareePromptV1";
import { dhaniakhalisareePromptV2 } from "./dhaniakhalisareePromptV2";
import { dhaniakhalisareePromptV3 } from "./dhaniakhalisareePromptV3";

export type DhaniakhalisareeVersion = "V1" | "V2" | "V3";

export interface DhaniakhalisareePromptFamily {
  version: DhaniakhalisareeVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const DHANIAKHALISAREE_PROMPT_FAMILIES: Record<DhaniakhalisareeVersion, DhaniakhalisareePromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "DHANIAKHALI SAREE", ...dhaniakhalisareePromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "DHANIAKHALI SAREE", ...dhaniakhalisareePromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "DHANIAKHALI SAREE", ...dhaniakhalisareePromptV3 },
};
