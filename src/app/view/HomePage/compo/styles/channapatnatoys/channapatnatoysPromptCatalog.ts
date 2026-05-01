import { channapatnatoysPromptV1 } from "./channapatnatoysPromptV1";
import { channapatnatoysPromptV2 } from "./channapatnatoysPromptV2";
import { channapatnatoysPromptV3 } from "./channapatnatoysPromptV3";

export type ChannapatnaToysVersion = "V1" | "V2" | "V3";

export interface ChannapatnaToysPromptFamily {
  version: ChannapatnaToysVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const CHANNAPATNATOYS_PROMPT_FAMILIES: Record<ChannapatnaToysVersion, ChannapatnaToysPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "ChannapatnaToys",
    ...channapatnatoysPromptV1,
  },
  V2: {
    version: "V2",
    chip: "WOODEN",
    title: "ChannapatnaToys Variations",
    ...channapatnatoysPromptV2,
  },
  V3: {
    version: "V3",
    chip: "LACQUER",
    title: "Dimensional ChannapatnaToys",
    ...channapatnatoysPromptV3,
  },
};
