export type HmaramVersion = 'v1' | 'v2' | 'v3';

export interface HmaramState {
  version: HmaramVersion;
  inputMode: 'text' | 'image';
  prompt: string;
  imagePrompt?: string;
  sourceImage?: string;
}

export const INITIAL_HMARAM_STATE: HmaramState = {
  version: 'v3',
  inputMode: 'text',
  prompt: '',
};
