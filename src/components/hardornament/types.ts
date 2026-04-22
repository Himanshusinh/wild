export type HardOrnamentVersion = 'v1' | 'v2' | 'v3';

export interface HardOrnamentState {
  version: HardOrnamentVersion;
  inputMode: 'text' | 'image';
  prompt: string;
  imagePrompt?: string;
  sourceImage?: string;
}

export const INITIAL_HARD_ORNAMENT_STATE: HardOrnamentState = {
  version: 'v3',
  inputMode: 'text',
  prompt: '',
};
