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
            } catch {}
        }

        // Try to get fresh token from Firebase Auth
        const { auth } = await import('./firebase');
        if (auth?.currentUser) {
            try {
                const token = await auth.currentUser.getIdToken();
                if (token && token.startsWith('eyJ')) {
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
            cookieDomain: typeof document !== 'undefined' ? document.cookie.split(';').find(c => c.trim().startsWith('app_session='))?.substring(0, 50) : 'N/A',
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
            credentials: 'include', // Include cookies for authentication (even if not present)
            headers,
        });

        if (!response.ok) {
            // Handle 401 Unauthorized specifically
            if (response.status === 401) {
                // Try to get error message from response
                let errorMessage = 'Unauthorized';
                let errorData: any = null;
                try {
                    errorData = await response.json();
                    errorMessage = errorData?.message || errorData?.error || 'Unauthorized';
                } catch {
                    errorMessage = response.statusText || 'Unauthorized';
                }
                
                console.error('[CanvasAPI] 401 Unauthorized - Authentication required', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    hostname,
                    hasSessionCookie,
                    errorMessage,
                    cookieInfo: typeof document !== 'undefined' ? {
                        allCookies: document.cookie.split(';').map(c => c.trim()),
                        hasAppSession: document.cookie.includes('app_session='),
                    } : 'N/A',
                    troubleshooting: [
                        '1. Check if you are logged in on www.wildmindai.com',
                        '2. Check browser DevTools → Application → Cookies → www.wildmindai.com',
                        '3. Look for app_session cookie - it should have Domain: .wildmindai.com',
                        '4. If cookie domain is www.wildmindai.com (not .wildmindai.com), you need to log in again',
                        '5. Backend COOKIE_DOMAIN env var should be set to .wildmindai.com',
                    ],
                });
                
                // Provide helpful error message
                const helpfulMessage = errorMessage.includes('Cookie not sent') || errorMessage.includes('cookie domain')
                    ? 'Authentication failed: Cookie not being sent. This is usually a cookie domain configuration issue. Please try logging out and logging in again, or contact support if the issue persists.'
                    : `Authentication required: ${errorMessage}. Please log in again.`;
                
                throw new Error(helpfulMessage);
            }
            
            throw new Error(`Failed to fetch canvas projects: ${response.statusText}`);
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
