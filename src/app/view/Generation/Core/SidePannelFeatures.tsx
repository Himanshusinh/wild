"use client";
import React from 'react';
import Image from 'next/image';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { ViewType, GenerationType } from '@/types/generation';
import { usePathname, useRouter } from 'next/navigation';
import {
  Hexagon,
  Home,
  Layers,
  Box,
  ImageIcon,
  Film,
  Music,
  CreditCard,
  History,
  Edit3,
  Crown,
  Menu,
  X
} from 'lucide-react';
import WSolid from '@/components/icons/WSolid';
import { useCredits } from '@/hooks/useCredits';
import { APP_ROUTES, NAV_ROUTES } from '@/routes/routes';

// --- Updated Sidebar Item: High Density & Max Readability ---
const SidebarItem = ({
  icon,
  label,
  isActive,
  onClick,
  url,
  setIsSidebarHovered
}: {
  icon: React.ReactElement<{ size?: number; strokeWidth?: number }>,
  label: string,
  isActive: boolean,
  onClick: (e: React.MouseEvent) => void,
  url: string,
  setIsSidebarHovered: (val: boolean) => void
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click (button 1) or Ctrl+Left click
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      e.preventDefault();
      window.open(url, '_blank');
    }
  };

  const handleAuxClick = (e: React.MouseEvent) => {
    // Middle click handler for better browser compatibility
    if (e.button === 1) {
      e.preventDefault();
      window.open(url, '_blank');
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Open in new tab if Ctrl is pressed
    if (e.ctrlKey) {
      e.preventDefault();
      window.open(url, '_blank');
    } else {
      onClick(e);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsSidebarHovered(true)}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onAuxClick={handleAuxClick}
      className={`group relative flex items-center justify-start md:flex-col md:items-center md:justify-center py-2.5 md:pl-1 pl-3 pr-0 transition-all duration-300 cursor-pointer
        ${isActive ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
    >
      {/* Refined Active Indicator */}
      {isActive && (
        <div className="absolute left-0 top-[20%] bottom-[20%]  w-[2px] bg-[#60a5fa] shadow-[0_0_12px_#60a5fa] rounded-r-full" />
      )}

      <div className={`transition-all duration-300  ${isActive ? 'scale-105 text-[#60a5fa]' : 'text-white'}`}>
        {/* Clone icon to enforce small size and thicker stroke for readability */}
        {React.isValidElement(icon) && React.cloneElement(icon, {
          size: 18,
          strokeWidth: 2
        })}
      </div>

      <span className={`ml-2 md:ml-0 md:mt-1 mt-0 text-[9px] uppercase font-black tracking-[0.12em] transition-colors duration-300
        ${isActive ? 'text-[#60a5fa]' : 'text-slate-100 '}`}>
        {label}
      </span>
    </div>
  );
};

const SidePannelFeatures = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarHovered, setIsSidebarHovered] = React.useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const userData = useAppSelector((state: any) => state?.auth?.user || null);
  const { creditBalance, loading: creditsLoading, refreshCredits } = useCredits();

  const nav = (url: string) => {
    setIsMobileSidebarOpen(false);
    router.push(url);
  };

  // Helper to get current page label based on pathname
  const getCurrentPageLabel = (): string => {
    if (!pathname) return 'Menu';
    const path = pathname.toLowerCase();

    if (path === '/' || path.includes('/homepage')) return 'Home';
    if (path.includes('/artstation')) return 'Gen-Art';
    if (path.includes('/canvas-projects')) return 'Studio';
    if (path.includes('/text-to-image')) return 'Image';
    if (path.includes('/text-to-music')) return 'Music';
    if (path.includes('/text-to-video')) return 'Video';
    if (path.includes('/editvideo')) return 'V-Edit';
    if (path.includes('/edit-image') || path.includes('edit')) return 'Edit';
    if (path.includes('/pricing')) return 'Pricing';
    if (path.includes('/history')) return 'History';

    return 'Menu';
  };

  return (
    <>
      {/* Mobile Toggle - Menu Icon */}
      {!isMobileSidebarOpen && (
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="fixed top-0 left-0 z-[60] md:hidden flex items-center gap-2 px-2 py-2"
        >
          <Menu size={24} className="text-[#f9fafb]" strokeWidth={2.5} />
        </button>
      )}

      {/* Main Sidebar Container */}
      <div
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`fixed top-0 bottom-0 left-0 flex flex-col transition-all duration-500 ease-in-out  bg-[#050505]/95 backdrop-blur-2xl
          ${isMobileSidebarOpen ? 'w-56 translate-x-0 z-[110]' : '-translate-x-full md:translate-x-0 z-[110] md:w-20'}`}
      >
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between px-3 pt-3 md:hidden">
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="flex items-center gap-0 px-0 py-1"
          >
            <X size={24} className="text-slate-100" />
          </button>
        </div>

        {/* Navigation Items - Tightened Gap */}
        <div className="flex flex-col gap-0.5 flex-1 overflow-y-auto no-scrollbar mx-1 md:pt-3 pt-1">
          {/* WildMind Logo as first item */}
          <div
            onClick={() => nav(APP_ROUTES.LANDING)}
            className="group relative flex items-center justify-start md:flex-col md:items-center md:justify-center py-0 md:pl-3 pl-2 pr-3 transition-all duration-300 cursor-pointer opacity-100"
          >
            <div className="relative w-[40px] h-[40px] md:w-[40px] md:h-[40px] flex items-center justify-center">
              <Image
                src="/core/logosquare.png"
                alt="WildMind Logo"
                fill
                className="object-contain"
                sizes="40px"
                unoptimized
              />
            </div>

            {/* Text label (kept for small screens) */}
            {/* <span className="ml-2 md:ml-0 md:mt-1.5 mt-0 md:text-[10px] text-[16px] uppercase font-black tracking-[0.12em] transition-all duration-300 text-slate-100 md:opacity-0 md:group-hover:opacity-100 md:translate-y-1 md:group-hover:translate-y-0">
              wildmindai
            </span> */}

            {/* Hover SVG: appears when the user hovers the logo group (better visual identity) */}
            {/* <Image
              src="/core/wildmind_text.svg"
              alt="WildMind Text Logo"
              className="hidden md:block ml-2 max-w-[120px] opacity-0 group-hover:opacity-100 transition-all duration-300"
              width={60}
              height={22}
              style={{ height: 22 }}
              unoptimized
            /> */}
          </div>

          <SidebarItem
            icon={<Home />}
            label="Home"
            isActive={pathname === APP_ROUTES.HOME || pathname === '/'}
            setIsSidebarHovered={setIsSidebarHovered}
            url={APP_ROUTES.HOME}
            onClick={() => nav(APP_ROUTES.HOME)}
          />
          <SidebarItem
            icon={<Layers />}
            label="Gen-Art"
            isActive={pathname?.includes('/ArtStation')}
            setIsSidebarHovered={setIsSidebarHovered}
            url="/view/ArtStation"
            onClick={() => nav('/view/ArtStation')}
          />
          <SidebarItem
            icon={<WSolid />}
            label="Studio"
            isActive={pathname?.includes('/canvas-projects')}
            setIsSidebarHovered={setIsSidebarHovered}
            url="/canvas-projects"
            onClick={() => nav('/canvas-projects')}
          />

          <SidebarItem
            icon={<Hexagon />}
            label="Workflows"
            isActive={pathname?.includes('/view/workflows') || pathname?.includes('/workflows')}
            setIsSidebarHovered={setIsSidebarHovered}
            url={NAV_ROUTES.WORKFLOWS}
            onClick={() => nav(NAV_ROUTES.WORKFLOWS)}
          />

          <SidebarItem
            icon={<ImageIcon />}
            label="Image"
            isActive={pathname?.includes('/text-to-image')}
            setIsSidebarHovered={setIsSidebarHovered}
            url="/text-to-image"
            onClick={() => nav('/text-to-image')}
          />

          <SidebarItem
            icon={<Film />}
            label="Video"
            isActive={pathname?.includes('/text-to-video')}
            setIsSidebarHovered={setIsSidebarHovered}
            url="/text-to-video"
            onClick={() => nav('/text-to-video')}
          />

          <SidebarItem
            icon={<Music />}
            label="Audio"
            isActive={pathname?.includes('/text-to-music')}
            setIsSidebarHovered={setIsSidebarHovered}
            url="/text-to-music"
            onClick={() => nav('/text-to-music')}
          />


          <SidebarItem
            icon={<CreditCard />}
            label="Pricing"
            isActive={pathname?.includes('/pricing')}
            setIsSidebarHovered={setIsSidebarHovered}
            url={NAV_ROUTES.PRICING}
            onClick={() => nav(NAV_ROUTES.PRICING)}
          />
          <SidebarItem
            icon={<History />}
            label="History"
            isActive={pathname?.includes('/history')}
            setIsSidebarHovered={setIsSidebarHovered}
            url="/history"
            onClick={() => nav('/history')}
          />
        </div>

        {/* Profile & Credits - Compact Bento Style */}
        <div className="mt-auto py-5 flex flex-col items-start md:items-center pl-3 md:pl-0 border-t border-white/5">
          <div className="relative group flex flex-col items-start md:items-center gap-1.5">
            <div
              className="relative cursor-pointer"
              onClick={() => nav(NAV_ROUTES.ACCOUNT_MANAGEMENT)}
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-slate-900 to-slate-800 border border-white/10 overflow-hidden group-hover:border-[#60a5fa]/50 transition-all">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {userData?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>

            {/* Credits Display - Show on hover below profile */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                refreshCredits();
              }}
              className="cursor-pointer transition-all duration-300 md:opacity-0 md:group-hover:opacity-100 md:translate-y-1 md:group-hover:translate-y-0"
            >
              <div className="bg-[#60a5fa]/10 border border-[#60a5fa]/20 text-[#60a5fa] text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg hover:bg-[#60a5fa]/20 transition-colors">
                {creditsLoading ? '...' : (creditBalance ?? 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default SidePannelFeatures;
