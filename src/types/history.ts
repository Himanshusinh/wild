export interface GeneratedImage {
  id: string;
  url: string;
  firebaseUrl?: string; // URL after uploading to Firebase Storage
  originalUrl: string; // Original URL from BFL API
  // Optimized image URLs
  avifUrl?: string; // AVIF optimized version (primary format)
  webpUrl?: string; // WebP optimized version (deprecated)
  thumbnailUrl?: string; // Thumbnail version (400x400)
  blurDataUrl?: string; // Base64 blur placeholder
  optimized?: boolean; // Flag indicating if image has been optimized
}

export interface GeneratedVideo {
  id: string;
  url: string;
  storagePath?: string; // Storage path in Zata
  firebaseUrl?: string; // URL after uploading to Firebase Storage
  originalUrl?: string; // Original URL from provider API
  // Optimized video thumbnails
  avifUrl?: string; // AVIF poster/thumbnail
  thumbnailUrl?: string; // Video thumbnail/poster
}

export interface GeneratedAudio {
  id: string;
  url: string;
  storagePath?: string; // Storage path in Zata
  firebaseUrl?: string; // If uploaded to Firebase Storage
  originalUrl?: string; // Original URL from provider API
}

export interface HistoryEntry {
  id: string;
  prompt: string;
  userPrompt?: string; // Original user-entered prompt (e.g., "@buddy is dancing with @emily")
  model: string;
  generationType: 'text-to-image' | 'logo' | 'sticker-generation' | 'text-to-video' | 'text-to-music' | 'text-to-speech' | 'mockup-generation' | 'product-generation' | 'ad-generation' | 'live-chat' | 'text-to-character' | 'voicecloning' | 'voice-cloning';
  images: GeneratedImage[];
  videos?: GeneratedVideo[];
  audios?: GeneratedAudio[];
  timestamp: string; // ISO string for Redux serializability
  createdAt: string; // ISO string for Firestore
  imageCount: number;
  status: 'generating' | 'completed' | 'failed';
  error?: string;
  frameSize?: string;
  style?: string;
  sessionId?: string; // Live chat grouping id
  generationProgress?: {
    current: number;
    total: number;
    status: string;
  };
  // Ad generation specific fields
  prompts?: any;
  analysis?: any;
  backendPrompt?: any;
  compiledPrompt?: string;
  falRequest?: {
    model: string;
    type: string;
    parameters?: any;
  };
  mode?: 'auto' | 'manual';
}

export interface HistoryEntryFirestore {
  id: string;
  prompt: string;
  model: string;
  generationType: 'text-to-image' | 'logo' | 'sticker-generation' | 'text-to-video' | 'text-to-music' | 'text-to-speech' | 'mockup-generation' | 'product-generation' | 'ad-generation' | 'live-chat' | 'text-to-character' | 'voicecloning' | 'voice-cloning';
  images: GeneratedImage[];
  videos?: GeneratedVideo[];
  audios?: GeneratedAudio[];
  timestamp: any; // Firestore Timestamp
  createdAt: string;
  imageCount: number;
  status: 'generating' | 'completed' | 'failed';
  error?: string;
  frameSize?: string;
  style?: string;
  sessionId?: string; // Live chat grouping id
  generationProgress?: {
    current: number;
    total: number;
    status: string;
  };
  // Ad generation specific fields
  prompts?: any;
  analysis?: any;
  backendPrompt?: any;
  compiledPrompt?: string;
  falRequest?: {
    model: string;
    type: string;
    parameters?: any;
  };
  mode?: 'auto' | 'manual';
}

export interface HistoryFilters {
  model?: string;
  // Allow filtering by a single type or multiple types (e.g., ['text-to-speech','text_to_speech','tts'])
  generationType?: (
    'text-to-image' | 'logo' | 'sticker-generation' | 'text-to-video' | 'text-to-music' | 'text-to-speech' | 'mockup-generation' | 'product-generation' | 'ad-generation' | 'live-chat' | 'text-to-character' | 'text_to_image' | 'image_to_video' | 'video_to_video' | 'text_to_speech' | 'tts'
  ) | Array<
    'text-to-image' | 'logo' | 'sticker-generation' | 'text-to-video' | 'text-to-music' | 'text-to-speech' | 'mockup-generation' | 'product-generation' | 'ad-generation' | 'live-chat' | 'text-to-character' | 'text_to_image' | 'image_to_video' | 'video_to_video' | 'text_to_speech' | 'tts'
  >;
  mode?: 'image' | 'video' | 'music' | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: 'generating' | 'completed' | 'failed';
}

// Live Chat specific types
export interface LiveChatMessage {
  prompt: string;
  images: GeneratedImage[];
  timestamp: string; // ISO
}

export interface LiveChatSession {
  id: string; // Firestore document id
  sessionId: string; // Also stored for client grouping
  model: string;
  frameSize?: string;
  style?: string;
  startedAt: string; // ISO
  completedAt?: string; // ISO
  status: 'active' | 'completed' | 'failed';
  messages: LiveChatMessage[]; // ordered by time (first → last)
  totalImages: number;
}

export interface LiveChatSessionFirestore {
  id: string;
  sessionId: string;
  model: string;
  frameSize?: string;
  style?: string;
  startedAt: any; // Firestore Timestamp
  completedAt?: any;
  status: 'active' | 'completed' | 'failed';
  messages: Array<{
    prompt: string;
    images: GeneratedImage[];
    timestamp: any; // Firestore Timestamp
  }>;
  totalImages: number;
}
