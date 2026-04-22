export type JaintiaTextileVersion = 'v1' | 'v2' | 'v3';

export interface JaintiaTextileState {
  version: JaintiaTextileVersion;
  inputMode: 'text' | 'image';
  prompt: string;
  imagePrompt?: string;
  sourceImage?: string;
}

export const INITIAL_JAINTIA_TEXTILE_STATE: JaintiaTextileState = {
  version: 'v3',
  inputMode: 'text',
  prompt: '',
};
