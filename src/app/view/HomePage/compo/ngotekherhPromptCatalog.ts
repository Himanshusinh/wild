import { ngotekherhPromptV1 } from "./ngotekherhPromptV1";
import { ngotekherhPromptV2 } from "./ngotekherhPromptV2";
import { ngotekherhPromptV3 } from "./ngotekherhPromptV3";

export const ngotekherhPromptCatalog = {
  id: "ngotekherh",
  name: "Ngotekherh",
  prompts: {
    v1: ngotekherhPromptV1,
    v2: ngotekherhPromptV2,
    v3: ngotekherhPromptV3,
  },
  defaultPrompt: ngotekherhPromptV1,
  promptI2I: ngotekherhPromptV1,
};
