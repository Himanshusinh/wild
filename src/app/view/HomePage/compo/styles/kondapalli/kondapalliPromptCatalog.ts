import { kondapalliPromptV1 } from "./kondapalliPromptV1";
import { kondapalliPromptV2 } from "./kondapalliPromptV2";
import { kondapalliPromptV3 } from "./kondapalliPromptV3";

export type KondapalliVersion = "V1" | "V2" | "V3";

export interface KondapalliPromptFamily {
  version: KondapalliVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KONDAPALLI_PROMPT_FAMILIES: Record<KondapalliVersion, KondapalliPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Kondapalli Toys",
    ...kondapalliPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "2D/3D Toy World",
    ...kondapalliPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "Full 3D Toy World",
    ...kondapalliPromptV3,
  },
};

