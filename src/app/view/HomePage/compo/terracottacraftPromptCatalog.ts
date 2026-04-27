import { terracottacraftPromptV1 } from "./terracottacraftPromptV1";
import { terracottacraftPromptV2 } from "./terracottacraftPromptV2";
import { terracottacraftPromptV3 } from "./terracottacraftPromptV3";

export type TerracottacraftVersion = "V1" | "V2" | "V3";

export interface TerracottacraftPromptFamily {
  version: TerracottacraftVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const TERRACOTTACRAFT_PROMPT_FAMILIES: Record<TerracottacraftVersion, TerracottacraftPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "TERRACOTTA CRAFT", ...terracottacraftPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "TERRACOTTA CRAFT", ...terracottacraftPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "TERRACOTTA CRAFT", ...terracottacraftPromptV3 },
};
