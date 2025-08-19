import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GeneratedImage } from '@/types/history';

interface GenerationState {
  prompt: string;
  selectedModel: string;
  imageCount: number;
  isGenerating: boolean;
  error: string | null;
  lastGeneratedImages: GeneratedImage[];
  generationProgress: {
    current: number;
    total: number;
    status: string;
  } | null;
}

const initialState: GenerationState = {
  prompt: '',
  selectedModel: 'flux-kontext-pro',
  imageCount: 1,
  isGenerating: false,
  error: null,
  lastGeneratedImages: [],
  generationProgress: null,
};

// Async thunk for image generation
export const generateImages = createAsyncThunk(
  'generation/generateImages',
  async (
    { prompt, model, imageCount }: { prompt: string; model: string; imageCount: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model,
          n: imageCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate images');
      }

      return {
        images: data.images,
        historyId: data.historyId,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to generate images');
    }
  }
);

const generationSlice = createSlice({
  name: 'generation',
  initialState,
  reducers: {
    setPrompt: (state, action: PayloadAction<string>) => {
      state.prompt = action.payload;
    },
    setSelectedModel: (state, action: PayloadAction<string>) => {
      state.selectedModel = action.payload;
    },
    setImageCount: (state, action: PayloadAction<number>) => {
      state.imageCount = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearLastGeneratedImages: (state) => {
      state.lastGeneratedImages = [];
    },
    setGenerationProgress: (state, action: PayloadAction<{
      current: number;
      total: number;
      status: string;
    } | null>) => {
      state.generationProgress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateImages.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
        state.generationProgress = {
          current: 0,
          total: state.imageCount,
          status: 'Starting generation...',
        };
      })
      .addCase(generateImages.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.lastGeneratedImages = action.payload.images;
        state.generationProgress = null;
        state.error = null;
      })
      .addCase(generateImages.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
        state.generationProgress = null;
      });
  },
});

export const {
  setPrompt,
  setSelectedModel,
  setImageCount,
  clearError,
  clearLastGeneratedImages,
  setGenerationProgress,
} = generationSlice.actions;

export default generationSlice.reducer;
