import { opaquewrapPromptV1 } from "./opaquewrapPromptV1";
import { opaquewrapPromptV2 } from "./opaquewrapPromptV2";
import { opaquewrapPromptV3 } from "./opaquewrapPromptV3";

export const opaquewrapPromptCatalog = {
  id: "opaquewrap",
  name: "Opaque Wrap",
  prompts: {
    v1: opaquewrapPromptV1,
    v2: opaquewrapPromptV2,
    v3: opaquewrapPromptV3,
  },
  defaultPrompt: opaquewrapPromptV1,
  promptI2I: opaquewrapPromptV1,
};
