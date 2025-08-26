import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface GeneratedImage {
  id: string;
  url: string;
  originalUrl: string;
}

interface GenerationState {
  prompt: string;
  selectedModel: string;
  imageCount: number;
  frameSize: string;
  style: string;
  isGenerating: boolean;
  error: string | null;
  lastGeneratedImages: GeneratedImage[];
  generationProgress: {
    current: number;
    total: number;
    status: string;
  } | null;
  // Mockup generation specific fields - only serializable data
  logoImageName: string;
  logoImageUrl: string;
  productImageName: string;
  productImageUrl: string;
  businessName: string;
  tagLine: string;
  // Generated mockup images for display
  generatedMockups: GeneratedImage[];
}

const initialState: GenerationState = {
  prompt: '',
  selectedModel: 'flux-kontext-pro',
  imageCount: 1,
  frameSize: '1:1',
  style: 'realistic',
  isGenerating: false,
  error: null,
  lastGeneratedImages: [],
  generationProgress: null,
  // Mockup generation specific fields
  logoImageName: '',
  logoImageUrl: '',
  productImageName: '',
  productImageUrl: '',
  businessName: '',
  tagLine: '',
  // Generated mockup images
  generatedMockups: [],
};

// Async thunk for mockup generation
export const generateMockup = createAsyncThunk(
  'generation/generateMockup',
  async (
    { prompt, model, imageCount, frameSize, logoImage, productImage, businessName, tagLine }: {
      prompt: string;
      model: string;
      imageCount: number;
      frameSize?: string;
      logoImage: File;
      productImage: File;
      businessName: string;
      tagLine?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      // Create FormData to send files
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('model', model);
      formData.append('n', imageCount.toString());
      formData.append('frameSize', frameSize || '1:1');
      formData.append('logoImage', logoImage);
      formData.append('productImage', productImage);
      formData.append('businessName', businessName);
      if (tagLine) formData.append('tagLine', tagLine);

      const response = await fetch('/api/generate-mockup', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate mockup');
      }

      return {
        images: data.images,
        historyId: data.historyId,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to generate mockup');
    }
  }
);

// Async thunk for regular image generation (kept for compatibility)
export const generateImages = createAsyncThunk(
  'generation/generateImages',
  async (
    { prompt, model, imageCount, frameSize, style }: {
      prompt: string;
      model: string;
      imageCount: number;
      frameSize?: string;
      style?: string;
    },
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
          frameSize,
          style,
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
    setFrameSize: (state, action: PayloadAction<string>) => {
      state.frameSize = action.payload;
    },
    setStyle: (state, action: PayloadAction<string>) => {
      state.style = action.payload;
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
    // Mockup generation reducers
    setLogoImageName: (state, action: PayloadAction<string>) => {
      state.logoImageName = action.payload;
    },
    setLogoImageUrl: (state, action: PayloadAction<string>) => {
      state.logoImageUrl = action.payload;
    },
    setProductImageName: (state, action: PayloadAction<string>) => {
      state.productImageName = action.payload;
    },
    setProductImageUrl: (state, action: PayloadAction<string>) => {
      state.productImageUrl = action.payload;
    },
    setBusinessName: (state, action: PayloadAction<string>) => {
      state.businessName = action.payload;
    },
    setTagLine: (state, action: PayloadAction<string>) => {
      state.tagLine = action.payload;
    },
    // Generated mockup images reducers
    setGeneratedMockups: (state, action: PayloadAction<GeneratedImage[]>) => {
      state.generatedMockups = action.payload;
    },
    clearGeneratedMockups: (state) => {
      state.generatedMockups = [];
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
      })
      // Mockup generation cases
      .addCase(generateMockup.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
        state.generationProgress = {
          current: 0,
          total: state.imageCount,
          status: 'Starting mockup generation...',
        };
      })
      .addCase(generateMockup.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.lastGeneratedImages = action.payload.images;
        state.generatedMockups = action.payload.images; // Update generated mockups for display
        state.generationProgress = null;
        state.error = null;
      })
      .addCase(generateMockup.rejected, (state, action) => {
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
  setFrameSize,
  setStyle,
  clearError,
  clearLastGeneratedImages,
  setGenerationProgress,
  // Mockup generation actions
  setLogoImageName,
  setLogoImageUrl,
  setProductImageName,
  setProductImageUrl,
  setBusinessName,
  setTagLine,
  // Generated mockup images actions
  setGeneratedMockups,
  clearGeneratedMockups,
} = generationSlice.actions;

export default generationSlice.reducer;
