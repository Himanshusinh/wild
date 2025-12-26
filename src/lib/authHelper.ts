import { auth } from './firebase';

/**
 * Get Firebase ID token for Bearer authentication
 */
export async function getAuthToken(): Promise<string | null> {
    try {
        // Try to get token from localStorage first (faster)
        const storedToken = localStorage.getItem('authToken');
        if (storedToken && storedToken.startsWith('eyJ')) {
            return storedToken;
        }

        // Try to get from user object
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

        // Try to get fresh token from Firebase Auth (most reliable)
        if (auth?.currentUser) {
            try {
                // Force refresh to ensure token is valid
                const token = await auth.currentUser.getIdToken(true);
                if (token && token.startsWith('eyJ')) {
                    // Cache it for next time
                    try {
                        localStorage.setItem('authToken', token);
                    } catch { }
                    return token;
                }
            } catch (error) {
                console.warn('[Auth] Failed to get Firebase token:', error);
            }
        }

        return null;
    } catch (error) {
        console.warn('[Auth] Error getting Firebase token:', error);
        return null;
    }
}
