'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, LayoutGrid, List, Menu, Heart } from 'lucide-react';
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

  // ... deriveCategoryFromPath ...
  // ... useState ...

  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Define Top 5 Mostly Used Workflows
  const MOSTLY_USED_IDS = [
    'creatively-upscale',
    'remove-background',
    'restore-old-photo',
    'photo-to-line-drawing',
    'become-celebrity'
  ];

  // Use passed workflows if available, otherwise filter from global
  // If category is "All", show only the Mostly Used workflows
  // Use passed workflows if available, otherwise filter from global
  // If category is "All", show only the Mostly Used workflows
  const filteredWorkflows = useMemo(() => {
    let result = workflows;

    if (!result) {
      if (activeCategory === "All") {
        // Show only curated list for "Mostly Used"
        const mostlyUsedIds = [
          'creatively-upscale',
          'turn-into-figurine', // Viral Trend
          'replace-element',    // General
          'style-transfer-viral', // Viral Trend
          'relighting'          // Fun
        ];
        result = WORKFLOWS_DATA.filter(wf => mostlyUsedIds.includes(wf.id));
      } else {
        result = WORKFLOWS_DATA.filter((wf) => wf.category === activeCategory);
      }
    }

    // Filter by search query
    if (searchQuery) {
      result = result.filter(wf =>
        wf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (wf.description && wf.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply visibility filters
    return result.filter(wf => {
      // Logic for determining if an item is "Coming Soon"
      const isComingSoon = (!['General', 'Photography', 'Fun', 'Viral Trend', 'Fashion', 'Branding', 'Architecture'].includes(wf.category) && wf.id !== 'selfie-video') || wf.comingSoon;

      // Hide coming soon items if they are in the 'Fun' category
      if (wf.category === 'Fun' && isComingSoon) return false;

      return true;
    });
  }, [activeCategory, workflows, searchQuery]);


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
      {/* Mobile Title (Static - Scrolls away) */}
      <div className="md:hidden pt-8 pb-2 px-0 bg-[#07070B]">
        <div className="mb-2">
          <h3 className="text-white text-xl font-semibold mb-0">
            Explore Apps
          </h3>
          <p className="text-white/80 text-xs mt-0">
            Explore AI tools that make your creative process easier and better
          </p>
        </div>
      </div>

      {/* Sticky Header Section */}
      <div className="sticky top-0 z-20 bg-[#07070B] -mx-2 px-2">
        <div className="mb-2 md:mb-1 pt-2">



          {/* Mobile Toolbar (Sticky) */}
          <div className="flex flex-col md:hidden pb-2 pt-1">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0">
              {/* Category Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleCategoryClick('All')}
                  className={`inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-medium transition-all border ${activeCategory === 'All'
                    ? 'bg-white border-white/5 text-black'
                    : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                >
                  Mostly Used
                </button>
                {CATEGORIES.filter(c => c !== 'All').map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-medium transition-all border whitespace-nowrap ${activeCategory === cat
                      ? 'bg-white border-white/5 text-black'
                      : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Right Side Actions: Heart + Search */}
              <div className="ml-auto flex items-center gap-1 flex-shrink-0 pl-1">
                <button className="p-1.5 rounded-lg border flex items-center justify-center transition-all bg-white/5 text-white border-white/10 hover:bg-white/10">
                  <Heart size={16} />
                </button>
                <div className="relative flex items-center">
                  <input
                    placeholder="Search by prompt..."
                    className="px-2 py-1.5 rounded-lg text-[11px] bg-white/5 border border-white/15 focus:outline-none focus:ring-1 focus:ring-white/10 focus:border-white/10 text-white placeholder-white/90 w-32"
                    type="text"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Title & Controls Row */}
          {/* Desktop Title & Controls Row */}
          <div className="hidden md:flex flex-col mb-2">
            <div className="flex items-center justify-between gap-4 mb-1">
              <div className="flex flex-col">
                <h3 className="text-white text-xl sm:text-2xl md:text-2xl font-semibold">
                  Explore Apps
                </h3>
                <p className="text-white/80 text-xs sm:text-lg md:text-sm pb-1 pt-2">
                  Explore AI tools that make your creative process easier and better
                </p>
              </div>

              {/* Right Side Controls */}
              <div className="flex items-center gap-3 pb-1">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#0A0A0F] border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/20 w-48 transition-all"
                  />
                </div>

                {/* Toggle */}
                <div className="flex items-center bg-[#0A0A0F] border border-white/10 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Category Navigation */}
            <div className="hidden md:flex items-center gap-3 overflow-x-auto no-scrollbar py-4">
              <button
                onClick={() => handleCategoryClick('All')}
                className={`inline-flex items-center px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border relative gap-2 ${activeCategory === 'All'
                  ? 'bg-white border-white/5 text-black'
                  : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                  }`}
              >
                Mostly Used
              </button>

              {CATEGORIES.filter(cat => cat !== 'All').map((cat) => {
                const isCatComingSoon = !['General', 'Fun', 'Viral Trend', 'Photography', 'Fashion', 'Branding', 'Architecture'].includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`inline-flex items-center px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border relative gap-2 ${activeCategory === cat
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
      </div>




      {/* Workflow Grid */}
      {filteredWorkflows.length > 0 ? (
        <div className={viewMode === 'grid'
          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 md:gap-x-6 gap-y-10"
          : "flex flex-col gap-4"
        }>
          {filteredWorkflows.map((wf) => {
            const isComingSoon = (!['General', 'Photography', 'Fun', 'Viral Trend'].includes(wf.category) && wf.id !== 'selfie-video') || wf.comingSoon;

            return (

              <WorkflowCard key={wf.id} wf={wf} router={router} />
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
    </div>

  );
}

function WorkflowCard({ wf, router }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isComingSoon = (!['General', 'Branding', 'Photography', 'Architecture', 'Fun', 'Viral Trend', 'Fashion'].includes(wf.category) && wf.id !== 'selfie-video') || wf.comingSoon;

  const handleClick = () => {
    if (isComingSoon) return;

    // Route to custom pages logic
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
    } else if (wf.id === 'create-logo') {
      router.push('/view/workflows/branding/create-logo');
    } else if (wf.id === 'business-card') {
      router.push('/view/workflows/branding/business-card');
    } else if (wf.id === 'logo-variations') {
      router.push('/view/workflows/branding/logo-variations');
    } else if (wf.id === 'mockup-generation') {
      router.push('/view/workflows/branding/mockup-generation');
    } else if (wf.category === 'Photography') {
      router.push(`/view/workflows/photography/${wf.id}`);
    } else if (wf.category === 'Architecture') {
      router.push(`/view/workflows/architecture/${wf.id}`);
    } else if (wf.category === 'Fun') {
      router.push(`/view/workflows/fun/${wf.id}`);
    } else if (wf.category === 'Viral Trend') {
      router.push(`/view/workflows/viral-trend/${wf.id}`);
    } else if (wf.category === 'Fashion') {
      router.push(`/view/workflows/fashion/${wf.id}`);
    } else {
      router.push(`/view/workflows/${wf.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsPlaying(true)}
      onMouseLeave={() => setIsPlaying(false)}
      className={`group flex flex-col transition-all duration-300 ${isComingSoon ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'}`}
    >
      <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-white/5 mb-4 border border-white/5 group-hover:border-white/10 transition-all duration-500 shadow-2xl">
        {/* Thumbnail (Visible by default) */}
        <img
          src={wf.thumbnail}
          className={`absolute inset-0 w-full h-full ${wf.imageFit || 'object-cover'} ${wf.imagePosition || 'object-top'} ${isComingSoon ? 'opacity-30 grayscale' : 'opacity-100'} transition-all duration-500`}
          alt={wf.title}
        />

        {/* Result Media (Visible on hover) */}
        {!isComingSoon && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
            {wf.video ? (
              isPlaying && (
                <video
                  src={wf.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )
            ) : (
              <img
                src={wf.sampleAfter}
                className={`absolute inset-0 w-full h-full ${wf.imageFit || 'object-cover'} ${wf.imagePosition || 'object-top'}`}
                alt={`${wf.title} Result`}
              />
            )}
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
}
