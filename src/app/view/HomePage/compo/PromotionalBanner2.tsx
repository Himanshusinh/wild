'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ArrowUpRight, Play, Zap, Sparkles, Box, 
  ShoppingBag, Watch, Scissors, ChevronRight, ChevronLeft 
} from 'lucide-react';

/**
 * Z-TURBO HERO CAROUSEL - FINAL VERSION
 * Slide 1: Restored to original "Turbo" concept
 * Slide 2: Model Matrix
 * Slide 3: Industry Solutions
 */

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 4;

  // Auto-advance slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));

  return (
    <section className="relative w-full min-h-[650px] bg-black text-white overflow-hidden border-b border-white/5 font-sans selection:bg-[#60a5fa] selection:text-white">
      
      {/* --- Ambient Background --- */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay"></div>
         <div className="absolute inset-0" style={{ 
            backgroundImage: 'linear-gradient(rgba(96, 165, 250, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(96, 165, 250, 0.03) 1px, transparent 1px)', 
            backgroundSize: '100px 100px' 
         }}></div>
      </div>

      {/* --- Slider Container --- */}
      <div className="relative h-[650px] w-full">
        {/* SLIDE 0: Promotional Banner Image */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentSlide === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
           <PromotionalBannerImage />
        </div>

        {/* SLIDE 1: TURBO ENGINE (From your image) */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentSlide === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
           <SlideOneContent />
        </div>

        {/* SLIDE 2: THE MODELS */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentSlide === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
           <SlideTwoContent />
        </div>

        {/* SLIDE 3: INDUSTRY SOLUTIONS */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentSlide === 3 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
           <SlideThreeContent />
        </div>

      </div>

      {/* --- Controls --- */}
      <div className="absolute bottom-8 left-0 right-0 z-30 flex items-center justify-center gap-6">
        <button onClick={prevSlide} className="p-2 rounded-full border border-white/10 bg-black/50 hover:bg-white hover:text-black transition-all backdrop-blur-md"><ChevronLeft size={20} /></button>
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((idx) => (
            <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-1.5 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-12 bg-[#60a5fa] shadow-[0_0_10px_#60a5fa]' : 'w-2 bg-white/20'}`} />
          ))}
        </div>
        <button onClick={nextSlide} className="p-2 rounded-full border border-white/10 bg-black/50 hover:bg-white hover:text-black transition-all backdrop-blur-md"><ChevronRight size={20} /></button>
      </div>
    </section>
  );
}

// --- SLIDE COMPONENTS ---

/**
 * SLIDE 1: Promotional Banner
 * Simple banner image display
function */

function PromotionalBannerImage() {
  return (
    <section className="w-full md:px-6 px-4 md:pt-4 pt-6 pb-0 md:pb-6">
      <div className="relative w-full rounded-lg overflow-hidden border border-white/10 group cursor-pointer hover:border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl">
        <div className="relative w-full aspect-[3/1] md:aspect-[3.25/1]">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/core%2Fbanner-1-dark-theme.jpg?alt=media&token=3cf24d94-3802-4cc8-8bd3-2b641161af9b"
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
  );
}

function SlideOneContent() {
  const router = useRouter();

  return (
    
    <div className="w-full h-full flex items-center justify-center relative">
      
      
       {/* Blue/Indigo Glows matching the screenshot */}
       <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-600/[0.08] rounded-full blur-[120px]" />
       <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-indigo-600/[0.08] rounded-full blur-[100px]" />

       <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          
          {/* Left: Typography */}
          <div className="flex flex-col items-start text-left animate-in slide-in-from-left-10 duration-700 fade-in">
             <div className="inline-flex items-center gap-2 border border-[#60a5fa]/30 bg-[#60a5fa]/10 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#60a5fa] mb-8 shadow-[0_0_15px_rgba(96,165,250,0.1)]">
                <span className="w-2 h-2 rounded-full bg-[#60a5fa] animate-pulse"></span>
                Z-Image Turbo
             </div>
             <h1 className="text-6xl md:text-7xl font-semibold tracking-tight text-white mb-6 leading-[1.1]">
                Create at the speed <br/> of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60a5fa] to-indigo-500">Turbo Generation</span>
             </h1>
             <p className="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed">
                The all-in-one generative suite for professionals. Stop jumping between apps. 
                Build, design, and animate from one powerful command center.
             </p>
              <div className="flex gap-4">
                 <button 
                   onClick={() => router.push('/text-to-image')}
                   className="group relative px-8 py-4 bg-white text-black rounded-full font-bold overflow-hidden transition-all hover:scale-105"
                 >
                  <span className="relative z-10 flex items-center gap-2">Start Creating <ArrowUpRight size={18} /></span>
                  <div className="absolute inset-0 bg-[#60a5fa] translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
                {/* <button className="px-8 py-4 bg-[#111] border border-white/10 text-white rounded-full font-medium hover:bg-[#222] flex items-center gap-2">
                  <Play size={16} fill="currentColor" className="text-slate-400" /> Watch Showreel
                </button> */}
             </div>
          </div>

          {/* Right: The Specific Card Stack (Upscale + Code) */}
          <div className="hidden lg:block relative h-[500px] w-full perspective-[1000px] animate-in zoom-in-95 duration-1000 fade-in delay-200">
             
              {/* Card 1: Video/Back (Right) */}
              <div className="absolute top-[10%] right-[5%] w-64 h-40 bg-[#0A0A0A] border border-white/10 rounded-xl p-2 shadow-2xl rotate-6 z-10 opacity-60">
                 <div className="w-full h-full bg-[#111] rounded-lg overflow-hidden relative">
                    <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400" className="object-cover w-full h-full opacity-50" alt="" />
                 </div>
              </div>

              {/* Card 2: Main Hero (Center - Upscale) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-auto bg-[#050505] border border-white/10 rounded-2xl p-4 shadow-[0_0_60px_rgba(0,0,0,0.8)] z-30 hover:scale-105 transition-transform duration-500">
                 <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-1.5">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">IMG_GEN_001</div>
                 </div>
                 <div className="w-full h-64 bg-[#111] rounded-lg mb-4 overflow-hidden relative group">
                     <img src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=400" className="w-full h-full object-cover" alt="Gen" />
                     {/* Blue Scanline */}
                     <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#60a5fa]/20 to-transparent h-4 w-full animate-[scan_2s_linear_infinite]"></div>
                 </div>
                 <button className="w-full py-2.5 bg-[#2563eb] text-white rounded-lg text-xs font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:bg-[#1d4ed8] transition-colors">
                    Upscale 4x
                 </button>
              </div>

              {/* Card 3: Code Snippet (Left) */}
              <div className="absolute bottom-[15%] left-[5%] w-60 h-auto bg-[#0A0A0A]/90 backdrop-blur border border-white/10 rounded-xl p-4 shadow-2xl -rotate-6 z-20">
                 <div className="text-xs font-mono text-slate-400 space-y-2">
                    <div className="flex justify-between"><span className="text-[#60a5fa]">model:</span> <span>flux-pro</span></div>
                    <div className="flex justify-between"><span className="text-[#60a5fa]">seed:</span> <span>49201044</span></div>
                    <div className="flex justify-between"><span className="text-[#60a5fa]">steps:</span> <span>35</span></div>
                    <div className="flex justify-between"><span className="text-[#60a5fa]">cfg:</span> <span>7.5</span></div>
                    <div className="w-full h-px bg-white/10 my-2"></div>
                    <div className="text-[10px] text-green-400 flex items-center gap-1"><Sparkles size={10}/> Complete (0.8s)</div>
                 </div>
              </div>
          </div>
       </div>
       <style>{`@keyframes scan { 0% { top: -20%; opacity: 0; } 50% { opacity: 1; } 100% { top: 120%; opacity: 0; } }`}</style>
    </div>
  );
}

/**
 * SLIDE 2: "The Model Matrix"
 */
function SlideTwoContent() {
  const router = useRouter();

  return (
    <div className="w-full h-full flex items-center justify-center relative bg-black">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/[0.1] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-600/[0.1] rounded-full blur-[100px]" />

        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full z-10">
          <div className="lg:col-span-4 flex flex-col items-start animate-in slide-in-from-bottom-8 duration-700 fade-in">
             <div className="inline-flex items-center gap-2 border border-purple-500/30 bg-purple-500/10 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-purple-400 mb-6">
                <Box size={12} /> Model Library
             </div>
             <h1 className="text-5xl md:text-5xl font-medium tracking-tight text-white mb-6">
               <span>Nano Banana Pro </span> <br/>
               <span>Seedream V4.5</span><br/>
               <span>Flux 2 Pro</span> <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">All in One Place.</span>

             </h1>
             <p className="text-lg text-slate-400 mb-8">
                Why choose WILDMIND AI? <br/> Access the world's most powerful image and video models through a unified API.
             </p>
             <button 
               className="flex items-center gap-2 text-white border-b border-[#60a5fa] pb-1 hover:text-[#60a5fa] transition-colors"
               onClick={() => {
                 const element = document.getElementById('ai-tools-section');
                 if (element) {
                   element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 }
               }}
             >
                View all 40+ Models <ArrowUpRight size={16} />
             </button>
          </div>

          <div className="lg:col-span-8 grid grid-cols-3 gap-4 h-[400px]">
             {/* Vibrant Cards Grid (Staggered) */}
              {['Fashion Photography', 'Product Visuals', 'Cinematic Visuals'].map((model, i) => {
               // Use Zata URLs for first and middle cards, Unsplash for last
               const imageUrl = i === 0
                 ? 'https://idr01.zata.ai/devstoragev1/users/lightmagic/image/U28CJQiOfvGAA5A7JUcu/U28CJQiOfvGAA5A7JUcu-image-1_optimized.avif'
                 : i === 1 
                 ? 'https://idr01.zata.ai/devstoragev1/users/vivek/image/HrzetVoJ3yLhuEYmNtAY/HrzetVoJ3yLhuEYmNtAY-image-1.jpeg'
                 : `https://idr01.zata.ai/devstoragev1/users/wildchild/image/N6nsJKPh7ukRaw5R5xlx/N6nsJKPh7ukRaw5R5xlx-image-1.jpeg`;
               
               return (
                 <div key={i} className={`relative group h-full rounded-3xl overflow-hidden border border-white/10 hover:border-[#60a5fa] transition-all duration-500 ${i === 0 ? 'translate-y-8' : i === 1 ? '-translate-y-4' : 'translate-y-8'}`}>
                    <img src={imageUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={model} />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-lg border border-white/10">
                       <div className="text-white font-bold text-sm">{model}</div>
                    </div>
                 </div>
               );
             })}
          </div>
        </div>
    </div>
  );
}

/**
 * SLIDE 3: "Industry Solutions"
 */
function SlideThreeContent() {
  return (
    <div className="w-full h-full flex items-center justify-center relative bg-black">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-amber-900/[0.05] rounded-full blur-[120px]" />

        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full z-10">
           {/* Visual: Industry Grid (Left Side) */}
           <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-700">
              {[
                { icon: Watch, label: "Luxury Horology", img: "1523170335258-f5ed11844a49" },
                { icon: Scissors, label: "Haute Couture", img: "https://idr01.zata.ai/devstoragev1/users/vivek/image/Pq8kjgiR1q6tw6xtKpGL/Pq8kjgiR1q6tw6xtKpGL-image-1.jpeg", offset: true },
                { icon: Zap, label: "Footwear Design", img: "https://idr01.zata.ai/devstoragev1/users/wildchild/image/Y3gk0xeGK0W4cV0UrcWG/Y3gk0xeGK0W4cV0UrcWG-image-1.jpeg" },
                { icon: Sparkles, label: "Fine Jewelry", img: "https://idr01.zata.ai/devstoragev1/users/vivek/image/AgKABQMG65ej5esP29Ew/AgKABQMG65ej5esP29Ew-image-1.jpeg", offset: true },
              ].map((item, i) => {
                // Handle both full URLs and Unsplash photo IDs
                const imageUrl = item.img.startsWith('http://') || item.img.startsWith('https://') 
                  ? item.img 
                  : `https://images.unsplash.com/photo-${item.img}?q=80&w=400`;
                
                return (
                  <div key={i} className={`bg-[#080808] border border-white/5 p-2 rounded-2xl group hover:border-[#60a5fa]/30 transition-colors ${item.offset ? 'translate-y-8' : ''}`}>
                     <div className="h-48 rounded-xl overflow-hidden relative mb-2">
                        <img src={imageUrl} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt={item.label} />
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur p-1.5 rounded-full"><item.icon size={12} className="text-white"/></div>
                     </div>
                     <div className="px-2"><span className="text-sm font-medium text-slate-300">{item.label}</span></div>
                  </div>
                );
              })}
           </div>

           {/* Text Content */}
           <div className="flex flex-col items-start animate-in slide-in-from-right-8 duration-700 fade-in">
           <div className="inline-flex items-center gap-2 border border-[#60a5fa]/30 bg-[#60a5fa]/10 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#60a5fa] mb-8 shadow-[0_0_15px_rgba(96,165,250,0.1)]">
                <span className="w-2 h-2 rounded-full bg-[#60a5fa] animate-pulse"></span>
                For Business
             </div>
             <h1 className="text-6xl md:text-7xl font-semibold tracking-tight text-white mb-6 leading-[1.1]">
                Perfect assets <br/> for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60a5fa] to-indigo-500">Every Industry.</span>
             </h1>
             <p className="text-lg text-slate-400 mb-8 max-w-lg">
                Generate professional-grade assets for e-commerce, advertising, and prototyping. 
             </p>
             <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                 {["Virtual Try-on", "3D Texture Gen", "Fashion Photography", "Brand-Ready Visual Consistency", "Product Photography"].map(f => (
                   <div key={f} className="flex items-center gap-2 text-sm text-slate-300"><div className="w-1.5 h-1.5 bg-[#60a5fa] rounded-full"></div> {f}</div>
                 ))}
             </div>
          </div>
        </div>
    </div>
  );
}
