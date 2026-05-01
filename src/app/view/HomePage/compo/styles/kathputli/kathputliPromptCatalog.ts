import { kathputliPromptV1 } from "./kathputliPromptV1";
import { kathputliPromptV2 } from "./kathputliPromptV2";
import { kathputliPromptV3 } from "./kathputliPromptV3";

export type KathputliVersion = "V1" | "V2" | "V3";

export interface KathputliPromptFamily {
  version: KathputliVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KATHPUTLI_PROMPT_FAMILIES: Record<KathputliVersion, KathputliPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Kathputli",
    ...kathputliPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Kathputli",
    ...kathputliPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Kathputli",
    ...kathputliPromptV3,
  },
};
