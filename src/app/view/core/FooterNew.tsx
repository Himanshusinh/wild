'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getImageUrl } from '@/routes/imageroute'
import { NAV_ROUTES, FEATURE_ROUTES, SOCIAL_LINKS, MUSICGENERATION } from '@/routes/routes'
// import {
//   IconBrandYoutube,
//   IconBrandInstagram,
//   IconBrandX,
// } from '@tabler/icons-react'
import Squares from './Squares'

const FooterNew: React.FC = () => {
  const legalLinks = [
    { name: "Terms of use", href: "" },
    { name: "Privacy Policy", href: "" },
    { name: "Cookies", href: "" },
    { name: "Legal Notice", href: "" },
    { name: "DMCA", href: "" },
  ];

  // const socialLinks = [
  //   {
  //     title: "X",
  //     icon: IconBrandX,
  //     href: "#",
  //     hoverColor: "hover:text-blue-500",
  //     borderHoverColor: "hover:border-blue-500",
  //     glowColor: "hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]",
  //   },
  //   {
  //     title: "Instagram",
  //     icon: IconBrandInstagram,
  //     href: "#",
  //     hoverColor: "hover:text-pink-800",
  //     borderHoverColor: "hover:border-pink-800",
  //     glowColor: "hover:shadow-[0_0_15px_rgba(236,72,153,0.5)]",
  //   },
  //   {
  //     title: "Youtube",
  //     icon: IconBrandYoutube,
  //     href: "#",
  //     hoverColor: "hover:text-red-700",
  //     borderHoverColor: "hover:border-red-700",
  //     glowColor: "hover:shadow-[0_0_15px_rgba(220,38,38,0.5)]",
  //   },
  // ];

  return (
    <footer className="relative z-[10] bg-black w-full">
      <div className="max-w-[680px] md:max-w-6xl lg:max-w-7xl mx-3 md:mx-auto px-6 sm:px-10 md:px-4 lg:px-1">
        <div className="relative z-0 pb-2 max-w-7xl mx-auto text-white p-6 sm:p-10 md:p-8 lg:p-10 rounded-t-3xl border border-b-0 border-white/20 overflow-hidden ">
           {/* Background decorative grid */}
           <div className="absolute inset-0 opacity-10">
             <Squares 
               speed={0.5}
               squareSize={40}
               direction='down'
               borderColor='#ffffff'
               hoverFillColor='#222222'
             />
           </div>
           <div className="relative z-10">
            {/* Main Footer Content */}
            <div className="py-8 md:py-6 lg:py-8 border-b border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-6 lg:gap-8">
                {/* Logo and Brand */}
                <div className="lg:col-span-1 w-[100%] ">
                  <div className="mb-4">
                    <Image
                      src={getImageUrl("core", "logo") || "/placeholder.svg"}
                      alt="WildMind Logo"
                      width={120}
                      height={48}
                      className="h-8 w-auto md:h-7 lg:h-8"
                    />
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xs md:max-w-sm">
                    WildMind uses advanced AI to turn imagination into high-quality, creative visuals.
                  </p>
                  
                  {/* Social Media Icons */}
                  {/* <div className="flex gap-4 mt-6 mb:gap-3">
                    {socialLinks.map((social, index) => (
                      <Link
                        key={index}
                        href={social.href}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#545454] bg-[#1E1E1E] 
                        ${social.hoverColor} ${social.borderHoverColor} ${social.glowColor} transition-all duration-200`}
                      >
                        <social.icon className="w-5 h-5 mb:w-4 mb:h-4" />
                      </Link>
                    ))}
                  </div> */}
                </div>

                {/* Home Category */}
                <div className="space-y-4 ml-6">
                  <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                  Solutions
                  </h3>
                  <ul className="space-y-3">
                    <li>
                      <Link href={NAV_ROUTES.WORKFLOWS} className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                        Wild Magic (Coming Soon)
                      </Link>
                    </li>
                    <li>
                      <Link href={FEATURE_ROUTES.IMAGE_GENERATION} className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      AI Image Generation
                      </Link>
                    </li>
                    <li>
                      <Link href={FEATURE_ROUTES.VIDEO_GENERATION} className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      AI Video Generation
                      </Link>
                    </li>
                    <li>
                      <Link href={MUSICGENERATION.TEXT_TO_MUSIC} className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      AI Audio Generation
                      </Link>                      </li>
                      <li>

                      <Link href="" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      AI Filming tools
                      </Link>                      </li>
                      <li>

                      <Link href="" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      AI 3D Generation
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Features Category */}
                <div className="space-y-4 ml-6">
                  <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                  Product
                  </h3>
                  <ul className="space-y-3">
                    <li>
                      <Link href={NAV_ROUTES.PRICING} className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Pricing                      </Link>
                    </li>
                    <li>
                      <Link href="" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Enterprise
                      </Link>
                    </li>
                    <li>
                      <Link href="" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      FAQs
                      </Link>
                    </li>
                    <li>
                      <Link href="" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Documentation
                      </Link>
                    </li>
                    <li>
                      <Link href="" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Terms for Use
                      </Link>
                    </li>
                    <li>
                      <Link href="" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link href="" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Cookie Policy
                      </Link>
                    </li>
                    <li>
                      <Link href="" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Cookie Settings
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Company Category */}
                <div className="space-y-4 ml-6">
                  <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                    Company
                  </h3>
                  <ul className="space-y-3">
                    <li>
                      <Link href={NAV_ROUTES.BLOG} className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                        Blog
                      </Link>
                    </li>
                    <li>
                      <Link href={NAV_ROUTES.CONTACT} className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                        Careers
                      </Link>
                    </li>
                    <li>
                      <Link href={NAV_ROUTES.SUPPORT} className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                        Support
                      </Link>
                    </li>
                    <li>
                      <Link href="" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                        About us
                      </Link>
                    </li>
                    <li>
                      <Link href="" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Newsletter
                      </Link>
                    </li>
                    <li>
                      <Link href="" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Affiliate Program
                      </Link>
                    </li>
                    <li>
                      <Link href="" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Wild Mind Creator Program
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4 ml-6">
                  <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                  Stay Connected
                  </h3>
                  <ul className="space-y-3">
                    <li>
                      <Link href={SOCIAL_LINKS.FACEBOOK} target="_blank" rel="noopener noreferrer" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Facebook
                      </Link>
                    </li>
                    <li>
                      <Link href={SOCIAL_LINKS.X} target="_blank" rel="noopener noreferrer" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      X
                      </Link>
                    </li>
                    <li>
                      <Link href={SOCIAL_LINKS.INSTAGRAM} target="_blank" rel="noopener noreferrer" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Instagram
                      </Link>
                    </li>
                    <li>
                      <Link href={SOCIAL_LINKS.YOUTUBE} target="_blank" rel="noopener noreferrer" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Youtube
                      </Link>
                    </li>
                    <li>
                      <Link href={SOCIAL_LINKS.LINKEDIN} target="_blank" rel="noopener noreferrer" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      LinkedIn
                      </Link>
                    </li>
                    <li>
                      <Link href={SOCIAL_LINKS.THREADS} target="_blank" rel="noopener noreferrer" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Threads
                      </Link>
                    </li>
                    
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="py-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-gray-400 text-sm mb:text-xs text-center">
                Copyright © 2025 WildMind Pvt Ltd. All rights reserved.
              </div>
              
              {/* Legal Links */}
              <div className="flex flex-wrap gap-6 justify-center mb:gap-4">
                {legalLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-gray-400 text-sm hover:text-white transition-colors duration-200 mb:text-xs"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default FooterNew
