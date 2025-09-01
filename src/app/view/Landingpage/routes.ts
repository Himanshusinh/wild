interface ImageRoute {
    [key: string]: string;
}

interface FolderImageRoutes {
    [folderName: string]: ImageRoute;
}   

export const imageRoutes: FolderImageRoutes = {
    // Core icons and logos
    core: {
        logo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/core%2FAsset%203wildmind%20logo%20text.svg?alt=media&token=c86daaa8-e085-498a-9037-b8b151c59b78',  
        coins: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fsetting%2Fcoins.png?alt=media&token=56e61d6d-8695-47ea-8e4d-952d2f8ff1ed',
        diamond: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fsetting%2Fdiamond.png?alt=media&token=4aad71ad-e181-4d8c-b2da-2de227d44336',
        profile: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fsetting%2Fprofile.png?alt=media&token=fb2b2e2c-944a-458e-a505-8ca414315d00',
        google: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fcore%2Fgoogle.svg?alt=media&token=5fb13362-b31d-4791-89d2-1a596d07ed17',
        apple: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fcore%2Fapple.svg?alt=media&token=c7fb97bb-0278-4b5d-9e86-a68977d0cb7d',
        microsoft: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fcore%2Fmicrosoft.svg?alt=media&token=88336993-efca-4fc2-89d4-338ba028a6f5',
        arrowup: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/core%2Farrowup.svg?alt=media&token=bad88f57-b83a-4186-a586-06a487f2a5d8',
        arrowdown: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/core%2Farrowdown.svg?alt=media&token=0823be44-ab26-44b9-a1e3-d15d8ef08531'
    },

    // Landing page images
    landingpage: {
        discordimage: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fdiscordview%2Fdc_view.gif?alt=media&token=8de2b2b8-3624-4c11-851a-d9e0e3cb76f4',
        discorddark: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fdiscordview%2Fdiscorddark.svg?alt=media&token=213ad347-59a1-41af-84a4-2ee6f3bacba8',
        discord: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fdiscordview%2Fdiscord.svg?alt=media&token=0b154550-809a-409f-83ee-5c89b827c716',
        usingai: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Faiview%2Faiview.png?alt=media&token=85921e13-e1d1-4587-a14c-688c7c8becc5',
        horizonalimage: "https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fhorizontal%20scroll%2Frollingimages.png?alt=media&token=5075ca4-ffe7-4c1e-b17d-c50389b0c349",
        saying1: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fsayings%2Fsvg1.svg?alt=media&token=813178f5-1f08-40ae-9b07-600ffc09d9df',
        saying2: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fsayings%2Fsvg2.svg?alt=media&token=f7637342-a38c-4374-9c8-7d1d40323321',
        saying3: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fsayings%2Fsophia.png?alt=media&token=580c3b8-de8f-4cab-b1b5-d4d734e2fbfe',
        realtimegen: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fcommingsoon%2Frealtime-canvas.gif?alt=media&token=96f5c800-b103-4b5b-abe1-5b828a31aac4',
        sketchtoimage: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fcommingsoon%2FSketchtoimage.png?alt=media&token=990cf810-7e60-4939-bbaf-6cdfaa7e01c1',
        texttovideo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fcommingsoon%2Frealtime-canvas.gif?alt=media&token=96f5c800-b103-4b5b-abe1-5b828a31aac4',
        texttod: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Flandingpage%2Fcommingsoon%2Frealtime-canvas.gif?alt=media&token=96f5c800-b103-4b5b-abe1-5b828a31aac4'
    },

    // Contact us images
    contactus: {
        bg_rating: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fcontactus%2Fbg_rating7.png?alt=media&token=dd5616e9-274a-4039-af4e-f69378d2d1f1',
        rateicon: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fcontactus%2Frateicon.png?alt=media&token=b6e24a27-e2c5-4768-a8bb-87ce6954b242'
    },
    
    // Sign in/up images
    sign: {
        signup: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fsignin%2Fstableturbo-1742556691988.png?alt=media&token=603728fa-ea51-4965-82ea-b7e3bbc16dc8'
    },

    // Art station images
    artstation: {
        burger: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fartstation%2FCard.png?alt=media&token=382040fa-3157-492f-8df7-4dbec4135f7e',
        dogs: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fartstation%2FCard1.png?alt=media&token=864f8a42-b191-4d29-ba64-2f7e7dc619a8',
        dogs2: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fartstation%2FCard2.png?alt=media&token=7d55bfa9-e8cf-403c-a1fe-844a22ff873f',
        remix: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fartstation%2Fremix.png?alt=media&token=0012f641-49e1-4187-9a5f-de499465e1ee',
        remix2: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fartstation%2Fremix1.png?alt=media&token=08a34931-9e9b-40d8-baf0-7d2c0ce22b90'
    },

    // Home page images
    home: {
        fluxshanell: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fhome%2Fshanell.png?alt=media&token=575796b0-209b-4975-b3b8-55f0a9673ee4',
        fluxdev: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fhome%2Fdev.png?alt=media&token=ef4c4d1-9ee0-43f6-81b1-19a64b84d211',
        imagin: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fhome%2Fimagin.png?alt=media&token=477b2629-3cc7-4a3b-8a61-379f3032a970',
        large: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fhome%2Flarge.png?alt=media&token=4cf1814-35b6-40bd-9c18-16a5657bdfaf',
        medium: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fhome%2Fmedium.png?alt=media&token=0974c5d4-a7b1-44d0-88ee-3439c28f59ef',
        xl: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/public%2Fhome%2Fxl.png?alt=media&token=4c14f209-cdfe-4ab5-91f1-9a12c9131685'
    },

    // Art gallery images
    artgallery: {
        img1: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fimg1.png?alt=media&token=636b6993-8838-417a-b40b-9a109675a848',
        img2: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fimg2.png?alt=media&token=507a37f0-ef55-4867-ab1f-79b92cb2d2d5',
        img3: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fimg3.png?alt=media&token=01bc4c52-e552-4a93-8f6c-8e62fdf11930',
        ex1: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex1.png?alt=media&token=def5ff0e-f95d-4622-9987-38b92b4f2982',
        ex2: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex2.png?alt=media&token=ff63ea0e-6335-4b41-87cf-738636039ecb',
        ex3: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex3.png?alt=media&token=f198a71f-2319-4b79-9dcd-d7355161032a',
        ex4: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex4.png?alt=media&token=8c83af98-29a4-44f7-8135-da8aed0ec78d',
        ex5: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex5.png?alt=media&token=4db2267-b1f2-4a80-b900-d6631c08378c',
        ex6: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex6.png?alt=media&token=9ffa68a0-a392-4ced-a154-761a8046df86',
        ex7: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex7.png?alt=media&token=bc1a7a8f-ebe0-4fd6-9a75-3d0f07414e27',
        ex8: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex8.png?alt=media&token=68dad024-f582-4e6a-9b8a-92f70188252f',
        ex9: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex9.png?alt=media&token=fd980978-cbb2-4039-8b02-307d028635d5',
        ex10: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex10.png?alt=media&token=8cd9bec9-ad65-4807-8189-e60dcc4eb441',
        ex11: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex11.png?alt=media&token=85a8bb76-f450-4db8-9df3-6f4b4eb75166',
        ex12: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex12.png?alt=media&token=65c055c1-d812-40c5-b85e-7e50103f6672',
        ex13: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex13.png?alt=media&token=d8392b12-de19-471b-8902-d1a8e72d3b8f',
        ex14: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex14.png?alt=media&token=230af79c-da11-4eec-b143-b444aaa6c266',
        ex15: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fartgallery%2Fex15.png?alt=media&token=64e4d18e-3bb0-471d-839b-656ce06ab0c0'
    },

    // AI models images
    aimodels: {
        kling: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Faimodels%2Fkling.png?alt=media&token=0c1fe920-b40e-4ffa-87b2-66f8ab5d920d',
        veo3: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Faimodels%2Fveo3.png?alt=media&token=39cc736e-f7dc-4aff-8664-9d597288acd3',
        krea: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Faimodels%2Fkrea.png?alt=media&token=2210d1da-35c7-46af-9ccf-26e6ac461806',
        runway: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Faimodels%2Frunway.png?alt=media&token=0d14df31-614a-41c8-8d67-2f84b8f693ce'
    },

    // Features images
    features: {
        textToImage: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Ftext%20to%20image.png?alt=media&token=c4d520f4-9634-4337-a12d-f1c7be8c98dc',
        imageToImage: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Fimage%20to%20image.png?alt=media&token=0e50eeb8-768a-4b87-bb0f-38b9e05aad0b',
        sticker: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Fsticker.png?alt=media&token=8486b4d6-5f0e-4ffc-a7bb-f5883c5835dd',
        characterGen: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Fcharacter%20gen.png?alt=media&token=22643ce1-885a-4625-8655-d608e1fcd228',
        characterSwap: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Fchatracter%20swap.png?alt=media&token=18a0cdb6-09a5-4ed7-a2d4-4d49fcb844fa',
        inpaint: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Fin%20paint.png?alt=media&token=97d8fd17-252a-4edf-9945-8dec84615838',
        livePortrait: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Flive%20portrtait.png?alt=media&token=d2f96342-4466-4309-bfcc-e55f6e438d82',
        facialExp: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Ffacial%20expe.png?alt=media&token=9f512ef5-ba55-4d51-aeb5-b66ee2e9728c',
        imageUpscale: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Fimage%20upscale.png?alt=media&token=6f225b2d-5f49-419e-a2f0-493dd27af9ca',
        backgroundRemo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Fbackground%20remo.png?alt=media&token=da167d22-ca8e-4c90-a990-2fefb1394edb',
        logoGeneration: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Flogo%20generation.png?alt=media&token=b502d6b3-0522-487d-84b2-748bf2e8ced1',
        productDisplay: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Fprouct%20display.png?alt=media&token=af61604f-415a-4fff-bcd5-ccf6dab64d2c',
        mockup: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Fmockup.png?alt=media&token=308c6101-51e6-4f23-be23-a3025bd9b545',
        productWithModels: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2FProduct%20with%20Models.png?alt=media&token=8c34d7fe-5cc1-4df8-be18-01acd0238c9f',
        textToVideo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Ftext%20to%20video.png?alt=media&token=c6f16395-285d-4c42-89bd-7dd745fab145',
        imageToVideo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Fimage%20to%20video.png?alt=media&token=85fbb1f5-eafc-455f-ad2e-c93e278ed356',
        faceSwap: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Fface%20swap.png?alt=media&token=6c560f62-7921-477f-a579-f500aad3f972',
        characterSwapVideo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Fcharcater%20swap.png?alt=media&token=77ad1588-b999-4cd3-8aca-3caf0e74bf48',
        vfx: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Fvfx.png?alt=media&token=d41d05a7-eda1-4ce2-a776-389cace09742',
        videoEnhancement: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Fvideo%20enhancement.png?alt=media&token=bc376eed-5163-44f2-83b7-e853f9d9cea9',
        textToMusic: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Ftext%20to%20music.png?alt=media&token=518a37b2-38ee-4e22-8b98-09e20db0a064',
        audioToMusic: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Faudio%20to%20music.png?alt=media&token=fa6b39e2-2efb-4c79-b17e-cf828232a92b',
        lyricsToMusic: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Flyrics%20to%20music.png?alt=media&token=c8933ad7-5ee5-4383-8b4b-a8e8c7ca1bca',
        storyboard: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Fstoryboard.png?alt=media&token=470a35e1-cb15-4772-b57c-48c5b36746a2',
        filmGeneration: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Ffilm%20generation.png?alt=media&token=fc605be6-7659-4da1-8221-89ad63f6f47f',
        comicGeneration: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Fcomic%20generation.png?alt=media&token=a11dd9e5-c0de-4f13-954c-7367eadb2ea1',
        textTo3d: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Ftextto3d.png?alt=media&token=0d574ba4-b404-4a96-b692-88441f1cdcd9',
        imageTo3d: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeatures%2Ftext%20to%203d.png?alt=media&token=1247f7f9-9d3d-45aa-9626-03e9e69cbf7f'
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

    // Feature category images
    featureCategory: {
        imageGen: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeaturecategory%2Fimage%20gen.png?alt=media&token=e690e65c-d54b-4817-bb0b-bcbc9d4f6b38',
        videoGen: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeaturecategory%2Fvideo%20generation.png?alt=media&token=456dc491-4d65-4044-a364-3694253ae881',
        brand: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeaturecategory%2Fbrand.png?alt=media&token=2104ccbb-b578-43f6-b1a2-a8cc61926e17',
        audioGen: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeaturecategory%2Faudio%20g.png?alt=media&token=6b529a2d-fe57-446b-9e66-994485713223',
        filming: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeaturecategory%2Ffilming.png?alt=media&token=0156cb3b-a83b-4b8f-a7a0-de3bdccea5bd',
        '3dGen': 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Ffeaturecategory%2F3d.png?alt=media&token=efe1a021-586e-405c-9446-9f1d5626d39e'
    },

    // Hero parallax images
    heroParallax: {
        hero1: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F01.png?alt=media&token=9a3ccb9c-37cf-42be-b947-6c16e95e6df8',
        hero3: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F03.png?alt=media&token=41df1532-6218-4f46-ba71-f45b78a0d9b5',
        hero4: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F04.png?alt=media&token=25444d08-1fc0-45c2-a58d-d73580ea1d95',
        hero5: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F05.png?alt=media&token=7792178d-b3ff-4f71-ba98-3d50e8077e13',
        hero6: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F06.png?alt=media&token=45000860-9659-4753-89dd-c96df02ebb37',
        hero7: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F07.png?alt=media&token=f37dc21e-6431-47a5-bec2-87c2cd46452b',
        hero8: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F08.png?alt=media&token=a9e28726-31c6-4d86-90a7-eb7bc0b3a191',
        hero9: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F09.png?alt=media&token=983036fc-929b-4dc5-8ba8-b7aa3abcdcf2',
        hero10: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F10.png?alt=media&token=d21ea473-8a0d-4409-b219-2ecfc4a788e6',
        hero11: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F11.png?alt=media&token=a146137c-7424-4646-bd85-e962a1fac153',
        hero12: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F12.png?alt=media&token=9110eb32-a0dd-4dcb-9e9b-437e12e3fe9b',
        hero13: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F13.png?alt=media&token=f71f2ac6-bd1f-4c78-bc8c-30b8a781f546',
        hero14: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F14.png?alt=media&token=b51529aa-8b95-409e-a2d9-bb74912ae40e',
        hero15: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F15.png?alt=media&token=792aa4a8-576e-4827-9e36-824caaf6556b',
        hero16: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fheroparallax%2F16.png?alt=media&token=b4aaff1a-2d1a-48ad-9890-6e9268f469f0'
    },

    // Subscribe images
    subscribe: {
        updates: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fsubscribe%2Fupdates.png?alt=media&token=1621cc22-2e80-4a0e-8975-d738310a5471',
        promo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fsubscribe%2Fpromo.png?alt=media&token=8497d01d-85c4-48ca-8c30-27da9e1d4fbd',
        news: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fsubscribe%2Fneswsl.png?alt=media&token=57d0ddeb-6c33-487a-a69e-9eb4c3ab00bf'
    },

    // Pricing images
    pricing: {
        freePlan: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fpricing%2Ffree%20plan%20(1).jpg?alt=media&token=24ca1409-6f04-45d5-a9c4-f891a7f6fcc6',
        explorePlans: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fpricing%2Fexplore_plans%20(1).jpg?alt=media&token=9c03c318-b7c3-4326-b53f-7310e70815bc'
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