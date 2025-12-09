// 'use client';

// import React, { useState, useEffect } from 'react';
// import { 
//   ArrowRight, 
//   Sparkles, 
//   Zap, 
//   Gem, 
//   Shirt, 
//   Package, 
//   Gamepad2, 
//   Building2,
//   ChevronRight, 
//   ArrowUpRight,
//   ChevronLeft,
//   Play
// } from 'lucide-react';

// function HeroCarousel() {
//   const [currentSlide, setCurrentSlide] = useState(0);
//   const [isPaused, setIsPaused] = useState(false);

//   // Configuration for the 6 Slides
//   const slides = [
//     {
//       id: 'vision',
//       label: 'The Vision',
//       icon: <Zap size={14} />,
//       content: (
//         <div className="relative z-10 text-center md:max-w-4xl max-w-2xl px-6">
//           <div className="inline-flex items-center gap-2 border border-[#60a5fa]/30 bg-[#60a5fa]/10 rounded-full px-4 py-1.5 text-xs uppercase tracking-widest text-[#60a5fa] mb-8 shadow-[0_0_20px_rgba(96,165,250,0.3)] backdrop-blur-md">
//             <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse"></span>
//             WildCanvas 
//           </div>
//           <h1 className="text-xl md:text-7xl font-medium tracking-tighter text-white mb-6 leading-[0.95]">
//             The Operating System <br/>
//             <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-500">
//               For Creative Intelligence.
//             </span>
//           </h1>
//           <p className="md:text-lg text-xs late-400 max-w-2xl mx-auto leading-relaxed mb-8">
//             Orchestrate text, image, and video models on a single infinite canvas. 
//             Stop switching tabs. Start building worlds.
//           </p>
//           <button className="bg-white text-black px-8 py-3 rounded-full font-noraml hover:scale-105 transition-transform flex items-center gap-2 mx-auto">
//              Launching soon <ArrowUpRight size={18} />
//           </button>
//         </div>
//       ),
//       bg: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#000]"
//     },
//     {
//       id: 'models',
//       label: 'All Models',
//       icon: <Sparkles size={14} />,
//       content: (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-12">
//            <div className="text-left">
//               <h2 className="text-5xl font-medium tracking-tight text-white mb-4">Total Model <br/><span className="text-[#60a5fa]">Supremacy.</span></h2>
//               <p className="text-slate-400 mb-6">Flux, Midjourney, Runway, Kling, and Luma. Unified in one workflow.</p>
//               <div className="flex flex-wrap gap-2">
//                  {['Flux Pro', 'Gen-3 Alpha', 'Luma Dream Machine', 'GPT-4o'].map(m => (
//                     <span key={m} className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs text-slate-300">{m}</span>
//                  ))}
//               </div>
//            </div>
//            <div className="relative h-[300px]">
//               {/* Floating Cards Visual */}
//               <div className="absolute right-0 top-0 w-64 h-48 bg-white/5 border border-white/10 rounded-lg -rotate-6 z-10 overflow-hidden"><img src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=600&q=80" className="opacity-60 object-cover w-full h-full" alt="Model showcase 1"/></div>
//               <div className="absolute right-12 top-12 w-64 h-48 bg-white/5 border border-white/10 rounded-lg rotate-3 z-20 overflow-hidden shadow-2xl"><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" className="opacity-80 object-cover w-full h-full" alt="Model showcase 2"/></div>
//            </div>
//         </div>
//       ),
//       bg: "bg-[#020202]"
//     },
//     {
//       id: 'fashion',
//       label: 'Fashion',
//       icon: <Shirt size={14} />,
//       content: (
//          <div className="relative w-full h-full flex items-end p-12">
//             <div className="relative z-10 max-w-xl">
//                <div className="text-[#60a5fa] font-mono text-xs mb-2">● VIRTUAL ATELIER</div>
//                <h2 className="text-5xl font-bold text-white mb-4">Digital Couture.</h2>
//                <p className="text-slate-200 text-lg">Consistent fabric textures and model poses. Train custom LoRAs on your seasonal collection.</p>
//             </div>
//             <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Fashion showcase" />
//             <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"></div>
//          </div>
//       ),
//       bg: "bg-black"
//     },
//     {
//       id: 'jewelry',
//       label: 'Jewelry',
//       icon: <Gem size={14} />,
//       content: (
//          <div className="relative w-full h-full flex items-center justify-end p-12">
//             <div className="relative z-10 max-w-xl text-right">
//                <div className="text-amber-400 font-mono text-xs mb-2">● MACRO STUDIO</div>
//                <h2 className="text-5xl font-bold text-white mb-4">Precision & Light.</h2>
//                <p className="text-slate-200 text-lg">Ray-traced quality for gold, diamonds, and precious metals. Perfect caustic reflections.</p>
//             </div>
//             <img src="https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=1200&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Jewelry showcase" />
//             <div className="absolute inset-0 bg-gradient-to-l from-black via-black/50 to-transparent"></div>
//          </div>
//       ),
//       bg: "bg-black"
//     },
//     {
//       id: 'product',
//       label: 'Product',
//       icon: <Package size={14} />,
//       content: (
//          <div className="relative w-full h-full flex items-center p-12">
//              <div className="relative z-10 max-w-xl">
//                <div className="text-emerald-400 font-mono text-xs mb-2">● COMMERCIAL</div>
//                <h2 className="text-5xl font-bold text-white mb-4">Product Staging.</h2>
//                <p className="text-slate-200 text-lg">Place your product in any environment. Outpaint backgrounds and relight scenes instantly.</p>
//             </div>
//             <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Product showcase" />
//             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
//          </div>
//       ),
//       bg: "bg-black"
//     },
//     {
//       id: 'gaming',
//       label: 'Gaming',
//       icon: <Gamepad2 size={14} />,
//       content: (
//          <div className="relative w-full h-full flex items-center justify-center text-center p-12">
//              <div className="relative z-10 max-w-2xl">
//                <div className="text-purple-400 font-mono text-xs mb-2">● WORLD BUILDING</div>
//                <h2 className="text-5xl font-bold text-white mb-4">Assets at Scale.</h2>
//                <p className="text-slate-200 text-lg">Generate sprite sheets, textures, and concept art. Consistent style transfer across assets.</p>
//             </div>
//             <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Gaming showcase" />
//             <div className="absolute inset-0 bg-black/60"></div>
//          </div>
//       ),
//       bg: "bg-black"
//     }
//   ];

//   // Auto-advance logic (pauses on hover)
//   useEffect(() => {
//     if (isPaused) return;
//     const timer = setInterval(() => {
//       setCurrentSlide((prev) => (prev + 1) % slides.length);
//     }, 5000); 
//     return () => clearInterval(timer);
//   }, [isPaused, slides.length]);

//   return (
//     <section className="w-full md:px-6 px-4 md:pt-4 pt-6 pb-0 md:pb-6">
//       <div 
//         className="relative w-full h-[600px] mb-24 group overflow-hidden rounded-3xl border border-white/10 bg-[#050505]"
//         onMouseEnter={() => setIsPaused(true)}
//         onMouseLeave={() => setIsPaused(false)}
//       >
        
//         {/* Slides Viewport */}
//         <div 
//           className="absolute inset-0 flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" 
//           style={{ transform: `translateX(-${currentSlide * 100}%)` }}
//         >
//           {slides.map((slide, index) => (
//             <div key={slide.id} className={`min-w-full h-full relative flex items-center justify-center overflow-hidden ${slide.bg}`}>
//               {slide.content}
//             </div>
//           ))}
//         </div>

//         {/* --- SMART NAVIGATION BAR (The "Better Option" Fix) --- */}
//         <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent z-30">
//           <div className="flex items-center justify-center gap-2 max-w-4xl mx-auto overflow-x-auto no-scrollbar py-2">
//             {slides.map((slide, index) => (
//               <button
//                 key={slide.id}
//                 onClick={() => setCurrentSlide(index)}
//                 className={`
//                   flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 border relative
//                   ${currentSlide === index 
//                     ? 'bg-white/10 border-[#60a5fa] text-white shadow-[0_0_15px_rgba(96,165,250,0.3)] scale-105' 
//                     : 'bg-black/40 border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300 hover:border-white/10'}
//                 `}
//               >
//                 <span className={currentSlide === index ? 'text-[#60a5fa]' : ''}>{slide.icon}</span>
//                 {slide.label}
//                 {currentSlide === index && (
//                    // Progress bar inside the active tab
//                    <div className="absolute bottom-0 left-0 h-[2px] bg-[#60a5fa] animate-[width_5s_linear]" style={{ width: '100%' }}></div>
//                 )}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Side Arrows (Optional, mostly for desktop) */}
//         <button 
//           onClick={() => setCurrentSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1))}
//           className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 text-white/30 hover:bg-black/60 hover:text-white hover:scale-110 transition-all backdrop-blur-sm border border-transparent hover:border-white/10 z-20"
//           aria-label="Previous slide"
//         >
//           <ChevronLeft size={24} />
//         </button>
//         <button 
//           onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
//           className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 text-white/30 hover:bg-black/60 hover:text-white hover:scale-110 transition-all backdrop-blur-sm border border-transparent hover:border-white/10 z-20"
//           aria-label="Next slide"
//         >
//           <ChevronRight size={24} />
//         </button>

//         {/* Animation Style for Progress Bar */}
//         <style jsx>{`
//           @keyframes width {
//             from { width: 0%; }
//             to { width: 100%; }
//           }
//         `}</style>
//       </div>
//     </section>
//   );
// }

// const PromotionalBanner: React.FC = () => {
//   return <HeroCarousel />;
// };

// export default PromotionalBanner;

