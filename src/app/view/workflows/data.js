export const CATEGORIES = ["All", "General", "Fun", "Viral Trend", "Architecture", "Photography", "Fashion", "Virtual Tryon", "Social Media", "Film Industry", "Branding"];

export const WORKFLOWS_DATA = [
  {
    "id": "creatively-upscale",
    "title": "Creatively Upscale",
    "category": "General",
    "description": "Creatively upscale the image. Ensure that all details are crisp and in high quality, Muted color.",
    "model": "Seadream4/ Nano Banana",
    "thumbnail": "/workflow-samples/creatively-upscale-before.png",
    "sampleBefore": "/workflow-samples/creatively-upscale-before.png",
    "sampleAfter": "/workflow-samples/creatively-upscale-after.png"
  },
  {
    "id": "remove-background",
    "title": "Remove Background",
    "category": "General",
    "description": "Clean background removal with high precision studio quality output.",
    "model": "Seadream4/ Nano Banana",
    "thumbnail": "/remove-bg-horse-before.jpg",
    "sampleBefore": "/remove-bg-horse-before.jpg",
    "sampleAfter": "/remove-bg-horse-after.jpg"
  },
  {
    "id": "restore-old-photo",
    "title": "Restore Old Photo",
    "category": "General",
    "description": "Restore and colorize this image, remove any scratches or imperfections.",
    "model": "Seadream4/ Nano Banana",
    "thumbnail": "/portrait-before.jpg",
    "sampleBefore": "/portrait-before.jpg",
    "sampleAfter": "/portrait-after.jpg"
  },
  {
    "id": "photo-to-line-drawing",
    "title": "Photo to Line Drawing",
    "category": "General",
    "description": "Turn this image into a simple coloring book line drawing, black and white.",
    "model": "Seadream4/ Nano Banana",
    "thumbnail": "/photo-to-line-before.jpg",
    "sampleBefore": "/photo-to-line-before.jpg",
    "sampleAfter": "/photo-to-line-after.jpg"
  },
  {
    "id": "line-drawing-to-photo",
    "title": "Line Drawing to Photo",
    "category": "General",
    "description": "Make it look like the image has been color in with crayons. Realistic results from markers/sketches.",
    "model": "Seadream4/ Nano Banana",
    "thumbnail": "/line-to-photo-before.jpg",
    "sampleBefore": "/line-to-photo-before.jpg",
    "sampleAfter": "/line-to-photo-after.jpg"
  },
  {
    "id": "remove-element",
    "title": "Remove Element from Image",
    "category": "General",
    "description": "Remove unwanted objects or persons from your Image seamlessly.",
    "model": "Seadream4/ Nano Banana",
    "thumbnail": "/remove-element-before.jpg",
    "sampleBefore": "/remove-element-before.jpg",
    "sampleAfter": "/remove-element-after.jpg"
  },
  {
    "id": "replace-element",
    "title": "Replace Element",
    "category": "General",
    "description": "Replace element from image 1 to image 2 using detailed prompts.",
    "model": "AI Transform",
    "thumbnail": "/replace-element-before.jpg",
    "sampleBefore": "/replace-element-before.jpg",
    "sampleAfter": "/replace-element-after.jpg"
  },
  {
    "id": "remove-watermark",
    "title": "Remove Watermark",
    "category": "General",
    "description": "Remove watermark from reference image while maintaining quality.",
    "model": "Nano Banana",
    "thumbnail": "/remove-watermark-before.jpg",
    "sampleBefore": "/remove-watermark-before.jpg",
    "sampleAfter": "/remove-watermark-after.jpg"
  },
  {
    "id": "surprise-me",
    "title": "Surprise Me",
    "category": "Fun",
    "description": "100,000 prompts ready to inspire your next creative masterpiece.",
    "model": "AI Prompt Engine",
    "thumbnail": "/workflow-samples/surpriseme-before.jpg",
    "sampleBefore": "/workflow-samples/surpriseme-before.jpg",
    "sampleAfter": "/workflow-samples/surpriseme-after.jpg"
  },
  {
    "id": "people-age",
    "title": "People Age",
    "category": "Fun",
    "description": "Make her/him look old with grey hair and wrinkles, or travel back to being a toddler or teenager.",
    "model": "Seadream4",
    "thumbnail": "/workflow-samples/people-age-before.png",
    "sampleBefore": "/workflow-samples/people-age-before.png",
    "sampleAfter": "/workflow-samples/people-age-after.png",
    "imageFit": "object-cover",
    "imagePosition": "object-top"
  },
  {
    "id": "become-celebrity",
    "title": "Become a Celebrity",
    "category": "Fun",
    "description": "Ultra realistic candid photo in a crowded place with fans and cameras, giving a true celebrity vibe.",
    "model": "Seadream4/ Nano Banana/ Qwen",
    "thumbnail": "/workflow-samples/become-celebrity-before.jpg",
    "sampleBefore": "/workflow-samples/become-celebrity-before.jpg",
    "sampleAfter": "/workflow-samples/become-celebrity-after.jpg"
  },
  {
    "id": "polaroid-style",
    "title": "Polaroid style Images",
    "category": "Fun",
    "description": "Retro flash photography with silly props and poses on a classic white curtain background.",
    "model": "Seadream4/ Nano Banana/ Qwen",
    "thumbnail": "/workflow-samples/polaroid-style-before.jpg",
    "sampleBefore": "/workflow-samples/polaroid-style-before.jpg",
    "sampleAfter": "/workflow-samples/polaroid-style-after.jpg"
  },
  {
    "id": "custom-stickers",
    "title": "Create custom stickers",
    "category": "Fun",
    "description": "Create a collection of cute chibi illustration stickers and see them as mockups on notebooks or laptops.",
    "model": "Seadream4/ Nano Banana/ Qwen",
    "thumbnail": "/workflow-samples/custom-stickers-before.jpg",
    "sampleBefore": "/workflow-samples/custom-stickers-before.jpg",
    "sampleAfter": "/workflow-samples/custom-stickers-after.jpg",
    "imageFit": "object-contain",
    "imagePosition": "object-top"
  },
  {
    "id": "fusion-styles",
    "title": "Fusion of Styles",
    "category": "Fun",
    "description": "Blend 2D characters or animals seamlessly into realistic backgrounds.",
    "model": "Seadream4/ Nano Banana/ Qwen",
    "thumbnail": "/workflow-samples/fusion-styles-before.jpg",
    "sampleBefore": "/workflow-samples/fusion-styles-before.jpg",
    "sampleAfter": "/workflow-samples/fusion-styles-after.jpg",
    "imageFit": "object-cover",
    "imagePosition": "object-top"
  },
  {
    "id": "vintage-teleport",
    "title": "Vintage Image / Teleport yourself",
    "category": "Fun",
    "description": "Teleport yourself to the late 1800s with period clothing, sepia tones, and worn textures.",
    "model": "Seadream4/ Nano Banana/ Qwen",
    "thumbnail": "/workflow-samples/vintage-teleport-before.png",
    "sampleBefore": "/workflow-samples/vintage-teleport-before.png",
    "sampleAfter": "/workflow-samples/vintage-teleport-after.jpg",
    "imageFit": "object-cover",
    "imagePosition": "object-top"
  },
  {
    "id": "cctv-footage",
    "title": "CCTV footage",
    "category": "Fun",
    "description": "Generate photorealistic low-quality CCTV footage with timestamps and ceiling-mounted perspectives.",
    "model": "Seadream4/ Nano Banana/ Qwen",
    "thumbnail": "/workflow-samples/cctv-footage-before.jpg",
    "sampleBefore": "/workflow-samples/cctv-footage-before.jpg",
    "sampleAfter": "/workflow-samples/cctv-footage-after.png",
    "imageFit": "object-cover",
    "imagePosition": "object-top"
  },
  {
    "id": "change-seasons",
    "title": "Change the Seasons",
    "category": "Fun",
    "description": "Transform any landscape from Summer to Winter, Spring, or Autumn instantly.",
    "model": "Weather AI",
    "thumbnail": "/workflow-samples/change-seasons-before.jpg",
    "sampleBefore": "/workflow-samples/change-seasons-before.jpg",
    "sampleAfter": "/workflow-samples/change-seasons-after.jpg",
    "imageFit": "object-cover",
    "imagePosition": "object-center"
  },
  {
    "id": "relighting",
    "title": "Relighting / Change the lighting",
    "category": "Fun",
    "description": "Change the lighting of any scene to Night, Golden Hour, or custom studio presets.",
    "model": "Seadream4/ Nano Banana/ Qwen",
    "thumbnail": "/workflow-samples/relighting-before.jpg",
    "sampleBefore": "/workflow-samples/relighting-before.jpg",
    "sampleAfter": "/workflow-samples/relighting-after.jpg",
    "imageFit": "object-cover",
    "imagePosition": "object-center"
  },

  {
    "id": "selfie-video",
    "title": "Selfie Video",
    "category": "Viral Trend",
    "description": "Step 1: Full body shot. Step 2: Realistic product-style sculpted character figurine with toy packaging mockups.",
    "model": "Seadream4/ Nano Banana",
    "thumbnail": "https://images.unsplash.com/photo-1558855430-6601ad06002c?q=80&w=800&auto=format&fit=crop",
    "sampleBefore": "https://images.unsplash.com/photo-1558855430-6601ad06002c?q=80&w=400&auto=format&fit=crop",
    "sampleAfter": "https://images.unsplash.com/photo-1558855430-6601ad06002c?q=80&w=800&auto=format&fit=crop"
  },


  {
    "id": "turn-into-figurine",
    "title": "Turn your self into a figurine",
    "category": "Viral Trend",
    "description": "Step 1: Full body shot. Step 2: Realistic product-style sculpted character figurine with toy packaging mockups.",
    "model": "Seadream4/ Nano Banana",
    "thumbnail": "https://images.unsplash.com/photo-1558855430-6601ad06002c?q=80&w=800&auto=format&fit=crop",
    "sampleBefore": "https://images.unsplash.com/photo-1558855430-6601ad06002c?q=80&w=400&auto=format&fit=crop",
    "sampleAfter": "https://images.unsplash.com/photo-1558855430-6601ad06002c?q=80&w=800&auto=format&fit=crop"
  },
  {
    "id": "style-transfer-viral",
    "title": "Style Transfer",
    "category": "Viral Trend",
    "description": "Create photorealistic 4-panel style transfer images using the palette and style of any reference image.",
    "model": "Seadream4/ Nano Banana/ Qwen",
    "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop",
    "sampleBefore": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&auto=format&fit=crop",
    "sampleAfter": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop"
  },
  {
    "id": "3d-print-mockup",
    "title": "3D Print",
    "category": "Viral Trend",
    "description": "1/7 scale commercialized figurine mockup in a realistic office environment with high-quality packaging design.",
    "model": "Seadream4/ Nano Banana/ Qwen",
    "thumbnail": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=800&auto=format&fit=crop",
    "sampleBefore": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=400&auto=format&fit=crop",
    "sampleAfter": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=800&auto=format&fit=crop"
  }
];
