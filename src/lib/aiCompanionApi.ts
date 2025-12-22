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
 * Pricing guard: block pricing/plan/cost queries from the chat surface.
 * Keeps the chatbot available for other topics while deflecting pricing asks.
 */
function isPricingQuestion(message: string): boolean {
  const text = message.toLowerCase();

  const pricingKeywords = [
    'price',
    'pricing',
    'plan',
    'plans',
    'subscription',
    'tier',
    'tiers',
    'cost',
    'credits',
    'credit cost',
    'per credit',
    'per image',
    'per video',
    'billing',
    'invoice',
    'charge',
    'fee'
  ];

  const currencyRegex = /(\$|usd|eur|inr|£|€)\s*\d+/i;

  let score = 0;
  if (pricingKeywords.some((kw) => text.includes(kw))) score += 2;
  if (currencyRegex.test(message)) score += 1;
  if (/(how much|what.*cost|what.*price|what.*plan)/i.test(message)) score += 1;

  return score >= 2;
}

/**
 * Dynamic, heuristic guard for sensitive/internal data:
 * - Scores intent for sensitive requests (keys, credentials, internal APIs, pricing internals).
 * - Detects token-like blobs (long base64/hex), urls to internal hosts, and commands asking to reveal configs.
 * - Blocks only when the score passes a threshold, keeping the bot free for normal Q&A.
 */
function isSensitiveQuestion(message: string): boolean {
  const text = message.toLowerCase();

  const highRiskKeywords = [
    'api key',
    'secret key',
    'private key',
    'auth token',
    'bearer token',
    'access token',
    'refresh token',
    'admin endpoint',
    'internal api',
    'internal endpoint',
    'pricing algorithm',
    'pricing logic',
    'model costs',
    'model pricing',
    'database url',
    'connection string',
    'env var',
    'environment variable',
    'config file',
    'credentials',
    'password',
    'ssh key',
    'jwt',
    'cookie value'
  ];

  const extractionVerbs = ['show', 'share', 'leak', 'expose', 'dump', 'reveal', 'print', 'give'];
  const internalNouns = ['token', 'key', 'secret', 'endpoint', 'url', 'config', 'environment', 'env', 'credential'];

  // Regex detectors for likely secrets / tokens
  const secretLikeRegexes = [
    /bearer\s+[a-z0-9\-_\.]{20,}/i,
    /['"`]?[a-z0-9]{24,}['"`]?/i,
    /(?:sk-|pk-|rk-)[a-z0-9]{16,}/i, // api-style prefixes
    /ya29\.[\w\-\.]+/i, // google-ish token
  ];

  // Internal host hints
  const internalHostRegex = /(localhost|127\.0\.0\.1|\.internal\b|\.svc\b|\.cluster\b)/i;

  // Score calculation
  let score = 0;

  if (highRiskKeywords.some((kw) => text.includes(kw))) score += 2;
  if (extractionVerbs.some((v) => text.includes(v)) && internalNouns.some((n) => text.includes(n))) score += 2;
  if (secretLikeRegexes.some((rx) => rx.test(message))) score += 2;
  if (internalHostRegex.test(message)) score += 1;

  // Long opaque token-like strings (base64-ish) without spaces
  const longOpaque = message.match(/[A-Za-z0-9+\/=_\-]{32,}/g);
  if (longOpaque && longOpaque.length > 0) score += 1;

  // If asking "which api/which model/which provider" plus "used here", mark as internal
  if (/(which|what)\s+(api|model|provider|service).*(used|using|behind)/i.test(message)) score += 2;

  return score >= 2;
}

/**
 * Send a message to the AI companion
 */
export async function sendCompanionMessage(
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  try {
    if (isPricingQuestion(message)) {
      return {
        responseStatus: 'success',
        message: 'Pricing filtered',
        data: {
          messageId: 'pricing-guard',
          response:
            "Our pricing is being updated and isn't available via chat. Please check the pricing page or reach out to support for the latest details.",
        },
      };
    }

    if (isSensitiveQuestion(message)) {
      return {
        responseStatus: 'success',
        message: 'Filtered locally',
        data: {
          messageId: 'local-guard',
          response:
            "I'm here to help with general product questions, but I can't share internal or confidential details. Ask me something else!",
        },
      };
    }

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
