export type HimrooVersion = 'v1' | 'v2' | 'v3';

export interface HimrooState {
  version: HimrooVersion;
  inputMode: 'text' | 'image';
  prompt: string;
  imagePrompt?: string;
  sourceImage?: string;
}

export const INITIAL_HIMROO_STATE: HimrooState = {
  version: 'v3',
  inputMode: 'text',
  prompt: '',
};
