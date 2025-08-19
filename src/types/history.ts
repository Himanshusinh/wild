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
  images: GeneratedImage[];
  timestamp: Date;
  createdAt: string; // ISO string for Firestore
  imageCount: number;
  status: 'generating' | 'completed' | 'failed';
  error?: string;
}

export interface HistoryEntryFirestore {
  id: string;
  prompt: string;
  model: string;
  images: GeneratedImage[];
  timestamp: any; // Firestore Timestamp
  createdAt: string;
  imageCount: number;
  status: 'generating' | 'completed' | 'failed';
  error?: string;
}

export interface HistoryFilters {
  model?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: 'generating' | 'completed' | 'failed';
}
