import { rosewoodinlayPromptV1 } from "./rosewoodinlayPromptV1";
import { rosewoodinlayPromptV2 } from "./rosewoodinlayPromptV2";
import { rosewoodinlayPromptV3 } from "./rosewoodinlayPromptV3";

export const rosewoodinlayPromptCatalog = {
  id: "rosewoodinlay",
  name: "Rosewood Inlay",
  prompts: {
    v1: rosewoodinlayPromptV1,
    v2: rosewoodinlayPromptV2,
    v3: rosewoodinlayPromptV3,
  },
  defaultPrompt: rosewoodinlayPromptV1,
  promptI2I: rosewoodinlayPromptV1,
};
