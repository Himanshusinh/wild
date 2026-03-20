const STORAGE_KEY = 'wildmind_auto_resume_intent';
const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

export const saveAutoResumeIntent = (type: 'image' | 'video' | 'workflow', data: any) => {
    const intent = { type, data, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
    console.log(`[AutoResume] Saved ${type} intent:`, intent);
};

export const getAutoResumeIntent = () => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
        const intent = JSON.parse(stored);
        if (Date.now() - intent.timestamp > EXPIRY_TIME) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return intent;
    } catch (e) {
        console.error('[AutoResume] Error parsing intent:', e);
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
};

export const clearAutoResumeIntent = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    console.log('[AutoResume] Cleared intent');
};
