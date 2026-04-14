type ReplicateErrorDetail = {
  detail?: string;
  message?: string;
  error?: string;
  status?: number;
  retryable?: boolean;
};

type ReplicateToastPayload = {
  type?: "success" | "error" | "loading" | "blank";
  title?: string;
  message?: string;
  retryable?: boolean;
};

type ReplicateErrorEnvelope = {
  message?: string;
  toast?: ReplicateToastPayload;
  detail?: ReplicateErrorDetail;
  status?: number;
  retryable?: boolean;
};

const FRIENDLY_RETRY_MESSAGE =
  "We could not complete this request right now. Please try again in a moment.";
const GENERIC_REQUEST_FAILURE_PATTERNS = [
  /^request failed$/i,
  /^request failed with status code \d+$/i,
  /^the server is temporarily unavailable/i,
];

const looksGenericFailureMessage = (message?: string): boolean => {
  const text = String(message || "").trim();
  if (!text) return true;
  return GENERIC_REQUEST_FAILURE_PATTERNS.some((pattern) => pattern.test(text));
};

const extractDeepBackendMessage = (error: any): string | undefined => {
  const candidates = [
    error?.response?.data?.message,
    error?.response?.data?.detail,
    error?.data?.message,
    error?.data?.detail,
    error?.payload?.message,
    error?.payload?.detail,
    error?.detail?.message,
    error?.detail?.detail,
    error?.raw?.response?.data?.message,
    error?.raw?.response?.data?.detail,
    typeof error?.raw?.response?.data === "string"
      ? error.raw.response.data
      : undefined,
  ];
  const best = candidates.find((value) => {
    const text = String(value || "").trim();
    return text.length > 0 && !looksGenericFailureMessage(text);
  });
  return typeof best === "string" ? best : undefined;
};

const toFriendlyReplicateMessage = (message?: string): string => {
  const raw = String(message || "").trim();
  if (!raw) return FRIENDLY_RETRY_MESSAGE;
  const lower = raw.toLowerCase();
  if (
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("network error") ||
    lower.includes("err_network") ||
    lower.includes("timeout") ||
    lower.includes("econnreset") ||
    lower.includes("socket hang up")
  ) {
    return FRIENDLY_RETRY_MESSAGE;
  }
  return raw;
};

// User-friendly error messages based on error type and status code
const REPLICATE_ERROR_MESSAGES: Record<
  number,
  (detail: ReplicateErrorDetail) => string
> = {
  400: (detail) => {
    const msg = detail.detail || detail.message || detail.error;
    if (msg?.includes("validation") || msg?.includes("invalid")) {
      return "Invalid request. Please check your input parameters and try again.";
    }
    return msg || "Bad request. Please check your input and try again.";
  },
  401: () => "Authentication failed. Please check your API credentials.",
  403: () => "Access forbidden. You may not have permission to use this model.",
  404: (detail) => {
    const msg = detail.detail || detail.message || detail.error;
    if (msg?.includes("model") || msg?.includes("not found")) {
      return "Model not found. Please verify the model name is correct.";
    }
    return "Resource not found. Please check the model or endpoint.";
  },
  429: (detail) => {
    const msg = detail.detail || detail.message || detail.error;
    if (msg?.includes("throttled") || msg?.includes("rate limit")) {
      const match = msg.match(/Expected available in (\d+) second/i);
      if (match) {
        const seconds = match[1];
        return `Rate limit exceeded. Please wait ${seconds} second${seconds !== "1" ? "s" : ""} before trying again.`;
      }
      return "Rate limit exceeded. Please wait a moment before trying again.";
    }
    return "Too many requests. Please slow down and try again.";
  },
  500: (detail) =>
    detail.detail ||
    detail.message ||
    detail.error ||
    "Replicate service is experiencing issues. Please try again in a few minutes.",
  502: (detail) =>
    detail.detail ||
    detail.message ||
    detail.error ||
    "Replicate service is temporarily unavailable. Please try again in a few minutes.",
  503: (detail) =>
    detail.detail ||
    detail.message ||
    detail.error ||
    "Replicate service is temporarily unavailable. Please try again in a few minutes.",
  504: () =>
    "Request timed out. The generation took too long. Please try again with a simpler prompt.",
};

const extractReplicateEnvelope = (
  error: any,
): ReplicateErrorEnvelope | null => {
  if (!error) return null;

  // Handle normalized errors from Redux rejectWithValue payloads first.
  // These often look like: { message, detail, status, retryable, raw }.
  const normalizedRawResponseData = error?.raw?.response?.data;
  const normalizedMessage =
    error?.message ||
    error?.detail?.message ||
    error?.detail?.detail ||
    (typeof normalizedRawResponseData === "string"
      ? normalizedRawResponseData
      : normalizedRawResponseData?.message || normalizedRawResponseData?.detail);
  if (normalizedMessage || error?.status || error?.retryable != null) {
    const deepBackendMessage = extractDeepBackendMessage(error);
    const resolvedMessage =
      (looksGenericFailureMessage(normalizedMessage)
        ? deepBackendMessage
        : normalizedMessage) ||
      normalizedMessage ||
      deepBackendMessage ||
      "Replicate request failed";
    return {
      message: toFriendlyReplicateMessage(resolvedMessage),
      detail:
        typeof error?.detail === "object"
          ? {
              detail: error.detail?.detail,
              message: error.detail?.message,
              error: error.detail?.error,
              status: error?.status || error.detail?.status,
              retryable:
                typeof error?.retryable === "boolean"
                  ? error.retryable
                  : error.detail?.retryable,
            }
          : undefined,
      status: error?.status,
      retryable:
        typeof error?.retryable === "boolean" ? error.retryable : undefined,
      toast: {
        type: "error",
        title: "Replicate Generation Failed",
        message: toFriendlyReplicateMessage(resolvedMessage),
        retryable:
          typeof error?.retryable === "boolean" ? error.retryable : undefined,
      },
    };
  }

  // Try to extract from response.data (axios format)
  const responseData = error?.response?.data;
  const status = error?.response?.status || error?.status || error?.statusCode;

  if (responseData) {
    // Replicate errors typically have a 'detail' field
    const detail =
      typeof responseData === "string"
        ? responseData
        : responseData.detail || responseData.message || responseData.error;

    const errorMessage =
      typeof detail === "string"
        ? detail
        : detail?.detail ||
          detail?.message ||
          detail?.error ||
          "Replicate request failed";
    const deepBackendMessage = extractDeepBackendMessage(error);
    const resolvedErrorMessage =
      (looksGenericFailureMessage(errorMessage)
        ? deepBackendMessage
        : errorMessage) ||
      errorMessage ||
      deepBackendMessage ||
      "Replicate request failed";

    // Determine if error is retryable based on status code
    const retryable = status ? status >= 500 || status === 429 : false;

    // Get user-friendly message based on status code
    let friendlyMessage = resolvedErrorMessage;
    if (status && REPLICATE_ERROR_MESSAGES[status]) {
      friendlyMessage = REPLICATE_ERROR_MESSAGES[status]({
        detail: typeof detail === "string" ? detail : undefined,
        message: typeof detail === "object" ? detail?.message : undefined,
        error: typeof detail === "object" ? detail?.error : undefined,
        status,
        retryable,
      });
    }

    return {
      message: friendlyMessage,
      detail: {
        detail: typeof detail === "string" ? detail : undefined,
        message: typeof detail === "object" ? detail?.message : undefined,
        error: typeof detail === "object" ? detail?.error : undefined,
        status,
        retryable,
      },
      status,
      retryable,
      toast: {
        type: "error",
        title: "Replicate Generation Failed",
        message: friendlyMessage,
        retryable,
      },
    };
  }

  // Check for rate limit errors in message
  if (error?.message) {
    const errorMsg = String(error.message);
    if (
      errorMsg.includes("throttled") ||
      errorMsg.includes("rate limit") ||
      errorMsg.includes("429")
    ) {
      const match = errorMsg.match(/Expected available in (\d+) second/i);
      let message =
        "Rate limit exceeded. Please wait a moment before trying again.";
      if (match) {
        const seconds = match[1];
        message = `Rate limit exceeded. Please wait ${seconds} second${seconds !== "1" ? "s" : ""} before trying again.`;
      }
      return {
        message,
        status: 429,
        retryable: true,
        toast: {
          type: "error",
          title: "Rate Limit Exceeded",
          message,
          retryable: true,
        },
      };
    }
  }

  // Fallback to simple error message
  const simpleMessage = toFriendlyReplicateMessage(
    error?.message || "Replicate request failed",
  );
  return {
    message: simpleMessage,
    status: status || 500,
    toast: {
      type: "error",
      title: "Replicate Generation Failed",
      message: simpleMessage,
    },
  };
};

export const extractReplicateErrorMessage = (
  error: any,
  fallback = "Request failed",
): string => {
  const envelope = extractReplicateEnvelope(error);
  if (envelope?.message) return envelope.message;
  if (typeof error?.message === "string" && error.message.trim().length > 0)
    return toFriendlyReplicateMessage(error.message);
  return fallback;
};

export const extractReplicateErrorDetails = (
  error: any,
): ReplicateErrorEnvelope | null => {
  return extractReplicateEnvelope(error);
};

export const showReplicateErrorToast = async (
  error: any,
  fallbackMessage?: string,
): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  const envelope = extractReplicateEnvelope(error);
  if (!envelope) {
    // Fallback: show simple error message
    try {
      const toastModule = await import("react-hot-toast");
      const toastLib = toastModule.default;
      const message = toFriendlyReplicateMessage(
        error?.message || fallbackMessage || "Request failed",
      );
      if (typeof toastLib.error === "function") {
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
    type: "error" as const,
    title: "Replicate Generation Failed",
    message: envelope.message || fallbackMessage || "Request failed",
    retryable: envelope.retryable,
  };

  try {
    const toastModule = await import("react-hot-toast");
    const toastLib = toastModule.default;
    const type =
      payload.type === "success" || payload.type === "loading"
        ? payload.type
        : "error";

    // Build message with retry hint if applicable
    const message =
      payload.message ||
      envelope.message ||
      fallbackMessage ||
      "Request failed";
    let finalMessage = message;

    // Add retry hint for retryable errors
    if (payload.retryable && type === "error") {
      finalMessage = `${message}\n\nYou can try again - this error may be temporary.`;
    }

    if (type === "success" && typeof toastLib.success === "function") {
      toastLib.success(finalMessage, { duration: 5000 });
    } else if (type === "loading" && typeof toastLib.loading === "function") {
      toastLib.loading(finalMessage);
    } else if (typeof toastLib.error === "function") {
      toastLib.error(finalMessage, {
        duration: payload.retryable ? 8000 : 5000,
      });
    } else {
      toastLib(finalMessage);
    }
    return true;
  } catch {
    return false;
  }
};
