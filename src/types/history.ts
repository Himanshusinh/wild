export interface GeneratedImage {
  id: string;
  url: string;
  firebaseUrl?: string; // URL after uploading to Firebase Storage
  originalUrl: string; // Original URL from BFL API
}

export interface HistoryEntry {
  id: string;
  prompt: string;
  model: string;
  generationType: 'text-to-image' | 'logo-generation' | 'sticker-generation' | 'text-to-video' | 'text-to-music' | 'mockup-generation' | 'product-generation' | 'ad-generation' | 'live-chat';
  images: GeneratedImage[];
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
  generationType: 'text-to-image' | 'logo-generation' | 'sticker-generation' | 'text-to-video' | 'text-to-music' | 'mockup-generation' | 'product-generation' | 'ad-generation' | 'live-chat';
  images: GeneratedImage[];
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
  generationType?: 'text-to-image' | 'logo-generation' | 'sticker-generation' | 'text-to-video' | 'text-to-music' | 'mockup-generation' | 'product-generation' | 'ad-generation' | 'live-chat' | 'text_to_image' | 'image_to_video' | 'video_to_video';
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
