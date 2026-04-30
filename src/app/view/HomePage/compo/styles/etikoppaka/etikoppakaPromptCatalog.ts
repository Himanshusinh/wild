import { etikoppakaPromptV1 } from "./etikoppakaPromptV1";
import { etikoppakaPromptV2 } from "./etikoppakaPromptV2";
import { etikoppakaPromptV3 } from "./etikoppakaPromptV3";

export type EtikoppakaVersion = "V1" | "V2" | "V3";

export interface EtikoppakaPromptFamily {
  version: EtikoppakaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const ETIKOPPAKA_PROMPT_FAMILIES: Record<
  EtikoppakaVersion,
  EtikoppakaPromptFamily
> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Etikoppaka Toys",
    ...etikoppakaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "2D/3D Lacquer World",
    ...etikoppakaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "Full 3D Lacquer World",
    ...etikoppakaPromptV3,
  },
};

