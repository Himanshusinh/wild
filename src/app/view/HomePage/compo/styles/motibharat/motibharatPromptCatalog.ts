import { motibharatPromptV1 } from "./motibharatPromptV1";
import { motibharatPromptV2 } from "./motibharatPromptV2";
import { motibharatPromptV3 } from "./motibharatPromptV3";

export const motibharatPromptCatalog = {
  id: "motibharat",
  name: "Moti Bharat",
  prompts: {
    v1: motibharatPromptV1,
    v2: motibharatPromptV2,
    v3: motibharatPromptV3,
  },
  defaultPrompt: motibharatPromptV1,
  promptI2I: motibharatPromptV1,
};
