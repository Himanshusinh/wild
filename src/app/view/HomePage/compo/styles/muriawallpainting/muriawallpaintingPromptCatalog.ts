import { muriawallpaintingPromptV1 } from "./muriawallpaintingPromptV1";
import { muriawallpaintingPromptV2 } from "./muriawallpaintingPromptV2";
import { muriawallpaintingPromptV3 } from "./muriawallpaintingPromptV3";

export type MuriaWallPaintingVersion = "V1" | "V2" | "V3";

export interface MuriaWallPaintingPromptFamily {
  version: MuriaWallPaintingVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const MURIAWALLPAINTING_PROMPT_FAMILIES: Record<MuriaWallPaintingVersion, MuriaWallPaintingPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "MuriaWallPainting",
    ...muriawallpaintingPromptV1,
  },
  V2: {
    version: "V2",
    chip: "MURAL",
    title: "MuriaWallPainting Variations",
    ...muriawallpaintingPromptV2,
  },
  V3: {
    version: "V3",
    chip: "EARTHEN",
    title: "Dimensional MuriaWallPainting",
    ...muriawallpaintingPromptV3,
  },
};
