'use client'

export type StyleDef = {
  name: string
  value: string
  image: string
  description?: string
  prompt: string
}

export const STYLE_CATALOG: StyleDef[] = [
  { name: 'None', value: 'none', image: '/styles/none.jpg', description: 'No enforced style', prompt: 'A neutral studio photo of a pair of wireless earbuds on a plain background, soft shadows, balanced lighting.' },
  { name: 'Neutral Studio', value: 'neutral_studio', image: '/styles/neutral_studio.jpg', description: 'Clean studio look', prompt: 'A neutral studio photo of a pair of wireless earbuds on a plain background, soft shadows, balanced lighting.' },
  { name: 'Realistic', value: 'realistic', image: '/styles/realistic.jpg', description: 'Photorealistic with natural lighting', prompt: 'Ultra-realistic product photo of a wristwatch, metallic reflections, macro texture detail, soft daylight.' },
  { name: 'Minimalist', value: 'minimalist', image: '/styles/minimalist.jpg', description: 'Clean and simple design', prompt: 'Minimalist vector of a smartphone; few shapes, ample white space, bold contrast, clean typography.' },
  { name: 'Watercolor', value: 'watercolor', image: '/styles/watercolor.jpg', description: 'Soft watercolor textures', prompt: 'Watercolor painting of wildflowers in a glass vase; soft bleeds, gentle edges, pastel tones.' },
  { name: 'Oil Painting', value: 'oil_painting', image: '/styles/oil_painting.jpg', description: 'Rich oil paint strokes', prompt: 'Oil painting of a mountain landscape at sunset; thick brush strokes, warm golden light.' },
  { name: 'Abstract', value: 'abstract', image: '/styles/abstract.jpg', description: 'Abstract and conceptual art', prompt: 'Abstract composition inspired by ocean waves; flowing lines, cool color gradients, motion energy.' },
  { name: 'Cyberpunk', value: 'cyberpunk', image: '/styles/cyberpunk.jpg', description: 'Futuristic neon aesthetics', prompt: 'Cyberpunk city street at night; neon reflections, rain-soaked pavement, magenta-blue glow.' },
  { name: 'Neon Noir', value: 'neon_noir', image: '/styles/neon_noir.jpg', description: 'Dark neon cinematic', prompt: 'Moody neon-noir alleyway; cinematic lighting, single flickering sign, misty atmosphere.' },
  { name: 'Isometric', value: 'isometric', image: '/styles/isometric.jpg', description: 'Isometric perspective', prompt: 'Isometric illustration of a cozy apartment workspace; warm desk light, tidy layout, 30° perspective.' },
  { name: 'Vintage Poster', value: 'vintage_poster', image: '/styles/vintage_poster.jpg', description: 'Retro travel poster', prompt: 'Vintage 1970s travel poster of Paris; faded colors, halftone grain, retro typography.' },
  { name: 'Vaporwave', value: 'vaporwave', image: '/styles/vaporwave.jpg', description: 'Nostalgic neon gradients', prompt: 'Vaporwave sunset over palm trees; grid horizon, pastel neon palette, nostalgic 80s feel.' },
  { name: 'Pixel Art', value: 'pixel_art', image: '/styles/pixel_art.jpg', description: 'Retro pixel aesthetics', prompt: 'Pixel art city skyline at dusk; 32×32 style, vibrant palette, retro game aesthetic.' },
  { name: 'Cartoon', value: 'cartoon', image: '/styles/cartoon.jpg', description: 'Fun cartoon-style illustrations', prompt: 'Cartoon illustration of a happy cat sipping coffee; playful proportions, flat colors, thick outlines.' },
  { name: 'Pencil Sketch', value: 'pencil_sketch', image: '/styles/pencil_sketch.jpg', description: 'Hand-drawn pencil lines', prompt: 'Detailed pencil sketch of a classic car; cross-hatching, realistic shadows, paper texture.' },
  { name: 'Claymation', value: 'claymation', image: '/styles/claymation.jpg', description: 'Claymation inspired', prompt: 'Claymation-style scene of a smiling sun over rolling hills; handmade feel, soft clay textures.' },
  { name: 'Fantasy', value: 'fantasy', image: '/styles/fantasy.jpg', description: 'Mythic, magical worlds', prompt: 'Fantasy illustration of a magical library; glowing runes, floating books, warm candlelight.' },
  { name: 'Sci‑Fi', value: 'sci_fi', image: '/styles/sci_fi.jpg', description: 'Futuristic technology', prompt: 'Futuristic astronaut holding a holographic map; sleek armor, blue lighting, cinematic realism.' },
  { name: 'Steampunk', value: 'steampunk', image: '/styles/steampunk.jpg', description: 'Victorian industrial', prompt: 'Steampunk-style flying ship with brass gears and steam vents, golden sunlight and clouds.' },
  { name: 'Abstract Geometry', value: 'abstract_geometry', image: '/styles/abstract_geometry.jpg', description: 'Geometric sculpture', prompt: 'Abstract geometric sculpture in a minimal gallery; dynamic angles, marble floor reflections.' },
  { name: 'Surrealism', value: 'surrealism', image: '/styles/surrealism.jpg', description: 'Dreamlike visuals', prompt: 'Surreal floating island above the ocean; a tree growing upside down, dreamlike lighting.' },
  { name: '3D Render', value: 'render_3d', image: '/styles/render_3d.jpg', description: 'High-fidelity 3D looks', prompt: 'High-fidelity 3D render of a glass sphere on a marble surface; reflections, depth of field.' },
  { name: 'Ukiyo‑e', value: 'ukiyoe', image: '/styles/ukiyoe.jpg', description: 'Japanese woodblock print', prompt: 'Ukiyo-e woodblock print of Mount Fuji at dawn; soft ink gradients, traditional waves pattern.' },
  { name: 'Graffiti', value: 'graffiti', image: '/styles/graffiti.jpg', description: 'Street art vibe', prompt: 'Graffiti mural of a phoenix on a brick wall; bold colors, paint drips, urban energy.' },
  { name: 'Renaissance', value: 'renaissance', image: '/styles/renaissance.jpg', description: 'Chiaroscuro portrait', prompt: 'Renaissance oil portrait of a modern woman with AirPods; chiaroscuro lighting, ornate frame.' },
  { name: 'Pop Art', value: 'pop_art', image: '/styles/pop_art.jpg', description: 'Bold comic style', prompt: 'Pop art illustration of a burger; bright primary colors, halftone dots, comic style.' },
  
  // Lucid Origin and Phoenix 1.0 specific styles
  { name: 'Bokeh', value: 'bokeh', image: '/styles/bokeh.jpg', description: 'Shallow depth of field', prompt: 'Portrait with beautiful bokeh background, soft focus, professional photography.' },
  { name: 'Cinematic', value: 'cinematic', image: '/styles/cinematic.jpg', description: 'Movie-like quality', prompt: 'Cinematic shot with dramatic lighting, film grain, professional cinematography.' },
  { name: 'Cinematic Close Up', value: 'cinematic_close_up', image: '/styles/cinematic_close_up.jpg', description: 'Close-up cinematic shot', prompt: 'Cinematic close-up with shallow depth of field, dramatic lighting, film quality.' },
  { name: 'Creative', value: 'creative', image: '/styles/creative.jpg', description: 'Artistic and imaginative', prompt: 'Creative artistic interpretation with unique composition and vibrant colors.' },
  { name: 'Dynamic', value: 'dynamic', image: '/styles/dynamic.jpg', description: 'High energy and movement', prompt: 'Dynamic composition with strong movement, energy, and visual impact.' },
  { name: 'Fashion', value: 'fashion', image: '/styles/fashion.jpg', description: 'Fashion photography style', prompt: 'Fashion photography with clean lighting, professional styling, editorial quality.' },
  { name: 'Film', value: 'film', image: '/styles/film.jpg', description: 'Film photography aesthetic', prompt: 'Film photography with natural grain, warm tones, analog feel.' },
  { name: 'Food', value: 'food', image: '/styles/food.jpg', description: 'Food photography style', prompt: 'Professional food photography with appetizing lighting and composition.' },
  { name: 'HDR', value: 'hdr', image: '/styles/hdr.jpg', description: 'High dynamic range', prompt: 'HDR photography with enhanced contrast and detail in highlights and shadows.' },
  { name: 'Long Exposure', value: 'long_exposure', image: '/styles/long_exposure.jpg', description: 'Long exposure photography', prompt: 'Long exposure shot with motion blur and light trails, ethereal quality.' },
  { name: 'Macro', value: 'macro', image: '/styles/macro.jpg', description: 'Macro photography', prompt: 'Macro photography with extreme close-up detail and shallow depth of field.' },
  { name: 'Monochrome', value: 'monochrome', image: '/styles/monochrome.jpg', description: 'Single color palette', prompt: 'Monochrome image with single color tone, artistic and minimalist.' },
  { name: 'Moody', value: 'moody', image: '/styles/moody.jpg', description: 'Dark and atmospheric', prompt: 'Moody atmosphere with dark tones, dramatic shadows, emotional depth.' },
  { name: 'Neutral', value: 'neutral', image: '/styles/neutral.jpg', description: 'Balanced and natural', prompt: 'Neutral photography with balanced colors and natural lighting.' },
  { name: 'Portrait', value: 'portrait', image: '/styles/portrait.jpg', description: 'Portrait photography', prompt: 'Professional portrait with flattering lighting and composition.' },
  { name: 'Retro', value: 'retro', image: '/styles/retro.jpg', description: 'Vintage aesthetic', prompt: 'Retro style with vintage colors, film grain, nostalgic feel.' },
  { name: 'Stock Photo', value: 'stock_photo', image: '/styles/stock_photo.jpg', description: 'Commercial stock style', prompt: 'Clean commercial photography suitable for business use.' },
  { name: 'Unprocessed', value: 'unprocessed', image: '/styles/unprocessed.jpg', description: 'Raw and natural', prompt: 'Unprocessed natural photography without heavy editing or filters.' },
  { name: 'Vibrant', value: 'vibrant', image: '/styles/vibrant.jpg', description: 'Bright and colorful', prompt: 'Vibrant image with saturated colors and high energy.' },
  
  // Phoenix 1.0 specific additional styles
  { name: 'Cinematic Concept', value: 'cinematic_concept', image: '/styles/cinematic_concept.jpg', description: 'Conceptual cinematic', prompt: 'Cinematic concept art with dramatic composition and storytelling elements.' },
  { name: 'Graphic Design Pop Art', value: 'graphic_design_pop_art', image: '/styles/graphic_design_pop_art.jpg', description: 'Pop art graphic design', prompt: 'Graphic design in pop art style with bold colors and commercial appeal.' },
  { name: 'Graphic Design Vector', value: 'graphic_design_vector', image: '/styles/graphic_design_vector.jpg', description: 'Vector graphic design', prompt: 'Clean vector graphic design with geometric shapes and modern aesthetics.' },
  { name: 'Illustration', value: 'illustration', image: '/styles/illustration.jpg', description: 'Illustrative style', prompt: 'Illustrative artwork with artistic interpretation and creative composition.' },
  { name: 'Pro BW Photography', value: 'pro_bw_photography', image: '/styles/pro_bw_photography.jpg', description: 'Professional black and white', prompt: 'Professional black and white photography with high contrast and artistic composition.' },
  { name: 'Pro Color Photography', value: 'pro_color_photography', image: '/styles/pro_color_photography.jpg', description: 'Professional color photography', prompt: 'Professional color photography with accurate color reproduction and composition.' },
  { name: 'Pro Film Photography', value: 'pro_film_photography', image: '/styles/pro_film_photography.jpg', description: 'Professional film photography', prompt: 'Professional film photography with natural grain and authentic analog feel.' },
  { name: 'Portrait Fashion', value: 'portrait_fashion', image: '/styles/portrait_fashion.jpg', description: 'Fashion portrait', prompt: 'Fashion portrait with editorial styling and professional lighting.' },
  { name: 'Ray Traced', value: 'ray_traced', image: '/styles/ray_traced.jpg', description: 'Ray traced rendering', prompt: 'Ray traced 3D rendering with realistic lighting and reflections.' },
  { name: 'Sketch BW', value: 'sketch_bw', image: '/styles/sketch_bw.jpg', description: 'Black and white sketch', prompt: 'Black and white sketch with artistic line work and shading.' },
  { name: 'Sketch Color', value: 'sketch_color', image: '/styles/sketch_color.jpg', description: 'Color sketch', prompt: 'Color sketch with artistic interpretation and creative use of color.' },
]

export const getStyleByValue = (value: string) => STYLE_CATALOG.find(s => s.value === value)


