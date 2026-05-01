import { nagashawlordinaryPromptV1 } from "./nagashawlordinaryPromptV1";
import { nagashawlordinaryPromptV2 } from "./nagashawlordinaryPromptV2";
import { nagashawlordinaryPromptV3 } from "./nagashawlordinaryPromptV3";

export const nagashawlordinaryPromptCatalog = {
  id: "nagashawlordinary",
  name: "Naga Shawl (Ordinary)",
  prompts: {
    v1: nagashawlordinaryPromptV1,
    v2: nagashawlordinaryPromptV2,
    v3: nagashawlordinaryPromptV3,
  },
  defaultPrompt: nagashawlordinaryPromptV1,
  promptI2I: nagashawlordinaryPromptV1,
};
