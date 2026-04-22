const fs = require('fs');
const path = 'c:/Users/asus/Desktop/wildmindai/wild/src/app/view/HomePage/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix Dynamic Imports
const importsTarget = /const NagashawlordinaryFullscreenWalkthrough = dynamic[\s\S]+?import StudioHomeShowcase from '\.\/compo\/StudioHomeShowcase';/;
const newImports = `const NagashawlordinaryFullscreenWalkthrough = dynamic<{ isOpen: boolean; onClose: () => void }>(
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
import StudioHomeShowcase from './compo/StudioHomeShowcase';`;

content = content.replace(importsTarget, newImports);

// 2. Fix CreativeStyle component call (restore it if missing)
if (!content.includes('<CreativeStyle')) {
    const footerTarget = /<FooterNew \/>/;
    const creativeStyleCall = `                    <CreativeStyle
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
                        onBaghEmbroideryOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBaghEmbroideryWalkthrough(true);
                        }}
                        onBagruPrintOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBagruPrintWalkthrough(true);
                        }}
                        onBandhejOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBandhejWalkthrough(true);
                        }}
                        onBerhampurPattaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBerhampurPattaWalkthrough(true);
                        }}
                        onBomkaiOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBomkaiWalkthrough(true);
                        }}
                        onBuddhistMaskOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowBuddhistMaskWalkthrough(true);
                        }}
                        onSikkimCarpetOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSikkimCarpetWalkthrough(true);
                        }}
                        onDurrieOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowDurrieWalkthrough(true);
                        }}
                        onThangkaFolkOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowThangkaNewWalkthrough(true);
                        }}
                        onPunjabJuttiOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPunjabJuttiWalkthrough(true);
                        }}
                        onKathputliOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKathputliWalkthrough(true);
                        }}
                        onKhaddarOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKhaddarWalkthrough(true);
                        }}
                        onKhanduaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKhanduaWalkthrough(true);
                        }}
                        onKhesOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowKhesWalkthrough(true);
                        }}
                        onMalerkotlaZariOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMalerkotlaZariWalkthrough(true);
                        }}
                        onMolelaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowMolelaWalkthrough(true);
                        }}
                        onPichhwaiOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPichhwaiNewWalkthrough(true);
                        }}
                        onPattachitraOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPattachitraWalkthrough(true);
                        }}
                        onPipiliOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPipiliWalkthrough(true);
                        }}
                        onRajasthaniMiniatureOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowRajasthaniMiniatureWalkthrough(true);
                        }}
                        onSambalpuriBandhaOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSambalpuriBandhaWalkthrough(true);
                        }}
                        onSanganerOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSanganerWalkthrough(true);
                        }}
                        onUstaArtOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowUstaArtWalkthrough(true);
                        }}
                        onPipiliAppliqueOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowPipiliAppliqueWalkthrough(true);
                        }}
                        onSauraOpen={() => {
                            setOpenedFromAllStyles(false);
                            setShowWelcomeModal(false);
                            setShowSauraWalkthrough(true);
                        }}
                        onAllStylesOpen={() => setShowAllStylesModal(true)}
                    />
<FooterNew />`;
    content = content.replace(footerTarget, creativeStyleCall);
}

// 3. Fix switch(id) in handleStyleSelect
const switchTarget = /case "yakshagana": setShowYakshaganaWalkthrough\(true\); break;/;
const newSwitchItems = `case "yakshagana": setShowYakshaganaWalkthrough(true); break;
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
            case "saura": setShowSauraWalkthrough(true); break;`;

content = content.replace(switchTarget, newSwitchItems);

// 4. Add modals at the bottom of JSX
const modalsTarget = /<AllStylesModal[\s\S]+?\/>/;
const newModals = `            <AllStylesModal
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
            />`;

content = content.replace(modalsTarget, newModals);

fs.writeFileSync(path, content);
console.log('Fixed page.tsx');
