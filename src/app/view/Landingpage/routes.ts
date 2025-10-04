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
        textToImage: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Ftext-to-image.jpg?alt=media&token=c76fa518-01dd-4890-a805-815a50e30e74',
        imageToImage: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fimage-to-image.jpg?alt=media&token=cbfb426b-3f6c-4bd4-86b3-5e8629ab5d31',
        sticker: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fsticker.jpg?alt=media&token=9980efe3-042b-4bd1-8af8-2ea7383af5c8',
        characterGen: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fcharacter-gen.jpg?alt=media&token=b3a3ad1a-659d-449d-994f-70603a274b59',
        characterSwap: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fchatracter-swap.jpg?alt=media&token=98c0fb1c-35f9-42ac-898f-067868099f36',
        inpaint: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fin-paint.jpg?alt=media&token=b821106b-709b-46e0-881b-c6de4ba21bc7',
        livePortrait: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Flive-portrtait.jpg?alt=media&token=bca4942a-4da8-44c0-ae98-ada5be32defd',
        facialExp: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Ffacial-expe.jpg?alt=media&token=a50bc580-4159-4723-a346-eed73d3a902e',
        backgroundRemo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fbackground-remo.jpg?alt=media&token=2417465e-4d0b-45af-b717-a653a541c835',
        logoGeneration: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Flogo-generation.jpg?alt=media&token=8e6b7772-49ab-45ef-b635-a20895a8874a',
        productDisplay: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fprouct-display.jpg?alt=media&token=e0f622eb-99f7-45d4-8eae-813db23a5358',
        mockup: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fmockup.jpg?alt=media&token=ed5f3083-e811-4f4a-9e07-f5f86d000356',
        productWithModels: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2FProduct-with-Models.jpg?alt=media&token=3e498bdc-7504-4988-a747-b973d184f89c',
        textToVideo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fimage-to-video.jpg?alt=media&token=ee52ae15-2dc1-43b4-bbee-72aefb617869',
        imageToVideo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fimage-to-video.jpg?alt=media&token=ee52ae15-2dc1-43b4-bbee-72aefb617869',
        faceSwap: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fface-swap.jpg?alt=media&token=85944f49-2bb5-4274-b654-f0b874da141a',
        characterSwapVideo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fchatracter-swap.jpg?alt=media&token=98c0fb1c-35f9-42ac-898f-067868099f36',
        vfx: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fvfx.jpg?alt=media&token=fa4b549f-4f3d-4845-9811-dbe7d5b1c547',
        videoEnhancement: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fvideo-enhancement.jpg?alt=media&token=2d7a05e4-8ff1-4939-b047-2bb2b0157a6d',
        textToMusic: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Ftext-to-music.jpg?alt=media&token=e6b3fb10-b352-49b1-8561-e05bbd931130',
        audioToMusic: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Faudio-to-music.jpg?alt=media&token=a6fb8210-b064-4f09-997f-76ea87aeed51',
        lyricsToMusic: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Flyrics-to-music.jpg?alt=media&token=5e52271f-d351-4dfe-bc02-332023f1f94e',
        storyboard: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fstoryboard.jpg?alt=media&token=c8bd06c5-bc94-4207-b22d-2ef6e1a824c4',
        filmGeneration: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Ffilm-generation.jpg?alt=media&token=7e6ab8b4-e7d9-4edc-81bb-b11e4fa86d69',
        textTo3d: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Ftext-to-3d.jpg?alt=media&token=629f3384-89d4-4871-9e45-f6bb10a718e9',
        imageTo3d: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Ftextto3d.jpg?alt=media&token=aa35b907-6ae7-4b8e-895b-a98d1284a758',
        comicGeneration : "https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fcomic-generation.jpg?alt=media&token=8d6b0253-b6e9-4bbd-99d7-5d7716f8839a",
        imageUpscale : "https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeatures%2Fimage-upscale.jpg?alt=media&token=397a05e4-8e18-4f3e-8a3b-a8f46efbe6bf"
    },

    // Workflow images
    workflow: {
        designing: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fworkflow%2Fdeisgning.jpg?alt=media&token=82557ce3-f36f-4adf-9516-ab9dd67642b4',
        filmMaking: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fworkflow%2Ffilm-making.jpg?alt=media&token=727a3eb8-6160-4e7a-bb54-4cd6d6d264ce',
        printing: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fworkflow%2Fprinting.jpg?alt=media&token=a5ded5f2-6ee7-4c38-92e6-e62cd9a98049',
        branding: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fworkflow%2Fbranding.jpg?alt=media&token=3389f33c-62c7-4f70-935a-e2da758d6f39',
        contentCreation: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fworkflow%2Fcontent-creation.jpg?alt=media&token=c2acfb29-2e5a-4615-957e-6a0deebf9d7a',
        artDirection: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fworkflow%2Fart-direction.jpg?alt=media&token=cd98c85a-dadc-464b-bd50-f0ba9a44fadf',
        marketing: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fworkflow%2Fmarketing.jpg?alt=media&token=4be74f48-a856-45b1-bea9-db60b67d7b37',
        photography: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fworkflow%2Fphotography.jpg?alt=media&token=a83a6852-f4c4-43c5-81f3-ac78c6824f0d'
    },

    // Feature category images
    featureCategory: {
        imageGen: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeaturescatagory%2Fimage-gen.jpg?alt=media&token=d0acb4e2-f3b2-4cd3-9b7e-063ffe45e442',
        videoGen: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeaturescatagory%2Fvideo-generation.jpg?alt=media&token=1cab2391-4715-4440-9b5a-d0881320ace5',
        brand: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeaturescatagory%2Fbrand.jpg?alt=media&token=15e0580d-8cc3-450e-9336-bf09875ac3ae',
        audioGen: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeaturescatagory%2Faudio-g.jpg?alt=media&token=124f87dc-9cac-4fab-a692-c23bfe2daaba',
        filming: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeaturescatagory%2Ffilming.jpg?alt=media&token=e176aaba-6d0f-4b00-9445-bb34c80b7450',
        '3dGen': 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Ffeaturescatagory%2F3d.jpg?alt=media&token=e2daab08-687f-4b8d-b866-630f5b57f24f'
    },

    // Hero parallax images
    heroParallax: {
        hero1: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F01.jpg?alt=media&token=1bc68638-d1d8-48b7-9f91-99eb471e3101',
        hero3: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F03.jpg?alt=media&token=21108bdd-17ba-47f3-9063-0096f06a92b4',
        hero4: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F04.jpg?alt=media&token=effb0258-6e26-4765-ad7b-50d743f281e7',
        hero5: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F05.jpg?alt=media&token=dfd47617-166c-4d24-a511-80a9255b3b50',
        hero6: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F06.jpg?alt=media&token=8f46f11a-b300-44ac-9d5f-709211b9ef45',
        hero7: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F08.jpg?alt=media&token=3b844060-4bc5-43ee-b0fa-130fad0fd25a',
        hero8: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F09.jpg?alt=media&token=b6b65df7-046d-4ebf-b48f-c96415e1e181',
        hero9: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F10.jpg?alt=media&token=2c311119-52ff-4afb-8564-3157496e500f',
        hero10: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F12.jpg?alt=media&token=72af5765-3fd9-4666-ae49-59dbb93fc74b',
        hero11: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F11.jpg?alt=media&token=c24834b1-06d3-41cc-8852-e353eccca7f4',
        hero12: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F13.jpg?alt=media&token=c3c2219f-a601-4814-9543-b6b936204364',
        hero13: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2F14.jpg?alt=media&token=dafb6316-a996-4bc2-bdb2-d4395fccd30f',
        hero14: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2Fex12.jpg?alt=media&token=71b30242-8617-4437-8e59-b6b0a40ab589',
        hero15: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2Fex2.jpg?alt=media&token=f0ef5806-af7e-460c-b710-e28d9284ea55',
        hero16: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fherosection%2Fex3.jpg?alt=media&token=09f28b25-8635-4ce9-ba5b-1050118b496a'
    },

    // Subscribe images
    subscribe: {
        updates: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fsubscribe%2Fupdates.jpg?alt=media&token=2f973589-eeaa-446d-b1e1-e4ec9b0086d6',
        promo: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fsubscribe%2Fpromo.jpg?alt=media&token=c0b34a2f-9da2-4a5c-bd03-5227c07a0277',
        news: 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/landingpageimages%2Fsubscribe%2Fneswsl.jpg?alt=media&token=efe3c4b8-94b1-4472-a4aa-b66c160f6736'
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