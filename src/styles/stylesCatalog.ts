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
]

export const getStyleByValue = (value: string) => STYLE_CATALOG.find(s => s.value === value)


