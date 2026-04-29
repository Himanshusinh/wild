/**
 * Utility to handle auto-resuming generations after a user signs in.
 * Stores "intents" in localStorage to be retrieved upon returning to the site.
 */

export interface AutoResumeIntent {
    type: 'image' | 'video' | 'workflow';
    data: any;
    timestamp: number;
}

const STORAGE_KEY = 'wildmind_auto_resume_intent';
const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

export const saveAutoResumeIntent = (type: AutoResumeIntent['type'], data: any) => {
    if (typeof window === 'undefined') return;

    const intent: AutoResumeIntent = {
        type,
        data,
        timestamp: Date.now(),
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
        console.log(`[AutoResume] Saved ${type} intent:`, intent);
    } catch (e) {
        console.error('[AutoResume] Failed to save intent:', e);
    }
};

export const getAutoResumeIntent = (): AutoResumeIntent | null => {
    if (typeof window === 'undefined') return null;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const intent: AutoResumeIntent = JSON.parse(stored);

        // Check for expiry
        if (Date.now() - intent.timestamp > EXPIRY_TIME) {
            console.log('[AutoResume] Intent expired');
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        return intent;
    } catch (e) {
        console.error('[AutoResume] Failed to get intent:', e);
        return null;
    }
};

export const clearAutoResumeIntent = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    console.log('[AutoResume] Intent cleared');
};
