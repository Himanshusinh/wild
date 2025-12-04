'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
// Import session checker utilities (available in browser console)
import '@/utils/checkSessionStatus'
// Nav and SidePannelFeatures are provided by the persistent root layout
import Header from './compo/Header'
import Image from 'next/image'
import { getImageUrl, API_BASE, imageRoutes } from './routes'
// Lazy load non-critical components for better performance
import dynamic from 'next/dynamic'

const Second = dynamic(() => import('./compo/Second'), {
  loading: () => <div className="h-96 animate-pulse bg-white/5 rounded-lg" />
})
const Recentcreation = dynamic(() => import('./compo/Recentcreation'), {
  loading: () => <div className="h-64 animate-pulse bg-white/5 rounded-lg" />
})
const WelcomeModal = dynamic(() => import('./compo/WelcomeModal'), {
  ssr: false
})
const WorkflowCarousel = dynamic(() => import('./compo/WorkflowCarousel').then(mod => ({ default: mod.default })), {
  loading: () => <div className="h-64 animate-pulse bg-white/5 rounded-lg" />
})
const CommunityCreations = dynamic(() => import('./compo/CommunityCreations').then(mod => ({ default: mod.default })), {
  loading: () => <div className="h-96 animate-pulse bg-white/5 rounded-lg" />
})
const WobbleCard = dynamic(() => import('../Landingpage/components/wobble-card').then(mod => ({ default: mod.WobbleCard })), {
  loading: () => <div className="h-[500px] animate-pulse bg-white/5 rounded-lg" />
})
const FooterNew = dynamic(() => import('../core/FooterNew'), {
  loading: () => <div className="h-32 animate-pulse bg-white/5 rounded-lg" />
})

import type { WorkflowCard } from './compo/WorkflowCarousel'


import { ViewType, GenerationType } from '@/types/generation';
import { ModelItem } from '@/app/canvas-projects/components/ui/ModelItem';
import { Hexagon, Sparkles } from 'lucide-react';

const HomePage: React.FC = () => {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [currentGenerationType, setCurrentGenerationType] = useState<GenerationType>('text-to-image');
  const [showWildmindSkitPopup, setShowWildmindSkitPopup] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const onViewChange = (view: ViewType) => {
    setCurrentView(view);
    switch (view) {
      case 'landing':
        router.push('/view/Landingpage');
        break;
      case 'home':
        router.push('/view/HomePage');
        break;
      case 'history':
        router.push('/history');
        break;
      case 'bookmarks':
        router.push('/bookmarks');
        break;
      case 'generation':
      default:
        router.push('/text-to-image');
        break;
    }
  };

  const onGenerationTypeChange = (type: GenerationType) => {
    setCurrentGenerationType(type);
    router.push(`/${type}`);
  };

  // Check for first-time user and show welcome modal
  useEffect(() => {
    const checkFirstTimeUser = () => {
      // Check if user has seen the welcome modal before
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal');

      if (!hasSeenWelcome) {
        // Show welcome modal after a short delay
        const timer = setTimeout(() => {
          setShowWelcomeModal(true);
          // Mark as seen
          localStorage.setItem('hasSeenWelcomeModal', 'true');
        }, 2000); // 2 second delay

        return () => clearTimeout(timer);
      }
    };

    checkFirstTimeUser();
  }, []);

  // Show deferred toast from login (set in signup/signin flow)
  useEffect(() => {
    try {
      const msg = localStorage.getItem('toastMessage');
      if (msg === 'LOGIN_SUCCESS') {
        // Clear the flag immediately to prevent duplicate toasts
        localStorage.removeItem('toastMessage');
        const t = setTimeout(() => {
          try { toast.success('Welcome back! You\'re logged in successfully.', { duration: 3000 }) } catch {}
        }, 500);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  const CARDS: WorkflowCard[] = [
    {
      id: "Designing",
      title: "Designing",
      description:
        "Boost your creative workflow with AI-powered design tools and premium digital assets that save time and maximize productivity. Eliminate repetitive tasks, customize designs instantly, and ensure every project stays consistent, secure, and on-brand. Whether you’re a designer, marketer, or business owner, our smart tools help you work faster, focus on what matters, and deliver high-quality results – without extra effort",
      subtitle: "Keep Every Asset On-Brand with Wild Mind’s Branding Kit",
      subtitleClassName: "text-white/70 font-medium text-lg",
      ctaText: "Explore",
      image: getImageUrl('workflow', 'designing'),
    },
    {
      id: "Film Making",
      title: "Film Making",
      description:
        "Accelerate your filmmaking process with AI-powered video tools built for creators by Wild Mind. Upscale footage instantly for streaming, presentations, or final delivery without expensive setups. Generate realistic voiceovers to test edits or polish trailers—no studio required. Quickly create storyboards, shot mockups, and concept art to plan scenes and visualize ideas faster. With AI handling the technical heavy lifting, filmmakers can focus on storytelling and creativity.",
      subtitle: "From Concept to Final Cut",
      subtitleClassName: "text-white/70 font-medium text-lg",
      ctaText: "Explore",
      image: getImageUrl('workflow', 'filmMaking'),
    },
    {
      id: "Printing",
      title: "Printing",
      description:
        "Prepare flawless, print-ready designs in seconds with AI. Automatically resize, retouch, and format images for business cards, posters, packaging, or merchandise—all while preserving quality. Eliminate manual prep with tools that generate high-resolution outputs optimized for print, ensuring colors, details, and layouts stay sharp and professional. Whether you’re producing marketing collateral or creative projects, our AI helps you move from concept to final print seamlessly.",
      subtitle: "Print-Ready Visuals Without the Hassle",
      subtitleClassName: "text-white/70 font-medium text-lg",
      ctaText: "Explore",
      image: getImageUrl('workflow', 'printing'),
    },
    {
      id: "Branding",
      title: "Branding",
      description:
        "Strengthen your identity with AI-powered branding tools that ensure consistency across every campaign. Instantly generate logos, brand mockups, and style assets tailored to your guidelines. Use Wild Mind’s Branding Kit to keep fonts, colors, and design elements unified across marketing visuals, social media posts, and presentations. From fresh brand concepts to polished assets, our AI keeps every creation aligned, recognizable, and professional—without extra effort.",
      subtitle: "Creative workfloKeep Every Asset On-Brand with Wild Mind’s Branding Kit",
      subtitleClassName: "text-white/70 font-medium text-lg",
      ctaText: "Explore",
      image: getImageUrl('workflow', 'branding'),
    },
    {
      id: "Content Creation",
      title: "Content Creation",
      description:
        "Stand out on every platform with AI-powered content creation tools designed for YouTube, TikTok, Reels, and beyond. Animate images, add AI-generated voiceovers, and create professional intros in seconds. Upscale visuals, design eye-catching graphics, and generate on-brand assets that match your unique style. With assistive tools built for speed and creativity, you can focus on engaging your audience while AI handles the heavy lifting.",
      subtitle: "Make Scroll-Stopping Content Instantly",
      subtitleClassName: "text-white/70 font-medium text-lg",
      ctaText: "Explore",
      image: getImageUrl('workflow', 'contentCreation'),
    },
    {
      id: "Art Direction",
      title: "Art Direction",
      description:
        "Turn ideas into visuals instantly with AI-powered comic generation, film scene creation, and storyboard design from simple text prompts. Explore creative directions faster, experiment with styles, and bring concepts to life without long manual processes. From drafting storyboards to generating cinematic frames or comic panels, our tools give art directors full creative control while cutting production time. Secondary assistive features let you refine details, adjust compositions, and adapt outputs for campaigns—ensuring every project moves smoothly from concept to final delivery.",
      subtitle: "Creative Control at Every Stage for Art Directors",
      subtitleClassName: "text-white/70 font-medium text-lg",
      ctaText: "Explore",
      image: getImageUrl('workflow', 'artDirection'),
    },
    {
      id: "Marketing",
      title: "Marketing",
      description:
        "Create impactful marketing campaign visuals in seconds with AI. From generating realistic AI models for product shoots and ads to producing ready-to-use mockups across platforms, our tools help marketers scale faster without compromising creativity. Whether you’re preparing ads, social posts, or promotional content, every asset is campaign-ready, on-brand, and designed to capture attention—all powered by Wild Mind.",
      subtitle: "Create Stunning Visuals in Seconds for your Marketing Campaigns with Wild Mind",
      subtitleClassName: "text-white/70 font-medium text-lg",
      ctaText: "Explore",
      image: getImageUrl('workflow', 'marketing'),
    },
    {
      id: "Photography",
      title: "Photography",
      description:
        "Elevate your photography with AI-powered photo enhancement and retouching tools by Wild Mind. Instantly correct details, remove imperfections, and enhance image quality—without complex editing software. Optimize a single shot for large prints, portfolios, social media, or client delivery with just one click. From color correction to fine-tuned detail adjustments, our AI tools help photographers save time, stay consistent, and deliver professional-quality results every time.",
      subtitle: "Perfect Every Shot in Seconds",
      subtitleClassName: "text-white/70 font-medium text-lg",
      ctaText: "Explore",
      image: getImageUrl('workflow', 'photography'),
    },
  ];


  return (
    <div className="min-h-screen bg-[#07070B]">
      <div className="flex  md:ml-[68px] pt-2">
        <div className="flex-1 min-w-0">
          {/* <Header /> */}
          
          {/* Promotional Banner */}
          <section className="w-full md:px-6 px-4 md:pt-4 pt-6 pb-0 md:pb-6">
            <div className="relative w-full rounded-lg overflow-hidden border border-white/10 group cursor-pointer hover:border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="relative w-full aspect-[3/1] md:aspect-[3.25/1]">
                <Image
                  src={getImageUrl('home', 'banner')}
                  alt="WILDMIND AI Launching Offer - 15 days free with 4000 credits"
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                />
              </div>
            </div>
          </section>

          <Recentcreation />

          <section className="w-full md:pl-6 md:pr-6 pl-4 pr-4 md:mt-12 mt-6 md:pb-12 pb-4 animate-in fade-in duration-1000 delay-200">
                <div className="md:mb-4 mb-4">
                    <h2 className="text-xl md:text-3xl font-medium tracking-tight text-white md:mb-2 mb-2">All Your AI Tools Live Under One Roof.</h2>
                    <p className="text-slate-400 text-lg md:text-lg text-sm">Stop jumping between apps. Create, build, design, and automate from one powerful place.</p>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-min">

                    {/* 1. Google (Wide Hero) */}
                    <div className="lg:col-span-3 md:col-span-2 relative md:h-80 h-80 rounded-3xl overflow-hidden border border-white/5 group bg-[#020617]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-transparent mix-blend-multiply"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                        <div className="absolute md:top-8 top-4 left-4 md:left-8"><h3 className="text-4xl font-bold text-white">Google</h3></div>
                        <div className="absolute md:bottom-8 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-4 md:gap-y-4 md:gap-x-8 md:gap-x-4">
                            <ModelItem title="Nano Banana" desc="SOTA Image Generation" pro />
                            <ModelItem title="Imagen 4" desc="Photorealistic synthesis" pro />

                            <ModelItem title="Veo3.1 " desc="Realistic short video" pro />
                            <ModelItem title="Imagen 4 Fast" desc="High-fidelity image synthesis" pro />


                            <ModelItem title="Nano Banana Pro" desc="Advanced reasoning" pro />
                            <ModelItem title="Imagen 4 Ultra" desc="Ultra-high-fidelity image synthesis" pro />

                            <ModelItem title="Veo3.1 Fast" desc="Cinematic long-form" pro />
                            <ModelItem title="Gemini 3 Pro Preview" desc="Professional-grade image generation" pro />
                        </div>
                    </div>

                    {/* 2. Runway (Tall Hero) */}
                    <div className="lg:col-span-1 md:col-span-1 md:row-span-2 relative md:h-[41rem] h-60 rounded-3xl overflow-hidden border border-white/5 group bg-[#0F0F05]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700 grayscale mix-blend-screen"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-amber-900/40 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black"></div>
                        <div className="absolute md:top-8 top-4 left-4 md:left-8"><h3 className="text-4xl font-bold text-white">Runway</h3></div>
                        <div className="absolute md:bottom-8 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-1 md:gap-6 gap-0">
                            <ModelItem title="Gen-4 Aleph" desc="Creative foundation model" pro />
                            <ModelItem title="Gen-4 Image " desc="Real-time video generation" pro />
                            <ModelItem title="Gen-4 Image Turbo" desc="Style/subject consistency" />

                            <ModelItem title="Act-Two" desc="Narrative video storytelling" />
                            <ModelItem title="Gen-3a Turbo" desc="Cinematic video realism" pro />
                        </div>
                    </div>

                    {/* 3. Wan */}
                    <div className="lg:col-span-1 md:col-span-1 relative md:h-80 h-50 rounded-3xl overflow-hidden border border-white/5 group bg-[#110505]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/40 to-red-900/40 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors"></div>
                        <div className="absolute md:top-8 top-4 left-4 md:left-8"><h3 className="text-3xl font-bold text-white flex items-center gap-2"><Hexagon size={24} fill="white" /> Wan</h3></div>
                        <div className="absolute md:bottom-8 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-1 md:gap-6 gap-0">
                            <ModelItem title="Wan 2.5" desc="Culturally tuned Video model" pro />
                            <ModelItem title="Wan 2.5 Fast" desc="Real-time video generation" pro />

                        </div>
                    </div>

                    {/* 4. OpenAI */}
                    <div className="lg:col-span-2 md:col-span-1 relative md:h-80 h-50 rounded-3xl overflow-hidden border border-white/5 group bg-[#021109]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-emerald-900/30 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-black/60"></div>
                        <div className="absolute md:top-8 top-4 left-4 md:left-8"><h3 className="text-3xl font-bold text-white">OpenAI</h3></div>
                        <div className="absolute md:bottom-8 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-1 md:gap-6 gap-0">
                            <ModelItem title="Sora 2" desc="Real-time video generation" pro />
                            <ModelItem title="Gpt 4o" desc="Small, fast multimodal" />
                            <ModelItem title="Sora 2 Pro" desc="Advanced video generation" />

                        </div>
                    </div>

                    {/* 5. Black Forest Labs */}
                    <div className="lg:col-span-2 md:col-span-2 relative md:h-72 h-60 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1635776062360-af423602aff3?q=80&w=800')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-black mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                        <div className="absolute md:top-8 top-4 left-4 md:left-8"><h3 className="text-2xl font-bold text-white">Black Forest Labs</h3></div>
                        <div className="absolute md:bottom-8 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-2 md:gap-6 gap-0">
                        <ModelItem title="FLUX 2 Pro" desc="Professional-grade image generation" />
                        <ModelItem title="FLUX 2 Pro 2k" desc="Professional-grade image generation" />

                            <ModelItem title="FLUX Pro 1.1 ULTRA" desc="Balanced photo/creative" pro />
                            <ModelItem title="FLUX Kontext Max" desc="Multi-reference guided" pro />
                            <ModelItem title="FLUX Kontext PRO" desc="Professional-grade image generation" pro />
                        </div>
                    </div>

                    {/* 6. Stability AI */}
                    <div className="lg:col-span-1 md:col-span-1 relative md:h-72 h-50 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=800')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-yellow-600/20 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-black/50"></div>
                        <div className="absolute md:top-8 top-4 left-4 md:left-8"><h3 className="text-2xl font-bold text-white">Ideogram</h3></div>
                        <div className="absolute md:bottom-8 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-1 md:gap-6 gap-0">
                            <ModelItem title="Ideogram V3 Turbo" desc="Open, versatile synthesis" />
                            <ModelItem title="Ideogram V3 Quality" desc="Open, versatile synthesis" />

                        </div>
                    </div>

                    {/* 7. Hailuo AI */}
                    <div className="lg:col-span-1 md:col-span-3 relative md:h-auto h-80 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-cyan-900/30 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-black/60"></div>
                        <div className="absolute md:top-8 top-4 left-4 md:left-8"><h3 className="text-2xl font-bold text-white">Minimax</h3></div>
                        <div className="absolute md:bottom-8 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-2 md:gap-6 gap-0">
                            <ModelItem title=" Image-01" desc="General-purpose image" pro />
                            <ModelItem title=" Hailuo-02" desc="Enhanced precision" pro />
                            <ModelItem title=" Hailuo 2.3" desc="Enhanced precision" pro />
                            <ModelItem title=" Hailuo 2.3 Fast" desc="Enhanced precision" pro />
                        </div>
                    </div>

                    {/* 8. Pika */}
                    <div className="lg:col-span-1 relative md:h-64 h-50 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614726365723-49cfae968603?q=80&w=800')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-black/50"></div>
                        <div className="absolute md:top-6 top-4 left-4 md:left-8"><h3 className="text-3xl font-bold text-white">LTX Studio                        </h3></div>
                        <div className="absolute md:bottom-6 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-1 md:gap-6 gap-0">
                            <ModelItem title="LTX V2 Pro" desc="Creative, fast video" />
                            <ModelItem title="LTX V2 Fast" desc="Creative, fast video" />

                        </div>
                    </div>

                    {/* 9. Kling AI */}
                    <div className="lg:col-span-2 relative md:h-64 h-60 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?q=80&w=800')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-red-900/20 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                        <div className="absolute md:top-6 top-4 left-4 md:left-8"><h3 className="text-2xl font-bold text-white flex gap-2"><Sparkles size={24} className="text-[#60a5fa]" /> KlingAI</h3></div>
                        <div className="absolute md:bottom-6 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-2 md:gap-6 gap-0">
                            <ModelItem title="Kling 2.1 Master" desc="Refined cinematic video" pro />
                            <ModelItem title="Kling 2.0 Master" desc="Advanced cinematic video" pro />
                            <ModelItem title="Kling Pro 1.5" desc="Prior-gen high-quality" pro />
                            <ModelItem title="Kling Pro 1.6" desc="High-quality video gen" pro />
                        </div>
                    </div>

                    {/* 10. Recraft */}
                    <div className="lg:col-span-1 relative md:h-64 h-60 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-fuchsia-600/20 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-black/50"></div>
                        <div className="absolute md:top-6 top-4 left-4 md:left-8"><h3 className="text-2xl font-bold text-white tracking-widest uppercase font-mono">PixVerse</h3></div>
                        <div className="absolute md:bottom-6 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-1 md:gap-6 gap-0">
                            <ModelItem title="PixVerse V5" desc="Vector & design-oriented" />
                        </div>
                    </div>

                    {/* 11. ByteDance | Seed */}
                    <div className="lg:col-span-2 relative md:h-48 h-50 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=800')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-black/60"></div>
                        <div className="absolute md:top-6 top-4 left-4 md:left-8"><h3 className="text-xl font-bold text-white flex items-center gap-2">ByteDance </h3></div>
                        <div className="absolute md:bottom-6 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-2 md:gap-6 gap-0">
                            <ModelItem title="Seedream V4 4K " desc="High-quality image generation" />
                            <ModelItem title="Seedream v4.5 4K" desc="High-quality image generation" />
                            <ModelItem title="Seedream 1 Pro" desc="High-quality image generation" />
                            <ModelItem title="Seedream 1 Pro Lite" desc="High-quality image generation" />
                        </div>
                    </div>

                    {/* 12. Moonvalley */}
                    <div className="lg:col-span-2 relative md:h-48 h-40 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-black/50"></div>
                        <div className="absolute md:top-6 top-4 left-4 md:left-8"><h3 className="text-xl font-bold text-white tracking-widest">Tongyi-MAI</h3></div>
                        <div className="absolute md:bottom-6 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-1 md:gap-6 gap-0">
                          <ModelItem title="Z-Image-Turbo" desc="High-quality image generation" />
                        </div>
                    </div>

                </div>
            </section>
          <main className="min-h-screen bg-[#07070B] text-white  md:px-8  ">
            <div className="w-full px-4 md:pl-4">
              <CommunityCreations />
            </div>
          </main>

          {/* WobbleCard Section */}
          <main className="bg-[#07070B] text-white px-0 md:px-8 md:py-6 md:mb-32 mb-6 md:mt-32 mt-16">
            <div className="w-full px-4 md:px-8 lg:px-12">
              <div className="w-full">
                <WobbleCard
                  containerClassName="w-full bg-[#002933] md:min-h-[400px] h-96 lg:min-h-[500px]"
                  className="!p-0 !py-0 !h-full !min-h-full"
                >
                  <div
                    className="flex w-full md:h-full h-96 relative"
                   
                  >
                    {/* Left side content */}
                    <div className="flex-1 flex flex-col justify-between p-6 md:p-8 lg:p-10 z-10">
                      <div className="w-full">
                        <h2 className="max-w-sm md:max-w-lg text-left text-balance text-sm md:text-2xl lg:text-4xl font-semibold tracking-[-0.015em] text-white font-poppins">
                          Plans That Grow With You
                        </h2>
                        <p className="mt-2 md:mt-3 lg:mt-4 max-w-[20rem] md:max-w-[30rem] lg:max-w-[40rem] text-left text-xs md:text-base lg:text-lg text-neutral-200 mr-2 font-medium">
                          Whether you’re a designer, marketer, filmmaker, or content creator, our pricing is built to match your workflow. Get unlimited generations, exclusive access to advanced AI models, and essential creative tools like storyboard generation, mockup design, and campaign visuals—all included with no extra fees. From individual projects to large-scale campaigns, our plans offer the perfect balance of affordability and professional-grade features. With us, you don’t just save money—you unlock endless creative possibilities.
                        </p>
                      </div>

                      {/* Join Community Button - Bottom Left */}
                      <button className="font-poppins md:text-lg text-xs bg-white text-[#1C303D] font-semibold md:px-6 px-2 md:py-3 py-1 rounded-full transition-all duration-200 shadow-lg w-fit">
                        Pricing Plans
                      </button>
                    </div>

                    {/* Right side image */}
                    <div
                      className="absolute right-0 top-0 w-1/2 h-full"
                      style={{ height: '100%', minHeight: '500px' }}
                    >
                      <Image
                        src="https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fpricing%2F20250830_1122_Abstract%20Nautical%20Scene_remix_01k3wres6ye27s4wtw945t05dz.png?alt=media&token=14f642d0-2e5b-4daf-b3bb-388b374a55d5"
                        alt="Pricing plans artwork"
                        fill
                        className="object-cover rounded-r-2xl"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 40vw, 30vw"
                        priority
                        quality={85}
                        loading="eager"
                        unoptimized
                      />
                    </div>
                  </div>
                </WobbleCard>
              </div>
            </div>
          </main>

          <FooterNew />
        </div>
      </div>
      {/* Wildmind Skit Popup */}
      {showWildmindSkitPopup && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black z-[200] flex items-center justify-center"
            onClick={() => setShowWildmindSkitPopup(false)}
          >
            {/* Popup Content */}
            <div
              className="bg-black backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-[90vw] max-w-4xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-white text-3xl font-bold">Choose Style</h2>
                <button
                  onClick={() => setShowWildmindSkitPopup(false)}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Video Ads - Available */}
                <div
                  onClick={() => {
                    onGenerationTypeChange('ad-generation');
                    setShowWildmindSkitPopup(false);
                  }}
                  className="relative group cursor-pointer"
                >
                  <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 h-48 flex flex-col items-center justify-center text-center transition-transform group-hover:scale-105">
                    <div className="absolute top-4 right-4">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-4xl mb-4">📹</div>
                  </div>
                  <h3 className="text-white text-lg font-semibold mt-4">Video Ads</h3>
                </div>

                {/* Jewelry - Coming Soon */}
                <div className="relative group cursor-not-allowed opacity-60">
                  <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-8 h-48 flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-4">💎</div>
                  </div>
                  <h3 className="text-white text-lg font-semibold mt-4">Jewelry</h3>
                  <span className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-semibold">Soon</span>
                </div>

                {/* Live Chat - Available */}
                <div
                  onClick={() => {
                    router.push('/view/Generation/wildmindskit/LiveChat');
                    setShowWildmindSkitPopup(false);
                  }}
                  className="relative group cursor-pointer"
                >
                  <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl p-8 h-48 flex flex-col items-center justify-center text-center transition-transform group-hover:scale-105">
                    <div className="absolute top-4 right-4">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-4xl mb-4">💬</div>
                  </div>
                  <h3 className="text-white text-lg font-semibold mt-4">Live Chat</h3>
                </div>

                {/* Virtual Try-On - Coming Soon */}
                <div className="relative group cursor-not-allowed opacity-60">
                  <div className="bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl p-8 h-48 flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-4">👗</div>
                  </div>
                  <h3 className="text-white text-lg font-semibold mt-4">Virtual Try-On</h3>
                  <span className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-semibold">Soon</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />
    </div>
  )
}

export default HomePage