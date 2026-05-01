import { iduMishmiPromptV1 } from "./iduMishmiPromptV1";
import { iduMishmiPromptV2 } from "./iduMishmiPromptV2";
import { iduMishmiPromptV3 } from "./iduMishmiPromptV3";

export type IduMishmiVersion = "V1" | "V2" | "V3";

export interface IduMishmiPromptFamily {
  version: IduMishmiVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const IDU_MISHMI_PROMPT_FAMILIES: Record<IduMishmiVersion, IduMishmiPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Idu Mishmi Textile",
    ...iduMishmiPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Handcrafted Dimensional Weave",
    ...iduMishmiPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "Full 3D Cinematic Woven World",
    ...iduMishmiPromptV3,
  },
};

