import { sawantwadiwoodcraftPromptV1 } from "./sawantwadiwoodcraftPromptV1";
import { sawantwadiwoodcraftPromptV2 } from "./sawantwadiwoodcraftPromptV2";
import { sawantwadiwoodcraftPromptV3 } from "./sawantwadiwoodcraftPromptV3";

export type SawantwadiWoodcraftVersion = "V1" | "V2" | "V3";

export interface SawantwadiWoodcraftPromptFamily {
  version: SawantwadiWoodcraftVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SAWANTWADIWOODCRAFT_PROMPT_FAMILIES: Record<SawantwadiWoodcraftVersion, SawantwadiWoodcraftPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "SawantwadiWoodcraft",
    ...sawantwadiwoodcraftPromptV1,
  },
  V2: {
    version: "V2",
    chip: "MINIATURE",
    title: "SawantwadiWoodcraft Variations",
    ...sawantwadiwoodcraftPromptV2,
  },
  V3: {
    version: "V3",
    chip: "HAND-CARVED",
    title: "Dimensional SawantwadiWoodcraft",
    ...sawantwadiwoodcraftPromptV3,
  },
};
