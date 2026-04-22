import { hoysalareliefPromptV1 } from "./hoysalareliefPromptV1";
import { hoysalareliefPromptV2 } from "./hoysalareliefPromptV2";
import { hoysalareliefPromptV3 } from "./hoysalareliefPromptV3";

export const hoysalareliefPromptCatalog = {
  id: "hoysalarelief",
  name: "Hoysala Relief",
  versions: [
    {
      id: "v1",
      version: "V1",
      name: "AUTHENTIC",
      description: "Source-faithful Hoysala relief world from Karnataka",
      prompt: hoysalareliefPromptV1.prompt,
      promptI2I: hoysalareliefPromptV1.promptI2I,
    },
    {
      id: "v2",
      version: "V2",
      name: "ARTISAN",
      description: "Creative expansion of dense relief logic",
      prompt: hoysalareliefPromptV2.prompt,
      promptI2I: hoysalareliefPromptV2.promptI2I,
    },
    {
      id: "v3",
      version: "V3",
      name: "CINEMATIC",
      description: "3D realistic soapstone relief world",
      prompt: hoysalareliefPromptV3.prompt,
      promptI2I: hoysalareliefPromptV3.promptI2I,
    },
  ],
  chips: [
    "Dense Relief Authority",
    "Soapstone Hierarchy",
    "Multi-tiered Frieze",
    "Stellate Projection",
    "Lathe-Turned Precision",
    "Karnataka Heritage",
  ],
};
