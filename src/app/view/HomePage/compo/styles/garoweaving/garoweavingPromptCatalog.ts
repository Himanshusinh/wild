import { garoweavingPromptV1 } from "./garoweavingPromptV1";
import { garoweavingPromptV2 } from "./garoweavingPromptV2";
import { garoweavingPromptV3 } from "./garoweavingPromptV3";

export const garoweavingPromptCatalog = {
  id: "garoweaving",
  name: "Garo Weaving",
  versions: [
    {
      id: "v1",
      version: "V1",
      name: "AUTHENTIC",
      description: "Source-faithful Garo weaving from Meghalaya",
      prompt: garoweavingPromptV1.prompt,
      promptI2I: garoweavingPromptV1.promptI2I,
    },
    {
      id: "v2",
      version: "V2",
      name: "ARTISAN",
      description: "Creative expansion of Garo weaving structure",
      prompt: garoweavingPromptV2.prompt,
      promptI2I: garoweavingPromptV2.promptI2I,
    },
    {
      id: "v3",
      version: "V3",
      name: "CINEMATIC",
      description: "3D realistic Garo weaving world",
      prompt: garoweavingPromptV3.prompt,
      promptI2I: garoweavingPromptV3.promptI2I,
    },
  ],
  chips: [
    "Dakmanda Logic",
    "Border Hierarchy",
    "Back-strap Loom",
    "Woven Symbols",
    "Meghalaya Heritage",
    "Cloth-Body Order",
  ],
};
