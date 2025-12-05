'use client';

import React from 'react';
import { ModelItem } from '@/app/canvas-projects/components/ui/ModelItem';
import { Hexagon, Sparkles } from 'lucide-react';

const AIToolsSection: React.FC = () => {
  return (
    <section id="ai-tools-section" className="w-full md:pl-6 md:pr-6 pl-4 pr-4 md:mt-12 mt-6 md:pb-12 pb-4 animate-in fade-in duration-1000 delay-200">
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
          <div className="absolute md:top-8 top-4 left-4 md:left-4"><h3 className="text-4xl font-bold text-white">Google</h3></div>
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
          <div className="absolute md:top-8 top-4 left-4 md:left-4"><h3 className="text-4xl font-bold text-white">Runway</h3></div>
          <div className="absolute md:bottom-4 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-1 md:gap-2 gap-0">
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
          <div className="absolute md:top-8 top-4 left-4 md:left-4"><h3 className="text-3xl font-bold text-white flex items-center gap-2"><Hexagon size={24} fill="white" /> Wan</h3></div>
          <div className="absolute md:bottom-4 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-1 md:gap-2 gap-0">
            <ModelItem title="Wan 2.5" desc="Culturally tuned Video model" pro />
            <ModelItem title="Wan 2.5 Fast" desc="Real-time video generation" pro />

          </div>
        </div>

        {/* 4. OpenAI */}
        <div className="lg:col-span-2 md:col-span-1 relative md:h-80 h-50 rounded-3xl overflow-hidden border border-white/5 group bg-[#021109]">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
          <div className="absolute inset-0 bg-emerald-900/30 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="absolute md:top-8 top-4 left-4 md:left-4"><h3 className="text-3xl font-bold text-white">OpenAI</h3></div>
          <div className="absolute md:bottom-4 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-1 md:gap-2 gap-0">
            <ModelItem title="Sora 2" desc="Real-time video generation" pro />
            <ModelItem title="Gpt 4o" desc="Small, fast multimodal" />
            <ModelItem title="Sora 2 Pro" desc="Advanced video generation" />

          </div>
        </div>


        {/* 11. ByteDance | Seed */}
        <div className="lg:col-span-2 relative md:h-48 h-50 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
          <div className="absolute inset-0 bg-[url('https://idr01.zata.ai/devstoragev1/users/vivek/image/kODFXxRvnoly6PLZKQVA/kODFXxRvnoly6PLZKQVA-image-1.jpeg')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="absolute md:top-6 top-4 left-4 md:left-4"><h3 className="text-xl font-bold text-white flex items-center gap-2">ByteDance </h3></div>
          <div className="absolute md:bottom-4 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-2 md:gap-2 gap-0">
            <ModelItem title="Seedream V4 4K " desc="High-quality image generation" />
            <ModelItem title="Seedream v4.5 4K" desc="High-quality image generation" />
            <ModelItem title="Seedream 1 Pro" desc="High-quality image generation" />
            <ModelItem title="Seedream 1 Pro Lite" desc="High-quality image generation" />
          </div>
        </div>

        {/* 12. Moonvalley */}
        <div className="lg:col-span-2 relative md:h-48 h-40 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
          <div className="absolute inset-0 bg-[url('https://idr01.zata.ai/devstoragev1/users/vivek/image/INAjoeVc048MQtJFmWE2/INAjoeVc048MQtJFmWE2-image-1.jpeg')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute md:top-6 top-4 left-4 md:left-4"><h3 className="text-xl font-bold text-white tracking-widest">Tongyi-MAI</h3></div>
          <div className="absolute md:bottom-4 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-1 md:gap-2 gap-0">
            <ModelItem title="Z-Image-Turbo" desc="High-quality image generation" />
          </div>
        </div>



        {/* 5. Black Forest Labs */}
        <div className="lg:col-span-2 md:col-span-2 relative md:h-72 h-60 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
          <div className="absolute inset-0 bg-[url('https://idr01.zata.ai/devstoragev1/users/vivek/image/4BPkw6mKwZxgZmnf4P1o/4BPkw6mKwZxgZmnf4P1o-image-1.jpeg')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-black mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
          <div className="absolute md:top-8 top-4 left-4 md:left-4"><h3 className="text-2xl font-bold text-white">Black Forest Labs</h3></div>
          <div className="absolute md:bottom-4 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-2 md:gap-2 gap-0">
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
          <div className="absolute md:top-8 top-4 left-4 md:left-4"><h3 className="text-2xl font-bold text-white">Ideogram</h3></div>
          <div className="absolute md:bottom-4 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-1 md:gap-2 gap-0">
            <ModelItem title="Ideogram V3 Turbo" desc="Open, versatile synthesis" />
            <ModelItem title="Ideogram V3 Quality" desc="Open, versatile synthesis" />

          </div>
        </div>

        {/* 7. Hailuo AI */}
        <div className="lg:col-span-1 md:col-span-3 relative md:h-auto h-80 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
          <div className="absolute inset-0 bg-cyan-900/30 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-black/60"></div>
            <div className="absolute md:top-8 top-4 left-4 md:left-4"><h3 className="text-2xl font-bold text-white">Minimax</h3></div>
          <div className="absolute md:bottom-4 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-2 md:gap-2 gap-0">
            <ModelItem title=" Image-01" desc="General-purpose image" pro />
            <ModelItem title=" Hailuo-02" desc="Enhanced precision" pro />
            <ModelItem title=" Hailuo 2.3" desc="Enhanced precision" pro />
            <ModelItem title=" Hailuo 2.3 Fast" desc="Enhanced precision" pro />
          </div>
        </div>

        {/* 8. Pika */}
        <div className="lg:col-span-1 relative md:h-64 h-50 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
          <div className="absolute inset-0 bg-[url('https://idr01.zata.ai/devstoragev1/users/vivek/image/5peSZb41hZ26vpyz5Nka/5peSZb41hZ26vpyz5Nka-image-1.jpeg')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute md:top-6 top-4 left-4 md:left-4"><h3 className="text-3xl font-bold text-white">LTX Studio                        </h3></div>
          <div className="absolute md:bottom-4 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-1 md:gap-2 gap-0">
            <ModelItem title="LTX V2 Pro" desc="Creative, fast video" />
            <ModelItem title="LTX V2 Fast" desc="Creative, fast video" />

          </div>
        </div>

        {/* 9. Kling AI */}
        <div className="lg:col-span-2 relative md:h-64 h-60 rounded-3xl overflow-hidden border border-white/5 group bg-[#080808]">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?q=80&w=800')] bg-cover bg-center opacity-100 group-hover:scale-105 transition-all duration-700"></div>
          <div className="absolute inset-0 bg-red-900/20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
          <div className="absolute md:top-6 top-4 left-4 md:left-4"><h3 className="text-2xl font-bold text-white flex gap-2"><Sparkles size={24} className="text-[#60a5fa]" /> KlingAI</h3></div>
          <div className="absolute md:bottom-4 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-2 md:gap-2 gap-0">
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
          <div className="absolute md:top-6 top-4 left-4 md:left-4"><h3 className="text-2xl font-bold text-white tracking-widest uppercase font-mono">PixVerse</h3></div>
            <div className="absolute md:bottom-4 bottom-4 left-4 md:right-8 right-4 grid grid-cols-2 md:grid-cols-1 md:gap-2 gap-0">
            <ModelItem title="PixVerse V5" desc="Vector & design-oriented" />
          </div>
        </div>

        
      </div>
    </section>
  );
};

export default AIToolsSection;

