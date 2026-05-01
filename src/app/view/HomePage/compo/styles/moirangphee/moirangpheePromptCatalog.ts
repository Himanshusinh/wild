import { moirangpheePromptV1 } from "./moirangpheePromptV1";
import { moirangpheePromptV2 } from "./moirangpheePromptV2";
import { moirangpheePromptV3 } from "./moirangpheePromptV3";

export const moirangpheePromptCatalog = {
  id: "moirangphee",
  name: "Moirang Phee",
  prompts: {
    v1: moirangpheePromptV1,
    v2: moirangpheePromptV2,
    v3: moirangpheePromptV3,
  },
  defaultPrompt: moirangpheePromptV1,
  promptI2I: moirangpheePromptV1,
};
