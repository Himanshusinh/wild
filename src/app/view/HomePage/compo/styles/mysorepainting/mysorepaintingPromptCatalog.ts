import { mysorepaintingPromptV1 } from "./mysorepaintingPromptV1";
import { mysorepaintingPromptV2 } from "./mysorepaintingPromptV2";
import { mysorepaintingPromptV3 } from "./mysorepaintingPromptV3";

export const mysorepaintingPromptCatalog = {
  id: "mysorepainting",
  name: "Mysore Painting",
  prompts: {
    v1: mysorepaintingPromptV1,
    v2: mysorepaintingPromptV2,
    v3: mysorepaintingPromptV3,
  },
  defaultPrompt: mysorepaintingPromptV1,
  promptI2I: mysorepaintingPromptV1,
};
