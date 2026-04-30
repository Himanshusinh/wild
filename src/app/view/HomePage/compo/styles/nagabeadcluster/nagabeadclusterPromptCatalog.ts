import { nagabeadclusterPromptV1 } from "./nagabeadclusterPromptV1";
import { nagabeadclusterPromptV2 } from "./nagabeadclusterPromptV2";
import { nagabeadclusterPromptV3 } from "./nagabeadclusterPromptV3";

export type NagaBeadClusterVersion = "V1" | "V2" | "V3";

export interface NagaBeadClusterPromptFamily {
  version: NagaBeadClusterVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const NAGABEADCLUSTER_PROMPT_FAMILIES: Record<NagaBeadClusterVersion, NagaBeadClusterPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "NagaBeadCluster",
    ...nagabeadclusterPromptV1,
  },
  V2: {
    version: "V2",
    chip: "STRANDS",
    title: "NagaBeadCluster Variations",
    ...nagabeadclusterPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CLUSTERED",
    title: "Dimensional NagaBeadCluster",
    ...nagabeadclusterPromptV3,
  },
};
