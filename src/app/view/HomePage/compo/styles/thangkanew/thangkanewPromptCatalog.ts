import { thangkanewPromptV1 } from "./thangkanewPromptV1";
import { thangkanewPromptV2 } from "./thangkanewPromptV2";
import { thangkanewPromptV3 } from "./thangkanewPromptV3";

export const thangkanewPromptCatalog = {
  id: "thangkanew",
  name: "Thangka",
  prompts: {
    v1: thangkanewPromptV1.prompt,
    v2: thangkanewPromptV2.prompt,
    v3: thangkanewPromptV3.prompt,
  },
  promptI2I: {
    v1: thangkanewPromptV1.promptI2I,
    v2: thangkanewPromptV2.promptI2I,
    v3: thangkanewPromptV3.promptI2I,
  },
  defaultPrompt: thangkanewPromptV3.prompt,
};
