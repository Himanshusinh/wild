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
};

const extractFalEnvelope = (error: any): FalErrorEnvelope | null => {
  if (!error) return null;
  const responseData = error?.response?.data;
  if (!responseData) return null;
  const body = typeof responseData === 'object' ? (responseData.data ?? responseData) : undefined;
  if (!body || typeof body !== 'object') return null;
  const toastPayload = body.toast;
  const message = responseData?.message || body?.message || body?.detail?.[0]?.msg;
  if (!toastPayload) {
    return message ? { message } : null;
  }
  return { message, toast: toastPayload };
};

export const extractFalErrorMessage = (error: any, fallback = 'Request failed'): string => {
  const envelope = extractFalEnvelope(error);
  if (envelope?.message) return envelope.message;
  if (typeof error?.message === 'string' && error.message.trim().length > 0) return error.message;
  return fallback;
};

export const showFalErrorToast = async (error: any, fallbackMessage?: string): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  const envelope = extractFalEnvelope(error);
  const payload = envelope?.toast;
  if (!payload) return false;

  try {
    const toastModule = await import('react-hot-toast');
    const toastLib = toastModule.default;
    const type = payload.type === 'success' || payload.type === 'loading' ? payload.type : 'error';
    const parts = [payload.title, payload.message || envelope?.message || fallbackMessage || 'Request failed']
      .filter(Boolean)
      .join(' — ');
    const docSuffix = payload.docUrl ? `\n${payload.docUrl}` : '';
    const finalMessage = `${parts}${docSuffix}`;

    if (type === 'success' && typeof toastLib.success === 'function') toastLib.success(finalMessage);
    else if (type === 'loading' && typeof toastLib.loading === 'function') toastLib.loading(finalMessage);
    else if (typeof toastLib.error === 'function') toastLib.error(finalMessage);
    else toastLib(finalMessage);
    return true;
  } catch {
    return false;
  }
};

