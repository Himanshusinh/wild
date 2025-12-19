type FalErrorDetail = {
  loc?: string[];
  msg?: string;
  type?: string;
  url?: string;
  ctx?: Record<string, unknown>;
  input?: any;
};

type FalToastPayload = {
  type?: 'success' | 'error' | 'loading' | 'blank';
  title?: string;
  message?: string;
  docUrl?: string;
  retryable?: boolean;
};

type FalErrorEnvelope = {
  message?: string;
  toast?: FalToastPayload;
  detail?: FalErrorDetail[];
  type?: string;
  retryable?: boolean;
  status?: number;
};

// User-friendly error messages based on error type
const FAL_ERROR_MESSAGES: Record<string, (detail: FalErrorDetail) => string> = {
  internal_server_error: () => 'An internal server error occurred. Please try again in a moment.',
  generation_timeout: () => 'Generation timed out. Try simplifying your prompt or retrying.',
  downstream_service_error: () => 'A service error occurred. Please try again.',
  downstream_service_unavailable: () => 'Service is temporarily unavailable. Please try again later.',
  content_policy_violation: () => 'Your prompt was blocked by content safety filters. Please adjust your prompt to follow our content policy.',
  image_too_small: (detail) => {
    const ctx = detail.ctx as { min_height?: number; min_width?: number } | undefined;
    if (ctx?.min_height && ctx?.min_width) {
      return `Image is too small. Minimum size is ${ctx.min_width}x${ctx.min_height} pixels.`;
    }
    return 'Image is too small. Please upload a larger image.';
  },
  image_too_large: (detail) => {
    const ctx = detail.ctx as { max_height?: number; max_width?: number } | undefined;
    if (ctx?.max_height && ctx?.max_width) {
      return `Image is too large. Maximum size is ${ctx.max_width}x${ctx.max_height} pixels.`;
    }
    return 'Image is too large. Please upload a smaller image.';
  },
  image_load_error: () => 'Failed to load the image. Please check the image format and try again.',
  file_download_error: () => 'Failed to download the file. Ensure the URL is publicly accessible.',
  face_detection_error: () => 'No face detected in the image. Please upload an image with a clearly visible face.',
  file_too_large: (detail) => {
    const ctx = detail.ctx as { max_size?: number } | undefined;
    if (ctx?.max_size) {
      const maxMB = Math.round(ctx.max_size / 1024 / 1024);
      return `File is too large. Maximum size is ${maxMB}MB.`;
    }
    return 'File is too large. Please upload a smaller file.';
  },
  greater_than: (detail) => {
    const ctx = detail.ctx as { gt?: number } | undefined;
    return ctx?.gt !== undefined ? `Value must be greater than ${ctx.gt}.` : 'Value is too small.';
  },
  greater_than_equal: (detail) => {
    const ctx = detail.ctx as { ge?: number } | undefined;
    return ctx?.ge !== undefined ? `Value must be at least ${ctx.ge}.` : 'Value is too small.';
  },
  less_than: (detail) => {
    const ctx = detail.ctx as { lt?: number } | undefined;
    return ctx?.lt !== undefined ? `Value must be less than ${ctx.lt}.` : 'Value is too large.';
  },
  less_than_equal: (detail) => {
    const ctx = detail.ctx as { le?: number } | undefined;
    return ctx?.le !== undefined ? `Value must be at most ${ctx.le}.` : 'Value is too large.';
  },
  multiple_of: (detail) => {
    const ctx = detail.ctx as { multiple_of?: number } | undefined;
    return ctx?.multiple_of !== undefined ? `Value must be a multiple of ${ctx.multiple_of}.` : 'Invalid value.';
  },
  sequence_too_short: (detail) => {
    const ctx = detail.ctx as { min_length?: number } | undefined;
    return ctx?.min_length !== undefined ? `At least ${ctx.min_length} item(s) required.` : 'Not enough items.';
  },
  sequence_too_long: (detail) => {
    const ctx = detail.ctx as { max_length?: number } | undefined;
    return ctx?.max_length !== undefined ? `Maximum ${ctx.max_length} item(s) allowed.` : 'Too many items.';
  },
  one_of: (detail) => {
    const ctx = detail.ctx as { expected?: unknown[] } | undefined;
    if (ctx?.expected && Array.isArray(ctx.expected) && ctx.expected.length > 0) {
      const options = ctx.expected.map(String).join(', ');
      return `Invalid value. Must be one of: ${options}.`;
    }
    return 'Invalid value.';
  },
  feature_not_supported: () => 'This feature combination is not supported by the selected model.',
  invalid_archive: () => 'The archive file is invalid or corrupted. Please check the file and try again.',
  archive_file_count_below_minimum: (detail) => {
    const ctx = detail.ctx as { min_count?: number; provided_count?: number; supported_extensions?: string[] } | undefined;
    if (ctx?.min_count && ctx?.provided_count) {
      const extensions = ctx.supported_extensions?.join(', ') || 'files';
      return `Archive has too few files. Expected at least ${ctx.min_count} ${extensions} files, found ${ctx.provided_count}.`;
    }
    return 'Archive does not contain enough valid files.';
  },
  archive_file_count_exceeds_maximum: (detail) => {
    const ctx = detail.ctx as { max_count?: number; provided_count?: number; supported_extensions?: string[] } | undefined;
    if (ctx?.max_count && ctx?.provided_count) {
      const extensions = ctx.supported_extensions?.join(', ') || 'files';
      return `Archive has too many files. Maximum ${ctx.max_count} ${extensions} files allowed, found ${ctx.provided_count}.`;
    }
    return 'Archive contains too many files.';
  },
  audio_duration_too_long: (detail) => {
    const ctx = detail.ctx as { max_duration?: number; provided_duration?: number } | undefined;
    if (ctx?.max_duration && ctx?.provided_duration) {
      return `Audio is too long. Maximum ${ctx.max_duration}s allowed, provided ${ctx.provided_duration}s.`;
    }
    return 'Audio duration exceeds the maximum allowed limit.';
  },
  audio_duration_too_short: (detail) => {
    const ctx = detail.ctx as { min_duration?: number; provided_duration?: number } | undefined;
    if (ctx?.min_duration && ctx?.provided_duration) {
      return `Audio is too short. Minimum ${ctx.min_duration}s required, provided ${ctx.provided_duration}s.`;
    }
    return 'Audio duration is too short.';
  },
  unsupported_audio_format: (detail) => {
    const ctx = detail.ctx as { supported_formats?: string[] } | undefined;
    if (ctx?.supported_formats && ctx.supported_formats.length > 0) {
      return `Unsupported audio format. Supported formats: ${ctx.supported_formats.join(', ')}.`;
    }
    return 'Unsupported audio format.';
  },
  unsupported_image_format: (detail) => {
    const ctx = detail.ctx as { supported_formats?: string[] } | undefined;
    if (ctx?.supported_formats && ctx.supported_formats.length > 0) {
      return `Unsupported image format. Supported formats: ${ctx.supported_formats.join(', ')}.`;
    }
    return 'Unsupported image format. Please use JPG, PNG, or WebP.';
  },
  unsupported_video_format: (detail) => {
    const ctx = detail.ctx as { supported_formats?: string[] } | undefined;
    if (ctx?.supported_formats && ctx.supported_formats.length > 0) {
      return `Unsupported video format. Supported formats: ${ctx.supported_formats.join(', ')}.`;
    }
    return 'Unsupported video format.';
  },
  video_duration_too_long: (detail) => {
    const ctx = detail.ctx as { max_duration?: number; provided_duration?: number } | undefined;
    if (ctx?.max_duration && ctx?.provided_duration) {
      return `Video is too long. Maximum ${ctx.max_duration}s allowed, provided ${ctx.provided_duration}s.`;
    }
    return 'Video duration exceeds the maximum allowed limit.';
  },
  video_duration_too_short: (detail) => {
    const ctx = detail.ctx as { min_duration?: number; provided_duration?: number } | undefined;
    if (ctx?.min_duration && ctx?.provided_duration) {
      return `Video is too short. Minimum ${ctx.min_duration}s required, provided ${ctx.provided_duration}s.`;
    }
    return 'Video duration is too short.';
  },
};

const extractFalEnvelope = (error: any): FalErrorEnvelope | null => {
  if (!error) return null;
  
  // Try to extract from response.data (axios format)
  const responseData = error?.response?.data;
  if (responseData) {
    const body = typeof responseData === 'object' ? (responseData.data ?? responseData) : undefined;
    if (body && typeof body === 'object') {
      // Check for structured error format with detail array
      const detailArray = Array.isArray(body.detail) ? body.detail : 
                        (Array.isArray(body.data?.detail) ? body.data.detail : []);
      const primaryDetail: FalErrorDetail | undefined = detailArray[0];
      
      // Extract error type
      const errorType = primaryDetail?.type || body.type;
      
      // Extract retryable from header or body
      const headers = error?.response?.headers || {};
      const retryableHeader = headers['x-fal-retryable'] || headers['X-Fal-Retryable'];
      const retryable = retryableHeader === 'true' || retryableHeader === true || body.retryable === true;
      
      // Get user-friendly message
      let message = primaryDetail?.msg || body.message || responseData.message;
      if (errorType && FAL_ERROR_MESSAGES[errorType]) {
        message = FAL_ERROR_MESSAGES[errorType](primaryDetail || {});
      }
      
      return {
        message,
        type: errorType,
        detail: detailArray,
        retryable,
        status: error?.response?.status || body.status,
        toast: body.toast || {
          type: 'error',
          title: 'Generation Failed',
          message,
          retryable,
          docUrl: primaryDetail?.url || body.url,
        },
      };
    }
  }
  
  // Fallback to simple error message
  const simpleMessage = error?.message || 'Request failed';
  return {
    message: simpleMessage,
    toast: {
      type: 'error',
      title: 'Generation Failed',
      message: simpleMessage,
    },
  };
};

export const extractFalErrorMessage = (error: any, fallback = 'Request failed'): string => {
  const envelope = extractFalEnvelope(error);
  if (envelope?.message) return envelope.message;
  if (typeof error?.message === 'string' && error.message.trim().length > 0) return error.message;
  return fallback;
};

export const extractFalErrorDetails = (error: any): FalErrorEnvelope | null => {
  return extractFalEnvelope(error);
};

export const showFalErrorToast = async (error: any, fallbackMessage?: string): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  const envelope = extractFalEnvelope(error);
  if (!envelope) {
    // Fallback: show simple error message
    try {
      const toastModule = await import('react-hot-toast');
      const toastLib = toastModule.default;
      const message = error?.message || fallbackMessage || 'Request failed';
      if (typeof toastLib.error === 'function') {
        toastLib.error(message);
      } else {
        toastLib(message);
      }
      return true;
    } catch {
      return false;
    }
  }

  const payload = envelope.toast || {
    type: 'error' as const,
    title: 'Generation Failed',
    message: envelope.message || fallbackMessage || 'Request failed',
    retryable: envelope.retryable,
    docUrl: envelope.detail?.[0]?.url,
  };

  try {
    const toastModule = await import('react-hot-toast');
    const toastLib = toastModule.default;
    const type = payload.type === 'success' || payload.type === 'loading' ? payload.type : 'error';
    
    // Build message with retry hint if applicable
    const message = payload.message || envelope.message || fallbackMessage || 'Request failed';
    let finalMessage = message;
    
    // Add retry hint for retryable errors
    if (payload.retryable && type === 'error') {
      finalMessage = `${message}\n\nYou can try again - this error may be temporary.`;
    }
    
    // Add documentation URL if available
    if (payload.docUrl) {
      finalMessage = `${finalMessage}\n\nLearn more: ${payload.docUrl}`;
    }

    if (type === 'success' && typeof toastLib.success === 'function') {
      toastLib.success(finalMessage, { duration: 5000 });
    } else if (type === 'loading' && typeof toastLib.loading === 'function') {
      toastLib.loading(finalMessage);
    } else if (typeof toastLib.error === 'function') {
      toastLib.error(finalMessage, { duration: payload.retryable ? 8000 : 5000 });
    } else {
      toastLib(finalMessage);
    }
    return true;
  } catch {
    return false;
  }
};

