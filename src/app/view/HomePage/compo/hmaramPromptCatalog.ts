import { hmaramPromptV1 } from "./hmaramPromptV1";
import { hmaramPromptV2 } from "./hmaramPromptV2";
import { hmaramPromptV3 } from "./hmaramPromptV3";

export const hmaramPromptCatalog = {
  id: "hmaram",
  name: "Hmaram",
  versions: [
    {
      id: "v1",
      version: "V1",
      name: "AUTHENTIC",
      description: "Source-faithful Hmaram weaving from Mizoram",
      prompt: hmaramPromptV1.prompt,
      promptI2I: hmaramPromptV1.promptI2I,
    },
    {
      id: "v2",
      version: "V2",
      name: "ARTISAN",
      description: "Creative expansion of Hmaram indigo-white structure",
      prompt: hmaramPromptV2.prompt,
      promptI2I: hmaramPromptV2.promptI2I,
    },
    {
      id: "v3",
      version: "V3",
      name: "CINEMATIC",
      description: "3D realistic Hmaram weaving world",
      prompt: hmaramPromptV3.prompt,
      promptI2I: hmaramPromptV3.promptI2I,
    },
  ],
  chips: [
    "Indigo-White Discipline",
    "Triangular Motifs",
    "Back-strap Loom",
    "Single-Width Logic",
    "Hmar Heritage",
    "Mizoram Weaving",
  ],
};
