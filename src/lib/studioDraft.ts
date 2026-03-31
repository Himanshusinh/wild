export interface StudioDraftPayload {
  prompt?: string;
  model?: string;
  frameSize?: string;
  imageCount?: number;
  style?: string;
  uploadedImages?: string[];
  metadata?: Record<string, unknown>;
}

interface PersistedStudioDraft extends StudioDraftPayload {
  timestamp: number;
}

const STORAGE_KEY = "wildmind_studio_draft";
const EXPIRY_MS = 30 * 60 * 1000;

const getStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }
};

export const saveStudioDraft = (draft: StudioDraftPayload) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  const payload: PersistedStudioDraft = {
    ...draft,
    timestamp: Date.now(),
  };

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Best effort only.
  }
};

export const getStudioDraft = (): StudioDraftPayload | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const payload = JSON.parse(raw) as PersistedStudioDraft;
    if (!payload?.timestamp || Date.now() - payload.timestamp > EXPIRY_MS) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }

    const { timestamp, ...draft } = payload;
    void timestamp;
    return draft;
  } catch {
    return null;
  }
};

export const clearStudioDraft = () => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Best effort only.
  }
};
