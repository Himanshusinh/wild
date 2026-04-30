import { maheshwariPromptV1 } from "./maheshwariPromptV1";
import { maheshwariPromptV2 } from "./maheshwariPromptV2";
import { maheshwariPromptV3 } from "./maheshwariPromptV3";

export const maheshwariPromptCatalog = {
  id: "maheshwari",
  name: "Maheshwari",
  prompts: {
    v1: maheshwariPromptV1,
    v2: maheshwariPromptV2,
    v3: maheshwariPromptV3,
  },
  defaultPrompt: maheshwariPromptV1,
  promptI2I: maheshwariPromptV1, // Using V1 as the primary logic for I2I translation
};
