import { mashruweavingPromptV1 } from "./mashruweavingPromptV1";
import { mashruweavingPromptV2 } from "./mashruweavingPromptV2";
import { mashruweavingPromptV3 } from "./mashruweavingPromptV3";

export const mashruweavingPromptCatalog = {
  id: "mashruweaving",
  name: "Mashru Weaving",
  prompts: {
    v1: mashruweavingPromptV1,
    v2: mashruweavingPromptV2,
    v3: mashruweavingPromptV3,
  },
  defaultPrompt: mashruweavingPromptV1,
  promptI2I: mashruweavingPromptV1,
};
