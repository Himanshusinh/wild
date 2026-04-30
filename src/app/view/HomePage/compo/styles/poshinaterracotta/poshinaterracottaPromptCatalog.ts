import { poshinaterracottaPromptV1 } from "./poshinaterracottaPromptV1";
import { poshinaterracottaPromptV2 } from "./poshinaterracottaPromptV2";
import { poshinaterracottaPromptV3 } from "./poshinaterracottaPromptV3";

export type PoshinaTerracottaVersion = "V1" | "V2" | "V3";

export interface PoshinaTerracottaPromptFamily {
  version: PoshinaTerracottaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const POSHINATERRACOTTA_PROMPT_FAMILIES: Record<PoshinaTerracottaVersion, PoshinaTerracottaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "PoshinaTerracotta",
    ...poshinaterracottaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "VOTIVE",
    title: "PoshinaTerracotta Variations",
    ...poshinaterracottaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "TERRACOTTA",
    title: "Dimensional PoshinaTerracotta",
    ...poshinaterracottaPromptV3,
  },
};
