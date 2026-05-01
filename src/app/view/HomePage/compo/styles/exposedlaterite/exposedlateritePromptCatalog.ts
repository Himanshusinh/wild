import { exposedlateritePromptV1 } from "./exposedlateritePromptV1";
import { exposedlateritePromptV2 } from "./exposedlateritePromptV2";
import { exposedlateritePromptV3 } from "./exposedlateritePromptV3";

export type ExposedLateriteVersion = "V1" | "V2" | "V3";

export interface ExposedLateritePromptFamily {
  version: ExposedLateriteVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const EXPOSEDLATERITE_PROMPT_FAMILIES: Record<ExposedLateriteVersion, ExposedLateritePromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "ExposedLaterite",
    ...exposedlateritePromptV1,
  },
  V2: {
    version: "V2",
    chip: "MASONRY",
    title: "ExposedLaterite Variations",
    ...exposedlateritePromptV2,
  },
  V3: {
    version: "V3",
    chip: "CHIRA",
    title: "Dimensional ExposedLaterite",
    ...exposedlateritePromptV3,
  },
};
