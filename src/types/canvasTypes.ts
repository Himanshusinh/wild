export interface CanvasProject {
    id: string;
    name: string;
    description?: string;
    ownerUid: string;
    collaborators?: Array<{
        uid: string;
        role: 'owner' | 'editor' | 'viewer';
    }>;
    settings?: {
        width?: number;
        height?: number;
        backgroundColor?: string;
    };
    thumbnail?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CanvasProjectsResponse {
    projects: CanvasProject[];
    total: number;
}
