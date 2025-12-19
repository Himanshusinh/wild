import { CanvasProject, CanvasProjectsResponse } from '@/types/canvasTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';

/**
 * Fetch all canvas projects for the current user
 */
export async function fetchCanvasProjects(limit: number = 100): Promise<CanvasProjectsResponse> {
    try {
        // Check if we have a session cookie before making the request
        const hasSessionCookie = typeof document !== 'undefined' && document.cookie.includes('app_session=');
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
        
        console.log('[CanvasAPI] Fetching projects', {
            apiBaseUrl: API_BASE_URL,
            hostname,
            hasSessionCookie,
            cookieDomain: typeof document !== 'undefined' ? document.cookie.split(';').find(c => c.trim().startsWith('app_session='))?.substring(0, 50) : 'N/A',
        });
        
        const response = await fetch(`${API_BASE_URL}/api/canvas/projects?limit=${limit}`, {
            method: 'GET',
            credentials: 'include', // Include cookies for authentication
            headers: {
                'Content-Type': 'application/json',
            },
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
        const response = await fetch(`${API_BASE_URL}/api/canvas/projects`, {
            method: 'POST',
            credentials: 'include', // Include cookies for authentication
            headers: {
                'Content-Type': 'application/json',
            },
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
        const response = await fetch(`${API_BASE_URL}/api/canvas/projects/${projectId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
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
        const response = await fetch(`${API_BASE_URL}/api/canvas/projects/${projectId}`, {
            method: 'DELETE',
            credentials: 'include',
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
