import { getImageUrl } from '../routes';

export interface HeroProduct {
  title: string;
  link: string;
  thumbnail: string;
}

export const heroProducts: HeroProduct[] = [
  { title: "", link: "", thumbnail: getImageUrl('heroParallax', 'hero1') },
  { title: "", link: "", thumbnail: getImageUrl('heroParallax', 'hero3') },
  { title: "", link: "", thumbnail: getImageUrl('heroParallax', 'hero4') },
  { title: "", link: "", thumbnail: getImageUrl('heroParallax', 'hero5') },
  { title: "", link: "", thumbnail: getImageUrl('heroParallax', 'hero6') },
  { title: "", link: "", thumbnail: getImageUrl('heroParallax', 'hero7') },
  { title: "", link: "", thumbnail: getImageUrl('heroParallax', 'hero8') },
  { title: "", link: "", thumbnail: getImageUrl('heroParallax', 'hero12') },
  { title: "", link: "", thumbnail: getImageUrl('heroParallax', 'hero10') },
  { title: "", link: "", thumbnail: getImageUrl('heroParallax', 'hero11') },
  { title: "", link: "", thumbnail: getImageUrl('heroParallax', 'hero9') },
  { title: "", link: "", thumbnail: getImageUrl('heroParallax', 'hero13') },
  { title: "", link: "", thumbnail: getImageUrl('heroParallax', 'hero14') },
  { title: "", link: "", thumbnail: getImageUrl('heroParallax', 'hero15') },
  { title: "", link: "", thumbnail: getImageUrl('heroParallax', 'hero16') },
];
