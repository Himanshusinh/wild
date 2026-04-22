export type NagaBodyClothVersion = 'v1' | 'v2' | 'v3';

export interface NagaBodyClothState {
  version: NagaBodyClothVersion;
  inputMode: 'text' | 'image';
  prompt: string;
  imagePrompt?: string;
  sourceImage?: string;
}

export const INITIAL_NAGA_BODY_CLOTH_STATE: NagaBodyClothState = {
  version: 'v3',
  inputMode: 'text',
  prompt: '',
};
