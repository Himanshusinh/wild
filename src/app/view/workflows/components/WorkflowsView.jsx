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
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`inline-flex items-center px-5 py-2 rounded-full text-[11px] md:text-xs font-semibold whitespace-nowrap transition-all border ${activeCategory === cat
                  ? 'bg-white border-white/5 text-black'
                  : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
        {filteredWorkflows.map((wf) => (
          <div
            key={wf.id}
            onClick={() => {
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
              } else if (wf.id === 'remove-element') {
                router.push('/view/workflows/general/remove-element');
              } else if (wf.id === 'remove-watermark') {
                router.push('/view/workflows/general/remove-watermark');
              } else {
                router.push(`/view/workflows/${wf.id}`);
              }
            }}
            className="group flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1"
          >
            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-white/[0.02] mb-4 border border-white/5 group-hover:border-white/10 transition-all duration-500 shadow-2xl">
              {/* Thumbnail (Visible by default) */}
              <img
                src={wf.thumbnail}
                className={`absolute inset-0 w-full h-full ${wf.imageFit || 'object-cover'} ${wf.imagePosition || 'object-top'} opacity-80 group-hover:opacity-0 transition-opacity duration-300`}
                alt={wf.title}
              />

              {/* Result Image (Visible on hover) */}
              <img
                src={wf.sampleAfter}
                className={`absolute inset-0 w-full h-full ${wf.imageFit || 'object-cover'} ${wf.imagePosition || 'object-top'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                alt={`${wf.title} Result`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            <div className="px-1 text-center">
              <h3 className="text-xs md:text-[13px] font-semibold text-white/70 group-hover:text-white transition-all duration-300 tracking-tight line-clamp-1">{wf.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div >
  );
}
