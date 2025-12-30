import { auth } from './firebase';

/**
 * Get Firebase ID token for Bearer authentication
 */
export async function getAuthToken(): Promise<string | null> {
    try {
        // Prefer a fresh token from Firebase (force refresh) to avoid expired ID tokens
        if (auth?.currentUser) {
            try {
                const token = await auth.currentUser.getIdToken(true);
                if (token && token.startsWith('eyJ')) {
                    try { localStorage.setItem('authToken', token); } catch {}
                    return token;
                }
            } catch (error) {
                console.warn('[Auth] Failed to refresh Firebase token:', error);
            }
        }

        // Fallback to cached token in localStorage (if any)
        const storedToken = localStorage.getItem('authToken');
        if (storedToken && storedToken.startsWith('eyJ')) {
            return storedToken;
        }

        // Fallback to user object stored in localStorage
        const userString = localStorage.getItem('user');
        if (userString) {
            try {
                const userObj = JSON.parse(userString);
                const token = userObj?.idToken || userObj?.token || null;
                if (token && token.startsWith('eyJ')) {
                    return token;
                }
            } catch { }
        }

        return null;
    } catch (error) {
        console.warn('[Auth] Error getting Firebase token:', error);
        return null;
    }
}
