import { jaintiatextilePromptV1 } from "./jaintiatextilePromptV1";
import { jaintiatextilePromptV2 } from "./jaintiatextilePromptV2";
import { jaintiatextilePromptV3 } from "./jaintiatextilePromptV3";

export const jaintiatextilePromptCatalog = {
  id: "jaintiatextile",
  name: "Jaintia Textile",
  versions: [
    {
      id: "v1",
      version: "V1",
      name: "AUTHENTIC",
      description: "Source-faithful Jaintia textile world from Meghalaya",
      prompt: jaintiatextilePromptV1.prompt,
      promptI2I: jaintiatextilePromptV1.promptI2I,
    },
    {
      id: "v2",
      version: "V2",
      name: "ARTISAN",
      description: "Creative expansion of field-and-zone logic",
      prompt: jaintiatextilePromptV2.prompt,
      promptI2I: jaintiatextilePromptV2.promptI2I,
    },
    {
      id: "v3",
      version: "V3",
      name: "CINEMATIC",
      description: "3D realistic Jaintia textile world",
      prompt: jaintiatextilePromptV3.prompt,
      promptI2I: jaintiatextilePromptV3.promptI2I,
    },
  ],
  chips: [
    "Field-and-Zone Order",
    "Shoulder-Drape Law",
    "Checkered Hierarchy",
    "Border-Banded Structure",
    "Jaintia Identity",
    "Meghalaya Heritage",
  ],
};
