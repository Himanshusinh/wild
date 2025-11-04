import axiosInstance from './axiosInstance';

export interface LiveChatSession {
  id: string;
  sessionId: string;
  uid: string;
  model: string;
  frameSize?: string | null;
  style?: string | null;
  startedAt: string;
  completedAt?: string;
  status: 'active' | 'completed' | 'failed';
  // All images in a single array, ordered by sequence
  images: Array<{
    id: string;
    url: string;
    storagePath?: string;
    originalUrl?: string;
    firebaseUrl?: string;
    order: number; // Order in sequence (1, 2, 3, ...)
    prompt?: string; // Optional prompt that generated this image
    timestamp?: string; // Optional timestamp when image was generated
  }>;
  // Array of messages with prompts (for reference)
  messages: Array<{
    prompt: string;
    timestamp: string;
  }>;
  imageUrls: string[];
  totalImages: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionPayload {
  sessionId: string;
  model: string;
  frameSize?: string;
  style?: string;
  startedAt: string;
}

export interface AddMessagePayload {
  prompt: string;
  images: Array<{
    id: string;
    url: string;
    storagePath?: string;
    originalUrl?: string;
    firebaseUrl?: string;
  }>;
  timestamp: string;
}

/**
 * Find or create a live chat session
 */
export async function findOrCreateSession(payload: CreateSessionPayload): Promise<{ sessionDocId: string }> {
  const response = await axiosInstance.post('/api/live-chat-sessions/find-or-create', payload);
  return response.data.data;
}

/**
 * Add a message with images to a session
 */
export async function addMessageToSession(
  sessionDocId: string,
  payload: AddMessagePayload
): Promise<void> {
  await axiosInstance.post(`/api/live-chat-sessions/${sessionDocId}/messages`, payload);
}

/**
 * Complete a session
 */
export async function completeSession(sessionDocId: string, completedAt?: string): Promise<void> {
  await axiosInstance.patch(`/api/live-chat-sessions/${sessionDocId}/complete`, {
    completedAt: completedAt || new Date().toISOString(),
  });
}

/**
 * Get a session by image URL
 * This is the key function for restoring sessions when clicking on an image
 */
export async function getSessionByImageUrl(imageUrl: string): Promise<LiveChatSession> {
  const response = await axiosInstance.get('/api/live-chat-sessions/by-image-url', {
    params: { imageUrl },
  });
  return response.data.data.session;
}

/**
 * Get a session by document ID
 */
export async function getSession(sessionDocId: string): Promise<LiveChatSession> {
  const response = await axiosInstance.get(`/api/live-chat-sessions/${sessionDocId}`);
  return response.data.data.session;
}

/**
 * Update a session
 */
export async function updateSession(
  sessionDocId: string,
  updates: Partial<LiveChatSession>
): Promise<void> {
  await axiosInstance.patch(`/api/live-chat-sessions/${sessionDocId}`, updates);
}

