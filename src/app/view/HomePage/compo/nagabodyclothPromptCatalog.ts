import { nagabodyclothPromptV1 } from "./nagabodyclothPromptV1";
import { nagabodyclothPromptV2 } from "./nagabodyclothPromptV2";
import { nagabodyclothPromptV3 } from "./nagabodyclothPromptV3";

export const nagabodyclothPromptCatalog = {
  id: "nagabodycloth",
  name: "Naga Body-Cloth",
  versions: [
    {
      id: "v1",
      version: "V1",
      name: "AUTHENTIC",
      description: "Source-faithful Naga body-cloth world",
      prompt: nagabodyclothPromptV1.prompt,
      promptI2I: nagabodyclothPromptV1.promptI2I,
    },
    {
      id: "v2",
      version: "V2",
      name: "ARTISAN",
      description: "Creative expansion of Naga wearer-law",
      prompt: nagabodyclothPromptV2.prompt,
      promptI2I: nagabodyclothPromptV2.promptI2I,
    },
    {
      id: "v3",
      version: "V3",
      name: "CINEMATIC",
      description: "3D realistic Naga body-cloth world",
      prompt: nagabodyclothPromptV3.prompt,
      promptI2I: nagabodyclothPromptV3.promptI2I,
    },
  ],
  chips: [
    "Wearer-Role Law",
    "Body-Placement",
    "Ceremonial Order",
    "Handloom Logic",
    "Public Readability",
    "Nagaland Heritage",
  ],
};
