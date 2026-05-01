import { gondpaintingPromptV1 } from "./gondpaintingPromptV1";
import { gondpaintingPromptV2 } from "./gondpaintingPromptV2";
import { gondpaintingPromptV3 } from "./gondpaintingPromptV3";

export const gondpaintingPromptCatalog = {
  id: "gondpainting",
  name: "Gond Painting",
  versions: [
    {
      id: "v1",
      version: "V1",
      name: "AUTHENTIC",
      description: "Source-faithful Gond painting logic",
      prompt: gondpaintingPromptV1.prompt,
      promptI2I: gondpaintingPromptV1.promptI2I,
    },
    {
      id: "v2",
      version: "V2",
      name: "ARTISAN",
      description: "Handcrafted dimensional Gond translation",
      prompt: gondpaintingPromptV2.prompt,
      promptI2I: gondpaintingPromptV2.promptI2I,
    },
    {
      id: "v3",
      version: "V3",
      name: "CINEMATIC",
      description: "Fully volumetric cinematic Gond world",
      prompt: gondpaintingPromptV3.prompt,
      promptI2I: gondpaintingPromptV3.promptI2I,
    },
  ],
  chips: [
    "Patangarh Lineage",
    "Rhythmic Dots",
    "Living Silhouettes",
    "Ecological Myth",
    "Madhya Pradesh Heritage",
    "Internal Activation",
  ],
};
