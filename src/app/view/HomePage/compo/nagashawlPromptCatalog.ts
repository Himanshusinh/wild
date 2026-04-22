import { nagashawlPromptV1 } from "./nagashawlPromptV1";
import { nagashawlPromptV2 } from "./nagashawlPromptV2";
import { nagashawlPromptV3 } from "./nagashawlPromptV3";

export const nagashawlPromptCatalog = {
  id: "nagashawl",
  name: "Naga Shawl",
  prompts: {
    v1: nagashawlPromptV1,
    v2: nagashawlPromptV2,
    v3: nagashawlPromptV3,
  },
  defaultPrompt: nagashawlPromptV1,
  promptI2I: nagashawlPromptV1,
};
