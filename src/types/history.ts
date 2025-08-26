export interface GeneratedImage {
  id: string;
  url: string;
  originalUrl: string;
}

export interface HistoryEntry {
  id: string;
  prompt: string;
  model: string;
  generationType: 'text-to-image' | 'logo-generation' | 'sticker-generation' | 'text-to-video' | 'text-to-music' | 'mockup-generation';
  images: GeneratedImage[];
  timestamp: Date;
  createdAt: string; // ISO string for local storage
  imageCount: number;
  status: 'generating' | 'completed' | 'failed';
  error?: string;
}

export interface HistoryEntryLocal {
  id: string;
  prompt: string;
  model: string;
  generationType: 'text-to-image' | 'logo-generation' | 'sticker-generation' | 'text-to-video' | 'text-to-music' | 'mockup-generation';
  images: GeneratedImage[];
  timestamp: any; // Local timestamp
  createdAt: string;
  imageCount: number;
  status: 'generating' | 'completed' | 'failed';
  error?: string;
}

export interface HistoryFilters {
  model?: string;
  generationType?: 'text-to-image' | 'logo-generation' | 'sticker-generation' | 'text-to-video' | 'text-to-music' | 'mockup-generation';
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: 'generating' | 'completed' | 'failed';
}
