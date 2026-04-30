import { nagashawlPromptV1 } from "./nagashawlPromptV1";
import { nagashawlPromptV2 } from "./nagashawlPromptV2";
import { nagashawlPromptV3 } from "./nagashawlPromptV3";

export type NagaShawlVersion = "V1" | "V2" | "V3";

export interface NagaShawlPromptFamily {
  version: NagaShawlVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const NAGASHAWL_PROMPT_FAMILIES: Record<NagaShawlVersion, NagaShawlPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Source-faithful Woven Logic",
    ...nagashawlPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Handcrafted Dimensional Weave",
    ...nagashawlPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "Full 3D Cinematic Woven World",
    ...nagashawlPromptV3,
  },
};

export interface NagaShawlPromptCatalog {
  id: string;
  name: string;
  prompts: Record<NagaShawlVersion, { promptHard: string; promptVariable: string; promptI2I: string }>;
  defaultPrompt: { promptHard: string; promptVariable: string; promptI2I: string };
  promptI2I: { promptHard: string; promptVariable: string; promptI2I: string };
}

export const nagashawlPromptCatalog: NagaShawlPromptCatalog = {
  id: "nagashawl",
  name: "Naga Shawl",
  prompts: {
    V1: nagashawlPromptV1,
    V2: nagashawlPromptV2,
    V3: nagashawlPromptV3,
  },
  defaultPrompt: nagashawlPromptV1,
  promptI2I: nagashawlPromptV1,
};
