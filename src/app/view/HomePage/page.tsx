'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/store/hooks'
import { setSidebarExpanded } from '@/store/slices/uiSlice'
import { Menu } from 'lucide-react'
// Import session checker utilities (available in browser console)
import '@/utils/checkSessionStatus'
// Nav and SidePannelFeatures are provided by the persistent root layout
import Header from './compo/Header'
import Image from 'next/image'
import { getImageUrl, API_BASE, imageRoutes } from './routes'
// import PromotionalBanner from './compo/PromotionalBanner'
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
const WarliFullscreenWalkthrough = dynamic(() => import('./compo/WarliFullscreenWalkthrough'), {
    ssr: false
})
const AjrakhFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/AjrakhFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const JhajjarFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/JhajjarFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const KaaviFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KaaviFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const KangraFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KangraFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const KarepaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KarepaFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const KhatwaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KhatwaFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const KhovarFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KhovarFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const KinnauriFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KinnauriFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const KosaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KosaFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const KutchFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KutchFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const LippanFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/LippanFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const MajuliFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/MajuliFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const ManjushaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/ManjushaFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const MataNiPachediFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/MataNiPachediFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const KalamkariFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KalamkariFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const SrikalahastiFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SrikalahastiFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const UppadaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/UppadaFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const TholuFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/TholuFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const ThangkaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/ThangkaFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const WanchoFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/WanchoFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const MonpaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/MonpaFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const HandmadePaperFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/HandmadePaperFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const MonpaMaskFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/MonpaMaskFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const KondapalliFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KondapalliFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const EtikoppakaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/EtikoppakaFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const MadhubaniFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/MadhubaniFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const KyilKhorFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KyilKhorFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const SherdukpenFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SherdukpenFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const IduMishmiFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/IduMishmiFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const AsharikandiFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/AsharikandiFullscreenWalkthrough'),
    {
        ssr: false
    }
)
const AzulejosFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/AzulejosFullscreenWalkthrough'),
    { ssr: false }
)
const BandhaniFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BandhaniFullscreenWalkthrough'),
    { ssr: false }
)
const BastarDhokraFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BastarDhokraFullscreenWalkthrough'),
    { ssr: false }
)
const MuriaWallPaintingFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/MuriaWallPaintingFullscreenWalkthrough'),
    { ssr: false }
)
const BastarWoodcraftFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BastarWoodcraftFullscreenWalkthrough'),
    { ssr: false }
)
const BhagalpurSilkFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BhagalpurSilkFullscreenWalkthrough'),
    { ssr: false }
)
const ChambaMiniatureFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/ChambaMiniatureFullscreenWalkthrough'),
    { ssr: false }
)
const ExposedLateriteFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/ExposedLateriteFullscreenWalkthrough'),
    { ssr: false }
)
const GharcholaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/GharcholaFullscreenWalkthrough'),
    { ssr: false }
)
const GodnaArtFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/GodnaArtFullscreenWalkthrough'),
    { ssr: false }
)
const TaiAhomManuscriptFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/TaiAhomManuscriptFullscreenWalkthrough'),
    { ssr: false }
)
const TangaliyaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/TangaliyaFullscreenWalkthrough'),
    { ssr: false }
)
const AgrarianIndustrialFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/AgrarianIndustrialFullscreenWalkthrough'),
    { ssr: false }
)
const IndoPortugueseFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/IndoPortugueseFullscreenWalkthrough'),
    { ssr: false }
)
const TikuliArtFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/TikuliArtFullscreenWalkthrough'),
    { ssr: false }
)
const SohraiKhovarFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SohraiKhovarFullscreenWalkthrough'),
    { ssr: false }
)
const WoodTempleCarvingFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/WoodTempleCarvingFullscreenWalkthrough'),
    { ssr: false }
)
const NeoAgrarianBrutalismFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/NeoAgrarianBrutalismFullscreenWalkthrough'),
    { ssr: false }
)
const PatolaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PatolaFullscreenWalkthrough'),
    { ssr: false }
)
const PhulkariFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PhulkariFullscreenWalkthrough'),
    { ssr: false }
)
const PithoraFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PithoraFullscreenWalkthrough'),
    { ssr: false }
)
const RoganArtFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/RoganArtFullscreenWalkthrough'),
    { ssr: false }
)
const RuralFiberCraftFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/RuralFiberCraftFullscreenWalkthrough'),
    { ssr: false }
)
const SarkandaArchitectureFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SarkandaArchitectureFullscreenWalkthrough'),
    { ssr: false }
)
const ShimplaHastkalaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/ShimplaHastkalaFullscreenWalkthrough'),
    { ssr: false }
)
const SitalpatiFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SitalpatiFullscreenWalkthrough'),
    { ssr: false }
)
const SohraiFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SohraiFullscreenWalkthrough'),
    { ssr: false }
)
const SonowalTextileFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SonowalTextileFullscreenWalkthrough'),
    { ssr: false }
)
const SufEmbroideryFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SufEmbroideryFullscreenWalkthrough'),
    { ssr: false }
)
const GanjifaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/GanjifaFullscreenWalkthrough'),
    { ssr: false }
)
const GaroWeavingFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/GaroWeavingFullscreenWalkthrough'),
    { ssr: false }
)
const NagaBodyClothFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/NagaBodyClothFullscreenWalkthrough'),
    { ssr: false }
)
const GondPaintingFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/GondPaintingFullscreenWalkthrough'),
    { ssr: false }
)
const HardOrnamentFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/HardOrnamentFullscreenWalkthrough'),
    { ssr: false }
)
const HimrooFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/HimrooFullscreenWalkthrough'),
    { ssr: false }
)
const HmaramFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/HmaramFullscreenWalkthrough'),
    { ssr: false }
)
const HoysalaReliefFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/HoysalaReliefFullscreenWalkthrough'),
    { ssr: false }
)
const JaintiaTextileFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/JaintiaTextileFullscreenWalkthrough'),
    { ssr: false }
)
const JhabuaDollsFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/JhabuaDollsFullscreenWalkthrough'),
    { ssr: false }
)
const MaheshwariFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/MaheshwariFullscreenWalkthrough'),
    { ssr: false }
)
const MashruweavingFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/MashruweavingFullscreenWalkthrough'),
    { ssr: false }
)
const MoirangpheeFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/MoirangpheeFullscreenWalkthrough'),
    { ssr: false }
)
const MotibharatFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/MotibharatFullscreenWalkthrough'),
    { ssr: false }
)
const MysorepaintingFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/MysorepaintingFullscreenWalkthrough'),
    { ssr: false }
)
const RosewoodinlayFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/RosewoodinlayFullscreenWalkthrough'),
    { ssr: false }
)
const NagashawlordinaryFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/NagashawlordinaryFullscreenWalkthrough'),
    { ssr: false }
)
const NgotekherhFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/NgotekherhFullscreenWalkthrough'),
    { ssr: false }
)
const NironalacquerFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/NironalacquerFullscreenWalkthrough'),
    { ssr: false }
)
const OpaquewrapFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/OpaquewrapFullscreenWalkthrough'),
    { ssr: false }
)
const TawlhlohpuanFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/TawlhlohpuanFullscreenWalkthrough'),
    { ssr: false }
)
const WoodcarvingFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/WoodcarvingFullscreenWalkthrough'),
    { ssr: false }
)
const WroughtironFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/WroughtironFullscreenWalkthrough'),
    { ssr: false }
)
const YakshaganaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/YakshaganaFullscreenWalkthrough'),
    { ssr: false }
)
const BaghEmbroideryFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BaghEmbroideryFullscreenWalkthrough'),
    { ssr: false }
)
const BagruPrintFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BagruPrintFullscreenWalkthrough'),
    { ssr: false }
)
const BandhejFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BandhejFullscreenWalkthrough'),
    { ssr: false }
)
const BerhampurPattaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BerhampurPattaFullscreenWalkthrough'),
    { ssr: false }
)
const BomkaiFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BomkaiFullscreenWalkthrough'),
    { ssr: false }
)
const BuddhistMaskFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BuddhistMaskFullscreenWalkthrough'),
    { ssr: false }
)
const SikkimCarpetFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SikkimCarpetFullscreenWalkthrough'),
    { ssr: false }
)
const DurrieFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/DurrieFullscreenWalkthrough'),
    { ssr: false }
)
const PunjabJuttiFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PunjabJuttiFullscreenWalkthrough'),
    { ssr: false }
)
const KathputliFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KathputliFullscreenWalkthrough'),
    { ssr: false }
)
const KhaddarFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KhaddarFullscreenWalkthrough'),
    { ssr: false }
)
const KhanduaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KhanduaFullscreenWalkthrough'),
    { ssr: false }
)
const KhesFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KhesFullscreenWalkthrough'),
    { ssr: false }
)
const MalerkotlaZariFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/MalerkotlaZariFullscreenWalkthrough'),
    { ssr: false }
)
const MolelaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/MolelaFullscreenWalkthrough'),
    { ssr: false }
)
const PichhwaiFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PichhwaiFullscreenWalkthrough'),
    { ssr: false }
)
const PattachitraFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PattachitraFullscreenWalkthrough'),
    { ssr: false }
)
const PipiliFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PipiliFullscreenWalkthrough'),
    { ssr: false }
)
const RajasthaniMiniatureFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/RajasthaniMiniatureFullscreenWalkthrough'),
    { ssr: false }
)
const SambalpuriBandhaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SambalpuriBandhaFullscreenWalkthrough'),
    { ssr: false }
)
const SanganerFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SanganerFullscreenWalkthrough'),
    { ssr: false }
)
const UstaArtFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/UstaArtFullscreenWalkthrough'),
    { ssr: false }
)
const PipiliAppliqueFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PipiliAppliqueFullscreenWalkthrough'),
    { ssr: false }
)
const SauraFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SauraFullscreenWalkthrough'),
    { ssr: false }
)
const WorkflowCarousel = dynamic(() => import('./compo/WorkflowCarousel').then(mod => ({ default: mod.default })), {
    loading: () => <div className="h-64 animate-pulse bg-white/5 rounded-lg" />
})
const CommunityCreations = dynamic(() => import('./compo/CommunityCreations').then(mod => ({ default: mod.default })), {
    loading: () => <div className="h-96 animate-pulse bg-white/5 rounded-lg" />
})
const TopCreators = dynamic(() => import('./compo/TopCreators'), {
    loading: () => <div className="h-32 animate-pulse bg-white/5 rounded-lg" />
})
const WobbleCard = dynamic(() => import('../Landingpage/components/wobble-card').then(mod => ({ default: mod.WobbleCard })), {
    loading: () => <div className="h-[500px] animate-pulse bg-white/5 rounded-lg" />
})
const FooterNew = dynamic(() => import('../core/FooterNew'), {
    loading: () => <div className="h-32 animate-pulse bg-white/5 rounded-lg" />
})

import type { WorkflowCard } from './compo/WorkflowCarousel'
import { ViewType, GenerationType } from '@/types/generation';
import MasonrySection from './compo/MasonrySection';
import AIToolsSection from './compo/AIToolsSection';

import CompactFeatureStrip from './CompactFeatureStrip';
import AllFeatures from './compo/AllFeatures';
import VideoModelCards from './compo/VideoModelCards';
import StudioHomeShowcase from './compo/StudioHomeShowcase';
import WildMindAIAPPS from './compo/WildMindAIAPPS';
import CreatorsSection from './compo/CreatorsSection';
import CreationCTASection from './compo/CreationCTASection';
import CreativeStyle from './compo/CreativeStyle';
import ImageVideoToggle from './compo/ImageVideoToggle';
import WhatsNew from './compo/WhatsNew';
import AllStylesModal from './compo/AllStylesModal';



const HomePage: React.FC = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [currentView, setCurrentView] = useState<ViewType>('home');
    const [currentGenerationType, setCurrentGenerationType] = useState<GenerationType>('text-to-image');
    const [showWildmindSkitPopup, setShowWildmindSkitPopup] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [showWarliWalkthrough, setShowWarliWalkthrough] = useState(false);
    const [showAjrakhWalkthrough, setShowAjrakhWalkthrough] = useState(false);
    const [showJhajjarWalkthrough, setShowJhajjarWalkthrough] = useState(false);
    const [showKaaviWalkthrough, setShowKaaviWalkthrough] = useState(false);
    const [showKangraWalkthrough, setShowKangraWalkthrough] = useState(false);
    const [showKarepaWalkthrough, setShowKarepaWalkthrough] = useState(false);
    const [showKhatwaWalkthrough, setShowKhatwaWalkthrough] = useState(false);
    const [showKhovarWalkthrough, setShowKhovarWalkthrough] = useState(false);
    const [showKinnauriWalkthrough, setShowKinnauriWalkthrough] = useState(false);
    const [showKosaWalkthrough, setShowKosaWalkthrough] = useState(false);
    const [showKutchWalkthrough, setShowKutchWalkthrough] = useState(false);
    const [showLippanWalkthrough, setShowLippanWalkthrough] = useState(false);
    const [showMajuliWalkthrough, setShowMajuliWalkthrough] = useState(false);
    const [showManjushaWalkthrough, setShowManjushaWalkthrough] = useState(false);
    const [showMataNiPachediWalkthrough, setShowMataNiPachediWalkthrough] = useState(false);
    const [showKalamkariWalkthrough, setShowKalamkariWalkthrough] = useState(false);
    const [showSrikalahastiWalkthrough, setShowSrikalahastiWalkthrough] = useState(false);
    const [showUppadaWalkthrough, setShowUppadaWalkthrough] = useState(false);
    const [showTholuWalkthrough, setShowTholuWalkthrough] = useState(false);
    const [showThangkaWalkthrough, setShowThangkaWalkthrough] = useState(false);
    const [showWanchoWalkthrough, setShowWanchoWalkthrough] = useState(false);
    const [showMonpaWalkthrough, setShowMonpaWalkthrough] = useState(false);
    const [showHandmadePaperWalkthrough, setShowHandmadePaperWalkthrough] = useState(false);
    const [showMonpaMaskWalkthrough, setShowMonpaMaskWalkthrough] = useState(false);
    const [showKondapalliWalkthrough, setShowKondapalliWalkthrough] = useState(false);
    const [showEtikoppakaWalkthrough, setShowEtikoppakaWalkthrough] = useState(false);
    const [showMadhubaniWalkthrough, setShowMadhubaniWalkthrough] = useState(false);
    const [showKyilKhorWalkthrough, setShowKyilKhorWalkthrough] = useState(false);
    const [showSherdukpenWalkthrough, setShowSherdukpenWalkthrough] = useState(false);
    const [showIduMishmiWalkthrough, setShowIduMishmiWalkthrough] = useState(false);
    const [showAsharikandiWalkthrough, setShowAsharikandiWalkthrough] = useState(false);
    const [showAzulejosWalkthrough, setShowAzulejosWalkthrough] = useState(false);
    const [showBandhaniWalkthrough, setShowBandhaniWalkthrough] = useState(false);
    const [showBastarDhokraWalkthrough, setShowBastarDhokraWalkthrough] = useState(false);
    const [showMuriaWallPaintingWalkthrough, setShowMuriaWallPaintingWalkthrough] = useState(false);
    const [showBastarWoodcraftWalkthrough, setShowBastarWoodcraftWalkthrough] = useState(false);
    const [showBhagalpurSilkWalkthrough, setShowBhagalpurSilkWalkthrough] = useState(false);
    const [showChambaMiniatureWalkthrough, setShowChambaMiniatureWalkthrough] = useState(false);
    const [showExposedLateriteWalkthrough, setShowExposedLateriteWalkthrough] = useState(false);
    const [showGharcholaWalkthrough, setShowGharcholaWalkthrough] = useState(false);
    const [showGodnaArtWalkthrough, setShowGodnaArtWalkthrough] = useState(false);
    const [showTaiAhomManuscriptWalkthrough, setShowTaiAhomManuscriptWalkthrough] = useState(false);
    const [showTangaliyaWalkthrough, setShowTangaliyaWalkthrough] = useState(false);
    const [showAgrarianIndustrialWalkthrough, setShowAgrarianIndustrialWalkthrough] = useState(false);
    const [showIndoPortugueseWalkthrough, setShowIndoPortugueseWalkthrough] = useState(false);
    const [showTikuliArtWalkthrough, setShowTikuliArtWalkthrough] = useState(false);
    const [showSohraiKhovarWalkthrough, setShowSohraiKhovarWalkthrough] = useState(false);
    const [showWoodTempleCarvingWalkthrough, setShowWoodTempleCarvingWalkthrough] = useState(false);
    const [showNeoAgrarianBrutalismWalkthrough, setShowNeoAgrarianBrutalismWalkthrough] = useState(false);
    const [showPatolaWalkthrough, setShowPatolaWalkthrough] = useState(false);
    const [showPhulkariWalkthrough, setShowPhulkariWalkthrough] = useState(false);
    const [showPithoraWalkthrough, setShowPithoraWalkthrough] = useState(false);
    const [showRoganArtWalkthrough, setShowRoganArtWalkthrough] = useState(false);
    const [showRuralFiberCraftWalkthrough, setShowRuralFiberCraftWalkthrough] = useState(false);
    const [showSarkandaArchitectureWalkthrough, setShowSarkandaArchitectureWalkthrough] = useState(false);
    const [showShimplaHastkalaWalkthrough, setShowShimplaHastkalaWalkthrough] = useState(false);
    const [showSitalpatiWalkthrough, setShowSitalpatiWalkthrough] = useState(false);
    const [showSohraiWalkthrough, setShowSohraiWalkthrough] = useState(false);
    const [showSonowalTextileWalkthrough, setShowSonowalTextileWalkthrough] = useState(false);
    const [showSufEmbroideryWalkthrough, setShowSufEmbroideryWalkthrough] = useState(false);
    const [showGanjifaWalkthrough, setShowGanjifaWalkthrough] = useState(false);
    const [showGaroWeavingWalkthrough, setShowGaroWeavingWalkthrough] = useState(false);
    const [showNagaBodyClothWalkthrough, setShowNagaBodyClothWalkthrough] = useState(false);
    const [showGondPaintingWalkthrough, setShowGondPaintingWalkthrough] = useState(false);
    const [showHardOrnamentWalkthrough, setShowHardOrnamentWalkthrough] = useState(false);
    const [showHimrooWalkthrough, setShowHimrooWalkthrough] = useState(false);
    const [showHmaramWalkthrough, setShowHmaramWalkthrough] = useState(false);
    const [showHoysalaReliefWalkthrough, setShowHoysalaReliefWalkthrough] = useState(false);
    const [showJaintiaTextileWalkthrough, setShowJaintiaTextileWalkthrough] = useState(false);
    const [showJhabuaDollsWalkthrough, setShowJhabuaDollsWalkthrough] = useState(false);
    const [showMaheshwariWalkthrough, setShowMaheshwariWalkthrough] = useState(false);
    const [showMashruweavingWalkthrough, setShowMashruweavingWalkthrough] = useState(false);
    const [showMoirangpheeWalkthrough, setShowMoirangpheeWalkthrough] = useState(false);
    const [showMotibharatWalkthrough, setShowMotibharatWalkthrough] = useState(false);
    const [showMysorepaintingWalkthrough, setShowMysorepaintingWalkthrough] = useState(false);
    const [showRosewoodinlayWalkthrough, setShowRosewoodinlayWalkthrough] = useState(false);
    const [showNagashawlordinaryWalkthrough, setShowNagashawlordinaryWalkthrough] = useState(false);
    const [showNgotekherhWalkthrough, setShowNgotekherhWalkthrough] = useState(false);
    const [showNironalacquerWalkthrough, setShowNironalacquerWalkthrough] = useState(false);
    const [showOpaquewrapWalkthrough, setShowOpaquewrapWalkthrough] = useState(false);
    const [showTawlhlohpuanWalkthrough, setShowTawlhlohpuanWalkthrough] = useState(false);
    const [showWoodcarvingWalkthrough, setShowWoodcarvingWalkthrough] = useState(false);
    const [showWroughtironWalkthrough, setShowWroughtironWalkthrough] = useState(false);
    const [showYakshaganaWalkthrough, setShowYakshaganaWalkthrough] = useState(false);
    const [showBaghEmbroideryWalkthrough, setShowBaghEmbroideryWalkthrough] = useState(false);
    const [showBagruPrintWalkthrough, setShowBagruPrintWalkthrough] = useState(false);
    const [showBandhejWalkthrough, setShowBandhejWalkthrough] = useState(false);
    const [showBerhampurPattaWalkthrough, setShowBerhampurPattaWalkthrough] = useState(false);
    const [showBomkaiWalkthrough, setShowBomkaiWalkthrough] = useState(false);
    const [showBuddhistMaskWalkthrough, setShowBuddhistMaskWalkthrough] = useState(false);
    const [showSikkimCarpetWalkthrough, setShowSikkimCarpetWalkthrough] = useState(false);
    const [showDurrieWalkthrough, setShowDurrieWalkthrough] = useState(false);
    const [showThangkaNewWalkthrough, setShowThangkaNewWalkthrough] = useState(false);
    const [showPunjabJuttiWalkthrough, setShowPunjabJuttiWalkthrough] = useState(false);
    const [showKathputliWalkthrough, setShowKathputliWalkthrough] = useState(false);
    const [showKhaddarWalkthrough, setShowKhaddarWalkthrough] = useState(false);
    const [showKhanduaWalkthrough, setShowKhanduaWalkthrough] = useState(false);
    const [showKhesWalkthrough, setShowKhesWalkthrough] = useState(false);
    const [showMalerkotlaZariWalkthrough, setShowMalerkotlaZariWalkthrough] = useState(false);
    const [showMolelaWalkthrough, setShowMolelaWalkthrough] = useState(false);
    const [showPichhwaiNewWalkthrough, setShowPichhwaiNewWalkthrough] = useState(false);
    const [showPattachitraWalkthrough, setShowPattachitraWalkthrough] = useState(false);
    const [showPipiliWalkthrough, setShowPipiliWalkthrough] = useState(false);
    const [showRajasthaniMiniatureWalkthrough, setShowRajasthaniMiniatureWalkthrough] = useState(false);
    const [showSambalpuriBandhaWalkthrough, setShowSambalpuriBandhaWalkthrough] = useState(false);
    const [showSanganerWalkthrough, setShowSanganerWalkthrough] = useState(false);
    const [showUstaArtWalkthrough, setShowUstaArtWalkthrough] = useState(false);
    const [showPipiliAppliqueWalkthrough, setShowPipiliAppliqueWalkthrough] = useState(false);
    const [showGaroWeavingNewWalkthrough, setShowGaroWeavingNewWalkthrough] = useState(false);
    const [showSauraWalkthrough, setShowSauraWalkthrough] = useState(false);

    const [showAllStylesModal, setShowAllStylesModal] = useState(false);
    const [openedFromAllStyles, setOpenedFromAllStyles] = useState(false);
    const [homepageMode, setHomepageMode] = useState<'image' | 'video'>('image');

    const handleStyleSelect = (id: string) => {
        setOpenedFromAllStyles(true);
        setShowAllStylesModal(false);
        
        switch (id) {
            case "Maharashtra": setShowWarliWalkthrough(true); break;
            case "ajrakh": setShowAjrakhWalkthrough(true); break;
            case "jhajjar": setShowJhajjarWalkthrough(true); break;
            case "kaavi": setShowKaaviWalkthrough(true); break;
            case "kangra": setShowKangraWalkthrough(true); break;
            case "karepa": setShowKarepaWalkthrough(true); break;
            case "khatwa": setShowKhatwaWalkthrough(true); break;
            case "khovar": setShowKhovarWalkthrough(true); break;
            case "kinnauri": setShowKinnauriWalkthrough(true); break;
            case "kosa": setShowKosaWalkthrough(true); break;
            case "kutch": setShowKutchWalkthrough(true); break;
            case "lippan": setShowLippanWalkthrough(true); break;
            case "majuli": setShowMajuliWalkthrough(true); break;
            case "manjusha": setShowManjushaWalkthrough(true); break;
            case "matanipachedi": setShowMataNiPachediWalkthrough(true); break;
            case "madhubani": setShowMadhubaniWalkthrough(true); break;
            case "kyilkhor": setShowKyilKhorWalkthrough(true); break;
            case "sherdukpen": setShowSherdukpenWalkthrough(true); break;
            case "etikoppaka": setShowEtikoppakaWalkthrough(true); break;
            case "kondapalli": setShowKondapalliWalkthrough(true); break;
            case "monpamask": setShowMonpaMaskWalkthrough(true); break;
            case "handmadepaper": setShowHandmadePaperWalkthrough(true); break;
            case "monpa": setShowMonpaWalkthrough(true); break;
            case "wancho": setShowWanchoWalkthrough(true); break;
            case "thangka": setShowThangkaWalkthrough(true); break;
            case "tholu": setShowTholuWalkthrough(true); break;
            case "uppadajamdani": setShowUppadaWalkthrough(true); break;
            case "machilipatnam": setShowKalamkariWalkthrough(true); break;
            case "srikalahasti": setShowSrikalahastiWalkthrough(true); break;
            case "asharikandi": setShowAsharikandiWalkthrough(true); break;
            case "azulejos": setShowAzulejosWalkthrough(true); break;
            case "bandhani": setShowBandhaniWalkthrough(true); break;
            case "bastardhokra": setShowBastarDhokraWalkthrough(true); break;
            case "muriawallpainting": setShowMuriaWallPaintingWalkthrough(true); break;
            case "bastarwoodcraft": setShowBastarWoodcraftWalkthrough(true); break;
            case "bhagalpursilk": setShowBhagalpurSilkWalkthrough(true); break;
            case "chambaminiature": setShowChambaMiniatureWalkthrough(true); break;
            case "exposedlaterite": setShowExposedLateriteWalkthrough(true); break;
            case "gharchola": setShowGharcholaWalkthrough(true); break;
            case "godnaart": setShowGodnaArtWalkthrough(true); break;
            case "taiahommanuscript": setShowTaiAhomManuscriptWalkthrough(true); break;
            case "tangaliya": setShowTangaliyaWalkthrough(true); break;
            case "agrarianindustrial": setShowAgrarianIndustrialWalkthrough(true); break;
            case "indoportuguese": setShowIndoPortugueseWalkthrough(true); break;
            case "tikuliart": setShowTikuliArtWalkthrough(true); break;
            case "sohraikhovar": setShowSohraiKhovarWalkthrough(true); break;
            case "woodtemplecarving": setShowWoodTempleCarvingWalkthrough(true); break;
            case "neoagrarianbrutalism": setShowNeoAgrarianBrutalismWalkthrough(true); break;
            case "patola": setShowPatolaWalkthrough(true); break;
            case "phulkari": setShowPhulkariWalkthrough(true); break;
            case "pithora": setShowPithoraWalkthrough(true); break;
            case "roganart": setShowRoganArtWalkthrough(true); break;
            case "ruralfibercraft": setShowRuralFiberCraftWalkthrough(true); break;
            case "sarkandaarchitecture": setShowSarkandaArchitectureWalkthrough(true); break;
            case "shimplahastkala": setShowShimplaHastkalaWalkthrough(true); break;
            case "sitalpati": setShowSitalpatiWalkthrough(true); break;
            case "sohrai": setShowSohraiWalkthrough(true); break;
            case "sonowaltextile": setShowSonowalTextileWalkthrough(true); break;
            case "sufembroidery": setShowSufEmbroideryWalkthrough(true); break;
            case "ganjifa": setShowGanjifaWalkthrough(true); break;
            case "garoweaving": setShowGaroWeavingWalkthrough(true); break;
            case "nagabodycloth": setShowNagaBodyClothWalkthrough(true); break;
            case "gondpainting": setShowGondPaintingWalkthrough(true); break;
            case "hardornament": setShowHardOrnamentWalkthrough(true); break;
            case "himroo": setShowHimrooWalkthrough(true); break;
            case "hmaram": setShowHmaramWalkthrough(true); break;
            case "hoysalarelief": setShowHoysalaReliefWalkthrough(true); break;
            case "jaintiatextile": setShowJaintiaTextileWalkthrough(true); break;
            case "jhabuadolls": setShowJhabuaDollsWalkthrough(true); break;
            case "maheshwari": setShowMaheshwariWalkthrough(true); break;
            case "mashruweaving": setShowMashruweavingWalkthrough(true); break;
            case "moirangphee": setShowMoirangpheeWalkthrough(true); break;
            case "motibharat": setShowMotibharatWalkthrough(true); break;
            case "mysorepainting": setShowMysorepaintingWalkthrough(true); break;
            case "rosewoodinlay": setShowRosewoodinlayWalkthrough(true); break;
            case "nagashawlordinary": setShowNagashawlordinaryWalkthrough(true); break;
            case "ngotekherh": setShowNgotekherhWalkthrough(true); break;
            case "nironalacquer": setShowNironalacquerWalkthrough(true); break;
            case "opaquewrap": setShowOpaquewrapWalkthrough(true); break;
            case "tawlhlohpuan": setShowTawlhlohpuanWalkthrough(true); break;
            case "woodcarving": setShowWoodcarvingWalkthrough(true); break;
            case "wroughtiron": setShowWroughtironWalkthrough(true); break;
            case "yakshagana": setShowYakshaganaWalkthrough(true); break;
            case "baghembroidery": setShowBaghEmbroideryWalkthrough(true); break;
            case "bagruprint": setShowBagruPrintWalkthrough(true); break;
            case "bandhej": setShowBandhejWalkthrough(true); break;
            case "berhampurpatta": setShowBerhampurPattaWalkthrough(true); break;
            case "bomkai": setShowBomkaiWalkthrough(true); break;
            case "buddhistmask": setShowBuddhistMaskWalkthrough(true); break;
            case "sikkimcarpet": setShowSikkimCarpetWalkthrough(true); break;
            case "durrie": setShowDurrieWalkthrough(true); break;
            case "thangka": setShowThangkaWalkthrough(true); break;
            case "punjabjutti": setShowPunjabJuttiWalkthrough(true); break;
            case "kathputli": setShowKathputliWalkthrough(true); break;
            case "khaddar": setShowKhaddarWalkthrough(true); break;
            case "khandua": setShowKhanduaWalkthrough(true); break;
            case "khes": setShowKhesWalkthrough(true); break;
            case "malerkotlazari": setShowMalerkotlaZariWalkthrough(true); break;
            case "molela": setShowMolelaWalkthrough(true); break;
            case "pichhwai": setShowPichhwaiNewWalkthrough(true); break;
            case "pattachitra": setShowPattachitraWalkthrough(true); break;
            case "pipili": setShowPipiliWalkthrough(true); break;
            case "rajasthaniminiature": setShowRajasthaniMiniatureWalkthrough(true); break;
            case "sambalpuribandha": setShowSambalpuriBandhaWalkthrough(true); break;
            case "sanganer": setShowSanganerWalkthrough(true); break;
            case "ustaart": setShowUstaArtWalkthrough(true); break;
            case "pipiliapplique": setShowPipiliAppliqueWalkthrough(true); break;
            case "saura": setShowSauraWalkthrough(true); break;
            default: break;
        }
    };

    const handleCloseWalkthrough = (setter: (v: boolean) => void) => {
        setter(false);
        if (openedFromAllStyles) {
            setShowAllStylesModal(true);
            setOpenedFromAllStyles(false);
        }
    };

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
                    try { toast.success('Welcome back! You\'re logged in successfully.', { duration: 3000 }) } catch { }
                }, 500);
                return () => clearTimeout(t);
            }
        } catch { }
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
        <div className="min-h-screen bg-[#0E0E12]">
            {/* Mobile Sidebar Toggle */}
            <button
                onClick={() => dispatch(setSidebarExpanded(true))}
                className="md:hidden fixed top-0 left-0 z-[60] flex h-10 w-10 items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-label="Toggle Menu"
            >
                <Menu size={24} />
            </button>
            <div className="flex  md:ml-[68px] pt-2">
                <div className="flex-1 min-w-0">
                    {/* <Header /> */}
                    {/* <Header /> */}

                    {/* Promotional Banner */}
                    <MasonrySection mode={homepageMode} onModeChange={setHomepageMode} />
                    <WhatsNew />
                    <CreativeStyle
                        onWarliOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowWarliWalkthrough(true);
                        }}
                        onAjrakhOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowAjrakhWalkthrough(true);
                        }}
                        onJhajjarOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowJhajjarWalkthrough(true);
                        }}
                        onKaaviOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKaaviWalkthrough(true);
                        }}
                        onKangraOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKangraWalkthrough(true);
                        }}
                        onKarepaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKarepaWalkthrough(true);
                        }}
                        onKhatwaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKhatwaWalkthrough(true);
                        }}
                        onKhovarOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKhovarWalkthrough(true);
                        }}
                        onKinnauriOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKinnauriWalkthrough(true);
                        }}
                        onKosaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKosaWalkthrough(true);
                        }}
                        onKutchOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKutchWalkthrough(true);
                        }}
                        onLippanOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowLippanWalkthrough(true);
                        }}
                        onMajuliOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMajuliWalkthrough(true);
                        }}
                        onManjushaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowManjushaWalkthrough(true);
                        }}
                        onMataNiPachediOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMataNiPachediWalkthrough(true);
                        }}
                        onMadhubaniOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMadhubaniWalkthrough(true);
                        }}
                        onKyilKhorOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKyilKhorWalkthrough(true);
                        }}
                        onSherdukpenOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSherdukpenWalkthrough(true);
                        }}
                        onIduMishmiOpen={() => {
                            setShowWelcomeModal(false);
                            setShowIduMishmiWalkthrough(true);
                        }}
                        onAsharikandiOpen={() => {
                            setShowWelcomeModal(false);
                            setShowAsharikandiWalkthrough(true);
                        }}
                        onAzulejosOpen={() => {
                            setShowWelcomeModal(false);
                            setShowAzulejosWalkthrough(true);
                        }}
                        onBandhaniOpen={() => {
                            setShowWelcomeModal(false);
                            setShowBandhaniWalkthrough(true);
                        }}
                        onBastarDhokraOpen={() => {
                            setShowWelcomeModal(false);
                            setShowBastarDhokraWalkthrough(true);
                        }}
                        onMuriaWallPaintingOpen={() => {
                            setShowWelcomeModal(false);
                            setShowMuriaWallPaintingWalkthrough(true);
                        }}
                        onBastarWoodcraftOpen={() => {
                            setShowWelcomeModal(false);
                            setShowBastarWoodcraftWalkthrough(true);
                        }}
                        onBhagalpurSilkOpen={() => {
                            setShowWelcomeModal(false);
                            setShowBhagalpurSilkWalkthrough(true);
                        }}
                        onChambaMiniatureOpen={() => {
                            setShowWelcomeModal(false);
                            setShowChambaMiniatureWalkthrough(true);
                        }}
                        onExposedLateriteOpen={() => {
                            setShowWelcomeModal(false);
                            setShowExposedLateriteWalkthrough(true);
                        }}
                        onGharcholaOpen={() => {
                            setShowWelcomeModal(false);
                            setShowGharcholaWalkthrough(true);
                        }}
                        onGodnaArtOpen={() => {
                            setShowWelcomeModal(false);
                            setShowGodnaArtWalkthrough(true);
                        }}
                        onTaiAhomManuscriptOpen={() => {
                            setShowWelcomeModal(false);
                            setShowTaiAhomManuscriptWalkthrough(true);
                        }}
                        onTangaliyaOpen={() => {
                            setShowWelcomeModal(false);
                            setShowTangaliyaWalkthrough(true);
                        }}
                        onAgrarianIndustrialOpen={() => {
                            setShowWelcomeModal(false);
                            setShowAgrarianIndustrialWalkthrough(true);
                        }}
                        onIndoPortugueseOpen={() => {
                            setShowWelcomeModal(false);
                            setShowIndoPortugueseWalkthrough(true);
                        }}
                        onTikuliArtOpen={() => {
                            setShowWelcomeModal(false);
                            setShowTikuliArtWalkthrough(true);
                        }}
                        onSohraiKhovarOpen={() => {
                            setShowWelcomeModal(false);
                            setShowSohraiKhovarWalkthrough(true);
                        }}
                        onWoodTempleCarvingOpen={() => {
                            setShowWelcomeModal(false);
                            setShowWoodTempleCarvingWalkthrough(true);
                        }}
                        onNeoAgrarianBrutalismOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowNeoAgrarianBrutalismWalkthrough(true);
                        }}
                        onPatolaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPatolaWalkthrough(true);
                        }}
                        onPhulkariOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPhulkariWalkthrough(true);
                        }}
                        onPithoraOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPithoraWalkthrough(true);
                        }}
                        onRoganArtOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowRoganArtWalkthrough(true);
                        }}
                        onRuralFiberCraftOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowRuralFiberCraftWalkthrough(true);
                        }}
                        onSarkandaArchitectureOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSarkandaArchitectureWalkthrough(true);
                        }}
                        onShimplaHastkalaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowShimplaHastkalaWalkthrough(true);
                        }}
                        onSitalpatiOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSitalpatiWalkthrough(true);
                        }}
                        onSohraiOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSohraiWalkthrough(true);
                        }}
                        onSonowalTextileOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSonowalTextileWalkthrough(true);
                        }}
                        onSufEmbroideryOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSufEmbroideryWalkthrough(true);
                        }}
                        onGanjifaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowGanjifaWalkthrough(true);
                        }}
                        onGaroWeavingOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowGaroWeavingWalkthrough(true);
                        }}
                        onNagaBodyClothOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowNagaBodyClothWalkthrough(true);
                        }}
                        onGondPaintingOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowGondPaintingWalkthrough(true);
                        }}
                        onHardOrnamentOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowHardOrnamentWalkthrough(true);
                        }}
                        onHimrooOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowHimrooWalkthrough(true);
                        }}
                        onHmaramOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowHmaramWalkthrough(true);
                        }}
                        onHoysalaReliefOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowHoysalaReliefWalkthrough(true);
                        }}
                        onJaintiaTextileOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowJaintiaTextileWalkthrough(true);
                        }}
                        onJhabuaDollsOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowJhabuaDollsWalkthrough(true);
                        }}
                        onEtikoppakaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowEtikoppakaWalkthrough(true);
                        }}
                        onKondapalliOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKondapalliWalkthrough(true);
                        }}
                        onMonpaMaskOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMonpaMaskWalkthrough(true);
                        }}
                        onHandmadePaperOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowHandmadePaperWalkthrough(true);
                        }}
                        onMonpaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMonpaWalkthrough(true);
                        }}
                        onWanchoOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowWanchoWalkthrough(true);
                        }}
                        onThangkaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowThangkaWalkthrough(true);
                        }}
                        onTholuOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowTholuWalkthrough(true);
                        }}
                        onKalamkariOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKalamkariWalkthrough(true);
                        }}
                        onSrikalahastiOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSrikalahastiWalkthrough(true);
                        }}
                        onUppadaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowUppadaWalkthrough(true);
                        }}
                        onMaheshwariOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMaheshwariWalkthrough(true);
                        }}
                        onMashruWeavingOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMashruweavingWalkthrough(true);
                        }}
                        onMoirangPheeOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMoirangpheeWalkthrough(true);
                        }}
                        onMotiBharatOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMotibharatWalkthrough(true);
                        }}
                        onMysorePaintingOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMysorepaintingWalkthrough(true);
                        }}
                        onRosewoodInlayOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowRosewoodinlayWalkthrough(true);
                        }}
                        onNagaShawlOrdinaryOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowNagashawlordinaryWalkthrough(true);
                        }}
                        onNgotekherhOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowNgotekherhWalkthrough(true);
                        }}
                        onNironaLacquerOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowNironalacquerWalkthrough(true);
                        }}
                        onOpaqueWrapOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowOpaquewrapWalkthrough(true);
                        }}
                        onTawlhlohpuanOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowTawlhlohpuanWalkthrough(true);
                        }}
                        onWoodCarvingOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowWoodcarvingWalkthrough(true);
                        }}
                        onWroughtIronOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowWroughtironWalkthrough(true);
                        }}
                        onYakshaganaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowYakshaganaWalkthrough(true);
                        }}
                        onAllStylesOpen={() => setShowAllStylesModal(true)}
                    />
                    <ImageVideoToggle mode={homepageMode} onChange={setHomepageMode} className="pb-8" />

                    <AllFeatures mode={homepageMode} />
                    <CommunityCreations mode={homepageMode} />

                    <VideoModelCards mode={homepageMode} />


                    {/* <Recentcreation /> */}
                    <StudioHomeShowcase />
                    <WildMindAIAPPS />
                    {/* <CreatorsSection /> */}

                    <CreationCTASection />

                    {/* <CompactFeatureStrip /> */}

                    {/* <AIToolsSection /> */}
                    {/* <main className="bg-[#07070B] text-white  md:px-8 ">
                        <div className="w-full px-4 md:pl-2">
                            <CommunityCreations />
                        </div>
                    </main> */}
                    {/* <div className='md:px-2 px-2'>
                        <TopCreators />
                    </div> */}



                    {/* <main className="bg-[#07070B] text-white px-0 md:px-8 md:py-6 md:mb-32 mb-6 md:mt-32 mt-16">
                        <div className="w-full px-4 md:px-8 lg:px-12">
                            <div className="w-full">
                                <WobbleCard
                                    containerClassName="w-full bg-[#002933] md:min-h-[400px] h-96 lg:min-h-[500px]"
                                    className="!p-0 !py-0 !h-full !min-h-full"
                                >
                                    <div
                                        className="flex w-full md:h-full h-96 relative"

                                    >

                                        <div className="flex-1 flex flex-col justify-between p-6 md:p-8 lg:p-10 z-10">
                                            <div className="w-full">
                                                <h2 className="max-w-sm md:max-w-lg text-left text-balance text-sm md:text-2xl lg:text-4xl font-semibold tracking-[-0.015em] text-white font-poppins">
                                                    Plans That Grow With You
                                                </h2>
                                                <p className="mt-2 md:mt-3 lg:mt-4 max-w-[20rem] md:max-w-[30rem] lg:max-w-[40rem] text-left text-xs md:text-base lg:text-lg text-neutral-200 mr-2 font-medium">
                                                    Whether you’re a designer, marketer, filmmaker, or content creator, our pricing is built to match your workflow. Get unlimited generations, exclusive access to advanced AI models, and essential creative tools like storyboard generation, mockup design, and campaign visuals—all included with no extra fees. From individual projects to large-scale campaigns, our plans offer the perfect balance of affordability and professional-grade features. With us, you don’t just save money—you unlock endless creative possibilities.
                                                </p>
                                            </div>


                                            <button className="font-poppins md:text-lg text-xs bg-white text-[#1C303D] font-semibold md:px-6 px-2 md:py-3 py-1 rounded-full transition-all duration-200 shadow-lg w-fit">
                                                Pricing Plans
                                            </button>
                                        </div>


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
                    </main> */}

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
            <WarliFullscreenWalkthrough
                isOpen={showWarliWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowWarliWalkthrough)}
            />
            <AjrakhFullscreenWalkthrough
                isOpen={showAjrakhWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowAjrakhWalkthrough)}
            />
            <JhajjarFullscreenWalkthrough
                isOpen={showJhajjarWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowJhajjarWalkthrough)}
            />
            <KaaviFullscreenWalkthrough
                isOpen={showKaaviWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKaaviWalkthrough)}
            />
            <KangraFullscreenWalkthrough
                isOpen={showKangraWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKangraWalkthrough)}
            />
            <KarepaFullscreenWalkthrough
                isOpen={showKarepaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKarepaWalkthrough)}
            />
            <KhatwaFullscreenWalkthrough
                isOpen={showKhatwaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKhatwaWalkthrough)}
            />
            <KhovarFullscreenWalkthrough
                isOpen={showKhovarWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKhovarWalkthrough)}
            />
            <KinnauriFullscreenWalkthrough
                isOpen={showKinnauriWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKinnauriWalkthrough)}
            />
            <KosaFullscreenWalkthrough
                isOpen={showKosaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKosaWalkthrough)}
            />
            <KutchFullscreenWalkthrough
                isOpen={showKutchWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKutchWalkthrough)}
            />
            <LippanFullscreenWalkthrough
                isOpen={showLippanWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowLippanWalkthrough)}
            />
            <MajuliFullscreenWalkthrough
                isOpen={showMajuliWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMajuliWalkthrough)}
            />
            <ManjushaFullscreenWalkthrough
                isOpen={showManjushaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowManjushaWalkthrough)}
            />
            <MataNiPachediFullscreenWalkthrough
                isOpen={showMataNiPachediWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMataNiPachediWalkthrough)}
            />

            <KalamkariFullscreenWalkthrough
                isOpen={showKalamkariWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKalamkariWalkthrough)}
            />

            <SrikalahastiFullscreenWalkthrough
                isOpen={showSrikalahastiWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSrikalahastiWalkthrough)}
            />

            <UppadaFullscreenWalkthrough
                isOpen={showUppadaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowUppadaWalkthrough)}
            />

            <TholuFullscreenWalkthrough
                isOpen={showTholuWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowTholuWalkthrough)}
            />

            <ThangkaFullscreenWalkthrough
                isOpen={showThangkaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowThangkaWalkthrough)}
            />

            <WanchoFullscreenWalkthrough
                isOpen={showWanchoWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowWanchoWalkthrough)}
            />

            <MonpaFullscreenWalkthrough
                isOpen={showMonpaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMonpaWalkthrough)}
            />

            <HandmadePaperFullscreenWalkthrough
                isOpen={showHandmadePaperWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowHandmadePaperWalkthrough)}
            />

            <MonpaMaskFullscreenWalkthrough
                isOpen={showMonpaMaskWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMonpaMaskWalkthrough)}
            />

            <KondapalliFullscreenWalkthrough
                isOpen={showKondapalliWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKondapalliWalkthrough)}
            />

            <EtikoppakaFullscreenWalkthrough
                isOpen={showEtikoppakaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowEtikoppakaWalkthrough)}
            />

            <MadhubaniFullscreenWalkthrough
                isOpen={showMadhubaniWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMadhubaniWalkthrough)}
            />

            <KyilKhorFullscreenWalkthrough
                isOpen={showKyilKhorWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKyilKhorWalkthrough)}
            />
            
            <SherdukpenFullscreenWalkthrough
                isOpen={showSherdukpenWalkthrough}
                onClose={() => setShowSherdukpenWalkthrough(false)}
            />

            <IduMishmiFullscreenWalkthrough
                isOpen={showIduMishmiWalkthrough}
                onClose={() => setShowIduMishmiWalkthrough(false)}
            />

            <AsharikandiFullscreenWalkthrough
                isOpen={showAsharikandiWalkthrough}
                onClose={() => setShowAsharikandiWalkthrough(false)}
            />

            <AzulejosFullscreenWalkthrough
                isOpen={showAzulejosWalkthrough}
                onClose={() => setShowAzulejosWalkthrough(false)}
            />

            <BandhaniFullscreenWalkthrough
                isOpen={showBandhaniWalkthrough}
                onClose={() => setShowBandhaniWalkthrough(false)}
            />

            <BastarDhokraFullscreenWalkthrough
                isOpen={showBastarDhokraWalkthrough}
                onClose={() => setShowBastarDhokraWalkthrough(false)}
            />

            <MuriaWallPaintingFullscreenWalkthrough
                isOpen={showMuriaWallPaintingWalkthrough}
                onClose={() => setShowMuriaWallPaintingWalkthrough(false)}
            />

            <BastarWoodcraftFullscreenWalkthrough
                isOpen={showBastarWoodcraftWalkthrough}
                onClose={() => setShowBastarWoodcraftWalkthrough(false)}
            />

            <BhagalpurSilkFullscreenWalkthrough
                isOpen={showBhagalpurSilkWalkthrough}
                onClose={() => setShowBhagalpurSilkWalkthrough(false)}
            />

            <ChambaMiniatureFullscreenWalkthrough
                isOpen={showChambaMiniatureWalkthrough}
                onClose={() => setShowChambaMiniatureWalkthrough(false)}
            />

            <ExposedLateriteFullscreenWalkthrough
                isOpen={showExposedLateriteWalkthrough}
                onClose={() => setShowExposedLateriteWalkthrough(false)}
            />

            <GharcholaFullscreenWalkthrough
                isOpen={showGharcholaWalkthrough}
                onClose={() => setShowGharcholaWalkthrough(false)}
            />

            <GodnaArtFullscreenWalkthrough
                isOpen={showGodnaArtWalkthrough}
                onClose={() => setShowGodnaArtWalkthrough(false)}
            />

            <TaiAhomManuscriptFullscreenWalkthrough
                isOpen={showTaiAhomManuscriptWalkthrough}
                onClose={() => setShowTaiAhomManuscriptWalkthrough(false)}
            />

            <TangaliyaFullscreenWalkthrough
                isOpen={showTangaliyaWalkthrough}
                onClose={() => setShowTangaliyaWalkthrough(false)}
            />

            <AgrarianIndustrialFullscreenWalkthrough
                isOpen={showAgrarianIndustrialWalkthrough}
                onClose={() => setShowAgrarianIndustrialWalkthrough(false)}
            />

            <IndoPortugueseFullscreenWalkthrough
                isOpen={showIndoPortugueseWalkthrough}
                onClose={() => setShowIndoPortugueseWalkthrough(false)}
            />

            <TikuliArtFullscreenWalkthrough
                isOpen={showTikuliArtWalkthrough}
                onClose={() => setShowTikuliArtWalkthrough(false)}
            />

            <SohraiKhovarFullscreenWalkthrough
                isOpen={showSohraiKhovarWalkthrough}
                onClose={() => setShowSohraiKhovarWalkthrough(false)}
            />

            <WoodTempleCarvingFullscreenWalkthrough
                isOpen={showWoodTempleCarvingWalkthrough}
                onClose={() => setShowWoodTempleCarvingWalkthrough(false)}
            />

            <NeoAgrarianBrutalismFullscreenWalkthrough
                isOpen={showNeoAgrarianBrutalismWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowNeoAgrarianBrutalismWalkthrough)}
            />

            <PatolaFullscreenWalkthrough
                isOpen={showPatolaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPatolaWalkthrough)}
            />

            <PhulkariFullscreenWalkthrough
                isOpen={showPhulkariWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPhulkariWalkthrough)}
            />

            <PithoraFullscreenWalkthrough
                isOpen={showPithoraWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPithoraWalkthrough)}
            />

            <RoganArtFullscreenWalkthrough
                isOpen={showRoganArtWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowRoganArtWalkthrough)}
            />

            <RuralFiberCraftFullscreenWalkthrough
                isOpen={showRuralFiberCraftWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowRuralFiberCraftWalkthrough)}
            />

            <SarkandaArchitectureFullscreenWalkthrough
                isOpen={showSarkandaArchitectureWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSarkandaArchitectureWalkthrough)}
            />

            <ShimplaHastkalaFullscreenWalkthrough
                isOpen={showShimplaHastkalaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowShimplaHastkalaWalkthrough)}
            />

            <SitalpatiFullscreenWalkthrough
                isOpen={showSitalpatiWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSitalpatiWalkthrough)}
            />

            <SohraiFullscreenWalkthrough
                isOpen={showSohraiWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSohraiWalkthrough)}
            />

            <SonowalTextileFullscreenWalkthrough
                isOpen={showSonowalTextileWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSonowalTextileWalkthrough)}
            />

            <SufEmbroideryFullscreenWalkthrough
                isOpen={showSufEmbroideryWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSufEmbroideryWalkthrough)}
            />

            <GanjifaFullscreenWalkthrough
                isOpen={showGanjifaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowGanjifaWalkthrough)}
            />

            <GaroWeavingFullscreenWalkthrough
                isOpen={showGaroWeavingWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowGaroWeavingWalkthrough)}
            />

            <NagaBodyClothFullscreenWalkthrough
                isOpen={showNagaBodyClothWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowNagaBodyClothWalkthrough)}
            />

            <GondPaintingFullscreenWalkthrough
                isOpen={showGondPaintingWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowGondPaintingWalkthrough)}
            />

            <HardOrnamentFullscreenWalkthrough
                isOpen={showHardOrnamentWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowHardOrnamentWalkthrough)}
            />

            <HimrooFullscreenWalkthrough
                isOpen={showHimrooWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowHimrooWalkthrough)}
            />

            <HmaramFullscreenWalkthrough
                isOpen={showHmaramWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowHmaramWalkthrough)}
            />

            <HoysalaReliefFullscreenWalkthrough
                isOpen={showHoysalaReliefWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowHoysalaReliefWalkthrough)}
            />

            <JaintiaTextileFullscreenWalkthrough
                isOpen={showJaintiaTextileWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowJaintiaTextileWalkthrough)}
            />

            <JhabuaDollsFullscreenWalkthrough
                isOpen={showJhabuaDollsWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowJhabuaDollsWalkthrough)}
            />

            <MaheshwariFullscreenWalkthrough
                isOpen={showMaheshwariWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMaheshwariWalkthrough)}
            />

            <MashruweavingFullscreenWalkthrough
                isOpen={showMashruweavingWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMashruweavingWalkthrough)}
            />

            <MoirangpheeFullscreenWalkthrough
                isOpen={showMoirangpheeWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMoirangpheeWalkthrough)}
            />

            <MotibharatFullscreenWalkthrough
                isOpen={showMotibharatWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMotibharatWalkthrough)}
            />

            <MysorepaintingFullscreenWalkthrough
                isOpen={showMysorepaintingWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMysorepaintingWalkthrough)}
            />

            <RosewoodinlayFullscreenWalkthrough
                isOpen={showRosewoodinlayWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowRosewoodinlayWalkthrough)}
            />

            <NagashawlordinaryFullscreenWalkthrough
                isOpen={showNagashawlordinaryWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowNagashawlordinaryWalkthrough)}
            />

            <NgotekherhFullscreenWalkthrough
                isOpen={showNgotekherhWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowNgotekherhWalkthrough)}
            />

            <NironalacquerFullscreenWalkthrough
                isOpen={showNironalacquerWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowNironalacquerWalkthrough)}
            />

            <OpaquewrapFullscreenWalkthrough
                isOpen={showOpaquewrapWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowOpaquewrapWalkthrough)}
            />

            <TawlhlohpuanFullscreenWalkthrough
                isOpen={showTawlhlohpuanWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowTawlhlohpuanWalkthrough)}
            />

            <WoodcarvingFullscreenWalkthrough
                isOpen={showWoodcarvingWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowWoodcarvingWalkthrough)}
            />

            <WroughtironFullscreenWalkthrough
                isOpen={showWroughtironWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowWroughtironWalkthrough)}
            />

            <YakshaganaFullscreenWalkthrough
                isOpen={showYakshaganaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowYakshaganaWalkthrough)}
            />

                        <AllStylesModal
                isOpen={showAllStylesModal}
                onClose={() => setShowAllStylesModal(false)}
                onStyleSelect={handleStyleSelect}
            />
            <BaghEmbroideryFullscreenWalkthrough
                isOpen={showBaghEmbroideryWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBaghEmbroideryWalkthrough)}
            />
            <BagruPrintFullscreenWalkthrough
                isOpen={showBagruPrintWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBagruPrintWalkthrough)}
            />
            <BandhejFullscreenWalkthrough
                isOpen={showBandhejWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBandhejWalkthrough)}
            />
            <BerhampurPattaFullscreenWalkthrough
                isOpen={showBerhampurPattaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBerhampurPattaWalkthrough)}
            />
            <BomkaiFullscreenWalkthrough
                isOpen={showBomkaiWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBomkaiWalkthrough)}
            />
            <BuddhistMaskFullscreenWalkthrough
                isOpen={showBuddhistMaskWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBuddhistMaskWalkthrough)}
            />
            <SikkimCarpetFullscreenWalkthrough
                isOpen={showSikkimCarpetWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSikkimCarpetWalkthrough)}
            />
            <DurrieFullscreenWalkthrough
                isOpen={showDurrieWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowDurrieWalkthrough)}
            />
            <PunjabJuttiFullscreenWalkthrough
                isOpen={showPunjabJuttiWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPunjabJuttiWalkthrough)}
            />
            <KathputliFullscreenWalkthrough
                isOpen={showKathputliWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKathputliWalkthrough)}
            />
            <KhaddarFullscreenWalkthrough
                isOpen={showKhaddarWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKhaddarWalkthrough)}
            />
            <KhanduaFullscreenWalkthrough
                isOpen={showKhanduaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKhanduaWalkthrough)}
            />
            <KhesFullscreenWalkthrough
                isOpen={showKhesWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKhesWalkthrough)}
            />
            <MalerkotlaZariFullscreenWalkthrough
                isOpen={showMalerkotlaZariWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMalerkotlaZariWalkthrough)}
            />
            <MolelaFullscreenWalkthrough
                isOpen={showMolelaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMolelaWalkthrough)}
            />
            <PichhwaiFullscreenWalkthrough
                isOpen={showPichhwaiNewWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPichhwaiNewWalkthrough)}
            />
            <PattachitraFullscreenWalkthrough
                isOpen={showPattachitraWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPattachitraWalkthrough)}
            />
            <PipiliFullscreenWalkthrough
                isOpen={showPipiliWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPipiliWalkthrough)}
            />
            <RajasthaniMiniatureFullscreenWalkthrough
                isOpen={showRajasthaniMiniatureWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowRajasthaniMiniatureWalkthrough)}
            />
            <SambalpuriBandhaFullscreenWalkthrough
                isOpen={showSambalpuriBandhaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSambalpuriBandhaWalkthrough)}
            />
            <SanganerFullscreenWalkthrough
                isOpen={showSanganerWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSanganerWalkthrough)}
            />
            <UstaArtFullscreenWalkthrough
                isOpen={showUstaArtWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowUstaArtWalkthrough)}
            />
            <PipiliAppliqueFullscreenWalkthrough
                isOpen={showPipiliAppliqueWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPipiliAppliqueWalkthrough)}
            />
            <SauraFullscreenWalkthrough
                isOpen={showSauraWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSauraWalkthrough)}
            />

            {/* Welcome Modal */}
            <WelcomeModal
                isOpen={showWelcomeModal}
                onClose={() => setShowWelcomeModal(false)}
            />
        </div>
    )
}

export default HomePage
