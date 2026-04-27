export type GaroWeavingVersion = 'v1' | 'v2' | 'v3';

export interface GaroWeavingState {
  version: GaroWeavingVersion;
  inputMode: 'text' | 'image';
  prompt: string;
  imagePrompt?: string;
  sourceImage?: string;
}

export const INITIAL_GARO_WEAVING_STATE: GaroWeavingState = {
  version: 'v3',
  inputMode: 'text',
  prompt: '',
};
