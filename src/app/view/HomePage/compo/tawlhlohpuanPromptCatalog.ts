import { tawlhlohpuanPromptV1 } from "./tawlhlohpuanPromptV1";
import { tawlhlohpuanPromptV2 } from "./tawlhlohpuanPromptV2";
import { tawlhlohpuanPromptV3 } from "./tawlhlohpuanPromptV3";

export const tawlhlohpuanPromptCatalog = {
  id: "tawlhlohpuan",
  name: "Tawlhlohpuan",
  prompts: {
    v1: tawlhlohpuanPromptV1,
    v2: tawlhlohpuanPromptV2,
    v3: tawlhlohpuanPromptV3,
  },
  defaultPrompt: tawlhlohpuanPromptV1,
  promptI2I: tawlhlohpuanPromptV1,
};
