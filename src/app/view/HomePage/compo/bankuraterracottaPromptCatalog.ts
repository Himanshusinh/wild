import { bankuraterracottaPromptV1 } from "./bankuraterracottaPromptV1";
import { bankuraterracottaPromptV2 } from "./bankuraterracottaPromptV2";
import { bankuraterracottaPromptV3 } from "./bankuraterracottaPromptV3";

export type BankuraterracottaVersion = "V1" | "V2" | "V3";

export interface BankuraterracottaPromptFamily {
  version: BankuraterracottaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BANKURATERRACOTTA_PROMPT_FAMILIES: Record<BankuraterracottaVersion, BankuraterracottaPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "BANKURA TERRACOTTA", ...bankuraterracottaPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "BANKURA TERRACOTTA", ...bankuraterracottaPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "BANKURA TERRACOTTA", ...bankuraterracottaPromptV3 },
};
