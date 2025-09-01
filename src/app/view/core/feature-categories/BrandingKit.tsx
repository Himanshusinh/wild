import React from "react";
import Link from "next/link"
import { BRANDINGKIT } from "@/routes/routes"
interface FeatureItem {
  title: string
  href: string
  icon: string
  coming?: boolean
}

const brandingFeatures: FeatureItem[] = [
  { title: "Logo Generation", href: BRANDINGKIT.LOGO_GENERATION, icon: "🏢" },
  { title: "Mockup Generation", href: BRANDINGKIT.MOCKUP_GENERATION, icon: "📱" },
  { title: "Product with Models", href: BRANDINGKIT.PRODUCT_WITH_MODEL_POSE, icon: "🧍" },
  // { title: "Product Generation", href: BRANDINGKIT.PRODUCT_GENERATION, icon: "📦" },
]

export default function BrandingKit() {
  return (
    <div className="space-y-4">
      <h3 className="text-regular font-semibold text-white mb-3 md:text-sm">
        Branding Kit
      </h3>
            <div className="space-y-3">
        {brandingFeatures.map((feature, index) => (
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
