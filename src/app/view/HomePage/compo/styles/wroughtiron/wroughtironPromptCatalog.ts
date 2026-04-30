import { wroughtironPromptV1 } from "./wroughtironPromptV1";
import { wroughtironPromptV2 } from "./wroughtironPromptV2";
import { wroughtironPromptV3 } from "./wroughtironPromptV3";

export const wroughtironPromptCatalog = {
  id: "wroughtiron",
  name: "Wrought Iron",
  prompts: {
    v1: wroughtironPromptV1,
    v2: wroughtironPromptV2,
    v3: wroughtironPromptV3,
  },
  defaultPrompt: wroughtironPromptV1,
  promptI2I: wroughtironPromptV1,
};
