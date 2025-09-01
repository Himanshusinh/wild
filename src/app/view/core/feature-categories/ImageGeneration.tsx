import React from "react";
import Link from "next/link"
import { IMAGEGENERATION } from "@/routes/routes"

interface FeatureItem {
  title: string
  href: string
  coming?: boolean
}

const imageGenerationFeatures: FeatureItem[] = [
  { title: "Text to Image", href: IMAGEGENERATION.TEXT_TO_IMAGE },
  { title: "Image to Image", href: IMAGEGENERATION.IMAGE_TO_IMAGE },
  // { title: "AI Sticker Generation", href: IMAGEGENERATION.STICKER_GENERATION },
  // { title: "Live Portrait", href: IMAGEGENERATION.LIVE_PORTRAIT },
  // { title: "Inpaint", href: IMAGEGENERATION.INPAINT_FLUX_API },
]

export default function ImageGeneration() {
  return (
    <div className="space-y-4">
      <h3 className="text-regular font-semibold text-white mb-3 md:text-sm">
        Image Generation
      </h3>
      <div className="space-y-3">
        {imageGenerationFeatures.map((feature, index) => (
          <Link
            key={index}
            href={feature.href}
            className="flex items-center text-white hover:text-white transition-all duration-200 text-sm group"
          >
           <span>{feature.title}</span>
            {feature.coming && <span className="text-xs text-yellow-400 ml-2">(Soon)</span>}
          </Link>
        ))}
      </div> 
    </div>           
  )    
} 
