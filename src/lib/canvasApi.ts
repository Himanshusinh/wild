import { CanvasProject, CanvasProjectsResponse } from '@/types/canvasTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';

/**
 * Get Firebase ID token for Bearer authentication (fallback when cookies don't work)
 */
async function getFirebaseIdToken(): Promise<string | null> {
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
        const { auth } = await import('./firebase');
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
                console.warn('[CanvasAPI] Failed to get Firebase token:', error);
            }
        }

        return null;
    } catch (error) {
        console.warn('[CanvasAPI] Error getting Firebase token:', error);
        return null;
    }
}

/**
 * Fetch all canvas projects for the current user
 */
export async function fetchCanvasProjects(limit: number = 100): Promise<CanvasProjectsResponse> {
    try {
        // Check if we have a session cookie before making the request
        const hasSessionCookie = typeof document !== 'undefined' && document.cookie.includes('app_session=');
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';

        // Always try to get Bearer token as fallback (even if cookie exists, it might not work due to domain issues)
        const bearerToken = await getFirebaseIdToken();

        console.log('[CanvasAPI] Fetching projects', {
            apiBaseUrl: API_BASE_URL,
            hostname,
            hasSessionCookie,
            hasBearerToken: !!bearerToken,
            authStrategy: bearerToken ? 'Bearer token (fallback)' : hasSessionCookie ? 'Session cookie only' : 'No authentication',
        });

        // Build headers with Bearer token if available (prioritize Bearer token for cross-subdomain reliability)
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (bearerToken) {
            headers['Authorization'] = `Bearer ${bearerToken}`;
            console.log('[CanvasAPI] Using Bearer token authentication (works across subdomains)');
        } else if (!hasSessionCookie) {
            console.warn('[CanvasAPI] ⚠️ No authentication method available - request will likely fail');
        }

        const response = await fetch(`${API_BASE_URL}/api/canvas/projects?limit=${limit}`, {
            method: 'GET',
            credentials: 'include', // Include cookies for authentication
            headers,
        });

        if (!response.ok) {
            // Let axios interceptor handle 401 errors with circuit breaker
            // Just throw a simple error here
            const errorText = await response.text().catch(() => response.statusText);
            throw new Error(`Failed to fetch canvas projects: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        const projects = result.data?.projects || [];

        return {
            projects: projects,
            total: projects.length,
        };
    } catch (error) {
        console.error('Error fetching canvas projects:', error);
        throw error;
    }
}

/**
 * Create a new canvas project
 */
export async function createCanvasProject(name?: string): Promise<CanvasProject> {
    try {
        // Try to get Bearer token as fallback
        const bearerToken = await getFirebaseIdToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (bearerToken) {
            headers['Authorization'] = `Bearer ${bearerToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/canvas/projects`, {
            method: 'POST',
            credentials: 'include', // Include cookies for authentication
            headers,
            body: JSON.stringify({
                name: name || 'Untitled Project',
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create canvas project: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data?.project;
    } catch (error) {
        console.error('Error creating canvas project:', error);
        throw error;
    }
}

/**
 * Update a canvas project
 */
export async function updateProject(
    projectId: string,
    updates: Partial<{ name: string; description: string; settings: CanvasProject['settings'] }>
): Promise<CanvasProject> {
    try {
        // Try to get Bearer token as fallback
        const bearerToken = await getFirebaseIdToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (bearerToken) {
            headers['Authorization'] = `Bearer ${bearerToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/canvas/projects/${projectId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers,
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            throw new Error(`Failed to update canvas project: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data?.project;
    } catch (error) {
        console.error('Error updating canvas project:', error);
        throw error;
    }
}

/**
 * Delete a canvas project
 */
export async function deleteProject(projectId: string): Promise<void> {
    try {
        // Try to get Bearer token as fallback
        const bearerToken = await getFirebaseIdToken();

        const headers: HeadersInit = {};

        if (bearerToken) {
            headers['Authorization'] = `Bearer ${bearerToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/canvas/projects/${projectId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers,
        });

        if (!response.ok) {
            throw new Error(`Failed to delete canvas project: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error deleting canvas project:', error);
        throw error;
    }
}



// Alias for convenience
export const createProject = createCanvasProject;
