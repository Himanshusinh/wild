import { garoweavingnewPromptV1 } from "./garoweavingnewPromptV1";
import { garoweavingnewPromptV2 } from "./garoweavingnewPromptV2";
import { garoweavingnewPromptV3 } from "./garoweavingnewPromptV3";

export const garoweavingnewPromptCatalog = {
  id: "garoweavingnew",
  name: "Garo Weaving",
  prompts: {
    v1: garoweavingnewPromptV1.prompt,
    v2: garoweavingnewPromptV2.prompt,
    v3: garoweavingnewPromptV3.prompt,
  },
  promptI2I: {
    v1: garoweavingnewPromptV1.promptI2I,
    v2: garoweavingnewPromptV2.promptI2I,
    v3: garoweavingnewPromptV3.promptI2I,
  },
  defaultPrompt: garoweavingnewPromptV3.prompt,
};
