export type JhabuaDollsVersion = 'v1' | 'v2' | 'v3';

export interface JhabuaDollsState {
  version: JhabuaDollsVersion;
  inputMode: 'text' | 'image';
  prompt: string;
  imagePrompt?: string;
  sourceImage?: string;
}

export const INITIAL_JHABUA_DOLLS_STATE: JhabuaDollsState = {
  version: 'v3',
  inputMode: 'text',
  prompt: '',
};
