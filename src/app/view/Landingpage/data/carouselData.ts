import { getImageUrl } from '../routes';

export interface CarouselCard {
  src: string;
  title: string;
  description: string;
}

export const carouselCards: CarouselCard[] = [
  {
    src: getImageUrl('featureCategory', 'imageGen'),
    title: 'Image Generation',
    description: 'Create stunning visuals from text prompts with state-of-the-art diffusion models.',
  },
  {
    src: getImageUrl('featureCategory', 'videoGen'),
    title: 'Video Generation',
    description: 'Generate short videos from ideas, concepts, or scripts with AI.',
  },
  {
    src: getImageUrl('featureCategory', 'brand'),
    title: 'Branding Kit',
    description: 'Logos, mockups, stickers, and assets to power your brand identity.',
  },
  {
    src: getImageUrl('featureCategory', 'audioGen'),
    title: 'Audio Generation',
    description: 'Compose music and soundscapes from natural language prompts.',
  },
  {
    src: getImageUrl('featureCategory', 'filming'),
    title: 'Filming Tools',
    description: 'Storyboards, shot planning, and VFX tools to accelerate production.',
  },
  {
    src: getImageUrl('featureCategory', '3dGen'),
    title: '3D Generation', 
    description: 'Turn ideas into 3D assets and scenes directly from text.',
  },
];
