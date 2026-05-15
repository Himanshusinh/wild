'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, LayoutGrid, List, Menu, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WORKFLOWS_DATA, CATEGORIES } from './data';
import { useDispatch, useSelector } from 'react-redux';
import { setSidebarExpanded } from '@/store/slices/uiSlice';
import { VirtualTryonTool } from './VirtualTryonTool';
import { useAppSelector } from '@/store/hooks';


// ... imports
export default function WorkflowsView({ openModal, initialCategory = "All", basePath = "/view/workflows", workflows = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const userData = useAppSelector((state) => state?.auth?.user || null);
  const isAuth = !!userData;


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
      const isComingSoon = (!['General', 'Photography', 'Fun', 'Fashion', 'Branding', 'Architecture', 'Film Industry', 'Virtual Tryon'].includes(wf.category) && wf.id !== 'selfie-video') || wf.comingSoon;

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
    // setActiveCategory(cat); // Optimistic update removed to prevent double-load animation
    const slug = slugify(cat);
    // Always use /view/workflows/[slug] for all categories, regardless of current basePath
    const path = `/view/workflows/${slug}`;
    router.push(path);
  };

  return (
    <div className="">
      {/* Sticky Header Section */}
      <div className={`fixed top-0 right-0 z-40 border-b border-white/5 shadow-2xl transition-all bg-[#07070B]/95 backdrop-blur-md py-1 md:py-0 px-2 sm:px-6 md:px-6 left-0 ${isAuth ? 'md:left-[72px]' : 'md:left-[72px]'}`}>
        {/* Mobile Title (Now Sticky) */}
        <div className="animate-in md:hidden pt-2 pb-1 px-1 flex items-center gap-1">
          <button
            onClick={() => dispatch(setSidebarExpanded(true))}
            className="flex h-10 w-10 items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            <Menu size={24} />
          </button>
          <h3 className="text-white text-base font-bold leading-tight tracking-tight">
            Explore Apps
          </h3>
        </div>


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
          <div className="animate-in hidden md:flex flex-col mb-2">
            <div className="flex items-center justify-between gap-4 mb-1">
              <div className="flex flex-col">
                <h3 className="text-white text-xl sm:text-2xl md:text-2xl font-semibold">
                  Explore Apps
                </h3>
                {/* <p className="text-white/80 text-xs sm:text-lg md:text-sm pb-1 pt-2">
                  Explore AI tools that make your creative process easier and better
                </p> */}
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
            <div className="hidden md:flex items-center gap-3 overflow-x-auto no-scrollbar py-0">
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
                const isCatComingSoon = !['General', 'Fun', 'Photography', 'Fashion', 'Branding', 'Architecture', 'Film Industry', 'Virtual Tryon'].includes(cat);
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
      <div className="pt-[110px] md:pt-[100px]">
        {/* Workflow Grid */}
      {filteredWorkflows.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory + viewMode}


            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.5,
                  ease: [0.25, 0.1, 0.25, 1.0], // cubic-bezier for smooth professional feel
                  staggerChildren: 0.05
                }
              },
              exit: {
                opacity: 0,
                y: -10,
                transition: { duration: 0.2, ease: "easeInOut" }
              }
            }}
            className={viewMode === 'grid'
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 md:gap-x-6 gap-y-10"
              : "flex flex-col gap-4"
            }
          >
            {filteredWorkflows.map((wf) => {
              const isComingSoon = (!['General', 'Photography', 'Fun', 'Virtual Tryon'].includes(wf.category) && wf.id !== 'selfie-video') || wf.comingSoon;

              return (
                <WorkflowCard key={wf.id} wf={wf} router={router} />
              );
            })}
          </motion.div>
        </AnimatePresence>
      ) : activeCategory === "Virtual Tryon" ? (
        <div className="mt-4">
          <VirtualTryonTool />
        </div>
      ) : (
        <div className="animate-in flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/5 rounded-[2.5rem] mt-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">

            <span className="text-2xl animate-pulse">✨</span>
          </div>
          <h3 className="text-white text-xl font-medium mb-2">Something Magic is Coming</h3>
          <p className="text-white/40 text-sm max-w-xs text-center">We're building incredible AI workflows for the {activeCategory} category. Stay tuned!</p>
        </div>
      )}
      </div>
    </div>

  );
}

function WorkflowCard({ wf, router }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isComingSoon = (!['General', 'Branding', 'Photography', 'Architecture', 'Fun', 'Fashion', 'Film Industry', 'Virtual Tryon'].includes(wf.category) && wf.id !== 'selfie-video') || wf.comingSoon;

  const handleClick = () => {
    if (isComingSoon) return;

    // Use a unified routing strategy based on category slugs
    // This ensures coverage for ALL categories (Film Industry, Social Media, etc.)
    // and matches the directory structure: /view/workflows/[category-slug]/[workflow-id]

    const categorySlug = wf.category.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
    router.push(`/view/workflows/${categorySlug}/${wf.id}`);
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsPlaying(true)}
      onMouseLeave={() => setIsPlaying(false)}
      className={`group relative flex flex-col p-[10px] pb-3 bg-[#161616] border border-white/5 rounded-[20px] transition-all duration-300 hover:bg-[#1A1A1A] hover:border-white/10 ${isComingSoon ? 'cursor-not-allowed opacity-80' : 'cursor-pointer shadow-lg hover:shadow-2xl'}`}
      whileHover={!isComingSoon ? { y: -5 } : {}}
    >
      <div className="relative aspect-[4/5] rounded-[14px] overflow-hidden bg-white/5 border border-white/5 mb-3 shadow-inner">
        {/* Thumbnail (Visible by default) */}
        <img
          src={wf.thumbnail}
          className={`absolute inset-0 w-full h-full ${wf.imageFit || 'object-cover'} ${wf.imagePosition || 'object-top'} ${isComingSoon ? 'opacity-30 grayscale' : 'opacity-100'} transition-transform duration-500 group-hover:scale-[1.03]`}
          alt={wf.title}
        />

        {/* Heart Icon (top-right overlay) */}
        {!isComingSoon && (
          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-black/60 shadow-sm border border-white/5">
            <Heart size={14} className="text-white" />
          </div>
        )}

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
                src={wf.sampleAfter || wf.thumbnail}
                className={`absolute inset-0 w-full h-full ${wf.imageFit || 'object-cover'} ${wf.imagePosition || 'object-top'}`}
                alt={`${wf.title} Result`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
          </div>
        )}

        {isComingSoon && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="px-4 py-2 bg-black/60 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 flex items-center gap-2">
              Coming Soon
            </div>
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="flex flex-col flex-1 px-1 relative">
        <h3 className={`text-[15px] sm:text-[16px] font-semibold tracking-tight line-clamp-1 ${isComingSoon ? 'text-white/30' : 'text-[#FAFAFA] group-hover:text-white transition-colors'}`}>
          {wf.title}
        </h3>
        {wf.description ? (
          <p className={`text-[12px] sm:text-[13px] mt-1 leading-[1.4] line-clamp-1 pr-10 ${isComingSoon ? 'text-white/20' : 'text-[#87878C]'}`}>
            {wf.description}
          </p>
        ) : (
          <p className={`text-[12px] sm:text-[13px] mt-1 leading-[1.4] line-clamp-1 pr-10 ${isComingSoon ? 'text-white/20' : 'text-[#87878C]'}`}>
            {`Create beautiful ${wf.category.toLowerCase()} content with AI.`}
          </p>
        )}

        {/* Circular Arrow Button */}
        {!isComingSoon && (
          <div className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center text-black shadow-md transition-transform group-hover:scale-110">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  );
}
