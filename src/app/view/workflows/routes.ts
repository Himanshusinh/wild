type ImageRoute = string | { [key: string]: string }

interface FolderImageRoutes {
    [folderName: string]: ImageRoute;
}   

export const imageRoutes: FolderImageRoutes = {
    // Core icons and logos
    core: {
        logo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/core%2FAsset%203wildmind%20logo%20text.svg?alt=media&token=16944401-2132-474c-9411-68e8afe550e6',
        google: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/core%2Fgoogle.png?alt=media&token=c33e2a7f-9a84-441a-99e0-89f9ab77a6f1',
    },
    
    // Recent Creations
    recentCreations: {
        recent1: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Frecent%20creation%2F001.png?alt=media&token=b5bfe5e2-66c9-4de2-aa6c-9ccddb33f7d5',
        recent2: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Frecent%20creation%2F002.png?alt=media&token=7bbe64f6-1c4c-4563-8d7f-0b5af2d90f71',
        recent3: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Frecent%20creation%2F003.png?alt=media&token=8cd1c0e7-33bf-497d-bce5-48e2efd4af6a',
        recent4: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Frecent%20creation%2F004.png?alt=media&token=ab9aa833-71a2-4e73-89ae-8e1afb39d6cf',
        recent5: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Frecent%20creation%2F005.png?alt=media&token=4d825a56-3a0a-46bb-9bf4-c8bea0b52c8e',
    },
    
    // Header
    header: {
        heroVideo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fherovideo.mp4?alt=media&token=e5c61ae1-9bae-4b8e-b39d-4cf1dbdac7df'
    }
};

// Helper function to get image URL by folder and name
export const getImageUrl = (folder: string, imageName: string): string => {
    const folderImages = imageRoutes[folder];
    if (!folderImages) {
        console.warn(`Folder not found: ${folder}`);
        return '';
    }
    
    if (typeof folderImages === 'string') {
        return folderImages;
    }
    
    const url = folderImages[imageName];
    if (!url) {
        console.warn(`Image route not found for name: ${imageName} in folder: ${folder}`);
        return '';
    }
    return url;
};

