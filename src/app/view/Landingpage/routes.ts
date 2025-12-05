interface ImageRoute {
    [key: string]: string;
}

interface FolderImageRoutes {
    [folderName: string]: ImageRoute;
}

export const imageRoutes: FolderImageRoutes = {
    // Core icons and logos
    core: {
        logo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/core%2FAsset%203wildmind%20logo%20text.svg?alt=media',
        coins: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fsetting%2Fcoins.png?alt=media',
        diamond: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fsetting%2Fdiamond.png?alt=media',
        profile: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fsetting%2Fprofile.png?alt=media',
        google: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fcore%2Fgoogle.svg?alt=media',
        apple: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fcore%2Fapple.svg?alt=media',
        microsoft: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fcore%2Fmicrosoft.svg?alt=media',
        arrowup: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/core%2Farrowup.svg?alt=media',
        arrowdown: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/core%2Farrowdown.svg?alt=media'
    },

    // Landing page images
    landingpage: {
        discordimage: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fdiscordview%2Fdc_view.gif?alt=media',
        discorddark: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fdiscordview%2Fdiscorddark.svg?alt=media',
        discord: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fdiscordview%2Fdiscord.svg?alt=media',
        usingai: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Faiview%2Faiview.png?alt=media',
        horizonalimage: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fhorizontal%20scroll%2Frollingimages.png?alt=media',
        saying1: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fsayings%2Fsvg1.svg?alt=media',
        saying2: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fsayings%2Fsvg2.svg?alt=media',
        saying3: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fsayings%2Fsophia.png?alt=media',
        realtimegen: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fcommingsoon%2Frealtime-canvas.gif?alt=media',
        sketchtoimage: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fcommingsoon%2FSketchtoimage.png?alt=media',
        texttovideo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fcommingsoon%2Frealtime-canvas.gif?alt=media',
        texttod: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fcommingsoon%2Frealtime-canvas.gif?alt=media'
    },

    // Contact us images
    contactus: {
        bg_rating: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fcontactus%2Fbg_rating7.png?alt=media',
        rateicon: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fcontactus%2Frateicon.png?alt=media'
    },

    // Sign in/up images
    sign: {
        signup: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fsignin%2Fstableturbo-1742556691988.png?alt=media'
    },

    // Art station images
    artstation: {
        burger: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fartstation%2FCard.png?alt=media',
        dogs: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fartstation%2FCard1.png?alt=media',
        dogs2: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fartstation%2FCard2.png?alt=media',
        remix: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fartstation%2Fremix.png?alt=media',
        remix2: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fartstation%2Fremix1.png?alt=media'
    },

    // Home page images
    home: {
        fluxshanell: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fhome%2Fshanell.png?alt=media',
        fluxdev: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fhome%2Fdev.png?alt=media',
        imagin: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fhome%2Fimagin.png?alt=media',
        large: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fhome%2Flarge.png?alt=media',
        medium: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fhome%2Fmedium.png?alt=media',
        xl: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fhome%2Fxl.png?alt=media'
    },

    // Art gallery images
    artgallery: {
        img1: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fimg1.png?alt=media',
        img2: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fimg2.png?alt=media',
        img3: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fimg3.png?alt=media',
        ex1: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex1.png?alt=media',
        ex2: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex2.png?alt=media',
        ex3: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex3.png?alt=media',
        ex4: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex4.png?alt=media',
        ex5: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex5.png?alt=media',
        ex6: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex6.png?alt=media',
        ex7: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex7.png?alt=media',
        ex8: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex8.png?alt=media',
        ex9: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex9.png?alt=media',
        ex10: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex10.png?alt=media',
        ex11: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex11.png?alt=media',
        ex12: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex12.png?alt=media',
        ex13: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex13.png?alt=media',
        ex14: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex14.png?alt=media',
        ex15: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex15.png?alt=media'
    },

    // AI models images
    aimodels: {
        kling: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Faimodels%2Fkling.png?alt=media',
        veo3: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Faimodels%2Fveo3.png?alt=media',
        krea: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Faimodels%2Fkrea.png?alt=media',
        runway: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Faimodels%2Frunway.png?alt=media'
    },

    // Features images
    features: {
        textToImage: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Ftext-to-image.jpg?alt=media',
        imageToImage: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fimage-to-image.jpg?alt=media',
        sticker: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fsticker.jpg?alt=media',
        characterGen: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fcharacter-gen.jpg?alt=media',
        characterSwap: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fchatracter-swap.jpg?alt=media',
        inpaint: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fin-paint.jpg?alt=media',
        livePortrait: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Flive-portrtait.jpg?alt=media',
        facialExp: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Ffacial-expe.jpg?alt=media',
        backgroundRemo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fbackground-remo.jpg?alt=media',
        logoGeneration: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Flogo-generation.jpg?alt=media',
        productDisplay: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fprouct-display.jpg?alt=media',
        mockup: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fmockup.jpg?alt=media',
        productWithModels: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2FProduct-with-Models.jpg?alt=media',
        textToVideo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fimage-to-video.jpg?alt=media',
        imageToVideo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fimage-to-video.jpg?alt=media',
        faceSwap: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fface-swap.jpg?alt=media',
        characterSwapVideo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fchatracter-swap.jpg?alt=media',
        vfx: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fvfx.jpg?alt=media',
        videoEnhancement: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fvideo-enhancement.jpg?alt=media',
        textToMusic: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Ftext-to-music.jpg?alt=media',
        audioToMusic: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Faudio-to-music.jpg?alt=media',
        lyricsToMusic: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Flyrics-to-music.jpg?alt=media',
        storyboard: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fstoryboard.jpg?alt=media',
        filmGeneration: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Ffilm-generation.jpg?alt=media',
        textTo3d: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Ftext-to-3d.jpg?alt=media',
        imageTo3d: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Ftextto3d.jpg?alt=media',
        comicGeneration: "https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fcomic-generation.jpg?alt=media",
        imageUpscale: "https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fimage-upscale.jpg?alt=media"
    },

    // Workflow images
    workflow: {
        designing: '/catagoryimages/designer.jpg',
        filmMaking: '/catagoryimages/film.jpg',
        printing: '/catagoryimages/printing.jpg',
        branding: '/catagoryimages/branding.jpg',
        contentCreation: '/catagoryimages/content.jpg',
        artDirection: '/catagoryimages/art.jpg',
        marketing: '/catagoryimages/marketing.jpg',
        photography: '/catagoryimages/photography.jpg'
    },

    // Feature category images
    featureCategory: {
        imageGen: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeaturescatagory%2Fimage-gen.jpg?alt=media',
        videoGen: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeaturescatagory%2Fvideo-generation.jpg?alt=media',
        brand: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeaturescatagory%2Fbrand.jpg?alt=media',
        audioGen: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeaturescatagory%2Faudio-g.jpg?alt=media',
        filming: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeaturescatagory%2Ffilming.jpg?alt=media',
        '3dGen': 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeaturescatagory%2F3d.jpg?alt=media'
    },

    // Hero parallax images
    heroParallax: {
        hero1: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F01.jpg?alt=media',
        hero3: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F03.jpg?alt=media',
        hero4: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F04.jpg?alt=media',
        hero5: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F05.jpg?alt=media',
        hero6: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F06.jpg?alt=media',
        hero7: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F08.jpg?alt=media',
        hero8: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F09.jpg?alt=media',
        hero9: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F10.jpg?alt=media',
        hero10: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F12.jpg?alt=media',
        hero11: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F11.jpg?alt=media',
        hero12: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F13.jpg?alt=media',
        hero13: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F14.jpg?alt=media',
        hero14: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2Fex12.jpg?alt=media',
        hero15: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2Fex2.jpg?alt=media',
        hero16: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2Fex3.jpg?alt=media'
    },

    // Subscribe images
    subscribe: {
        updates: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fsubscribe%2Fupdates.jpg?alt=media',
        promo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fsubscribe%2Fpromo.jpg?alt=media',
        news: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fsubscribe%2Fneswsl.jpg?alt=media'
    },

    // Pricing images
    pricing: {
        freePlan: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fpricing%2Ffree%20plan%20(1).jpg?alt=media',
        explorePlans: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fpricing%2Fexplore_plans%20(1).jpg?alt=media'
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