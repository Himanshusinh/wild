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
const ThangkaNewFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/ThangkaNewFullscreenWalkthrough'),
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
const KatabAppliqueFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KatabAppliqueFullscreenWalkthrough'),
    { ssr: false }
)
const BaghPrintFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BaghPrintFullscreenWalkthrough'),
    { ssr: false }
)
const BambooCraftFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BambooCraftFullscreenWalkthrough'),
    { ssr: false }
)
const NagaBeadClusterFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/NagaBeadClusterFullscreenWalkthrough'),
    { ssr: false }
)
const BidriwareFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BidriwareFullscreenWalkthrough'),
    { ssr: false }
)
const BorderSignTextileFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BorderSignTextileFullscreenWalkthrough'),
    { ssr: false }
)
const BundeliPaintingFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BundeliPaintingFullscreenWalkthrough'),
    { ssr: false }
)
const CeremonialEmblemFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/CeremonialEmblemFullscreenWalkthrough'),
    { ssr: false }
)
const ChannapatnaToysFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/ChannapatnaToysFullscreenWalkthrough'),
    { ssr: false }
)
const CoirCraftFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/CoirCraftFullscreenWalkthrough'),
    { ssr: false }
)
const BellMetalRitualsFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BellMetalRitualsFullscreenWalkthrough'),
    { ssr: false }
)
const KasutiEmbroideryFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KasutiEmbroideryFullscreenWalkthrough'),
    { ssr: false }
)
const KeralaMuralFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KeralaMuralFullscreenWalkthrough'),
    { ssr: false }
)
const KhambhatAgateFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KhambhatAgateFullscreenWalkthrough'),
    { ssr: false }
)
const KinhalCraftFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KinhalCraftFullscreenWalkthrough'),
    { ssr: false }
)
const KolhapurJewelleryFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KolhapurJewelleryFullscreenWalkthrough'),
    { ssr: false }
)
const KolhapuriChappalFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KolhapuriChappalFullscreenWalkthrough'),
    { ssr: false }
)
const KolhapuriSaajFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KolhapuriSaajFullscreenWalkthrough'),
    { ssr: false }
)
const LambaniEmbroideryFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/LambaniEmbroideryFullscreenWalkthrough'),
    { ssr: false }
)
const LeatherToysFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/LeatherToysFullscreenWalkthrough'),
    { ssr: false }
)
const PaithaniFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PaithaniFullscreenWalkthrough'),
    { ssr: false }
)
const PawndumFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PawndumFullscreenWalkthrough'),
    { ssr: false }
)
const PoshinaTerracottaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PoshinaTerracottaFullscreenWalkthrough'),
    { ssr: false }
)
const PrestigePendantsFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PrestigePendantsFullscreenWalkthrough'),
    { ssr: false }
)
const PuancheiFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PuancheiFullscreenWalkthrough'),
    { ssr: false }
)
const PuanlaisenFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PuanlaisenFullscreenWalkthrough'),
    { ssr: false }
)
const SandalwoodCarvingFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SandalwoodCarvingFullscreenWalkthrough'),
    { ssr: false }
)
const SankhedaWoodworkFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SankhedaWoodworkFullscreenWalkthrough'),
    { ssr: false }
)
const GanjifaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/GanjifaFullscreenWalkthrough'),
    { ssr: false }
)
const SawantwadiWoodcraftFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SawantwadiWoodcraftFullscreenWalkthrough'),
    { ssr: false }
)
const ShapheeLanpheeFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/ShapheeLanpheeFullscreenWalkthrough'),
    { ssr: false }
)
const SheerFieldClothFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SheerFieldClothFullscreenWalkthrough'),
    { ssr: false }
)
const BodyAugmentationFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BodyAugmentationFullscreenWalkthrough'),
    { ssr: false }
)
const TawlhlophuanFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/TawlhlophuanFullscreenWalkthrough'),
    { ssr: false }
)
const TempleMuralFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/TempleMuralFullscreenWalkthrough'),
    { ssr: false }
)
const TogaluGombeyaataFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/TogaluGombeyaataFullscreenWalkthrough'),
    { ssr: false }
)
const NagaShawlFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/NagaShawlFullscreenWalkthrough'),
    { ssr: false }
)
const WangkheiPheeFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/WangkheiPheeFullscreenWalkthrough'),
    { ssr: false }
)
const MeritShawlFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/MeritShawlFullscreenWalkthrough'),
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
const TraditionalStyleWalkthrough = dynamic<{ 
    isOpen: boolean; 
    onClose: () => void;
    styleId: string;
    styleTitle: string;
    styleName: string;
    styleDesc: string;
    styleImage: string;
    styleTag: string;
}>(
    () => import('./compo/TraditionalStyleWalkthrough'),
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
const GabbaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/GabbaFullscreenWalkthrough'),
    { ssr: false }
)
const GaradsareeFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/GaradsareeFullscreenWalkthrough'),
    { ssr: false }
)
const HimalayansacredimageFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/HimalayansacredimageFullscreenWalkthrough'),
    { ssr: false }
)
const KhatambandFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KhatambandFullscreenWalkthrough'),
    { ssr: false }
)
const KushmandimaskFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/KushmandimaskFullscreenWalkthrough'),
    { ssr: false }
)
const AgramarbleinlayFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/AgramarbleinlayFullscreenWalkthrough'),
    { ssr: false }
)
const BalucharisareeFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BalucharisareeFullscreenWalkthrough'),
    { ssr: false }
)
const BankuraterracottaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BankuraterracottaFullscreenWalkthrough'),
    { ssr: false }
)
const BasohlipaintingFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/BasohlipaintingFullscreenWalkthrough'),
    { ssr: false }
)
const CanebamboocraftandamanFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/CanebamboocraftandamanFullscreenWalkthrough'),
    { ssr: false }
)
const ChandigarhmodernistFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/ChandigarhmodernistFullscreenWalkthrough'),
    { ssr: false }
)
const CoastalfibercraftFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/CoastalfibercraftFullscreenWalkthrough'),
    { ssr: false }
)
const CoconutshellcraftFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/CoconutshellcraftFullscreenWalkthrough'),
    { ssr: false }
)
const CoircraftlakshadweepFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/CoircraftlakshadweepFullscreenWalkthrough'),
    { ssr: false }
)
const DhaniakhalisareeFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/DhaniakhalisareeFullscreenWalkthrough'),
    { ssr: false }
)
const FrancotamilenvironmentFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/FrancotamilenvironmentFullscreenWalkthrough'),
    { ssr: false }
)
const LikhaiwoodcarvingFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/LikhaiwoodcarvingFullscreenWalkthrough'),
    { ssr: false }
)
const MatweavingFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/MatweavingFullscreenWalkthrough'),
    { ssr: false }
)
const MoradabadmetalcraftFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/MoradabadmetalcraftFullscreenWalkthrough'),
    { ssr: false }
)
const NamdaFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/NamdaFullscreenWalkthrough'),
    { ssr: false }
)
const NeedleworkFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/NeedleworkFullscreenWalkthrough'),
    { ssr: false }
)
const PalmmatFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PalmmatFullscreenWalkthrough'),
    { ssr: false }
)
const PapiermachekashmirFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PapiermachekashmirFullscreenWalkthrough'),
    { ssr: false }
)
const PuruliachhaumaskFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PuruliachhaumaskFullscreenWalkthrough'),
    { ssr: false }
)
const PapiermachepuducherryFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/PapiermachepuducherryFullscreenWalkthrough'),
    { ssr: false }
)
const RammanmaskFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/RammanmaskFullscreenWalkthrough'),
    { ssr: false }
)
const RockgardenassemblageFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/RockgardenassemblageFullscreenWalkthrough'),
    { ssr: false }
)
const SaharanpurwoodcraftFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SaharanpurwoodcraftFullscreenWalkthrough'),
    { ssr: false }
)
const ShellcraftFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/ShellcraftFullscreenWalkthrough'),
    { ssr: false }
)
const SozniembroideryFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/SozniembroideryFullscreenWalkthrough'),
    { ssr: false }
)
const TerracottacraftFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/TerracottacraftFullscreenWalkthrough'),
    { ssr: false }
)
const WalnutcarvingFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/WalnutcarvingFullscreenWalkthrough'),
    { ssr: false }
)
const WoodcraftFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/WoodcraftFullscreenWalkthrough'),
    { ssr: false }
)
const LadakhtextilesystemFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/LadakhtextilesystemFullscreenWalkthrough'),
    { ssr: false }
)
const IndoportugueseenvironmentFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
    () => import('./compo/IndoportugueseenvironmentFullscreenWalkthrough'),
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
import CreativeStyle, { STYLES } from './compo/CreativeStyle';
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
    const [showKatabAppliqueWalkthrough, setShowKatabAppliqueWalkthrough] = useState(false);
    const [showBaghPrintWalkthrough, setShowBaghPrintWalkthrough] = useState(false);
    const [showBambooCraftWalkthrough, setShowBambooCraftWalkthrough] = useState(false);
    const [showNagaBeadClusterWalkthrough, setShowNagaBeadClusterWalkthrough] = useState(false);
    const [showBidriwareWalkthrough, setShowBidriwareWalkthrough] = useState(false);
    const [showBorderSignTextileWalkthrough, setShowBorderSignTextileWalkthrough] = useState(false);
    const [showBundeliPaintingWalkthrough, setShowBundeliPaintingWalkthrough] = useState(false);
    const [showCeremonialEmblemWalkthrough, setShowCeremonialEmblemWalkthrough] = useState(false);
    const [showChannapatnaToysWalkthrough, setShowChannapatnaToysWalkthrough] = useState(false);
    const [showCoirCraftWalkthrough, setShowCoirCraftWalkthrough] = useState(false);
    const [showBellMetalRitualsWalkthrough, setShowBellMetalRitualsWalkthrough] = useState(false);
    const [showKasutiEmbroideryWalkthrough, setShowKasutiEmbroideryWalkthrough] = useState(false);
    const [showKeralaMuralWalkthrough, setShowKeralaMuralWalkthrough] = useState(false);
    const [showKhambhatAgateWalkthrough, setShowKhambhatAgateWalkthrough] = useState(false);
    const [showKinhalCraftWalkthrough, setShowKinhalCraftWalkthrough] = useState(false);
    const [showKolhapurJewelleryWalkthrough, setShowKolhapurJewelleryWalkthrough] = useState(false);
    const [showKolhapuriChappalWalkthrough, setShowKolhapuriChappalWalkthrough] = useState(false);
    const [showKolhapuriSaajWalkthrough, setShowKolhapuriSaajWalkthrough] = useState(false);
    const [showLambaniEmbroideryWalkthrough, setShowLambaniEmbroideryWalkthrough] = useState(false);
    const [showLeatherToysWalkthrough, setShowLeatherToysWalkthrough] = useState(false);
    const [showPaithaniWalkthrough, setShowPaithaniWalkthrough] = useState(false);
    const [showPawndumWalkthrough, setShowPawndumWalkthrough] = useState(false);
    const [showPoshinaTerracottaWalkthrough, setShowPoshinaTerracottaWalkthrough] = useState(false);
    const [showPrestigePendantsWalkthrough, setShowPrestigePendantsWalkthrough] = useState(false);
    const [showPuancheiWalkthrough, setShowPuancheiWalkthrough] = useState(false);
    const [showPuanlaisenWalkthrough, setShowPuanlaisenWalkthrough] = useState(false);
    const [showSandalwoodCarvingWalkthrough, setShowSandalwoodCarvingWalkthrough] = useState(false);
    const [showSankhedaWoodworkWalkthrough, setShowSankhedaWoodworkWalkthrough] = useState(false);
    const [showGanjifaWalkthrough, setShowGanjifaWalkthrough] = useState(false);
    const [showSawantwadiWoodcraftWalkthrough, setShowSawantwadiWoodcraftWalkthrough] = useState(false);
    const [showShapheeLanpheeWalkthrough, setShowShapheeLanpheeWalkthrough] = useState(false);
    const [showSheerFieldClothWalkthrough, setShowSheerFieldClothWalkthrough] = useState(false);
    const [showBodyAugmentationWalkthrough, setShowBodyAugmentationWalkthrough] = useState(false);
    const [showTawlhlophuanWalkthrough, setShowTawlhlophuanWalkthrough] = useState(false);
    const [showTempleMuralWalkthrough, setShowTempleMuralWalkthrough] = useState(false);
    const [showTogaluGombeyaataWalkthrough, setShowTogaluGombeyaataWalkthrough] = useState(false);
    const [showNagaShawlWalkthrough, setShowNagaShawlWalkthrough] = useState(false);
    const [showWangkheiPheeWalkthrough, setShowWangkheiPheeWalkthrough] = useState(false);
    const [showMeritShawlWalkthrough, setShowMeritShawlWalkthrough] = useState(false);

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
    const [showBanarasMuralWalkthrough, setShowBanarasMuralWalkthrough] = useState(false);
    const [showBanarasiBrocadeWalkthrough, setShowBanarasiBrocadeWalkthrough] = useState(false);
    const [showBanjaraEmbroideryWalkthrough, setShowBanjaraEmbroideryWalkthrough] = useState(false);
    const [showPataChitraWalkthrough, setShowPataChitraWalkthrough] = useState(false);
    const [showBhotiaWeavingWalkthrough, setShowBhotiaWeavingWalkthrough] = useState(false);
    const [showCheriyalWalkthrough, setShowCheriyalWalkthrough] = useState(false);
    const [showChikankariWalkthrough, setShowChikankariWalkthrough] = useState(false);
    const [showCholaBronzeWalkthrough, setShowCholaBronzeWalkthrough] = useState(false);
    const [showCholaOldBronzeWalkthrough, setShowCholaOldBronzeWalkthrough] = useState(false);
    const [showFarrukhabadPrintWalkthrough, setShowFarrukhabadPrintWalkthrough] = useState(false);
    const [showOdishaFiligreeWalkthrough, setShowOdishaFiligreeWalkthrough] = useState(false);
    const [showGadwalSareeWalkthrough, setShowGadwalSareeWalkthrough] = useState(false);
    const [showGollabhamaSareeWalkthrough, setShowGollabhamaSareeWalkthrough] = useState(false);
    const [showGotaZariWalkthrough, setShowGotaZariWalkthrough] = useState(false);
    const [showKaavadWalkthrough, setShowKaavadWalkthrough] = useState(false);
    const [showKalighatPaintingWalkthrough, setShowKalighatPaintingWalkthrough] = useState(false);
    const [showKaruppurKalamkariWalkthrough, setShowKaruppurKalamkariWalkthrough] = useState(false);
    const [showKolamGeometryWalkthrough, setShowKolamGeometryWalkthrough] = useState(false);
    const [showLacBanglesWalkthrough, setShowLacBanglesWalkthrough] = useState(false);
    const [showBambooCaneCraftWalkthrough, setShowBambooCaneCraftWalkthrough] = useState(false);
    const [showOdishaStoneCarvingWalkthrough, setShowOdishaStoneCarvingWalkthrough] = useState(false);
    const [showPachraWalkthrough, setShowPachraWalkthrough] = useState(false);
    const [showPembarthiMetalCraftWalkthrough, setShowPembarthiMetalCraftWalkthrough] = useState(false);
    const [showPilkhuwaBlockPrintWalkthrough, setShowPilkhuwaBlockPrintWalkthrough] = useState(false);
    const [showRangwaliPichhodaWalkthrough, setShowRangwaliPichhodaWalkthrough] = useState(false);
    const [showRignaiWalkthrough, setShowRignaiWalkthrough] = useState(false);
    const [showRisaWalkthrough, setShowRisaWalkthrough] = useState(false);
    const [showSanjhiWalkthrough, setShowSanjhiWalkthrough] = useState(false);
    const [showTamilRitualCraftWalkthrough, setShowTamilRitualCraftWalkthrough] = useState(false);
    const [showTanjorePaintingWalkthrough, setShowTanjorePaintingWalkthrough] = useState(false);
    const [showThanjavurDollWalkthrough, setShowThanjavurDollWalkthrough] = useState(false);
    const [showTherukoothuWalkthrough, setShowTherukoothuWalkthrough] = useState(false);
    const [showTodaEmbroideryWalkthrough, setShowTodaEmbroideryWalkthrough] = useState(false);
    const [showZardoziWalkthrough, setShowZardoziWalkthrough] = useState(false);
    const [showMaduraiSungudiWalkthrough, setShowMaduraiSungudiWalkthrough] = useState(false);
    const [showMahabalipuramSculptureWalkthrough, setShowMahabalipuramSculptureWalkthrough] = useState(false);
    const [showNarayanpetSareeWalkthrough, setShowNarayanpetSareeWalkthrough] = useState(false);
    const [showNirmalArtWalkthrough, setShowNirmalArtWalkthrough] = useState(false);

    // 5th Batch Styles
    const [showGabbaWalkthrough, setShowGabbaWalkthrough] = useState(false);
    const [showGaradSareeWalkthrough, setShowGaradSareeWalkthrough] = useState(false);
    const [showHimalayanSacredImageWalkthrough, setShowHimalayanSacredImageWalkthrough] = useState(false);
    const [showKhatambandWalkthrough, setShowKhatambandWalkthrough] = useState(false);
    const [showKushmandiMaskWalkthrough, setShowKushmandiMaskWalkthrough] = useState(false);
    const [showLikhaiWoodCarvingWalkthrough, setShowLikhaiWoodCarvingWalkthrough] = useState(false);
    const [showMatWeavingWalkthrough, setShowMatWeavingWalkthrough] = useState(false);
    const [showMoradabadMetalCraftWalkthrough, setShowMoradabadMetalCraftWalkthrough] = useState(false);
    const [showNamdaWalkthrough, setShowNamdaWalkthrough] = useState(false);
    const [showNeedleWorkWalkthrough, setShowNeedleWorkWalkthrough] = useState(false);
    const [showPalmMatWalkthrough, setShowPalmMatWalkthrough] = useState(false);
    const [showPapierMacheKashmirWalkthrough, setShowPapierMacheKashmirWalkthrough] = useState(false);
    const [showPuruliaChhauMaskWalkthrough, setShowPuruliaChhauMaskWalkthrough] = useState(false);
    const [showPapierMachePuducherryWalkthrough, setShowPapierMachePuducherryWalkthrough] = useState(false);
    const [showRammanMaskWalkthrough, setShowRammanMaskWalkthrough] = useState(false);
    const [showRockGardenAssemblageWalkthrough, setShowRockGardenAssemblageWalkthrough] = useState(false);
    const [showSaharanpurWoodCraftWalkthrough, setShowSaharanpurWoodCraftWalkthrough] = useState(false);
    const [showShellCraftWalkthrough, setShowShellCraftWalkthrough] = useState(false);
    const [showSozniEmbroideryWalkthrough, setShowSozniEmbroideryWalkthrough] = useState(false);
    const [showTerracottaCraftWalkthrough, setShowTerracottaCraftWalkthrough] = useState(false);
    const [showWalnutCarvingWalkthrough, setShowWalnutCarvingWalkthrough] = useState(false);
    const [showWoodcraftWalkthrough, setShowWoodcraftWalkthrough] = useState(false);
    const [showLadakhTextileSystemWalkthrough, setShowLadakhTextileSystemWalkthrough] = useState(false);
    const [showIndoPortugueseEnvironmentWalkthrough, setShowIndoPortugueseEnvironmentWalkthrough] = useState(false);
    const [showAgraMarbleInlayWalkthrough, setShowAgraMarbleInlayWalkthrough] = useState(false);
    const [showBaluchariSareeWalkthrough, setShowBaluchariSareeWalkthrough] = useState(false);
    const [showBankuraTerracottaWalkthrough, setShowBankuraTerracottaWalkthrough] = useState(false);
    const [showBasohliPaintingWalkthrough, setShowBasohliPaintingWalkthrough] = useState(false);
    const [showCaneBambooCraftAndamanWalkthrough, setShowCaneBambooCraftAndamanWalkthrough] = useState(false);
    const [showChandigarhModernistWalkthrough, setShowChandigarhModernistWalkthrough] = useState(false);
    const [showCoastalFiberCraftWalkthrough, setShowCoastalFiberCraftWalkthrough] = useState(false);
    const [showCoconutShellCraftWalkthrough, setShowCoconutShellCraftWalkthrough] = useState(false);
    const [showCoirCraftLakshadweepWalkthrough, setShowCoirCraftLakshadweepWalkthrough] = useState(false);
    const [showDhaniakhaliSareeWalkthrough, setShowDhaniakhaliSareeWalkthrough] = useState(false);
    const [showFrancoTamilEnvironmentWalkthrough, setShowFrancoTamilEnvironmentWalkthrough] = useState(false);

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
            case "katabapplique": setShowKatabAppliqueWalkthrough(true); break;
            case "baghprint": setShowBaghPrintWalkthrough(true); break;
            case "bamboocraft": setShowBambooCraftWalkthrough(true); break;
            case "nagabeadcluster": setShowNagaBeadClusterWalkthrough(true); break;
            case "bidriware": setShowBidriwareWalkthrough(true); break;
            case "bordersigntextile": setShowBorderSignTextileWalkthrough(true); break;
            case "bundelipainting": setShowBundeliPaintingWalkthrough(true); break;
            case "ceremonialemblem": setShowCeremonialEmblemWalkthrough(true); break;
            case "channapatnatoys": setShowChannapatnaToysWalkthrough(true); break;
            case "coircraft": setShowCoirCraftWalkthrough(true); break;
            case "bellmetalrituals": setShowBellMetalRitualsWalkthrough(true); break;
            case "kasutiembroidery": setShowKasutiEmbroideryWalkthrough(true); break;
            case "keralamural": setShowKeralaMuralWalkthrough(true); break;
            case "khambhatagate": setShowKhambhatAgateWalkthrough(true); break;
            case "kinhalcraft": setShowKinhalCraftWalkthrough(true); break;
            case "kolhapurjewellery": setShowKolhapurJewelleryWalkthrough(true); break;
            case "kolhapurichappal": setShowKolhapuriChappalWalkthrough(true); break;
            case "kolhapurisaaj": setShowKolhapuriSaajWalkthrough(true); break;
            case "lambaniembroidery": setShowLambaniEmbroideryWalkthrough(true); break;
            case "leathertoys": setShowLeatherToysWalkthrough(true); break;
            case "paithani": setShowPaithaniWalkthrough(true); break;
            case "pawndum": setShowPawndumWalkthrough(true); break;
            case "poshinaterracotta": setShowPoshinaTerracottaWalkthrough(true); break;
            case "prestigependants": setShowPrestigePendantsWalkthrough(true); break;
            case "puanchei": setShowPuancheiWalkthrough(true); break;
            case "puanlaisen": setShowPuanlaisenWalkthrough(true); break;
            case "sandalwoodcarving": setShowSandalwoodCarvingWalkthrough(true); break;
            case "sankhedawoodwork": setShowSankhedaWoodworkWalkthrough(true); break;
            case "ganjifa":
            case "ganjifa-sawantwadi":
            case "ganjifa-mysore": setShowGanjifaWalkthrough(true); break;
            case "sawantwadiwoodcraft": setShowSawantwadiWoodcraftWalkthrough(true); break;
            case "shapheelanphee": setShowShapheeLanpheeWalkthrough(true); break;
            case "sheerfieldcloth": setShowSheerFieldClothWalkthrough(true); break;
            case "bodyaugmentation": setShowBodyAugmentationWalkthrough(true); break;
            case "tawlhlophuan": setShowTawlhlophuanWalkthrough(true); break;
            case "templemural": setShowTempleMuralWalkthrough(true); break;
            case "togalugombeyaata": setShowTogaluGombeyaataWalkthrough(true); break;
            case "nagashawl": setShowNagaShawlWalkthrough(true); break;
            case "wangkheiphee": setShowWangkheiPheeWalkthrough(true); break;
            case "meritshawl": setShowMeritShawlWalkthrough(true); break;

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
            case "tawlhlohpuan-ceremonial": setShowTawlhlohpuanWalkthrough(true); break;
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
            case "banarasmural": setShowBanarasMuralWalkthrough(true); break;
            case "banarasibrocade": setShowBanarasiBrocadeWalkthrough(true); break;
            case "banjaraembroidery": setShowBanjaraEmbroideryWalkthrough(true); break;
            case "patachitra": setShowPataChitraWalkthrough(true); break;
            case "bhotiaweaving": setShowBhotiaWeavingWalkthrough(true); break;
            case "cheriyal": setShowCheriyalWalkthrough(true); break;
            case "chikankari": setShowChikankariWalkthrough(true); break;
            case "cholabronze": setShowCholaBronzeWalkthrough(true); break;
            case "cholaoldbronze": setShowCholaOldBronzeWalkthrough(true); break;
            case "farrukhabadprint": setShowFarrukhabadPrintWalkthrough(true); break;
            case "odishafiligree": setShowOdishaFiligreeWalkthrough(true); break;
            case "gadwalsaree": setShowGadwalSareeWalkthrough(true); break;
            case "gollabhamasaree": setShowGollabhamaSareeWalkthrough(true); break;
            case "gotazari": setShowGotaZariWalkthrough(true); break;
            case "kaavad": setShowKaavadWalkthrough(true); break;
            case "kalighatpainting": setShowKalighatPaintingWalkthrough(true); break;
            case "karuppurkalamkari": setShowKaruppurKalamkariWalkthrough(true); break;
            case "kolamgeometry": setShowKolamGeometryWalkthrough(true); break;
            case "lacbangles": setShowLacBanglesWalkthrough(true); break;
            case "maduraisungudi": setShowMaduraiSungudiWalkthrough(true); break;
            case "mahabalipuramsculpture": setShowMahabalipuramSculptureWalkthrough(true); break;
            case "narayanpetsaree": setShowNarayanpetSareeWalkthrough(true); break;
            case "nirmalart": setShowNirmalArtWalkthrough(true); break;
            case "bamboocanecraft": setShowBambooCaneCraftWalkthrough(true); break;
            case "odishastonecarving": setShowOdishaStoneCarvingWalkthrough(true); break;
            case "pachra": setShowPachraWalkthrough(true); break;
            case "pembarthimetalcraft": setShowPembarthiMetalCraftWalkthrough(true); break;
            case "pilkhuwablockprint": setShowPilkhuwaBlockPrintWalkthrough(true); break;
            case "rangwalipichhoda": setShowRangwaliPichhodaWalkthrough(true); break;
            case "rignai": setShowRignaiWalkthrough(true); break;
            case "risa": setShowRisaWalkthrough(true); break;
            case "sanjhi": setShowSanjhiWalkthrough(true); break;
            case "tamilritualcraft": setShowTamilRitualCraftWalkthrough(true); break;
            case "tanjorepainting": setShowTanjorePaintingWalkthrough(true); break;
            case "thanjavurdoll": setShowThanjavurDollWalkthrough(true); break;
            case "therukoothu": setShowTherukoothuWalkthrough(true); break;
            case "todaembroidery": setShowTodaEmbroideryWalkthrough(true); break;
            case "zardozi": setShowZardoziWalkthrough(true); break;
            case "gabba": setShowGabbaWalkthrough(true); break;
            case "garadsaree": setShowGaradSareeWalkthrough(true); break;
            case "himalayansacredimage": setShowHimalayanSacredImageWalkthrough(true); break;
            case "khatamband": setShowKhatambandWalkthrough(true); break;
            case "kushmandimask": setShowKushmandiMaskWalkthrough(true); break;
            case "likhaiwoodcarving": setShowLikhaiWoodCarvingWalkthrough(true); break;
            case "matweaving": setShowMatWeavingWalkthrough(true); break;
            case "moradabadmetalcraft": setShowMoradabadMetalCraftWalkthrough(true); break;
            case "namda": setShowNamdaWalkthrough(true); break;
            case "needlework": setShowNeedleWorkWalkthrough(true); break;
            case "palmmat": setShowPalmMatWalkthrough(true); break;
            case "papiermachekashmir": setShowPapierMacheKashmirWalkthrough(true); break;
            case "puruliachhaumask": setShowPuruliaChhauMaskWalkthrough(true); break;
            case "papiermachepuducherry": setShowPapierMachePuducherryWalkthrough(true); break;
            case "rammanmask": setShowRammanMaskWalkthrough(true); break;
            case "rockgardenassemblage": setShowRockGardenAssemblageWalkthrough(true); break;
            case "saharanpurwoodcraft": setShowSaharanpurWoodCraftWalkthrough(true); break;
            case "shellcraft": setShowShellCraftWalkthrough(true); break;
            case "sozniembroidery": setShowSozniEmbroideryWalkthrough(true); break;
            case "terracottacraft": setShowTerracottaCraftWalkthrough(true); break;
            case "walnutcarving": setShowWalnutCarvingWalkthrough(true); break;
            case "woodcraft": setShowWoodcraftWalkthrough(true); break;
            case "ladakhtextilesystem": setShowLadakhTextileSystemWalkthrough(true); break;
            case "indoportugueseenvironment": setShowIndoPortugueseEnvironmentWalkthrough(true); break;
            case "agramarbleinlay": setShowAgraMarbleInlayWalkthrough(true); break;
            case "balucharisaree": setShowBaluchariSareeWalkthrough(true); break;
            case "bankuraterracotta": setShowBankuraTerracottaWalkthrough(true); break;
            case "basohlipainting": setShowBasohliPaintingWalkthrough(true); break;
            case "canebamboocraftandaman": setShowCaneBambooCraftAndamanWalkthrough(true); break;
            case "chandigarhmodernist": setShowChandigarhModernistWalkthrough(true); break;
            case "coastalfibercraft": setShowCoastalFiberCraftWalkthrough(true); break;
            case "coconutshellcraft": setShowCoconutShellCraftWalkthrough(true); break;
            case "coircraftlakshadweep": setShowCoirCraftLakshadweepWalkthrough(true); break;
            case "dhaniakhalisaree": setShowDhaniakhaliSareeWalkthrough(true); break;
            case "francotamilenvironment": setShowFrancoTamilEnvironmentWalkthrough(true); break;
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
        let timer: ReturnType<typeof setTimeout> | null = null;
        const checkFirstTimeUser = () => {
            // Check if user has seen the welcome modal before
            const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal');

            if (!hasSeenWelcome) {
                // Show welcome modal after a short delay
                timer = setTimeout(() => {
                    setShowWelcomeModal(true);
                    // Mark as seen
                    localStorage.setItem('hasSeenWelcomeModal', 'true');
                }, 2000); // 2 second delay
            }
        };

        checkFirstTimeUser();
        return () => {
            if (timer) clearTimeout(timer);
        };
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
                        onKatabAppliqueOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKatabAppliqueWalkthrough(true);
                        }}
                        onBaghPrintOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBaghPrintWalkthrough(true);
                        }}
                        onBambooCraftOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBambooCraftWalkthrough(true);
                        }}
                        onNagaBeadClusterOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowNagaBeadClusterWalkthrough(true);
                        }}
                        onBidriwareOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBidriwareWalkthrough(true);
                        }}
                        onBorderSignTextileOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBorderSignTextileWalkthrough(true);
                        }}
                        onBundeliPaintingOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBundeliPaintingWalkthrough(true);
                        }}
                        onCeremonialEmblemOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowCeremonialEmblemWalkthrough(true);
                        }}
                        onChannapatnaToysOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowChannapatnaToysWalkthrough(true);
                        }}
                        onCoirCraftOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowCoirCraftWalkthrough(true);
                        }}
                        onBellMetalRitualsOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBellMetalRitualsWalkthrough(true);
                        }}
                        onKasutiEmbroideryOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKasutiEmbroideryWalkthrough(true);
                        }}
                        onKeralaMuralOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKeralaMuralWalkthrough(true);
                        }}
                        onKhambhatAgateOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKhambhatAgateWalkthrough(true);
                        }}
                        onKinhalCraftOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKinhalCraftWalkthrough(true);
                        }}
                        onKolhapurJewelleryOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKolhapurJewelleryWalkthrough(true);
                        }}
                        onKolhapuriChappalOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKolhapuriChappalWalkthrough(true);
                        }}
                        onKolhapuriSaajOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKolhapuriSaajWalkthrough(true);
                        }}
                        onLambaniEmbroideryOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowLambaniEmbroideryWalkthrough(true);
                        }}
                        onLeatherToysOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowLeatherToysWalkthrough(true);
                        }}
                        onPaithaniOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPaithaniWalkthrough(true);
                        }}
                        onPawndumOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPawndumWalkthrough(true);
                        }}
                        onPoshinaTerracottaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPoshinaTerracottaWalkthrough(true);
                        }}
                        onPrestigePendantsOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPrestigePendantsWalkthrough(true);
                        }}
                        onPuancheiOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPuancheiWalkthrough(true);
                        }}
                        onPuanlaisenOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPuanlaisenWalkthrough(true);
                        }}
                        onSandalwoodCarvingOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSandalwoodCarvingWalkthrough(true);
                        }}
                        onSankhedaWoodworkOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSankhedaWoodworkWalkthrough(true);
                        }}
                        onGanjifaSawantwadiOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowGanjifaWalkthrough(true);
                        }}
                        onGanjifaMysoreOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowGanjifaWalkthrough(true);
                        }}
                        onSawantwadiWoodcraftOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSawantwadiWoodcraftWalkthrough(true);
                        }}
                        onShapheeLanpheeOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowShapheeLanpheeWalkthrough(true);
                        }}
                        onSheerFieldClothOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSheerFieldClothWalkthrough(true);
                        }}
                        onBodyAugmentationOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBodyAugmentationWalkthrough(true);
                        }}
                        onTawlhlophuanMizoramOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowTawlhlophuanWalkthrough(true);
                        }}
                        onTempleMuralOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowTempleMuralWalkthrough(true);
                        }}
                        onTogaluGombeyaataOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowTogaluGombeyaataWalkthrough(true);
                        }}
                        onNagaShawlOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowNagaShawlWalkthrough(true);
                        }}
                        onWangkheiPheeOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowWangkheiPheeWalkthrough(true);
                        }}
                        onMeritShawlOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMeritShawlWalkthrough(true);
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
                        onTawlhlohpuanCeremonialOpen={() => {
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
                        onThangkaFolkOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowThangkaNewWalkthrough(true);
                        }}
                        onBanarasMuralOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBanarasMuralWalkthrough(true);
                        }}
                        onBanarasiBrocadeOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBanarasiBrocadeWalkthrough(true);
                        }}
                        onBanjaraEmbroideryOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBanjaraEmbroideryWalkthrough(true);
                        }}
                        onPataChitraOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPataChitraWalkthrough(true);
                        }}
                        onBhotiaWeavingOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBhotiaWeavingWalkthrough(true);
                        }}
                        onCheriyalOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowCheriyalWalkthrough(true);
                        }}
                        onChikankariOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowChikankariWalkthrough(true);
                        }}
                        onCholaBronzeOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowCholaBronzeWalkthrough(true);
                        }}
                        onCholaOldBronzeOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowCholaOldBronzeWalkthrough(true);
                        }}
                        onFarrukhabadPrintOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowFarrukhabadPrintWalkthrough(true);
                        }}
                        onOdishaFiligreeOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowOdishaFiligreeWalkthrough(true);
                        }}
                        onGadwalSareeOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowGadwalSareeWalkthrough(true);
                        }}
                        onGollabhamaSareeOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowGollabhamaSareeWalkthrough(true);
                        }}
                        onGotaZariOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowGotaZariWalkthrough(true);
                        }}
                        onKaavadOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKaavadWalkthrough(true);
                        }}
                        onKalighatPaintingOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKalighatPaintingWalkthrough(true);
                        }}
                        onKaruppurKalamkariOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKaruppurKalamkariWalkthrough(true);
                        }}
                        onKolamGeometryOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKolamGeometryWalkthrough(true);
                        }}
                        onLacBanglesOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowLacBanglesWalkthrough(true);
                        }}
                        onMaduraiSungudiOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMaduraiSungudiWalkthrough(true);
                        }}
                        onMahabalipuramSculptureOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMahabalipuramSculptureWalkthrough(true);
                        }}
                        onNarayanpetSareeOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowNarayanpetSareeWalkthrough(true);
                        }}
                        onNirmalArtOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowNirmalArtWalkthrough(true);
                        }}
                        onBambooCaneCraftOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBambooCaneCraftWalkthrough(true);
                        }}
                        onOdishaStoneCarvingOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowOdishaStoneCarvingWalkthrough(true);
                        }}
                        onPachraOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPachraWalkthrough(true);
                        }}
                        onPembarthiMetalCraftOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPembarthiMetalCraftWalkthrough(true);
                        }}
                        onPilkhuwaBlockPrintOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPilkhuwaBlockPrintWalkthrough(true);
                        }}
                        onRangwaliPichhodaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowRangwaliPichhodaWalkthrough(true);
                        }}
                        onRignaiOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowRignaiWalkthrough(true);
                        }}
                        onRisaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowRisaWalkthrough(true);
                        }}
                        onSanjhiOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSanjhiWalkthrough(true);
                        }}
                        onTamilRitualCraftOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowTamilRitualCraftWalkthrough(true);
                        }}
                        onTanjorePaintingOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowTanjorePaintingWalkthrough(true);
                        }}
                        onThanjavurDollOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowThanjavurDollWalkthrough(true);
                        }}
                        onTherukoothuOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowTherukoothuWalkthrough(true);
                        }}
                        onTodaEmbroideryOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowTodaEmbroideryWalkthrough(true);
                        }}
                        onZardoziOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowZardoziWalkthrough(true);
                        }}
                        onGabbaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowGabbaWalkthrough(true);
                        }}
                        onGaradSareeOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowGaradSareeWalkthrough(true);
                        }}
                        onHimalayanSacredImageOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowHimalayanSacredImageWalkthrough(true);
                        }}
                        onKhatambandOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKhatambandWalkthrough(true);
                        }}
                        onKushmandiMaskOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKushmandiMaskWalkthrough(true);
                        }}
                        onLikhaiWoodCarvingOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowLikhaiWoodCarvingWalkthrough(true);
                        }}
                        onMatWeavingOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMatWeavingWalkthrough(true);
                        }}
                        onMoradabadMetalCraftOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMoradabadMetalCraftWalkthrough(true);
                        }}
                        onNamdaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowNamdaWalkthrough(true);
                        }}
                        onNeedleWorkOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowNeedleWorkWalkthrough(true);
                        }}
                        onPalmMatOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPalmMatWalkthrough(true);
                        }}
                        onPapierMacheKashmirOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPapierMacheKashmirWalkthrough(true);
                        }}
                        onPuruliaChhauMaskOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPuruliaChhauMaskWalkthrough(true);
                        }}
                        onPapierMachePuducherryOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPapierMachePuducherryWalkthrough(true);
                        }}
                        onRammanMaskOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowRammanMaskWalkthrough(true);
                        }}
                        onRockGardenAssemblageOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowRockGardenAssemblageWalkthrough(true);
                        }}
                        onSaharanpurWoodCraftOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSaharanpurWoodCraftWalkthrough(true);
                        }}
                        onShellCraftOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowShellCraftWalkthrough(true);
                        }}
                        onSozniEmbroideryOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSozniEmbroideryWalkthrough(true);
                        }}
                        onTerracottaCraftOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowTerracottaCraftWalkthrough(true);
                        }}
                        onWalnutCarvingOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowWalnutCarvingWalkthrough(true);
                        }}
                        onWoodcraftOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowWoodcraftWalkthrough(true);
                        }}
                        onLadakhTextileSystemOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowLadakhTextileSystemWalkthrough(true);
                        }}
                        onIndoPortugueseEnvironmentOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowIndoPortugueseEnvironmentWalkthrough(true);
                        }}
                        onAgraMarbleInlayOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowAgraMarbleInlayWalkthrough(true);
                        }}
                        onBaluchariSareeOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBaluchariSareeWalkthrough(true);
                        }}
                        onBankuraTerracottaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBankuraTerracottaWalkthrough(true);
                        }}
                        onBasohliPaintingOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBasohliPaintingWalkthrough(true);
                        }}
                        onCaneBambooCraftAndamanOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowCaneBambooCraftAndamanWalkthrough(true);
                        }}
                        onChandigarhModernistOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowChandigarhModernistWalkthrough(true);
                        }}
                        onCoastalFiberCraftOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowCoastalFiberCraftWalkthrough(true);
                        }}
                        onCoconutShellCraftOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowCoconutShellCraftWalkthrough(true);
                        }}
                        onCoirCraftLakshadweepOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowCoirCraftLakshadweepWalkthrough(true);
                        }}
                        onDhaniakhaliSareeOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowDhaniakhaliSareeWalkthrough(true);
                        }}
                        onFrancoTamilEnvironmentOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowFrancoTamilEnvironmentWalkthrough(true);
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
            <ThangkaNewFullscreenWalkthrough
                isOpen={showThangkaNewWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowThangkaNewWalkthrough)}
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

            <KatabAppliqueFullscreenWalkthrough
                isOpen={showKatabAppliqueWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKatabAppliqueWalkthrough)}
            />

            <BaghPrintFullscreenWalkthrough
                isOpen={showBaghPrintWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBaghPrintWalkthrough)}
            />

            <BambooCraftFullscreenWalkthrough
                isOpen={showBambooCraftWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBambooCraftWalkthrough)}
            />

            <NagaBeadClusterFullscreenWalkthrough
                isOpen={showNagaBeadClusterWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowNagaBeadClusterWalkthrough)}
            />

            <BidriwareFullscreenWalkthrough
                isOpen={showBidriwareWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBidriwareWalkthrough)}
            />

            <BorderSignTextileFullscreenWalkthrough
                isOpen={showBorderSignTextileWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBorderSignTextileWalkthrough)}
            />

            <BundeliPaintingFullscreenWalkthrough
                isOpen={showBundeliPaintingWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBundeliPaintingWalkthrough)}
            />

            <CeremonialEmblemFullscreenWalkthrough
                isOpen={showCeremonialEmblemWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowCeremonialEmblemWalkthrough)}
            />

            <ChannapatnaToysFullscreenWalkthrough
                isOpen={showChannapatnaToysWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowChannapatnaToysWalkthrough)}
            />

            <CoirCraftFullscreenWalkthrough
                isOpen={showCoirCraftWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowCoirCraftWalkthrough)}
            />

            <BellMetalRitualsFullscreenWalkthrough
                isOpen={showBellMetalRitualsWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBellMetalRitualsWalkthrough)}
            />

            <KasutiEmbroideryFullscreenWalkthrough
                isOpen={showKasutiEmbroideryWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKasutiEmbroideryWalkthrough)}
            />

            <KeralaMuralFullscreenWalkthrough
                isOpen={showKeralaMuralWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKeralaMuralWalkthrough)}
            />

            <KhambhatAgateFullscreenWalkthrough
                isOpen={showKhambhatAgateWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKhambhatAgateWalkthrough)}
            />

            <KinhalCraftFullscreenWalkthrough
                isOpen={showKinhalCraftWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKinhalCraftWalkthrough)}
            />

            <KolhapurJewelleryFullscreenWalkthrough
                isOpen={showKolhapurJewelleryWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKolhapurJewelleryWalkthrough)}
            />

            <KolhapuriChappalFullscreenWalkthrough
                isOpen={showKolhapuriChappalWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKolhapuriChappalWalkthrough)}
            />

            <KolhapuriSaajFullscreenWalkthrough
                isOpen={showKolhapuriSaajWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKolhapuriSaajWalkthrough)}
            />

            <LambaniEmbroideryFullscreenWalkthrough
                isOpen={showLambaniEmbroideryWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowLambaniEmbroideryWalkthrough)}
            />

            <LeatherToysFullscreenWalkthrough
                isOpen={showLeatherToysWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowLeatherToysWalkthrough)}
            />

            <PaithaniFullscreenWalkthrough
                isOpen={showPaithaniWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPaithaniWalkthrough)}
            />

            <PawndumFullscreenWalkthrough
                isOpen={showPawndumWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPawndumWalkthrough)}
            />

            <PoshinaTerracottaFullscreenWalkthrough
                isOpen={showPoshinaTerracottaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPoshinaTerracottaWalkthrough)}
            />

            <PrestigePendantsFullscreenWalkthrough
                isOpen={showPrestigePendantsWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPrestigePendantsWalkthrough)}
            />

            <PuancheiFullscreenWalkthrough
                isOpen={showPuancheiWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPuancheiWalkthrough)}
            />

            <PuanlaisenFullscreenWalkthrough
                isOpen={showPuanlaisenWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPuanlaisenWalkthrough)}
            />

            <SandalwoodCarvingFullscreenWalkthrough
                isOpen={showSandalwoodCarvingWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSandalwoodCarvingWalkthrough)}
            />

            <SankhedaWoodworkFullscreenWalkthrough
                isOpen={showSankhedaWoodworkWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSankhedaWoodworkWalkthrough)}
            />

            <GanjifaFullscreenWalkthrough
                isOpen={showGanjifaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowGanjifaWalkthrough)}
            />

            <SawantwadiWoodcraftFullscreenWalkthrough
                isOpen={showSawantwadiWoodcraftWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSawantwadiWoodcraftWalkthrough)}
            />

            <ShapheeLanpheeFullscreenWalkthrough
                isOpen={showShapheeLanpheeWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowShapheeLanpheeWalkthrough)}
            />

            <SheerFieldClothFullscreenWalkthrough
                isOpen={showSheerFieldClothWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSheerFieldClothWalkthrough)}
            />

            <BodyAugmentationFullscreenWalkthrough
                isOpen={showBodyAugmentationWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBodyAugmentationWalkthrough)}
            />

            <TawlhlophuanFullscreenWalkthrough
                isOpen={showTawlhlophuanWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowTawlhlophuanWalkthrough)}
            />

            <TempleMuralFullscreenWalkthrough
                isOpen={showTempleMuralWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowTempleMuralWalkthrough)}
            />

            <TogaluGombeyaataFullscreenWalkthrough
                isOpen={showTogaluGombeyaataWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowTogaluGombeyaataWalkthrough)}
            />

            <NagaShawlFullscreenWalkthrough
                isOpen={showNagaShawlWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowNagaShawlWalkthrough)}
            />

            <WangkheiPheeFullscreenWalkthrough
                isOpen={showWangkheiPheeWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowWangkheiPheeWalkthrough)}
            />

            <MeritShawlFullscreenWalkthrough
                isOpen={showMeritShawlWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMeritShawlWalkthrough)}
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

            {/* New Cultural Craft Styles */}
            <TraditionalStyleWalkthrough
                isOpen={showBanarasMuralWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBanarasMuralWalkthrough)}
                styleId="banarasmural"
                styleTitle="BANARAS MURAL"
                styleName="Uttar Pradesh"
                styleTag="Uttar Pradesh"
                styleDesc="A sacred wall-painting tradition where devotional imagery is embedded into architectural surfaces."
                styleImage="/HomePage/creativeStyle/4th-images/banaras-mural.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showBanarasiBrocadeWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBanarasiBrocadeWalkthrough)}
                styleId="banarasibrocade"
                styleTitle="BANARASI BROCADE"
                styleName="Uttar Pradesh"
                styleTag="Uttar Pradesh"
                styleDesc="A woven silk tradition where intricate patterns emerge directly from the loom using zari threads."
                styleImage="/HomePage/creativeStyle/4th-images/banarasi-brocade.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showBanjaraEmbroideryWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBanjaraEmbroideryWalkthrough)}
                styleId="banjaraembroidery"
                styleTitle="BANJARA EMBROIDERY"
                styleName="Telangana"
                styleTag="Telangana"
                styleDesc="A vibrant textile tradition where mirrors, stitches, and patchwork come together to create bold geometric surfaces."
                styleImage="/HomePage/creativeStyle/4th-images/banjara-embroidery.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showPataChitraWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPataChitraWalkthrough)}
                styleId="patachitra"
                styleTitle="PATA CHITRA"
                styleName="West Bengal"
                styleTag="West Bengal"
                styleDesc="A storytelling painting tradition where vivid scenes unfold through bold lines and expressive figures."
                styleImage="/HomePage/creativeStyle/4th-images/pata-chitra.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showBhotiaWeavingWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBhotiaWeavingWalkthrough)}
                styleId="bhotiaweaving"
                styleTitle="BHOTIA WEAVING"
                styleName="Uttarakhand"
                styleTag="Uttarakhand"
                styleDesc="A high-altitude wool weaving tradition designed for warmth, durability, and rugged mountain life."
                styleImage="/HomePage/creativeStyle/4th-images/bhotia-weaving.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showCheriyalWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowCheriyalWalkthrough)}
                styleId="cheriyal"
                styleTitle="CHERIYAL"
                styleName="Telangana"
                styleTag="Telangana"
                styleDesc="A painted scroll tradition where stories unfold through bold figures on a striking red background."
                styleImage="/HomePage/creativeStyle/4th-images/cheriyal.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showChikankariWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowChikankariWalkthrough)}
                styleId="chikankari"
                styleTitle="CHIKANKARI"
                styleName="Uttar Pradesh"
                styleTag="Uttar Pradesh"
                styleDesc="A delicate shadow-work embroidery where fine white threads create ethereal patterns on light fabrics."
                styleImage="/HomePage/creativeStyle/4th-images/chikankari.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showCholaBronzeWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowCholaBronzeWalkthrough)}
                styleId="cholabronze"
                styleTitle="CHOLA BRONZE"
                styleName="Tamil Nadu"
                styleTag="Tamil Nadu"
                styleDesc="A lost-wax casting tradition that captures divine movement and grace in enduring metallic form."
                styleImage="/HomePage/creativeStyle/4th-images/chola-bronze.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showCholaOldBronzeWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowCholaOldBronzeWalkthrough)}
                styleId="cholaoldbronze"
                styleTitle="CHOLA OLD BRONZE"
                styleName="Tamil Nadu"
                styleTag="Tamil Nadu"
                styleDesc="An ancient casting tradition characterized by weathered patinas and timeless spiritual weight."
                styleImage="/HomePage/creativeStyle/4th-images/chola-old-bronze.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showFarrukhabadPrintWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowFarrukhabadPrintWalkthrough)}
                styleId="farrukhabadprint"
                styleTitle="FARRUKHABAD PRINT"
                styleName="Uttar Pradesh"
                styleTag="Uttar Pradesh"
                styleDesc="A block-printing tradition known for its large, intricate paisley motifs and deep, earthy tones."
                styleImage="/HomePage/creativeStyle/4th-images/farrukhabad-print.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showOdishaFiligreeWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowOdishaFiligreeWalkthrough)}
                styleId="odishafiligree"
                styleTitle="ODISHA FILIGREE"
                styleName="Odisha"
                styleTag="Odisha"
                styleDesc="A silver-crafting tradition where fine wires are spun into delicate, lace-like structures of immense beauty."
                styleImage="/HomePage/creativeStyle/4th-images/odisha-filigree.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showGadwalSareeWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowGadwalSareeWalkthrough)}
                styleId="gadwalsaree"
                styleTitle="GADWAL SAREE"
                styleName="Telangana"
                styleTag="Telangana"
                styleDesc="A unique weaving tradition where cotton bodies meet silk borders through masterful interlocking techniques."
                styleImage="/HomePage/creativeStyle/4th-images/gadwal-saree.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showGollabhamaSareeWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowGollabhamaSareeWalkthrough)}
                styleId="gollabhamasaree"
                styleTitle="GOLLABHAMA SAREE"
                styleName="Telangana"
                styleTag="Telangana"
                styleDesc="A charming textile tradition featuring woven motifs of milkmaids carrying pots, symbolizing rural life."
                styleImage="/HomePage/creativeStyle/4th-images/gollabhama-saree.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showGotaZariWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowGotaZariWalkthrough)}
                styleId="gotazari"
                styleTitle="GOTA ZARI"
                styleName="Rajasthan"
                styleTag="Rajasthan"
                styleDesc="A royal textile craft where metallic ribbons are appliquéed onto fabric to create shimmering, festive surfaces."
                styleImage="/HomePage/creativeStyle/4th-images/gota-zari.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showKaavadWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKaavadWalkthrough)}
                styleId="kaavad"
                styleTitle="KAAVAD"
                styleName="Rajasthan"
                styleTag="Rajasthan"
                styleDesc="A portable wooden shrine tradition where mythological stories unfold through multiple painted folding panels."
                styleImage="/HomePage/creativeStyle/4th-images/kaavad.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showKalighatPaintingWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKalighatPaintingWalkthrough)}
                styleId="kalighatpainting"
                styleTitle="KALIGHAT PAINTING"
                styleName="West Bengal"
                styleTag="West Bengal"
                styleDesc="A bold watercolor tradition from Bengal featuring expressive figures and sharp social commentary."
                styleImage="/HomePage/creativeStyle/4th-images/kalighat-painting.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showKaruppurKalamkariWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKaruppurKalamkariWalkthrough)}
                styleId="karuppurkalamkari"
                styleTitle="KARUPPUR KALAMKARI"
                styleName="Tamil Nadu"
                styleTag="Tamil Nadu"
                styleDesc="A rare textile tradition where hand-painted natural dyes are enriched with woven gold zari work."
                styleImage="/HomePage/creativeStyle/4th-images/karuppur-kalamkari.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showKolamGeometryWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKolamGeometryWalkthrough)}
                styleId="kolamgeometry"
                styleTitle="KOLAM GEOMETRY"
                styleName="Tamil Nadu"
                styleTag="Tamil Nadu"
                styleDesc="A ritual floor-art tradition where mathematical precision meets spiritual invitation through rhythmic dots and lines."
                styleImage="/HomePage/creativeStyle/4th-images/kolam-geometry.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showLacBanglesWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowLacBanglesWalkthrough)}
                styleId="lacbangles"
                styleTitle="LAC BANGLES"
                styleName="Rajasthan"
                styleTag="Rajasthan"
                styleDesc="A vibrant jewelry tradition where resin is molded and encrusted with stones to create bold, colorful ornaments."
                styleImage="/HomePage/creativeStyle/4th-images/lac-bangles.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showMaduraiSungudiWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMaduraiSungudiWalkthrough)}
                styleId="maduraisungudi"
                styleTitle="MADURAI SUNGUDI"
                styleName="Tamil Nadu"
                styleTag="Tamil Nadu"
                styleDesc="A tie-dye textile tradition where tiny, hand-knotted patterns create a mesmerizing starry-night effect on fabric."
                styleImage="/HomePage/creativeStyle/4th-images/madurai-sungudi.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showMahabalipuramSculptureWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMahabalipuramSculptureWalkthrough)}
                styleId="mahabalipuramsculpture"
                styleTitle="MAHABALIPURAM SCULPTURE"
                styleName="Tamil Nadu"
                styleTag="Tamil Nadu"
                styleDesc="A monumental stone-carving tradition where granite is transformed into lifelike figures and epic rock-cut temples."
                styleImage="/HomePage/creativeStyle/4th-images/mahabalipuram-sculpture.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showNarayanpetSareeWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowNarayanpetSareeWalkthrough)}
                styleId="narayanpetsaree"
                styleTitle="NARAYANPET SAREE"
                styleName="Telangana"
                styleTag="Telangana"
                styleDesc="A sturdy weaving tradition known for its distinct check patterns and vibrant contrasting borders."
                styleImage="/HomePage/creativeStyle/4th-images/narayanpet-saree.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showNirmalArtWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowNirmalArtWalkthrough)}
                styleId="nirmalart"
                styleTitle="NIRMAL ART"
                styleName="Telangana"
                styleTag="Telangana"
                styleDesc="A rich lacquered woodwork tradition where golden hues and vibrant colors bring mythological scenes to life."
                styleImage="/HomePage/creativeStyle/4th-images/nirmal-art.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showBambooCaneCraftWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBambooCaneCraftWalkthrough)}
                styleId="bamboocanecraft"
                styleTitle="BAMBOO & CANE CRAFT"
                styleName="North East"
                styleTag="North East"
                styleDesc="A traditional weaving craft where bamboo and cane are shaped into functional forms and rhythmic structures."
                styleImage="/HomePage/creativeStyle/4th-images/bamboo--cane-craft.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showOdishaStoneCarvingWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowOdishaStoneCarvingWalkthrough)}
                styleId="odishastonecarving"
                styleTitle="ODISHA STONE CARVING"
                styleName="Odisha"
                styleTag="Odisha"
                styleDesc="An ancient stone-carving tradition where sacred forms and temple narratives are sculpted in relief and monumental scale."
                styleImage="/HomePage/creativeStyle/4th-images/odisha-stone-carving.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showPachraWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPachraWalkthrough)}
                styleId="pachra"
                styleTitle="PACHRA"
                styleName="Tripura"
                styleTag="Tripura"
                styleDesc="A traditional handwoven textile from Tripura, defined by its specific cultural motifs and rhythmic weaving patterns."
                styleImage="/HomePage/creativeStyle/4th-images/pachra.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showPembarthiMetalCraftWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPembarthiMetalCraftWalkthrough)}
                styleId="pembarthimetalcraft"
                styleTitle="PEMBARTHI METAL CRAFT"
                styleName="Telangana"
                styleTag="Telangana"
                styleDesc="An ancient metalwork tradition where brass and copper surfaces are adorned with intricate deep-relief hand carvings."
                styleImage="/HomePage/creativeStyle/4th-images/pembarthi-metal-craft.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showPilkhuwaBlockPrintWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPilkhuwaBlockPrintWalkthrough)}
                styleId="pilkhuwablockprint"
                styleTitle="PILKHUWA BLOCK PRINT"
                styleName="Uttar Pradesh"
                styleTag="Uttar Pradesh"
                styleDesc="A traditional hand-block printing style from Uttar Pradesh, known for its distinct rhythmic patterns and floral compositions."
                styleImage="/HomePage/creativeStyle/4th-images/pilkhuwa-block-print.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showRangwaliPichhodaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowRangwaliPichhodaWalkthrough)}
                styleId="rangwalipichhoda"
                styleTitle="RANGWALI PICHHODA"
                styleName="Uttarakhand"
                styleTag="Uttarakhand"
                styleDesc="A traditional ceremonial veil from Uttarakhand, characteristically adorned with auspicious symbols and vibrant dotted patterns."
                styleImage="/HomePage/creativeStyle/4th-images/rangwali-pichhoda.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showRignaiWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowRignaiWalkthrough)}
                styleId="rignai"
                styleTitle="RIGNAI"
                styleName="Tripura"
                styleTag="Tripura"
                styleDesc="A traditional handwoven lower garment from Tripura, featuring complex geometric patterns and cultural symbolism."
                styleImage="/HomePage/creativeStyle/4th-images/rignai.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showRisaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowRisaWalkthrough)}
                styleId="risa"
                styleTitle="RISA"
                styleName="Tripura"
                styleTag="Tripura"
                styleDesc="A traditional handwoven upper cloth from Tripura, used as ceremonial headgear and a symbol of cultural honor."
                styleImage="/HomePage/creativeStyle/4th-images/risa.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showSanjhiWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSanjhiWalkthrough)}
                styleId="sanjhi"
                styleTitle="SANJHI"
                styleName="Uttar Pradesh"
                styleTag="Uttar Pradesh"
                styleDesc="A sacred paper-cutting tradition from Mathura, where intricate stencils are used to create devotional art and threshold patterns."
                styleImage="/HomePage/creativeStyle/4th-images/sanjhi.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showTamilRitualCraftWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowTamilRitualCraftWalkthrough)}
                styleId="tamilritualcraft"
                styleTitle="TAMIL RITUAL CRAFT"
                styleName="Tamil Nadu"
                styleTag="Tamil Nadu"
                styleDesc="A broad category of ceremonial crafts from Tamil Nadu, designed for sacred temple rituals and festive processions."
                styleImage="/HomePage/creativeStyle/4th-images/tamil-ritual-craft.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showTanjorePaintingWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowTanjorePaintingWalkthrough)}
                styleId="tanjorepainting"
                styleTitle="TANJORE PAINTING"
                styleName="Tamil Nadu"
                styleTag="Tamil Nadu"
                styleDesc="A classical painting style from Tamil Nadu, known for its rich colors, gold-leaf embellishments, and sacred iconography."
                styleImage="/HomePage/creativeStyle/4th-images/tanjore-painting.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showThanjavurDollWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowThanjavurDollWalkthrough)}
                styleId="thanjavurdoll"
                styleTitle="THANJAVUR DOLL"
                styleName="Tamil Nadu"
                styleTag="Tamil Nadu"
                styleDesc="A traditional bobblehead craft from Tamil Nadu, featuring handmade terracotta forms that move with a distinct rhythmic grace."
                styleImage="/HomePage/creativeStyle/4th-images/thanjavur-doll.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showTherukoothuWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowTherukoothuWalkthrough)}
                styleId="therukoothu"
                styleTitle="THERUKOOTHU"
                styleName="Tamil Nadu"
                styleTag="Tamil Nadu"
                styleDesc="An ancient folk theatre tradition from Tamil Nadu, where sacred epics are enacted through music, dance, and vibrant costume design."
                styleImage="/HomePage/creativeStyle/4th-images/therukoothu.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showTodaEmbroideryWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowTodaEmbroideryWalkthrough)}
                styleId="todaembroidery"
                styleTitle="TODA EMBROIDERY"
                styleName="Tamil Nadu"
                styleTag="Tamil Nadu"
                styleDesc="A unique reversible embroidery tradition from the Nilgiris, featuring precise geometric patterns in red and black wool."
                styleImage="/HomePage/creativeStyle/4th-images/toda-embroidery.avif"
            />
            <TraditionalStyleWalkthrough
                isOpen={showZardoziWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowZardoziWalkthrough)}
                styleId="zardozi"
                styleTitle="ZARDOZI"
                styleName="Uttar Pradesh"
                styleTag="Uttar Pradesh"
                styleDesc="An opulent metallic embroidery tradition where gold and silver threads are used to create intricate surface patterns on rich fabrics."
                styleImage="/HomePage/creativeStyle/4th-images/zardozi.avif"
            />

            <GabbaFullscreenWalkthrough
                isOpen={showGabbaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowGabbaWalkthrough)}
            />
            <GaradsareeFullscreenWalkthrough
                isOpen={showGaradSareeWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowGaradSareeWalkthrough)}
            />
            <HimalayansacredimageFullscreenWalkthrough
                isOpen={showHimalayanSacredImageWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowHimalayanSacredImageWalkthrough)}
            />
            <KhatambandFullscreenWalkthrough
                isOpen={showKhatambandWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKhatambandWalkthrough)}
            />
            <KushmandimaskFullscreenWalkthrough
                isOpen={showKushmandiMaskWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowKushmandiMaskWalkthrough)}
            />
            <LikhaiwoodcarvingFullscreenWalkthrough
                isOpen={showLikhaiWoodCarvingWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowLikhaiWoodCarvingWalkthrough)}
            />
            <MatweavingFullscreenWalkthrough
                isOpen={showMatWeavingWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMatWeavingWalkthrough)}
            />
            <MoradabadmetalcraftFullscreenWalkthrough
                isOpen={showMoradabadMetalCraftWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowMoradabadMetalCraftWalkthrough)}
            />
            <NamdaFullscreenWalkthrough
                isOpen={showNamdaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowNamdaWalkthrough)}
            />
            <NeedleworkFullscreenWalkthrough
                isOpen={showNeedleWorkWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowNeedleWorkWalkthrough)}
            />
            <PalmmatFullscreenWalkthrough
                isOpen={showPalmMatWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPalmMatWalkthrough)}
            />
            <PapiermachekashmirFullscreenWalkthrough
                isOpen={showPapierMacheKashmirWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPapierMacheKashmirWalkthrough)}
            />
            <PuruliachhaumaskFullscreenWalkthrough
                isOpen={showPuruliaChhauMaskWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPuruliaChhauMaskWalkthrough)}
            />
            <PapiermachepuducherryFullscreenWalkthrough
                isOpen={showPapierMachePuducherryWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowPapierMachePuducherryWalkthrough)}
            />
            <RammanmaskFullscreenWalkthrough
                isOpen={showRammanMaskWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowRammanMaskWalkthrough)}
            />
            <RockgardenassemblageFullscreenWalkthrough
                isOpen={showRockGardenAssemblageWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowRockGardenAssemblageWalkthrough)}
            />
            <SaharanpurwoodcraftFullscreenWalkthrough
                isOpen={showSaharanpurWoodCraftWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSaharanpurWoodCraftWalkthrough)}
            />
            <ShellcraftFullscreenWalkthrough
                isOpen={showShellCraftWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowShellCraftWalkthrough)}
            />
            <SozniembroideryFullscreenWalkthrough
                isOpen={showSozniEmbroideryWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowSozniEmbroideryWalkthrough)}
            />
            <TerracottacraftFullscreenWalkthrough
                isOpen={showTerracottaCraftWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowTerracottaCraftWalkthrough)}
            />
            <WalnutcarvingFullscreenWalkthrough
                isOpen={showWalnutCarvingWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowWalnutCarvingWalkthrough)}
            />
            <WoodcraftFullscreenWalkthrough
                isOpen={showWoodcraftWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowWoodcraftWalkthrough)}
            />
            <LadakhtextilesystemFullscreenWalkthrough
                isOpen={showLadakhTextileSystemWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowLadakhTextileSystemWalkthrough)}
            />
            <IndoportugueseenvironmentFullscreenWalkthrough
                isOpen={showIndoPortugueseEnvironmentWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowIndoPortugueseEnvironmentWalkthrough)}
            />
            <AgramarbleinlayFullscreenWalkthrough
                isOpen={showAgraMarbleInlayWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowAgraMarbleInlayWalkthrough)}
            />
            <BalucharisareeFullscreenWalkthrough
                isOpen={showBaluchariSareeWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBaluchariSareeWalkthrough)}
            />
            <BankuraterracottaFullscreenWalkthrough
                isOpen={showBankuraTerracottaWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBankuraTerracottaWalkthrough)}
            />
            <BasohlipaintingFullscreenWalkthrough
                isOpen={showBasohliPaintingWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowBasohliPaintingWalkthrough)}
            />
            <CanebamboocraftandamanFullscreenWalkthrough
                isOpen={showCaneBambooCraftAndamanWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowCaneBambooCraftAndamanWalkthrough)}
            />
            <ChandigarhmodernistFullscreenWalkthrough
                isOpen={showChandigarhModernistWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowChandigarhModernistWalkthrough)}
            />
            <CoastalfibercraftFullscreenWalkthrough
                isOpen={showCoastalFiberCraftWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowCoastalFiberCraftWalkthrough)}
            />
            <CoconutshellcraftFullscreenWalkthrough
                isOpen={showCoconutShellCraftWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowCoconutShellCraftWalkthrough)}
            />
            <CoircraftlakshadweepFullscreenWalkthrough
                isOpen={showCoirCraftLakshadweepWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowCoirCraftLakshadweepWalkthrough)}
            />
            <DhaniakhalisareeFullscreenWalkthrough
                isOpen={showDhaniakhaliSareeWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowDhaniakhaliSareeWalkthrough)}
            />
            <FrancotamilenvironmentFullscreenWalkthrough
                isOpen={showFrancoTamilEnvironmentWalkthrough}
                onClose={() => handleCloseWalkthrough(setShowFrancoTamilEnvironmentWalkthrough)}
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
