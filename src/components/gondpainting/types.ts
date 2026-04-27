export type GondPaintingVersion = 'v1' | 'v2' | 'v3';

export interface GondPaintingState {
  version: GondPaintingVersion;
  inputMode: 'text' | 'image';
  prompt: string;
  imagePrompt?: string;
  sourceImage?: string;
}

export const INITIAL_GOND_PAINTING_STATE: GondPaintingState = {
  version: 'v3',
  inputMode: 'text',
  prompt: '',
};
