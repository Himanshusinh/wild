import { resolveBackendBase } from './serverApiBase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatResponse {
  responseStatus: 'success' | 'error';
  message: string;
  data?: {
    response: string;
    messageId: string;
  };
  error?: string;
}

/**
 * Send a message to the AI companion
 */
export async function sendCompanionMessage(
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  try {
    // Get backend URL
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    
    const response = await fetch(`${backendUrl}/api/chat/companion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for auth
      body: JSON.stringify({
        message,
        conversationHistory: conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      }),
    });

    const data: ChatResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send message');
    }

    return data;
  } catch (error: any) {
    console.error('[AiCompanionApi] Error sending message:', error);
    return {
      responseStatus: 'error',
      message: error.message || 'Network error. Please check your connection.',
    };
  }
}
