import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getApiClient } from '@/lib/axiosInstance';
import { requestCreditsRefresh } from '@/lib/creditsBus';
import { GeneratedImage } from '@/types/history';
import { GenerationType as SharedGenerationType } from '@/types/generation';
import { getModelMapping } from '@/utils/modelMapping';
import type { ActiveGeneration } from '@/lib/generationPersistence';
import * as generationPersistence from '@/lib/generationPersistence';
// Import Runway thunks from generationsApi to synchronize active generation lifecycle for Runway flows
import { runwayGenerate, runwayVideo } from '@/store/slices/generationsApi';

interface GenerationState {
  prompt: string;
  selectedModel: string;
  imageCount: number;
  frameSize: string;
  style: string;
  isGenerating: boolean; // Computed from activeGenerations.length > 0 for backward compatibility
  error: string | null;
  lastGeneratedImages: GeneratedImage[];
  generationProgress: {
    current: number;
    total: number;
    status: string;
  } | null;
  uploadedImages: string[];
  selectedCharacters: {
    id: string;
    name: string;
    frontImageUrl: string;
    leftImageUrl?: string;
    rightImageUrl?: string;
    createdAt: string;
  }[];
  // Lucid Origin options
  lucidStyle: string;
  lucidContrast: string;
  lucidMode: string;
  lucidPromptEnhance: boolean;
  // Phoenix 1.0 options
  phoenixStyle: string;
  phoenixContrast: string;
  phoenixMode: string;
  phoenixPromptEnhance: boolean;
  // Output format for Imagen models
  outputFormat: string;
  // Parallel generation support
  activeGenerations: ActiveGeneration[];
  maxConcurrentGenerations: number;
}

const initialState: GenerationState = {
  prompt: '',
  selectedModel: 'new-turbo-model', // Default to Infinite (z-image-turbo) - free unlimited
  imageCount: 1,
  frameSize: '1:1',
  style: 'none',
  isGenerating: false,
  error: null,
  lastGeneratedImages: [],
  generationProgress: null,
  uploadedImages: [],
  selectedCharacters: [],
  // Lucid Origin defaults
  lucidStyle: 'none',
  lucidContrast: 'medium',
  lucidMode: 'standard',
  lucidPromptEnhance: false,
  // Phoenix 1.0 defaults
  phoenixStyle: 'none',
  phoenixContrast: 'medium',
  phoenixMode: 'fast',
  phoenixPromptEnhance: false,
  // Output format default
  outputFormat: 'jpeg',
  // Parallel generation defaults
  activeGenerations: [],
  maxConcurrentGenerations: 4,
};

type GenerationTypeLocal = SharedGenerationType;

// Async thunk for image generation
export const generateImages = createAsyncThunk(
  'generation/generateImages',
  async (
    { prompt, model, imageCount, frameSize, style, generationType, uploadedImages, width, height, isPublic, quality, output_format }: {
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
      generationId?: string; // For parallel generation tracking
      quality?: string; // For models that support quality parameter (e.g., GPT Image 1.5)
      output_format?: string; // For models that support output_format parameter (e.g., GPT Image 1.5)
    },
    { rejectWithValue }
  ) => {
    try {
      // Enforce app-wide max of 4 images
      const requestedCount = Math.min(imageCount, 4);
      const clientRequestId = `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const api = getApiClient();

      // Decide provider based on model mapping (fal | bfl | replicate | runway)
      const mapping = getModelMapping(model);
      const provider = mapping?.provider;

      // Backward-compatible fal detection for older models without mapping
      const isFalModel =
        provider === 'fal' ||
        model === 'gemini-25-flash-image' ||
        model === 'google/nano-banana-pro' ||
        model === 'nano-banana-pro' ||
        model === 'seedream-v4' ||
        model === 'seedream-4.5' ||
        model === 'imagen-4-ultra' ||
        model === 'imagen-4' ||
        model === 'imagen-4-fast';

      let endpoint: string;
      if (provider === 'replicate') {
        endpoint = '/api/replicate/generate';
      } else if (isFalModel) {
        endpoint = '/api/fal/generate';
      } else {
        // Default to BFL for Flux and other canvas-style models
        endpoint = '/api/bfl/generate';
      }

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
        ...(typeof resolvedIsPublic === 'boolean' ? { isPublic: resolvedIsPublic } : {}),
        ...(quality ? { quality } : {}), // Add quality parameter if provided
        ...(output_format ? { output_format } : {}) // Add output_format parameter if provided
      };
      // For FAL image models, prefer aspect_ratio over frameSize naming
      if (isFalModel) {
        if (frameSize) body.aspect_ratio = frameSize;
      }
      // For GPT Image 1.5 (Replicate), use aspect_ratio from frameSize
      if (model === 'openai/gpt-image-1.5' && frameSize) {
        body.aspect_ratio = frameSize;
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
      // Use different endpoints based on model/provider
      const mapping = getModelMapping(model);
      const provider = mapping?.provider;
      const isFalModel =
        provider === 'fal' ||
        model === 'gemini-25-flash-image' ||
        model === 'google/nano-banana-pro' ||
        model === 'nano-banana-pro' ||
        model === 'seedream-v4' ||
        model === 'seedream-4.5' ||
        model === 'imagen-4-ultra' ||
        model === 'imagen-4' ||
        model === 'imagen-4-fast';

      let endpoint: string;
      if (provider === 'replicate') {
        endpoint = '/api/replicate/generate';
      } else if (isFalModel) {
        endpoint = '/api/fal/generate';
      } else {
        endpoint = '/api/bfl/generate';
      }
      
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
    setSelectedCharacter: (state, action: PayloadAction<{
      id: string;
      name: string;
      frontImageUrl: string;
      leftImageUrl?: string;
      rightImageUrl?: string;
      createdAt: string;
    } | null>) => {
      // Legacy support: if null, clear all; if character, replace array with single item
      if (action.payload === null) {
        state.selectedCharacters = [];
      } else {
        state.selectedCharacters = [action.payload];
      }
    },
    addSelectedCharacter: (state, action: PayloadAction<{
      id: string;
      name: string;
      frontImageUrl: string;
      leftImageUrl?: string;
      rightImageUrl?: string;
      createdAt: string;
    }>) => {
      // Don't add if already exists or if limit reached (10 characters)
      const exists = state.selectedCharacters.some(c => c.id === action.payload.id);
      if (!exists && state.selectedCharacters.length < 10) {
        state.selectedCharacters.push(action.payload);
      }
    },
    removeSelectedCharacter: (state, action: PayloadAction<string>) => {
      state.selectedCharacters = state.selectedCharacters.filter(c => c.id !== action.payload);
    },
    clearSelectedCharacters: (state) => {
      state.selectedCharacters = [];
    },
    // Lucid Origin options
    setLucidStyle: (state, action: PayloadAction<string>) => {
      state.lucidStyle = action.payload;
    },
    setLucidContrast: (state, action: PayloadAction<string>) => {
      state.lucidContrast = action.payload;
    },
    setLucidMode: (state, action: PayloadAction<string>) => {
      state.lucidMode = action.payload;
    },
    setLucidPromptEnhance: (state, action: PayloadAction<boolean>) => {
      state.lucidPromptEnhance = action.payload;
    },
    // Phoenix 1.0 options
    setPhoenixStyle: (state, action: PayloadAction<string>) => {
      state.phoenixStyle = action.payload;
    },
    setPhoenixContrast: (state, action: PayloadAction<string>) => {
      state.phoenixContrast = action.payload;
    },
    setPhoenixMode: (state, action: PayloadAction<string>) => {
      state.phoenixMode = action.payload;
    },
    setPhoenixPromptEnhance: (state, action: PayloadAction<boolean>) => {
      state.phoenixPromptEnhance = action.payload;
    },
    // Output format
    setOutputFormat: (state, action: PayloadAction<string>) => {
      state.outputFormat = action.payload;
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
    // Parallel generation actions
    addActiveGeneration: (state, action: PayloadAction<ActiveGeneration>) => {
      // Check if already exists
      const exists = state.activeGenerations.some(g => g.id === action.payload.id);
      if (!exists) {
        // Add to beginning (most recent first)
        state.activeGenerations = [action.payload, ...state.activeGenerations].slice(0, state.maxConcurrentGenerations);
        // Update isGenerating flag for backward compatibility
        state.isGenerating = state.activeGenerations.some(
          g => g.status === 'pending' || g.status === 'generating'
        );
        // Sync to localStorage - only if status is pending/generating
        // addGeneration will check and skip if status is completed/failed
        if (action.payload.status === 'pending' || action.payload.status === 'generating') {
          generationPersistence.addGeneration(action.payload);
        }
      }
    },
    updateActiveGeneration: (state, action: PayloadAction<{ id: string; updates: Partial<ActiveGeneration> }>) => {
      const index = state.activeGenerations.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        const updatedGen = {
          ...state.activeGenerations[index],
          ...action.payload.updates,
          updatedAt: Date.now(),
        };
        state.activeGenerations[index] = updatedGen;
        
        // Update isGenerating flag
        state.isGenerating = state.activeGenerations.some(
          g => g.status === 'pending' || g.status === 'generating'
        );
        
        // Sync to localStorage
        // updateGeneration will automatically remove from persistence if status becomes completed/failed
        generationPersistence.updateGeneration(action.payload.id, action.payload.updates);
      }
    },
    removeActiveGeneration: (state, action: PayloadAction<string>) => {
      state.activeGenerations = state.activeGenerations.filter(g => g.id !== action.payload);
      // Update isGenerating flag
      state.isGenerating = state.activeGenerations.length > 0;
      // Sync to localStorage
      generationPersistence.removeGeneration(action.payload);
    },
    hydrateGenerations: (state, action: PayloadAction<ActiveGeneration[]>) => {
      state.activeGenerations = action.payload.slice(0, state.maxConcurrentGenerations);
      // Update isGenerating flag
      state.isGenerating = state.activeGenerations.some(
        g => g.status === 'pending' || g.status === 'generating'
      );
    },
    clearOldGenerations: (state) => {
      const cleaned = generationPersistence.clearOldGenerations();
      state.activeGenerations = cleaned;
      // Update isGenerating flag
      state.isGenerating = state.activeGenerations.some(
        g => g.status === 'pending' || g.status === 'generating'
      );
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
      .addCase(generateImages.pending, (state, action) => {
        state.isGenerating = true;
        state.error = null;
        state.generationProgress = {
          current: 0,
          total: state.imageCount,
          status: 'Starting generation...',
        };
        
        // Update active generation if ID exists
        const genId = action.meta.arg.generationId;
        if (genId) {
          const index = state.activeGenerations.findIndex(g => g.id === genId);
          if (index !== -1) {
            state.activeGenerations[index].status = 'generating';
            state.activeGenerations[index].updatedAt = Date.now();
            generationPersistence.updateGeneration(genId, { status: 'generating' });
          }
        }
      })
      .addCase(generateImages.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.lastGeneratedImages = action.payload.images;
        state.generationProgress = null;
        state.error = null;
        
        // Update active generation if ID exists
        const genId = action.meta.arg.generationId;
        if (genId) {
          const index = state.activeGenerations.findIndex(g => g.id === genId);
          if (index !== -1) {
            state.activeGenerations[index].status = 'completed';
            state.activeGenerations[index].images = action.payload.images;
            state.activeGenerations[index].historyId = action.payload.historyId;
            state.activeGenerations[index].updatedAt = Date.now();
            // Don't persist completed generations - updateGeneration will remove from persistence
            generationPersistence.updateGeneration(genId, { 
              status: 'completed',
              images: action.payload.images,
              historyId: action.payload.historyId 
            });
          }
        }
      })
      .addCase(generateImages.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
        state.generationProgress = null;
        
        // Update active generation if ID exists
        const genId = action.meta.arg.generationId;
        if (genId) {
          const index = state.activeGenerations.findIndex(g => g.id === genId);
          if (index !== -1) {
            state.activeGenerations[index].status = 'failed';
            state.activeGenerations[index].error = action.payload as string;
            state.activeGenerations[index].updatedAt = Date.now();
            // Don't persist failed generations - updateGeneration will remove from persistence
            generationPersistence.updateGeneration(genId, { 
              status: 'failed',
              error: action.payload as string
            });
          }
        }
      })
      .addCase(generateRunwayImages.pending, (state, action) => {
        state.isGenerating = true;
        state.error = null;
        state.generationProgress = {
          current: 0,
          total: 1,
          status: 'Starting Runway generation...',
        };
        // If a generationId was provided, mark the matching active generation as generating
        const genId = (action.meta as any).arg?.generationId;
        if (genId) {
          const idx = state.activeGenerations.findIndex(g => g.id === genId);
          if (idx !== -1) {
            state.activeGenerations[idx].status = 'generating';
            state.activeGenerations[idx].updatedAt = Date.now();
            generationPersistence.updateGeneration(genId, { status: 'generating' });
          }
        }
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
        // Persist history/task info to the active generation if we have an ID
        const genId = (action.meta as any).arg?.generationId;
        if (genId) {
          const idx = state.activeGenerations.findIndex(g => g.id === genId);
          if (idx !== -1) {
            state.activeGenerations[idx].updatedAt = Date.now();
            // Store taskId/historyId for future reference
            state.activeGenerations[idx].historyId = action.payload.historyId || state.activeGenerations[idx].historyId;
            generationPersistence.updateGeneration(genId, { historyId: action.payload.historyId });
          }
        }
      })
      .addCase(generateRunwayImages.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
        state.generationProgress = null;
        const genId = (action.meta as any).arg?.generationId;
        if (genId) {
          const idx = state.activeGenerations.findIndex(g => g.id === genId);
          if (idx !== -1) {
            state.activeGenerations[idx].status = 'failed';
            state.activeGenerations[idx].error = action.payload as string;
            state.activeGenerations[idx].updatedAt = Date.now();
            generationPersistence.updateGeneration(genId, { status: 'failed', error: action.payload as string });
          }
        }
      })
      // Runway API helpers (per-image create task) - ensure generationId sync when callers pass one
      .addCase(runwayGenerate.pending, (state, action) => {
        state.isGenerating = true;
        state.error = null;
        // If generationId present in payload, mark active generation as generating
        const genId = (action.meta as any).arg?.generationId;
        if (genId) {
          const idx = state.activeGenerations.findIndex(g => g.id === genId);
          if (idx !== -1) {
            state.activeGenerations[idx].status = 'generating';
            state.activeGenerations[idx].updatedAt = Date.now();
            generationPersistence.updateGeneration(genId, { status: 'generating' });
          }
        }
      })
      .addCase(runwayGenerate.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.error = null;
        state.generationProgress = {
          current: 0,
          total: 1,
          status: `Task created: ${action.payload.taskId}`,
        };
        const genId = (action.meta as any).arg?.generationId;
        if (genId) {
          const idx = state.activeGenerations.findIndex(g => g.id === genId);
          if (idx !== -1) {
            state.activeGenerations[idx].updatedAt = Date.now();
            state.activeGenerations[idx].historyId = action.payload.historyId || state.activeGenerations[idx].historyId;
            generationPersistence.updateGeneration(genId, { historyId: action.payload.historyId });
          }
        }
      })
      .addCase(runwayGenerate.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
        state.generationProgress = null;
        const genId = (action.meta as any).arg?.generationId;
        if (genId) {
          const idx = state.activeGenerations.findIndex(g => g.id === genId);
          if (idx !== -1) {
            state.activeGenerations[idx].status = 'failed';
            state.activeGenerations[idx].error = action.payload as string;
            state.activeGenerations[idx].updatedAt = Date.now();
            generationPersistence.updateGeneration(genId, { status: 'failed', error: action.payload as string });
          }
        }
      })
      // Runway Video lifecycle: accept optional generationId so UI can track the video task
      .addCase(runwayVideo.pending, (state, action) => {
        state.isGenerating = true;
        state.error = null;
        state.generationProgress = {
          current: 0,
          total: 100,
          status: 'Starting Runway video generation...',
        };
        const genId = (action.meta as any).arg?.generationId;
        if (genId) {
          const idx = state.activeGenerations.findIndex(g => g.id === genId);
          if (idx !== -1) {
            state.activeGenerations[idx].status = 'generating';
            state.activeGenerations[idx].updatedAt = Date.now();
            generationPersistence.updateGeneration(genId, { status: 'generating' });
          }
        }
      })
      .addCase(runwayVideo.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.error = null;
        state.generationProgress = null;
        const genId = (action.meta as any).arg?.generationId;
        if (genId) {
          const idx = state.activeGenerations.findIndex(g => g.id === genId);
          if (idx !== -1) {
            state.activeGenerations[idx].updatedAt = Date.now();
            state.activeGenerations[idx].historyId = action.payload.historyId || state.activeGenerations[idx].historyId;
            generationPersistence.updateGeneration(genId, { historyId: action.payload.historyId });
          }
        }
      })
      .addCase(runwayVideo.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
        state.generationProgress = null;
        const genId = (action.meta as any).arg?.generationId;
        if (genId) {
          const idx = state.activeGenerations.findIndex(g => g.id === genId);
          if (idx !== -1) {
            state.activeGenerations[idx].status = 'failed';
            state.activeGenerations[idx].error = action.payload as string;
            state.activeGenerations[idx].updatedAt = Date.now();
            generationPersistence.updateGeneration(genId, { status: 'failed', error: action.payload as string });
          }
        }
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
  setSelectedCharacter,
  addSelectedCharacter,
  removeSelectedCharacter,
  clearSelectedCharacters,
  // Lucid Origin options
  setLucidStyle,
  setLucidContrast,
  setLucidMode,
  setLucidPromptEnhance,
  // Phoenix 1.0 options
  setPhoenixStyle,
  setPhoenixContrast,
  setPhoenixMode,
  setPhoenixPromptEnhance,
  // Output format
  setOutputFormat,
  clearGenerationState,
  // Parallel generation actions
  addActiveGeneration,
  updateActiveGeneration,
  removeActiveGeneration,
  hydrateGenerations,
  clearOldGenerations,
} = generationSlice.actions;

export default generationSlice.reducer;
