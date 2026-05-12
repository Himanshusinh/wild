interface ImageRoute {
    [key: string]: string;
}

interface FolderImageRoutes {
    [folderName: string]: ImageRoute;
}

export const imageRoutes: FolderImageRoutes = {
    // Core icons and logos
    core: {
        logo: 'https://idr01.zata.ai/devstoragev1/public/core/wildmind_text.svg',
        home: 'https://idr01.zata.ai/devstoragev1/public/icons/Homewhite.svg',
        imageGeneration: 'https://idr01.zata.ai/devstoragev1/public/core/imagegenerationwhite.svg',
        videoGeneration: 'https://idr01.zata.ai/devstoragev1/public/core/videoGenerationiconwhite.svg',
        musicGeneration: 'https://idr01.zata.ai/devstoragev1/public/core/musicgenerationwhite.svg',
        canvas: 'https://idr01.zata.ai/devstoragev1/public/core/canvaswhite.svg',
        brandingKit: 'https://idr01.zata.ai/devstoragev1/public/core/brandingkitwhite.svg',
        templates: 'https://idr01.zata.ai/devstoragev1/public/core/templateswhite.svg',
        pricing: 'https://idr01.zata.ai/devstoragev1/public/core/pricingwhite.svg',
        history: 'https://idr01.zata.ai/devstoragev1/public/core/historywhite.svg',
        bookmarks: 'https://idr01.zata.ai/devstoragev1/public/core/Bookmarkwhite.svg',
        search: 'https://idr01.zata.ai/devstoragev1/public/core/searchwhite.svg',
        coins: 'https://idr01.zata.ai/devstoragev1/public/core/coinswhite.svg',
        profile: 'https://idr01.zata.ai/devstoragev1/public/core/person.svg'
    },

    // Workflow images
    workflow: {
        designing: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fworkflow%2Fdeisgning.jpg?alt=media&token=9d92ceb5-dbfe-4abc-8218-f4e1a7c0040c',
        filmMaking: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fworkflow%2Ffilm%20making.jpg?alt=media&token=7d912929-3afe-4541-9db2-7056bedee05a',
        printing: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fworkflow%2Fprinting.jpg?alt=media&token=9fe8da8f-a149-4729-aeff-59e8a983a6c6',
        branding: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fworkflow%2Fbranding.jpg?alt=media&token=5e897f52-dfc0-48f2-963c-bf588e99dd7f',
        contentCreation: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fworkflow%2Fcontent%20creation.jpg?alt=media&token=da971075-1380-48ce-8954-5ef194ec3e73',
        artDirection: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fworkflow%2Fart%20direction.jpg?alt=media&token=63f4b18d-0e97-41c0-b4a5-aad2fe4f0e9f',
        marketing: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fworkflow%2Fmarketing.jpg?alt=media&token=b7913e44-e7d9-45f8-88f8-595a80f8b1d3',
        photography: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fworkflow%2Fphotography.jpg?alt=media&token=20fb8b4c-e9c5-47d1-844f-b9f4c52fd415'
    },

    // Community creations images
    communityCreations: {
        creation1: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F05.png?alt=media&token=7792178d-b3ff-4f71-ba98-3d50e8077e13',
        creation2: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F08.png?alt=media&token=a9e28726-31c6-4d86-90a7-eb7bc0b3a191',
        creation3: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F10.png?alt=media&token=d21ea473-8a0d-4409-b219-2ecfc4a788e6',
        creation4: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F01.png?alt=media&token=9a3ccb9c-37cf-42be-b947-6c16e95e6df8',
        creation5: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F04.png?alt=media&token=25444d08-1fc0-45c2-a58d-d73580ea1d95',
        creation6: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex15.png?alt=media&token=64e4d18e-3bb0-471d-839b-656ce06ab0c0',
        creation7: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex13.png?alt=media&token=d8392b12-de19-471b-8902-d1a8e72d3b8f',
        creation8: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F07.png?alt=media&token=f37dc21e-6431-47a5-bec2-87c2cd46452b',
        creation9: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F14.png?alt=media&token=b51529aa-8b95-409e-a2d9-bb74912ae40e'
    },

    // Recent creations images
    recentCreations: {
        recent1: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex10.png?alt=media&token=8cd9bec9-ad65-4807-8189-e60dcc4eb441',
        recent2: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex4.png?alt=media&token=8c83af98-29a4-44f7-8135-da8aed0ec78d',
        recent3: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex12.png?alt=media&token=65c055c1-d812-40c5-b85e-7e50103f6672',
        recent4: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex5.png?alt=media&token=4db2267-b1f2-4a80-b900-d6631c08378c',
        recent5: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fimg3.png?alt=media&token=01bc4c52-e552-4a93-8f6c-8e62fdf11930'
    },

    // How to use guide videos
    howToUse: {
        brandLaunch: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/homepageimageshimanshu%2FAnimated%20Brand%20Launch%20Billboard%20Video.mp4?alt=media&token=67d96203-d3b3-4c8d-a8ab-a05e338ac1cf',
        mountainLandscape: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/homepageimageshimanshu%2FMountain%20Landscape%20Transformation%20Video.mp4?alt=media&token=3a31842b-0f74-4685-a243-f41e6d4b5c67',
        realTimeCanvas: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/how%20to%20use%20guide%2FA_picture_of_202508291421.mp4?alt=media&token=8254db96-11de-4c19-a234-cb08c2eccb5e',
        sceneSetup: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/homepageimageshimanshu%2FScene%20Setup%20Pov%20202508291428.mp4?alt=media&token=523fc3c7-bf14-4824-9260-7801ed1afc1e',
        showcaseDemo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/how%20to%20use%20guide%2FScene_setup_a_202508291433.mp4?alt=media&token=f2bf0bc2-7a10-44bc-a762-e9a259d073c6'
    },

    // Header video
    header: {
        heroVideo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/homepageimageshimanshu%2FKLING_Ultra_Real_Text_to_Video_Model%20(1).mp4?alt=media&token=e1312e5a-cdf5-4df2-8f4f-1c0bc5195382',
        heroVideo2: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/homepageimageshimanshu%2F20251008_0132_New%20Video_simple_compose_01k71f5qnke1wvf4xz99y098ws.mp4?alt=media&token=04748dd2-ee1a-4515-b85c-d51d84c111b7',
        heroVideo3: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/homepageimageshimanshu%2FVeo_Cinematic_Intelligence_Reimagined.mp4?alt=media&token=f04a1a44-4290-47b9-822f-ca62bcffbd45',
    },

    // Pricing section
    pricing: {
        balloonPlane: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fpricing%2F20250829_1658_Balloon%20Plane%20in%20Sky_remix_01k3ts72pyf3vrzfpp48y7yy5q%20(1).png?alt=media&token=c7c7464e-b808-405b-8929-c9a1235054ed'
    },
    icons: {
        home: 'https://idr01.zata.ai/devstoragev1/public/icons/Homewhite.svg',
        imageGeneration: 'https://idr01.zata.ai/devstoragev1/public/icons/imagegeneration.svg',
        videoGeneration: 'https://idr01.zata.ai/devstoragev1/public/icons/videoGenerationiconwhite.svg',
        videoEdit: 'https://idr01.zata.ai/devstoragev1/public/icons/gear-video%20dark.svg',
        musicGeneration: 'https://idr01.zata.ai/devstoragev1/public/icons/musicgenerationwhite.svg',
        canvas: 'https://idr01.zata.ai/devstoragev1/public/core/ws_solid.svg',
        brandingKit: 'https://idr01.zata.ai/devstoragev1/public/icons/brandingkitwhite.svg',
        templates: 'https://idr01.zata.ai/devstoragev1/public/icons/templateswhite.svg',
        pricing: 'https://idr01.zata.ai/devstoragev1/public/icons/pricingwhite.svg',
        history: 'https://idr01.zata.ai/devstoragev1/public/icons/historywhite.svg',
        bookmarks: 'https://idr01.zata.ai/devstoragev1/public/icons/Bookmarkwhite.svg',
        search: 'https://idr01.zata.ai/devstoragev1/public/icons/searchwhite.svg',
        coins: 'https://idr01.zata.ai/devstoragev1/public/icons/coinswhite.svg',
        profile: 'https://idr01.zata.ai/devstoragev1/public/icons/person.svg',
        editImage: 'https://idr01.zata.ai/devstoragev1/public/icons/edit_image.svg',
        wildmindskit: 'https://idr01.zata.ai/devstoragev1/public/icons/yy666.avif',
        artStation: 'https://idr01.zata.ai/devstoragev1/public/icons/artstation.svg'
    },

    // Home page images
    home: {
        banner: 'https://idr01.zata.ai/devstoragev1/public/core/banner-1.jpg'
    }
};

// Helper function to get image URL by folder and name
export const getImageUrl = (folder: string, imageName: string): string => {
    const folderImages = imageRoutes[folder];
    if (!folderImages) {
        console.warn(`Folder not found: ${folder}`);
        return '';
    }

    const url = folderImages[imageName];
    if (!url) {
        console.warn(`Image route not found for name: ${imageName} in folder: ${folder}`);
        return '';
    }
    return url;
};

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';