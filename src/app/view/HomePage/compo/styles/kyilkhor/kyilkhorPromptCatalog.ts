import { kyilkhorPromptV1 } from "./kyilkhorPromptV1";
import { kyilkhorPromptV2 } from "./kyilkhorPromptV2";
import { kyilkhorPromptV3 } from "./kyilkhorPromptV3";

export type KyilKhorVersion = "V1" | "V2" | "V3";

export interface KyilKhorPromptFamily {
  version: KyilKhorVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KYILKHOR_PROMPT_FAMILIES: Record<KyilKhorVersion, KyilKhorPromptFamily> =
  {
    V1: {
      version: "V1",
      chip: "AUTHENTIC",
      title: "Kyil-khor",
      ...kyilkhorPromptV1,
    },
    V2: {
      version: "V2",
      chip: "ARTISAN",
      title: "Handcrafted Dimensional Mandala",
      ...kyilkhorPromptV2,
    },
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "Full 3D Sand-Mandala World",
      ...kyilkhorPromptV3,
    },
  };

