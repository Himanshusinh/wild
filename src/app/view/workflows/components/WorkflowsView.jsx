'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, LayoutGrid, List } from 'lucide-react';
import { WORKFLOWS_DATA, CATEGORIES } from './data';

// ... imports
export default function WorkflowsView({ openModal, initialCategory = "All", basePath = "/view/workflows", workflows = null }) {
  const router = useRouter();
  const pathname = usePathname();

  // ... slugify ...
  const slugify = (cat) => cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').trim();
  const categoryBySlug = useMemo(() => (
    CATEGORIES.reduce((acc, cat) => {
      acc[slugify(cat)] = cat;
      return acc;
    }, {})
  ), []);

  // ... deriveCategoryFromPath ...
  // ... useState ...

  const deriveCategoryFromPath = (path) => {
    if (!path) return null;
    const segments = path.split('/').filter(Boolean);
    const last = segments[segments.length - 1];

    // 1. Check if last segment is a category slug
    if (categoryBySlug[last]) return categoryBySlug[last];

    // 2. Check if last segment is a workflow ID
    const workflow = WORKFLOWS_DATA.find(w => w.id === last);
    if (workflow) return workflow.category;

    // 3. Fallback
    return (last === 'workflows' ? null : 'All');
  };

  const [activeCategory, setActiveCategory] = useState(() => {
    return deriveCategoryFromPath(pathname) || initialCategory;
  });

  // Use passed workflows if available, otherwise filter from global
  const filteredWorkflows = useMemo(() => {
    if (workflows) return workflows;
    return activeCategory === "All"
      ? WORKFLOWS_DATA
      : WORKFLOWS_DATA.filter((wf) => wf.category === activeCategory);
  }, [activeCategory, workflows]);



  useEffect(() => {
    const nextCategory = deriveCategoryFromPath(pathname);
    setActiveCategory(nextCategory || initialCategory);
  }, [pathname, initialCategory]);



  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    const slug = slugify(cat);
    // Always use /view/workflows/[slug] for all categories, regardless of current basePath
    const path = `/view/workflows/${slug}`;
    router.push(path);
  };

  return (
    <div className="animate-in">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-20 bg-[#07070B]">
        <div className="mb-2 md:mb-1 pt-2">
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <h3 className="text-white text-xl sm:text-2xl md:text-2xl font-semibold">
                Magic Workflows
              </h3>
            </div>

            {/* Desktop Controls */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <div className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-3 pr-8 flex items-center">
                  <Search size={14} className="text-white/40 mr-2" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="bg-transparent border-none outline-none focus:ring-0 text-xs text-white placeholder-white/20 w-12 lg:w-32"
                  />
                </div>
              </div>
              <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                <button className="p-1.5 bg-white/10 text-white rounded-md">
                  <LayoutGrid size={14} />
                </button>
                <button className="p-1.5 text-white/40 hover:text-white transition-colors">
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          <p className="text-white/80 text-xs sm:text-lg md:text-sm pb-1">
            Explore AI tools that make your creative process easier and better
          </p>

          {/* Category Navigation - Moved Below Subtitle */}
          <div className="flex items-center md:gap-3 gap-2 overflow-x-auto no-scrollbar py-4">
            {CATEGORIES.map((cat) => {
              const isCatComingSoon = !['All', 'General', 'Viral Trend'].includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`inline-flex items-center px-5 py-2 rounded-full text-[11px] md:text-xs font-semibold whitespace-nowrap transition-all border relative gap-2 ${activeCategory === cat
                    ? 'bg-white border-white/5 text-black'
                    : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {cat}
                  {isCatComingSoon && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full border ${activeCategory === cat ? 'bg-black text-white border-black' : 'bg-white/10 border-white/10 text-white/40'}`}>
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Workflow Grid */}
      {filteredWorkflows.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
          {filteredWorkflows.map((wf) => {
            const isComingSoon = wf.category !== 'General' && wf.id !== 'selfie-video';

            return (
              <div
                key={wf.id}
                onClick={() => {
                  if (isComingSoon) return;
                  // Route to custom pages
                  if (wf.id === 'selfie-video') {
                    router.push('/view/workflows/viral-trend/selfie-video');
                  } else if (wf.id === 'remove-background') {
                    router.push('/view/workflows/general/remove-background');
                  } else if (wf.id === 'restore-old-photo') {
                    router.push('/view/workflows/general/restore-old-photo');
                  } else if (wf.id === 'photo-to-line-drawing') {
                    router.push('/view/workflows/general/photo-to-line-drawing');
                  } else if (wf.id === 'line-drawing-to-photo') {
                    router.push('/view/workflows/general/line-drawing-to-photo');
                  } else if (wf.id === 'become-celebrity') {
                    router.push('/view/workflows/fun/become-celebrity');
                  } else if (wf.id === 'remove-element') {
                    router.push('/view/workflows/general/remove-element');
                  } else if (wf.id === 'remove-watermark') {
                    router.push('/view/workflows/general/remove-watermark');
                  } else if (wf.id === 'creatively-upscale') {
                    router.push('/view/workflows/general/creatively-upscale');
                  } else if (wf.id === 'replace-element') {
                    router.push('/view/workflows/general/replace-element');
                  } else {
                    router.push(`/view/workflows/${wf.id}`);
                  }
                }}
                className={`group flex flex-col transition-all duration-300 ${isComingSoon ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'}`}
              >
                <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-white/5 mb-4 border border-white/5 group-hover:border-white/10 transition-all duration-500 shadow-2xl">
                  {/* Thumbnail (Visible by default) */}
                  <img
                    src={wf.thumbnail}
                    className={`absolute inset-0 w-full h-full ${wf.imageFit || 'object-cover'} ${wf.imagePosition || 'object-top'} ${isComingSoon ? 'opacity-30 grayscale' : 'opacity-100'} transition-all duration-500`}
                    alt={wf.title}
                  />

                  {/* Result Image (Visible on hover) */}
                  {!isComingSoon && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
                      <img
                        src={wf.sampleAfter}
                        className={`absolute inset-0 w-full h-full ${wf.imageFit || 'object-cover'} ${wf.imagePosition || 'object-top'}`}
                        alt={`${wf.title} Result`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse shadow-[0_0_8px_#60a5fa]"></div>
                          <span className="text-[10px] font-bold text-white tracking-widest uppercase">Live Now</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isComingSoon && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                      <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 shadow-2xl flex flex-col items-center gap-1">
                        <span className="opacity-50 text-[8px]">Coming</span>
                        <span>Soon</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-1 text-center">
                  <h3 className={`text-xs md:text-[13px] font-semibold transition-all duration-300 tracking-tight line-clamp-1 ${isComingSoon ? 'text-white/30' : 'text-white/70 group-hover:text-white'}`}>{wf.title}</h3>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/5 rounded-[2.5rem] mt-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
            <span className="text-2xl animate-pulse">✨</span>
          </div>
          <h3 className="text-white text-xl font-medium mb-2">Something Magic is Coming</h3>
          <p className="text-white/40 text-sm max-w-xs text-center">We're building incredible AI workflows for the {activeCategory} category. Stay tuned!</p>
        </div>
      )}
    </div >
  );
}
