export type HoysalaReliefVersion = 'v1' | 'v2' | 'v3';

export interface HoysalaReliefState {
  version: HoysalaReliefVersion;
  inputMode: 'text' | 'image';
  prompt: string;
  imagePrompt?: string;
  sourceImage?: string;
}

export const INITIAL_HOYSALA_RELIEF_STATE: HoysalaReliefState = {
  version: 'v3',
  inputMode: 'text',
  prompt: '',
};
