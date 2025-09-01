import React from 'react'
import { getImageUrl } from '../routes';

export interface LayoutGridCard {
  id: number;
  content: React.ReactNode;
  className: string;
  thumbnail: string;
  title: string;
}

export const layoutGridCards: LayoutGridCard[] = [
  {
    id: 1,
    content: (
      <div>
        <p className="font-bold text-white text-4xl mb:text-2xl">Kling 2.0 </p>
        <p className="font-normal text-base my-4 max-w-lg text-neutral-200 mb:text-sm mb:my-3 text-justify">The latest version of the Kling AI video generation model, known for its ability to create 
          high-quality, cinematic videos from text descriptions and images.
</p>
      </div>
    ),
    className: "md:col-span-2",
    thumbnail: getImageUrl('aimodels', 'kling') || '',
    title: "Kling 2.0",
  },
  {
    id: 2,
    content: (
      <div>
        <p className="font-bold text-white text-4xl mb:text-2xl">Google Veo 3 </p>
        <p className="font-normal text-base my-4 max-w-lg text-neutral-200 mb:text-sm mb:my-3 text-justify">An advanced AI video generation model developed by Google, capable of creating realistic, high-fidelity videos with audio from text prompts or input images.</p>
      </div>
    ),
    className: "col-span-1",
    thumbnail: getImageUrl('aimodels', 'veo3') || '',
    title: "Google Veo 3",
  },
  {
    id: 3,
    content: (
      <div>
        <p className="font-bold text-white text-4xl mb:text-2xl">Flux.1 Krea</p>
        <p className="font-normal text-base my-4 max-w-lg text-neutral-200 mb:text-sm mb:my-3 text-justify">FLUX.1 Krea [dev] is a new state-of-the-art open-weights model for text-to-image generation that overcomes the oversaturated &apos;AI look&apos; to achieve new levels of photorealism with its distinctive aesthetic approach.</p>
      </div>
    ),
    className: "col-span-1",
    thumbnail: getImageUrl('aimodels', 'krea') || '',
    title: "Flux.1 Krea",
  },
  {
    id: 4,
    content: (
      <div>
        <p className="font-bold text-white text-4xl mb:text-2xl">Runway Gen 4 Aleph</p>
        <p className="font-normal text-base my-4 max-w-lg text-neutral-200 mb:text-sm mb:my-3 text-justify">A powerful video model focused on advanced video transformations and editing. It allows users to edit, transform, and generate videos by manipulating existing video clips with text prompts and optional image references.</p>
      </div>
    ),
    className: "md:col-span-2",
    thumbnail: getImageUrl('aimodels', 'runway') || '',
    title: "Runway Gen 4 Aleph",
  },
];
