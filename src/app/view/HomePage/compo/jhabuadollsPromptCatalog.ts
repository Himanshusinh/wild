import { jhabuadollsPromptV1 } from "./jhabuadollsPromptV1";
import { jhabuadollsPromptV2 } from "./jhabuadollsPromptV2";
import { jhabuadollsPromptV3 } from "./jhabuadollsPromptV3";

export const jhabuadollsPromptCatalog = {
  id: "jhabuadolls",
  name: "Jhabua Dolls",
  versions: [
    {
      id: "v1",
      version: "V1",
      name: "AUTHENTIC",
      description: "Source-faithful Jhabua doll world from Madhya Pradesh",
      prompt: jhabuadollsPromptV1.prompt,
      promptI2I: jhabuadollsPromptV1.promptI2I,
    },
    {
      id: "v2",
      version: "V2",
      name: "ARTISAN",
      description: "Creative expansion of stuffed-doll volume",
      prompt: jhabuadollsPromptV2.prompt,
      promptI2I: jhabuadollsPromptV2.promptI2I,
    },
    {
      id: "v3",
      version: "V3",
      name: "CINEMATIC",
      description: "3D realistic Jhabua doll world",
      prompt: jhabuadollsPromptV3.prompt,
      promptI2I: jhabuadollsPromptV3.promptI2I,
    },
  ],
  chips: [
    "Stuffed-Cloth Volume",
    "Painted Features",
    "Mini-Tribal Ornament",
    "Life-Record Logic",
    "Bhil/Bhilala Heritage",
    "Hand-Stitched Joints",
  ],
};
