import { himrooPromptV1 } from "./himrooPromptV1";
import { himrooPromptV2 } from "./himrooPromptV2";
import { himrooPromptV3 } from "./himrooPromptV3";

export const himrooPromptCatalog = {
  id: "himroo",
  name: "Himroo",
  versions: [
    {
      id: "v1",
      version: "V1",
      name: "AUTHENTIC",
      description: "Source-faithful Himroo world from Maharashtra",
      prompt: himrooPromptV1.prompt,
      promptI2I: himrooPromptV1.promptI2I,
    },
    {
      id: "v2",
      version: "V2",
      name: "ARTISAN",
      description: "Creative expansion of Himroo field logic",
      prompt: himrooPromptV2.prompt,
      promptI2I: himrooPromptV2.promptI2I,
    },
    {
      id: "v3",
      version: "V3",
      name: "CINEMATIC",
      description: "3D realistic Himroo world",
      prompt: himrooPromptV3.prompt,
      promptI2I: himrooPromptV3.promptI2I,
    },
  ],
  chips: [
    "Woven Field Logic",
    "Silk-Cotton Presence",
    "Deccani Restraint",
    "Layered Weave Depth",
    "Aurangabad Heritage",
    "Courtly Elegance",
  ],
};
