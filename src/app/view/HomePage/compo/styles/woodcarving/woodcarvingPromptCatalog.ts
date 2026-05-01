import { woodcarvingPromptV1 } from "./woodcarvingPromptV1";
import { woodcarvingPromptV2 } from "./woodcarvingPromptV2";
import { woodcarvingPromptV3 } from "./woodcarvingPromptV3";

export const woodcarvingPromptCatalog = {
  id: "woodcarving",
  name: "Wood Carving",
  prompts: {
    v1: woodcarvingPromptV1,
    v2: woodcarvingPromptV2,
    v3: woodcarvingPromptV3,
  },
  defaultPrompt: woodcarvingPromptV1,
  promptI2I: woodcarvingPromptV1,
};
