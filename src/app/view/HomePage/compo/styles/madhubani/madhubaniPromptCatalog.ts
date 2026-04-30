import { madhubaniPromptV1 } from "./madhubaniPromptV1";
import { madhubaniPromptV2 } from "./madhubaniPromptV2";
import { madhubaniPromptV3 } from "./madhubaniPromptV3";

export type MadhubaniVersion = "V1" | "V2" | "V3";

export interface MadhubaniPromptFamily {
  version: MadhubaniVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const MADHUBANI_PROMPT_FAMILIES: Record<MadhubaniVersion, MadhubaniPromptFamily> =
  {
    V1: {
      version: "V1",
      chip: "AUTHENTIC",
      title: "Madhubani",
      ...madhubaniPromptV1,
    },
    V2: {
      version: "V2",
      chip: "ARTISAN",
      title: "2D/3D Mithila Field",
      ...madhubaniPromptV2,
    },
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "Full 3D Mithila World",
      ...madhubaniPromptV3,
    },
  };

