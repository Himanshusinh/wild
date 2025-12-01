import { CanvasProject, CanvasProjectsResponse } from '@/types/canvasTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';

/**
 * Fetch all canvas projects for the current user
 */
export async function fetchCanvasProjects(limit: number = 100): Promise<CanvasProjectsResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/canvas/projects?limit=${limit}`, {
            method: 'GET',
            credentials: 'include', // Include cookies for authentication
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
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
