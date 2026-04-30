import { nironalacquerPromptV1 } from "./nironalacquerPromptV1";
import { nironalacquerPromptV2 } from "./nironalacquerPromptV2";
import { nironalacquerPromptV3 } from "./nironalacquerPromptV3";

export const nironalacquerPromptCatalog = {
  id: "nironalacquer",
  name: "Nirona Lacquer",
  prompts: {
    v1: nironalacquerPromptV1,
    v2: nironalacquerPromptV2,
    v3: nironalacquerPromptV3,
  },
  defaultPrompt: nironalacquerPromptV1,
  promptI2I: nironalacquerPromptV1,
};
