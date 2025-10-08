import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getApiClient } from '@/lib/axiosInstance';
import { requestCreditsRefresh } from '@/lib/creditsBus';
import { GeneratedImage } from '@/types/history';
import { GenerationType as SharedGenerationType } from '@/types/generation';

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
  uploadedImages: string[];
}

const initialState: GenerationState = {
  prompt: '',
  selectedModel: 'gemini-25-flash-image',
  imageCount: 1,
  frameSize: '1:1',
  style: 'realistic',
  isGenerating: false,
  error: null,
  lastGeneratedImages: [],
  generationProgress: null,
  uploadedImages: [],
};

type GenerationTypeLocal = SharedGenerationType;

// Async thunk for image generation
export const generateImages = createAsyncThunk(
  'generation/generateImages',
  async (
    { prompt, model, imageCount, frameSize, style, generationType, uploadedImages, width, height, isPublic }: {
      prompt: string;
      model: string;
      imageCount: number;
      frameSize?: string;
      style?: string;
      generationType: GenerationTypeLocal;
      uploadedImages?: string[];
      width?: number;
      height?: number;
      isPublic?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      // Enforce app-wide max of 4 images
      const requestedCount = Math.min(imageCount, 4);
      const clientRequestId = `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const api = getApiClient();

      // Decide provider based on model
      const isFalModel = model === 'gemini-25-flash-image' || model === 'seedream-v4';
      const endpoint = isFalModel ? '/api/fal/generate' : '/api/bfl/generate';

      // Resolve isPublic from backend policy when not explicitly provided
      let resolvedIsPublic: boolean | undefined = isPublic;
      try {
        if (typeof resolvedIsPublic !== 'boolean') {
          const mod = await import('@/lib/publicFlag');
          resolvedIsPublic = await mod.getIsPublic();
        }
      } catch {}

      // Build payload
      const body: any = {
        prompt,
        model,
        n: requestedCount,
        frameSize,
        style,
        generationType,
        uploadedImages,
        clientRequestId,
        ...(width && height ? { width, height } : {}),
        ...(typeof resolvedIsPublic === 'boolean' ? { isPublic: resolvedIsPublic } : {})
      };
      // For FAL image models, prefer aspect_ratio over frameSize naming
      if (isFalModel) {
        if (frameSize) body.aspect_ratio = frameSize;
      }

      console.log('[generateImages] POST', endpoint, { body, isPublic: body.isPublic });
      const { data } = await api.post(endpoint, body);
      console.log('[generateImages] RESPONSE', endpoint, { status: (data && data.status) || 'ok', keys: Object.keys(data || {}) });
      const payload = data?.data || data;
      // Trigger credits refresh after successful charge
      requestCreditsRefresh();
      return {
        images: payload.images,
        historyId: payload.historyId,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to generate images');
    }
  }
);

// Live chat specific generate (supports both flux-kontext and Google Nano Banana)
export const generateLiveChatImage = createAsyncThunk(
  'generation/generateLiveChatImage',
  async (
    { prompt, model, frameSize, uploadedImages, isPublic }: {
      prompt: string;
      model: string;
      frameSize?: string;
      uploadedImages?: string[];
      isPublic?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const api = getApiClient();
      // Use different endpoints based on model
      const isFalModel = model === 'gemini-25-flash-image' || model === 'seedream-v4';
      const endpoint = isFalModel ? '/api/fal/generate' : '/api/bfl/generate';
      
      // Resolve isPublic if absent
      let resolvedIsPublic: boolean | undefined = isPublic;
      try {
        if (typeof resolvedIsPublic !== 'boolean') {
          const mod = await import('@/lib/publicFlag');
          resolvedIsPublic = await mod.getIsPublic();
        }
      } catch {}

      const body: any = { prompt, model, frameSize, uploadedImages, n: 1, generationType: 'live-chat' as any, ...(typeof resolvedIsPublic === 'boolean' ? { isPublic: resolvedIsPublic } : {}) };
      if (isFalModel && frameSize) body.aspect_ratio = frameSize;
      console.log('[generateLiveChatImage] POST', endpoint, { body, isPublic: body.isPublic });
      const { data } = await api.post(endpoint, body);
      const payload = data?.data || data;
      requestCreditsRefresh();
      return { images: payload.images, requestId: payload.requestId };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Live chat generation failed');
    }
  }
);

// Async thunk for Runway image generation
export const generateRunwayImages = createAsyncThunk(
  'generation/generateRunwayImages',
  async (
    { prompt, model, ratio, generationType, uploadedImages, style, isPublic }: {
      prompt: string;
      model: string;
      ratio: string;
      generationType: GenerationTypeLocal;
      uploadedImages?: string[];
      style?: string;
      isPublic?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      // Validate that gen4_image_turbo has at least one reference image
      if (model === 'gen4_image_turbo' && (!uploadedImages || uploadedImages.length === 0)) {
        throw new Error('gen4_image_turbo requires at least one reference image');
      }

      const api = getApiClient();
      let resolvedIsPublic: boolean | undefined = isPublic;
      try {
        if (typeof resolvedIsPublic !== 'boolean') {
          const mod = await import('@/lib/publicFlag');
          resolvedIsPublic = await mod.getIsPublic();
        }
      } catch {}

      const payload = {
        promptText: prompt,
        model,
        ratio,
        uploadedImages,
        generationType,
        style,
        ...(typeof resolvedIsPublic === 'boolean' ? { isPublic: resolvedIsPublic } : {})
      };
      console.log('[generateRunwayImages] POST /api/runway/generate', { payload });
      const { data } = await api.post('/api/runway/generate', payload);
      console.log('[generateRunwayImages] RESPONSE /api/runway/generate', { status: (data && data.status) || 'ok' });
      const out = (data && (data.data || data)) as any;
      // Runway charges may occur async, but backend computes cost on start
      requestCreditsRefresh();
      return {
        taskId: out.taskId,
        historyId: out.historyId,
        model,
        ratio,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to generate images with Runway');
    }
  }
);

// Async thunk for MiniMax image generation
export const generateMiniMaxImages = createAsyncThunk(
  'generation/generateMiniMaxImages',
  async (
    { prompt, model, aspect_ratio, width, height, imageCount, generationType, uploadedImages, style, isPublic }: {
      prompt: string;
      model: string;
      aspect_ratio?: string;
      width?: number;
      height?: number;
      imageCount: number;
      generationType: GenerationTypeLocal;
      uploadedImages?: string[];
      style?: string;
      isPublic?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      // Validate image count for MiniMax (1-9)
      if (imageCount < 1 || imageCount > 9) {
        throw new Error('MiniMax supports 1-9 images per request');
      }

      // Enforce app-wide max of 4 images
      const requestedCount = Math.min(imageCount, 4);

      // Resolve isPublic when absent
      let resolvedIsPublic: boolean | undefined = isPublic;
      try {
        if (typeof resolvedIsPublic !== 'boolean') {
          const mod = await import('@/lib/publicFlag');
          resolvedIsPublic = await mod.getIsPublic();
        }
      } catch {}

      const payload: any = {
        prompt,
        n: requestedCount,
        response_format: 'url',
        prompt_optimizer: true,
        generationType,
        style,
        ...(typeof resolvedIsPublic === 'boolean' ? { isPublic: resolvedIsPublic } : {})
      };

      // Add aspect ratio or width/height
      if (aspect_ratio) {
        payload.aspect_ratio = aspect_ratio;
      } else if (width && height) {
        payload.width = width;
        payload.height = height;
      } else {
        // Default to 1:1 if neither provided
        payload.aspect_ratio = '1:1';
      }

      // Add subject reference if images are uploaded
      if (uploadedImages && uploadedImages.length > 0) {
        // MiniMax only supports 1 reference image
        const referenceImage = uploadedImages[0];
        payload.subject_reference = [
          {
            type: 'character',
            image_file: referenceImage
          }
        ];
      }

      const api = getApiClient();
      console.log('[generateMiniMaxImages] POST /api/minimax/generate', { payload });
      const { data } = await api.post('/api/minimax/generate', payload);
      console.log('[generateMiniMaxImages] RESPONSE /api/minimax/generate', { status: (data && data.status) || 'ok' });
      const payloadOut = (data && (data.data || data)) as any;
      requestCreditsRefresh();
      return {
        images: payloadOut.images,
        historyId: payloadOut.historyId,
        model,
        aspect_ratio: aspect_ratio || `${width}:${height}`,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to generate images with MiniMax');
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
    setIsGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setLastGeneratedImages: (state, action: PayloadAction<GeneratedImage[]>) => {
      state.lastGeneratedImages = action.payload;
    },
    setGenerationProgress: (state, action: PayloadAction<{
      current: number;
      total: number;
      status: string;
    } | null>) => {
      state.generationProgress = action.payload;
    },
    setUploadedImages: (state, action: PayloadAction<string[]>) => {
      state.uploadedImages = action.payload;
    },
    clearGenerationState: (state) => {
      state.prompt = '';
      state.uploadedImages = [];
      state.isGenerating = false;
      state.error = null;
      // Don't clear lastGeneratedImages as it might affect history display
      // state.lastGeneratedImages = [];
      state.generationProgress = null;
      // Keep model, imageCount, frameSize, and style as they might be user preferences
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateLiveChatImage.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateLiveChatImage.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.lastGeneratedImages = action.payload.images;
        state.error = null;
      })
      .addCase(generateLiveChatImage.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
      })
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
      .addCase(generateRunwayImages.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
        state.generationProgress = {
          current: 0,
          total: 1,
          status: 'Starting Runway generation...',
        };
      })
      .addCase(generateRunwayImages.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.generationProgress = null;
        state.error = null;
        // Store the task ID for polling
        state.generationProgress = {
          current: 0,
          total: 1,
          status: `Task created: ${action.payload.taskId}`,
        };
      })
      .addCase(generateRunwayImages.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
        state.generationProgress = null;
      })
      .addCase(generateMiniMaxImages.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
        state.generationProgress = {
          current: 0,
          total: state.imageCount,
          status: 'Starting MiniMax generation...',
        };
      })
      .addCase(generateMiniMaxImages.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.lastGeneratedImages = action.payload.images;
        state.generationProgress = null;
        state.error = null;
      })
      .addCase(generateMiniMaxImages.rejected, (state, action) => {
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
  setIsGenerating,
  setError,
  setLastGeneratedImages,
  setGenerationProgress,
  setUploadedImages,
  clearGenerationState,
} = generationSlice.actions;

export default generationSlice.reducer;
