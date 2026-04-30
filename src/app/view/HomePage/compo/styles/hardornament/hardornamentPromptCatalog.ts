import { hardornamentPromptV1 } from "./hardornamentPromptV1";
import { hardornamentPromptV2 } from "./hardornamentPromptV2";
import { hardornamentPromptV3 } from "./hardornamentPromptV3";

export const hardornamentPromptCatalog = {
  id: "hardornament",
  name: "Hard Ornament",
  versions: [
    {
      id: "v1",
      version: "V1",
      name: "AUTHENTIC",
      description: "Source-faithful Naga hard-ornament world",
      prompt: hardornamentPromptV1.prompt,
      promptI2I: hardornamentPromptV1.promptI2I,
    },
    {
      id: "v2",
      version: "V2",
      name: "ARTISAN",
      description: "Creative expansion of rigid body-extension logic",
      prompt: hardornamentPromptV2.prompt,
      promptI2I: hardornamentPromptV2.promptI2I,
    },
    {
      id: "v3",
      version: "V3",
      name: "CINEMATIC",
      description: "3D realistic hard-ornament world",
      prompt: hardornamentPromptV3.prompt,
      promptI2I: hardornamentPromptV3.promptI2I,
    },
  ],
  chips: [
    "Rigid Boundary",
    "Body-Extension Law",
    "Encircling Zones",
    "Limb-Zone Authority",
    "Nagaland Heritage",
    "Material Firmness",
  ],
};
