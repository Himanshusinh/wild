import { pichhwainewPromptV1 } from "./pichhwainewPromptV1";
import { pichhwainewPromptV2 } from "./pichhwainewPromptV2";
import { pichhwainewPromptV3 } from "./pichhwainewPromptV3";

export const pichhwainewPromptCatalog = {
  id: "pichhwainew",
  name: "Pichhwai",
  prompts: {
    v1: pichhwainewPromptV1.prompt,
    v2: pichhwainewPromptV2.prompt,
    v3: pichhwainewPromptV3.prompt,
  },
  promptI2I: {
    v1: pichhwainewPromptV1.promptI2I,
    v2: pichhwainewPromptV2.promptI2I,
    v3: pichhwainewPromptV3.promptI2I,
  },
  defaultPrompt: pichhwainewPromptV3.prompt,
};
