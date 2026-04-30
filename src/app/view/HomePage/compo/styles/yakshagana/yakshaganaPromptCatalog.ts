import { yakshaganaPromptV1 } from "./yakshaganaPromptV1";
import { yakshaganaPromptV2 } from "./yakshaganaPromptV2";
import { yakshaganaPromptV3 } from "./yakshaganaPromptV3";

export const yakshaganaPromptCatalog = {
  id: "yakshagana",
  name: "Yakshagana",
  prompts: {
    v1: yakshaganaPromptV1,
    v2: yakshaganaPromptV2,
    v3: yakshaganaPromptV3,
  },
  defaultPrompt: yakshaganaPromptV1,
  promptI2I: yakshaganaPromptV1,
};
