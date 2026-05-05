"use client";

import { Fragment, useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { CREATIVE_STYLE_IMAGE_BASE } from "@/constants/creativeStyleCdn";
import { STYLES } from "@/styles/creativeStyleCatalog";
import type { StyleItem } from "@/styles/creativeStyleCatalog";
export { STYLES } from "@/styles/creativeStyleCatalog";

function WarliStyleCard({ style, onClick }: { style: StyleItem; onClick: (e: any) => void }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const v1Image = `${CREATIVE_STYLE_IMAGE_BASE}warlistyles/warliv1.jpg`;
  const v2Image = `${CREATIVE_STYLE_IMAGE_BASE}warlistyles/warliv2.jpg`;
  const v3Image = `${CREATIVE_STYLE_IMAGE_BASE}warlistyles/warliv3.jpg`;
  const defaultImage = style.image;
  const images = [v1Image, v2Image, v3Image];

  return (
    <Link
      href={style.href}
      onClick={onClick}
      className="w-full md:w-[340px] shrink-0 snap-start"
    >
      <div className="mb-2 overflow-hidden rounded-xl border border-white/10 bg-[#18181f] sm:mb-3">
        <div 
          className="group relative flex h-[190px] overflow-hidden sm:h-[220px]"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {images.map((imgSrc, idx) => {
            let width = "33.33%";
            if (hoveredIndex !== null) {
              width = hoveredIndex === idx ? "80%" : "10%";
            }
            return (
              <div
                key={idx}
                className="relative h-full overflow-hidden transition-[width] duration-700 ease-in-out cursor-pointer"
                style={{ width }}
                onMouseEnter={() => setHoveredIndex(idx)}
              >
                <img
                  src={imgSrc}
                  alt={`${style.name} v${idx + 1}`}
                  className="h-full w-full object-cover transition-transform duration-500"
                  style={{
                    filter: style.imageFilter,
                    transform: hoveredIndex === idx ? "scale(1.1)" : "scale(1)",
                  }}
                />
              </div>
            );
          })}

          {/* Outer Thumbnail Overlay */}
          <img
            src={style.image}
            alt={style.name}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 pointer-events-none ${
              hoveredIndex !== null ? "opacity-0" : "opacity-100"
            }`}
            style={{ filter: style.imageFilter }}
          />

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,rgba(0,0,0,0.72)_100%)]" />
          <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-white/80 backdrop-blur-[6px] sm:left-4 sm:top-4 sm:px-3 sm:text-[9px]">
            {style.tag}
          </div>
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
            <div
              className="text-[30px] uppercase leading-none tracking-[0.06em] sm:text-[34px]"
              style={{
                color: style.titleColor,
                fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif",
                textShadow: "0 2px 12px rgba(0,0,0,0.5)",
              }}
            >
              {style.title}
            </div>
            <div className="mt-1 text-[11px] font-semibold tracking-wide text-white/85 sm:text-[12px]">
              {style.name}
            </div>
            <div className="mt-1 max-w-[280px] text-[10px] leading-snug text-white/60 line-clamp-2 sm:max-w-[300px]">
              {style.desc}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}






type CreativeStyleProps = {
  onWarliOpen?: () => void;
  onAjrakhOpen?: () => void;
  onJhajjarOpen?: () => void;
  onKaaviOpen?: () => void;
  onKangraOpen?: () => void;
  onKarepaOpen?: () => void;
  onKhatwaOpen?: () => void;
  onKhovarOpen?: () => void;
  onKinnauriOpen?: () => void;
  onKosaOpen?: () => void;
  onKutchOpen?: () => void;
  onLippanOpen?: () => void;
  onMajuliOpen?: () => void;
  onManjushaOpen?: () => void;
  onMataNiPachediOpen?: () => void;
  onMadhubaniOpen?: () => void;
  onKyilKhorOpen?: () => void;
  onSherdukpenOpen?: () => void;
  onEtikoppakaOpen?: () => void;
  onKondapalliOpen?: () => void;
  onKalamkariOpen?: () => void;
  onSrikalahastiOpen?: () => void;
  onUppadaOpen?: () => void;
  onTholuOpen?: () => void;
  onThangkaOpen?: () => void;
  onWanchoOpen?: () => void;
  onMonpaOpen?: () => void;
  onHandmadePaperOpen?: () => void;
  onMonpaMaskOpen?: () => void;
  onIduMishmiOpen?: () => void;
  onAsharikandiOpen?: () => void;
  onAzulejosOpen?: () => void;
  onBandhaniOpen?: () => void;
  onBastarDhokraOpen?: () => void;
  onMuriaWallPaintingOpen?: () => void;
  onBastarWoodcraftOpen?: () => void;
  onBhagalpurSilkOpen?: () => void;
  onChambaMiniatureOpen?: () => void;
  onExposedLateriteOpen?: () => void;
  onGharcholaOpen?: () => void;
  onGodnaArtOpen?: () => void;
  onTaiAhomManuscriptOpen?: () => void;
  onTangaliyaOpen?: () => void;
  onAgrarianIndustrialOpen?: () => void;
  onIndoPortugueseOpen?: () => void;
  onTikuliArtOpen?: () => void;
  onSohraiKhovarOpen?: () => void;
  onWoodTempleCarvingOpen?: () => void;
  onNeoAgrarianBrutalismOpen?: () => void;
  onPatolaOpen?: () => void;
  onPhulkariOpen?: () => void;
  onPithoraOpen?: () => void;
  onRoganArtOpen?: () => void;
  onRuralFiberCraftOpen?: () => void;
  onSarkandaArchitectureOpen?: () => void;
  onShimplaHastkalaOpen?: () => void;
  onSitalpatiOpen?: () => void;
  onSohraiOpen?: () => void;
  onSonowalTextileOpen?: () => void;
  onSufEmbroideryOpen?: () => void;
  onKatabAppliqueOpen?: () => void;
  onBaghPrintOpen?: () => void;
  onBambooCraftOpen?: () => void;
  onNagaBeadClusterOpen?: () => void;
  onBidriwareOpen?: () => void;
  onBorderSignTextileOpen?: () => void;
  onBundeliPaintingOpen?: () => void;
  onCeremonialEmblemOpen?: () => void;
  onChannapatnaToysOpen?: () => void;
  onCoirCraftOpen?: () => void;
  onBellMetalRitualsOpen?: () => void;
  onKasutiEmbroideryOpen?: () => void;
  onKeralaMuralOpen?: () => void;
  onKhambhatAgateOpen?: () => void;
  onKinhalCraftOpen?: () => void;
  onKolhapurJewelleryOpen?: () => void;
  onKolhapuriChappalOpen?: () => void;
  onKolhapuriSaajOpen?: () => void;
  onLambaniEmbroideryOpen?: () => void;
  onLeatherToysOpen?: () => void;
  onPaithaniOpen?: () => void;
  onPawndumOpen?: () => void;
  onPoshinaTerracottaOpen?: () => void;
  onPrestigePendantsOpen?: () => void;
  onPuancheiOpen?: () => void;
  onPuanlaisenOpen?: () => void;
  onSandalwoodCarvingOpen?: () => void;
  onSankhedaWoodworkOpen?: () => void;
  onGanjifaSawantwadiOpen?: () => void;
  onSawantwadiWoodcraftOpen?: () => void;
  onShapheeLanpheeOpen?: () => void;
  onSheerFieldClothOpen?: () => void;
  onBodyAugmentationOpen?: () => void;
  onTawlhlophuanMizoramOpen?: () => void;
  onTempleMuralOpen?: () => void;
  onTogaluGombeyaataOpen?: () => void;
  onNagaShawlOpen?: () => void;
  onWangkheiPheeOpen?: () => void;
  onMeritShawlOpen?: () => void;
  onGanjifaMysoreOpen?: () => void;
  onGaroWeavingOpen?: () => void;
  onNagaBodyClothOpen?: () => void;
  onGondPaintingOpen?: () => void;
  onHardOrnamentOpen?: () => void;
  onHimrooOpen?: () => void;
  onHmaramOpen?: () => void;
  onHoysalaReliefOpen?: () => void;
  onJaintiaTextileOpen?: () => void;
  onJhabuaDollsOpen?: () => void;
  onMaheshwariOpen?: () => void;
  onMashruWeavingOpen?: () => void;
  onMoirangPheeOpen?: () => void;
  onMotiBharatOpen?: () => void;
  onMysorePaintingOpen?: () => void;
  onRosewoodInlayOpen?: () => void;
  onNagaShawlOrdinaryOpen?: () => void;
  onNgotekherhOpen?: () => void;
  onNironaLacquerOpen?: () => void;
  onOpaqueWrapOpen?: () => void;
  onWoodCarvingOpen?: () => void;
  onWroughtIronOpen?: () => void;
  onYakshaganaOpen?: () => void;
  onBaghEmbroideryOpen?: () => void;
  onBagruPrintOpen?: () => void;
  onBandhejOpen?: () => void;
  onBerhampurPattaOpen?: () => void;
  onBomkaiOpen?: () => void;
  onBuddhistMaskOpen?: () => void;
  onSikkimCarpetOpen?: () => void;
  onDurrieOpen?: () => void;
  onThangkaFolkOpen?: () => void;
  onPunjabJuttiOpen?: () => void;
  onKathputliOpen?: () => void;
  onKhaddarOpen?: () => void;
  onKhanduaOpen?: () => void;
  onKhesOpen?: () => void;
  onMalerkotlaZariOpen?: () => void;
  onMolelaOpen?: () => void;
  onPichhwaiOpen?: () => void;
  onPattachitraOpen?: () => void;
  onPipiliOpen?: () => void;
  onRajasthaniMiniatureOpen?: () => void;
  onSambalpuriBandhaOpen?: () => void;
  onSanganerOpen?: () => void;
  onUstaArtOpen?: () => void;
  onPipiliAppliqueOpen?: () => void;
  onSauraOpen?: () => void;
  onBanarasMuralOpen?: () => void;
  onBanarasiBrocadeOpen?: () => void;
  onBanjaraEmbroideryOpen?: () => void;
  onPataChitraOpen?: () => void;
  onBhotiaWeavingOpen?: () => void;
  onCheriyalOpen?: () => void;
  onChikankariOpen?: () => void;
  onCholaBronzeOpen?: () => void;
  onCholaOldBronzeOpen?: () => void;
  onFarrukhabadPrintOpen?: () => void;
  onOdishaFiligreeOpen?: () => void;
  onGadwalSareeOpen?: () => void;
  onGollabhamaSareeOpen?: () => void;
  onGotaZariOpen?: () => void;
  onKaavadOpen?: () => void;
  onKalighatPaintingOpen?: () => void;
  onKaruppurKalamkariOpen?: () => void;
  onKolamGeometryOpen?: () => void;
  onLacBanglesOpen?: () => void;
  onMaduraiSungudiOpen?: () => void;
  onMahabalipuramSculptureOpen?: () => void;
  onNarayanpetSareeOpen?: () => void;
  onNirmalArtOpen?: () => void;
  onBambooCaneCraftOpen?: () => void;
  onOdishaStoneCarvingOpen?: () => void;
  onPachraOpen?: () => void;
  onPembarthiMetalCraftOpen?: () => void;
  onPilkhuwaBlockPrintOpen?: () => void;
  onRangwaliPichhodaOpen?: () => void;
  onRignaiOpen?: () => void;
  onRisaOpen?: () => void;
  onSanjhiOpen?: () => void;
  onTamilRitualCraftOpen?: () => void;
  onTanjorePaintingOpen?: () => void;
  onThanjavurDollOpen?: () => void;
  onTherukoothuOpen?: () => void;
  onTodaEmbroideryOpen?: () => void;
  onZardoziOpen?: () => void;
  onAllStylesOpen?: () => void;

  // 5th Batch Styles
  onGabbaOpen?: () => void;
  onGaradSareeOpen?: () => void;
  onHimalayanSacredImageOpen?: () => void;
  onKhatambandOpen?: () => void;
  onKushmandiMaskOpen?: () => void;
  onLikhaiWoodCarvingOpen?: () => void;
  onMatWeavingOpen?: () => void;
  onMoradabadMetalCraftOpen?: () => void;
  onNamdaOpen?: () => void;
  onNeedleWorkOpen?: () => void;
  onPalmMatOpen?: () => void;
  onPapierMacheKashmirOpen?: () => void;
  onPuruliaChhauMaskOpen?: () => void;
  onPapierMachePuducherryOpen?: () => void;
  onRammanMaskOpen?: () => void;
  onRockGardenAssemblageOpen?: () => void;
  onSaharanpurWoodCraftOpen?: () => void;
  onShellCraftOpen?: () => void;
  onSozniEmbroideryOpen?: () => void;
  onTerracottaCraftOpen?: () => void;
  onWalnutCarvingOpen?: () => void;
  onWoodcraftOpen?: () => void;
  onLadakhTextileSystemOpen?: () => void;
  onIndoPortugueseEnvironmentOpen?: () => void;
  onAgraMarbleInlayOpen?: () => void;
  onBaluchariSareeOpen?: () => void;
  onBankuraTerracottaOpen?: () => void;
  onBasohliPaintingOpen?: () => void;
  onCaneBambooCraftAndamanOpen?: () => void;
  onChandigarhModernistOpen?: () => void;
  onCoastalFiberCraftOpen?: () => void;
  onCoconutShellCraftOpen?: () => void;
  onCoirCraftLakshadweepOpen?: () => void;
  onDhaniakhaliSareeOpen?: () => void;
  onFrancoTamilEnvironmentOpen?: () => void;
};

export default function CreativeStyle({
  onWarliOpen,
  onAjrakhOpen,
  onJhajjarOpen,
  onKaaviOpen,
  onKangraOpen,
  onKarepaOpen,
  onKhatwaOpen,
  onKhovarOpen,
  onKinnauriOpen,
  onKosaOpen,
  onKutchOpen,
  onLippanOpen,
  onMajuliOpen,
  onManjushaOpen,
  onMataNiPachediOpen,
  onMadhubaniOpen,
  onKyilKhorOpen,
  onSherdukpenOpen,
  onEtikoppakaOpen,
  onKondapalliOpen,
  onKalamkariOpen,
  onSrikalahastiOpen,
  onUppadaOpen,
  onTholuOpen,
  onThangkaOpen,
  onWanchoOpen,
  onMonpaOpen,
  onHandmadePaperOpen,
  onMonpaMaskOpen,
  onIduMishmiOpen,
  onAsharikandiOpen,
  onAzulejosOpen,
  onBandhaniOpen,
  onBastarDhokraOpen,
  onMuriaWallPaintingOpen,
  onBastarWoodcraftOpen,
  onBhagalpurSilkOpen,
  onChambaMiniatureOpen,
  onExposedLateriteOpen,
  onGharcholaOpen,
  onGodnaArtOpen,
  onTaiAhomManuscriptOpen,
  onTangaliyaOpen,
  onAgrarianIndustrialOpen,
  onIndoPortugueseOpen,
  onTikuliArtOpen,
  onSohraiKhovarOpen,
  onWoodTempleCarvingOpen,
  onNeoAgrarianBrutalismOpen,
  onPatolaOpen,
  onPhulkariOpen,
  onPithoraOpen,
  onRoganArtOpen,
  onRuralFiberCraftOpen,
  onSarkandaArchitectureOpen,
  onShimplaHastkalaOpen,
  onSitalpatiOpen,
  onSohraiOpen,
  onSonowalTextileOpen,
  onSufEmbroideryOpen,
  onKatabAppliqueOpen,
  onBaghPrintOpen,
  onBambooCraftOpen,
  onNagaBeadClusterOpen,
  onBidriwareOpen,
  onBorderSignTextileOpen,
  onBundeliPaintingOpen,
  onCeremonialEmblemOpen,
  onChannapatnaToysOpen,
  onCoirCraftOpen,
  onBellMetalRitualsOpen,
  onKasutiEmbroideryOpen,
  onKeralaMuralOpen,
  onKhambhatAgateOpen,
  onKinhalCraftOpen,
  onKolhapurJewelleryOpen,
  onKolhapuriChappalOpen,
  onKolhapuriSaajOpen,
  onLambaniEmbroideryOpen,
  onLeatherToysOpen,
  onPaithaniOpen,
  onPawndumOpen,
  onPoshinaTerracottaOpen,
  onPrestigePendantsOpen,
  onPuancheiOpen,
  onPuanlaisenOpen,
  onSandalwoodCarvingOpen,
  onSankhedaWoodworkOpen,
  onGanjifaSawantwadiOpen,
  onSawantwadiWoodcraftOpen,
  onShapheeLanpheeOpen,
  onSheerFieldClothOpen,
  onBodyAugmentationOpen,
  onTawlhlophuanMizoramOpen,
  onTempleMuralOpen,
  onTogaluGombeyaataOpen,
  onNagaShawlOpen,
  onWangkheiPheeOpen,
  onMeritShawlOpen,
  onGanjifaMysoreOpen,
  onGaroWeavingOpen,
  onNagaBodyClothOpen,
  onGondPaintingOpen,
  onHardOrnamentOpen,
  onHimrooOpen,
  onHmaramOpen,
  onHoysalaReliefOpen,
  onJaintiaTextileOpen,
  onJhabuaDollsOpen,
  onMaheshwariOpen,
  onMashruWeavingOpen,
  onMoirangPheeOpen,
  onMotiBharatOpen,
  onMysorePaintingOpen,
  onRosewoodInlayOpen,
  onNagaShawlOrdinaryOpen,
  onNgotekherhOpen,
  onNironaLacquerOpen,
  onOpaqueWrapOpen,
  onWoodCarvingOpen,
  onWroughtIronOpen,
  onYakshaganaOpen,
  onBaghEmbroideryOpen,
  onBagruPrintOpen,
  onBandhejOpen,
  onBerhampurPattaOpen,
  onBomkaiOpen,
  onBuddhistMaskOpen,
  onSikkimCarpetOpen,
  onDurrieOpen,
  onThangkaFolkOpen,
  onPunjabJuttiOpen,
  onKathputliOpen,
  onKhaddarOpen,
  onKhanduaOpen,
  onKhesOpen,
  onMalerkotlaZariOpen,
  onMolelaOpen,
  onPichhwaiOpen,
  onPattachitraOpen,
  onPipiliOpen,
  onRajasthaniMiniatureOpen,
  onSambalpuriBandhaOpen,
  onSanganerOpen,
  onUstaArtOpen,
  onPipiliAppliqueOpen,
  onSauraOpen,
  onBanarasMuralOpen,
  onBanarasiBrocadeOpen,
  onBanjaraEmbroideryOpen,
  onPataChitraOpen,
  onBhotiaWeavingOpen,
  onCheriyalOpen,
  onChikankariOpen,
  onCholaBronzeOpen,
  onCholaOldBronzeOpen,
  onFarrukhabadPrintOpen,
  onOdishaFiligreeOpen,
  onGadwalSareeOpen,
  onGollabhamaSareeOpen,
  onGotaZariOpen,
  onKaavadOpen,
  onKalighatPaintingOpen,
  onKaruppurKalamkariOpen,
  onKolamGeometryOpen,
  onLacBanglesOpen,
  onMaduraiSungudiOpen,
  onMahabalipuramSculptureOpen,
  onNarayanpetSareeOpen,
  onNirmalArtOpen,
  onBambooCaneCraftOpen,
  onOdishaStoneCarvingOpen,
  onPachraOpen,
  onPembarthiMetalCraftOpen,
  onPilkhuwaBlockPrintOpen,
  onRangwaliPichhodaOpen,
  onRignaiOpen,
  onRisaOpen,
  onSanjhiOpen,
  onTamilRitualCraftOpen,
  onTanjorePaintingOpen,
  onThanjavurDollOpen,
  onTherukoothuOpen,
  onTodaEmbroideryOpen,
  onZardoziOpen,
  onAllStylesOpen,

  // 5th Batch
  onGabbaOpen,
  onGaradSareeOpen,
  onHimalayanSacredImageOpen,
  onKhatambandOpen,
  onKushmandiMaskOpen,
  onLikhaiWoodCarvingOpen,
  onMatWeavingOpen,
  onMoradabadMetalCraftOpen,
  onNamdaOpen,
  onNeedleWorkOpen,
  onPalmMatOpen,
  onPapierMacheKashmirOpen,
  onPuruliaChhauMaskOpen,
  onPapierMachePuducherryOpen,
  onRammanMaskOpen,
  onRockGardenAssemblageOpen,
  onSaharanpurWoodCraftOpen,
  onShellCraftOpen,
  onSozniEmbroideryOpen,
  onTerracottaCraftOpen,
  onWalnutCarvingOpen,
  onWoodcraftOpen,
  onLadakhTextileSystemOpen,
  onIndoPortugueseEnvironmentOpen,
  onAgraMarbleInlayOpen,
  onBaluchariSareeOpen,
  onBankuraTerracottaOpen,
  onBasohliPaintingOpen,
  onCaneBambooCraftAndamanOpen,
  onChandigarhModernistOpen,
  onCoastalFiberCraftOpen,
  onCoconutShellCraftOpen,
  onCoirCraftLakshadweepOpen,
  onDhaniakhaliSareeOpen,
  onFrancoTamilEnvironmentOpen,
}: CreativeStyleProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleStyleClick = (event: MouseEvent<HTMLAnchorElement>, style: StyleItem) => {
    const t = style.title.toLowerCase();
    const id = style.id.toLowerCase();

    if ((id === "maharashtra" || t === "warli") && onWarliOpen) {
      event.preventDefault();
      onWarliOpen();
      return;
    }
    if (style.id === "ajrakh" && onAjrakhOpen) {
      event.preventDefault();
      onAjrakhOpen();
      return;
    }
    if (style.id === "jhajjar" && onJhajjarOpen) {
      event.preventDefault();
      onJhajjarOpen();
      return;
    }
    if (style.id === "kaavi" && onKaaviOpen) {
      event.preventDefault();
      onKaaviOpen();
      return;
    }
    if (style.id === "kangra" && onKangraOpen) {
      event.preventDefault();
      onKangraOpen();
      return;
    }
    if (style.id === "karepa" && onKarepaOpen) {
      event.preventDefault();
      onKarepaOpen();
      return;
    }
    if (style.id === "khatwa" && onKhatwaOpen) {
      event.preventDefault();
      onKhatwaOpen();
      return;
    }
    if (style.id === "khovar" && onKhovarOpen) {
      event.preventDefault();
      onKhovarOpen();
      return;
    }
    if (style.id === "kinnauri" && onKinnauriOpen) {
      event.preventDefault();
      onKinnauriOpen();
      return;
    }
    if (style.id === "kosa" && onKosaOpen) {
      event.preventDefault();
      onKosaOpen();
      return;
    }
    if (style.id === "kutch" && onKutchOpen) {
      event.preventDefault();
      onKutchOpen();
      return;
    }
    if (style.id === "lippan" && onLippanOpen) {
      event.preventDefault();
      onLippanOpen();
      return;
    }
    if (style.id === "majuli" && onMajuliOpen) {
      event.preventDefault();
      onMajuliOpen();
      return;
    }
    if (style.id === "manjusha" && onManjushaOpen) {
      event.preventDefault();
      onManjushaOpen();
      return;
    }
    if (style.id === "matanipachedi" && onMataNiPachediOpen) {
      event.preventDefault();
      onMataNiPachediOpen();
      return;
    }
    if (style.id === "madhubani" && onMadhubaniOpen) {
      event.preventDefault();
      onMadhubaniOpen();
      return;
    }
    if (style.id === "kyilkhor" && onKyilKhorOpen) {
      event.preventDefault();
      onKyilKhorOpen();
      return;
    }
    if (style.id === "sherdukpen" && onSherdukpenOpen) {
      event.preventDefault();
      onSherdukpenOpen();
      return;
    }
    if (style.id === "etikoppaka" && onEtikoppakaOpen) {
      event.preventDefault();
      onEtikoppakaOpen();
      return;
    }
    if (style.id === "kondapalli" && onKondapalliOpen) {
      event.preventDefault();
      onKondapalliOpen();
      return;
    }
    if (style.id === "monpamask" && onMonpaMaskOpen) {
      event.preventDefault();
      onMonpaMaskOpen();
      return;
    }
    if (style.id === "handmadepaper" && onHandmadePaperOpen) {
      event.preventDefault();
      onHandmadePaperOpen();
      return;
    }
    if (style.id === "monpa" && onMonpaOpen) {
      event.preventDefault();
      onMonpaOpen();
      return;
    }
    if (style.id === "wancho" && onWanchoOpen) {
      event.preventDefault();
      onWanchoOpen();
      return;
    }
    if (style.id === "thangka" && onThangkaOpen) {
      event.preventDefault();
      onThangkaOpen();
      return;
    }
    if (style.id === "tholu" && onTholuOpen) {
      event.preventDefault();
      onTholuOpen();
      return;
    }
    if (style.id === "uppadajamdani" && onUppadaOpen) {
      event.preventDefault();
      onUppadaOpen();
      return;
    }
    if (style.id === "machilipatnam" && onKalamkariOpen) {
      event.preventDefault();
      onKalamkariOpen();
      return;
    }
    if (style.id === "srikalahasti" && onSrikalahastiOpen) {
      event.preventDefault();
      onSrikalahastiOpen();
      return;
    }
    if (style.id === "idumishmi" && onIduMishmiOpen) {
      event.preventDefault();
      onIduMishmiOpen();
      return;
    }
    if (style.id === "asharikandi" && onAsharikandiOpen) {
      event.preventDefault();
      onAsharikandiOpen();
      return;
    }
    if (style.id === "azulejos" && onAzulejosOpen) {
      event.preventDefault();
      onAzulejosOpen();
      return;
    }
    if (style.id === "bandhani" && onBandhaniOpen) {
      event.preventDefault();
      onBandhaniOpen();
      return;
    }
    if (style.id === "bastardhokra" && onBastarDhokraOpen) {
      event.preventDefault();
      onBastarDhokraOpen();
      return;
    }
    if (style.id === "muriawallpainting" && onMuriaWallPaintingOpen) {
      event.preventDefault();
      onMuriaWallPaintingOpen();
      return;
    }
    if (style.id === "bastarwoodcraft" && onBastarWoodcraftOpen) {
      event.preventDefault();
      onBastarWoodcraftOpen();
      return;
    }
    if (style.id === "bhagalpursilk" && onBhagalpurSilkOpen) {
      event.preventDefault();
      onBhagalpurSilkOpen();
      return;
    }
    if (style.id === "chambaminiature" && onChambaMiniatureOpen) {
      event.preventDefault();
      onChambaMiniatureOpen();
      return;
    }
    if (style.id === "exposedlaterite" && onExposedLateriteOpen) {
      event.preventDefault();
      onExposedLateriteOpen();
      return;
    }
    if (style.id === "gharchola" && onGharcholaOpen) {
      event.preventDefault();
      onGharcholaOpen();
      return;
    }
    if (style.id === "godnaart" && onGodnaArtOpen) {
      event.preventDefault();
      onGodnaArtOpen();
      return;
    }
    if (style.id === "taiahommanuscript" && onTaiAhomManuscriptOpen) {
      event.preventDefault();
      onTaiAhomManuscriptOpen();
      return;
    }
    if (style.id === "tangaliya" && onTangaliyaOpen) {
      event.preventDefault();
      onTangaliyaOpen();
      return;
    }
    if (style.id === "agrarianindustrial" && onAgrarianIndustrialOpen) {
      event.preventDefault();
      onAgrarianIndustrialOpen();
      return;
    }
    if (style.id === "indoportuguese" && onIndoPortugueseOpen) {
      event.preventDefault();
      onIndoPortugueseOpen();
      return;
    }
    if (style.id === "tikuliart" && onTikuliArtOpen) {
      event.preventDefault();
      onTikuliArtOpen();
      return;
    }
    if (style.id === "sohraikhovar" && onSohraiKhovarOpen) {
      event.preventDefault();
      onSohraiKhovarOpen();
      return;
    }
    if (style.id === "woodtemplecarving" && onWoodTempleCarvingOpen) {
      event.preventDefault();
      onWoodTempleCarvingOpen();
      return;
    }
    if (style.id === "neoagrarianbrutalism" && onNeoAgrarianBrutalismOpen) {
      event.preventDefault();
      onNeoAgrarianBrutalismOpen();
      return;
    }
    if (style.id === "patola" && onPatolaOpen) {
      event.preventDefault();
      onPatolaOpen();
      return;
    }
    if (style.id === "phulkari" && onPhulkariOpen) {
      event.preventDefault();
      onPhulkariOpen();
      return;
    }
    if (style.id === "pithora" && onPithoraOpen) {
      event.preventDefault();
      onPithoraOpen();
      return;
    }
    if (style.id === "roganart" && onRoganArtOpen) {
      event.preventDefault();
      onRoganArtOpen();
      return;
    }
    if (style.id === "baghembroidery" && onBaghEmbroideryOpen) {
      event.preventDefault();
      onBaghEmbroideryOpen();
      return;
    }
    if (style.id === "bagruprint" && onBagruPrintOpen) {
      event.preventDefault();
      onBagruPrintOpen();
      return;
    }
    if (style.id === "bandhej" && onBandhejOpen) {
      event.preventDefault();
      onBandhejOpen();
      return;
    }
    if (style.id === "berhampurpatta" && onBerhampurPattaOpen) {
      event.preventDefault();
      onBerhampurPattaOpen();
      return;
    }
    if (style.id === "bomkai" && onBomkaiOpen) {
      event.preventDefault();
      onBomkaiOpen();
      return;
    }
    if (style.id === "buddhistmask" && onBuddhistMaskOpen) {
      event.preventDefault();
      onBuddhistMaskOpen();
      return;
    }
    if (style.id === "sikkimcarpet" && onSikkimCarpetOpen) {
      event.preventDefault();
      onSikkimCarpetOpen();
      return;
    }
    if (style.id === "durrie" && onDurrieOpen) {
      event.preventDefault();
      onDurrieOpen();
      return;
    }
    if (style.id === "thangka" && onThangkaFolkOpen) {
      event.preventDefault();
      onThangkaFolkOpen();
      return;
    }
    if (style.id === "punjabjutti" && onPunjabJuttiOpen) {
      event.preventDefault();
      onPunjabJuttiOpen();
      return;
    }
    if (style.id === "kathputli" && onKathputliOpen) {
      event.preventDefault();
      onKathputliOpen();
      return;
    }
    if (style.id === "khaddar" && onKhaddarOpen) {
      event.preventDefault();
      onKhaddarOpen();
      return;
    }
    if (style.id === "khandua" && onKhanduaOpen) {
      event.preventDefault();
      onKhanduaOpen();
      return;
    }
    if (style.id === "khes" && onKhesOpen) {
      event.preventDefault();
      onKhesOpen();
      return;
    }
    if (style.id === "malerkotlazari" && onMalerkotlaZariOpen) {
      event.preventDefault();
      onMalerkotlaZariOpen();
      return;
    }
    if (style.id === "molela" && onMolelaOpen) {
      event.preventDefault();
      onMolelaOpen();
      return;
    }
    if (style.id === "pichhwai" && onPichhwaiOpen) {
      event.preventDefault();
      onPichhwaiOpen();
      return;
    }
    if (style.id === "pattachitra" && onPattachitraOpen) {
      event.preventDefault();
      onPattachitraOpen();
      return;
    }
    if (style.id === "pipili" && onPipiliOpen) {
      event.preventDefault();
      onPipiliOpen();
      return;
    }
    if (style.id === "rajasthaniminiature" && onRajasthaniMiniatureOpen) {
      event.preventDefault();
      onRajasthaniMiniatureOpen();
      return;
    }
    if (style.id === "sambalpuribandha" && onSambalpuriBandhaOpen) {
      event.preventDefault();
      onSambalpuriBandhaOpen();
      return;
    }
    if (style.id === "sanganer" && onSanganerOpen) {
      event.preventDefault();
      onSanganerOpen();
      return;
    }
    if (style.id === "ustaart" && onUstaArtOpen) {
      event.preventDefault();
      onUstaArtOpen();
      return;
    }
    if (style.id === "pipiliapplique" && onPipiliAppliqueOpen) {
      event.preventDefault();
      onPipiliAppliqueOpen();
      return;
    }
    if (style.id === "saura" && onSauraOpen) {
      event.preventDefault();
      onSauraOpen();
      return;
    }
    if (style.id === "banarasmural" && onBanarasMuralOpen) {
      event.preventDefault();
      onBanarasMuralOpen();
      return;
    }
    if (style.id === "banarasibrocade" && onBanarasiBrocadeOpen) {
      event.preventDefault();
      onBanarasiBrocadeOpen();
      return;
    }
    if (style.id === "banjaraembroidery" && onBanjaraEmbroideryOpen) {
      event.preventDefault();
      onBanjaraEmbroideryOpen();
      return;
    }
    if (style.id === "patachitra" && onPataChitraOpen) {
      event.preventDefault();
      onPataChitraOpen();
      return;
    }
    if (style.id === "bhotiaweaving" && onBhotiaWeavingOpen) {
      event.preventDefault();
      onBhotiaWeavingOpen();
      return;
    }
    if (style.id === "cheriyal" && onCheriyalOpen) {
      event.preventDefault();
      onCheriyalOpen();
      return;
    }
    if (style.id === "chikankari" && onChikankariOpen) {
      event.preventDefault();
      onChikankariOpen();
      return;
    }
    if (style.id === "cholabronze" && onCholaBronzeOpen) {
      event.preventDefault();
      onCholaBronzeOpen();
      return;
    }
    if (style.id === "cholaoldbronze" && onCholaOldBronzeOpen) {
      event.preventDefault();
      onCholaOldBronzeOpen();
      return;
    }
    if (style.id === "farrukhabadprint" && onFarrukhabadPrintOpen) {
      event.preventDefault();
      onFarrukhabadPrintOpen();
      return;
    }
    if (style.id === "odishafiligree" && onOdishaFiligreeOpen) {
      event.preventDefault();
      onOdishaFiligreeOpen();
      return;
    }
    if (style.id === "gadwalsaree" && onGadwalSareeOpen) {
      event.preventDefault();
      onGadwalSareeOpen();
      return;
    }
    if (style.id === "gollabhamasaree" && onGollabhamaSareeOpen) {
      event.preventDefault();
      onGollabhamaSareeOpen();
      return;
    }
    if (style.id === "gotazari" && onGotaZariOpen) {
      event.preventDefault();
      onGotaZariOpen();
      return;
    }
    if (style.id === "kaavad" && onKaavadOpen) {
      event.preventDefault();
      onKaavadOpen();
      return;
    }
    if (style.id === "kalighatpainting" && onKalighatPaintingOpen) {
      event.preventDefault();
      onKalighatPaintingOpen();
      return;
    }
    if (style.id === "karuppurkalamkari" && onKaruppurKalamkariOpen) {
      event.preventDefault();
      onKaruppurKalamkariOpen();
      return;
    }
    if (style.id === "kolamgeometry" && onKolamGeometryOpen) {
      event.preventDefault();
      onKolamGeometryOpen();
      return;
    }
    if (style.id === "lacbangles" && onLacBanglesOpen) {
      event.preventDefault();
      onLacBanglesOpen();
      return;
    }
    if (style.id === "maduraisungudi" && onMaduraiSungudiOpen) {
      event.preventDefault();
      onMaduraiSungudiOpen();
      return;
    }
    if (style.id === "mahabalipuramsculpture" && onMahabalipuramSculptureOpen) {
      event.preventDefault();
      onMahabalipuramSculptureOpen();
      return;
    }
    if (style.id === "narayanpetsaree" && onNarayanpetSareeOpen) {
      event.preventDefault();
      onNarayanpetSareeOpen();
      return;
    }
    if (style.id === "nirmalart" && onNirmalArtOpen) {
      event.preventDefault();
      onNirmalArtOpen();
      return;
    }
    if (style.id === "bamboocanecraft" && onBambooCaneCraftOpen) {
      event.preventDefault();
      onBambooCaneCraftOpen();
      return;
    }
    if (style.id === "odishastonecarving" && onOdishaStoneCarvingOpen) {
      event.preventDefault();
      onOdishaStoneCarvingOpen();
      return;
    }
    if (style.id === "pachra" && onPachraOpen) {
      event.preventDefault();
      onPachraOpen();
      return;
    }
    if (style.id === "pembarthimetalcraft" && onPembarthiMetalCraftOpen) {
      event.preventDefault();
      onPembarthiMetalCraftOpen();
      return;
    }
    if (style.id === "pilkhuwablockprint" && onPilkhuwaBlockPrintOpen) {
      event.preventDefault();
      onPilkhuwaBlockPrintOpen();
      return;
    }
    if (style.id === "rangwalipichhoda" && onRangwaliPichhodaOpen) {
      event.preventDefault();
      onRangwaliPichhodaOpen();
      return;
    }
    if (style.id === "rignai" && onRignaiOpen) {
      event.preventDefault();
      onRignaiOpen();
      return;
    }
    if (style.id === "risa" && onRisaOpen) {
      event.preventDefault();
      onRisaOpen();
      return;
    }
    if (style.id === "sanjhi" && onSanjhiOpen) {
      event.preventDefault();
      onSanjhiOpen();
      return;
    }
    if (style.id === "tamilritualcraft" && onTamilRitualCraftOpen) {
      event.preventDefault();
      onTamilRitualCraftOpen();
      return;
    }
    if (style.id === "tanjorepainting" && onTanjorePaintingOpen) {
      event.preventDefault();
      onTanjorePaintingOpen();
      return;
    }
    if (style.id === "thanjavurdoll" && onThanjavurDollOpen) {
      event.preventDefault();
      onThanjavurDollOpen();
      return;
    }
    if (style.id === "therukoothu" && onTherukoothuOpen) {
      event.preventDefault();
      onTherukoothuOpen();
      return;
    }
    if (style.id === "todaembroidery" && onTodaEmbroideryOpen) {
      event.preventDefault();
      onTodaEmbroideryOpen();
      return;
    }
    if (style.id === "zardozi" && onZardoziOpen) {
      event.preventDefault();
      onZardoziOpen();
      return;
    }
    if (style.id === "ruralfibercraft" && onRuralFiberCraftOpen) {
      event.preventDefault();
      onRuralFiberCraftOpen();
      return;
    }
    if (style.id === "sarkandaarchitecture" && onSarkandaArchitectureOpen) {
      event.preventDefault();
      onSarkandaArchitectureOpen();
      return;
    }
    if (style.id === "shimplahastkala" && onShimplaHastkalaOpen) {
      event.preventDefault();
      onShimplaHastkalaOpen();
      return;
    }
    if (style.id === "sitalpati" && onSitalpatiOpen) {
      event.preventDefault();
      onSitalpatiOpen();
      return;
    }
    if (style.id === "sohrai" && onSohraiOpen) {
      event.preventDefault();
      onSohraiOpen();
      return;
    }
    if (style.id === "sonowaltextile" && onSonowalTextileOpen) {
      event.preventDefault();
      onSonowalTextileOpen();
      return;
    }
    if (style.id === "sufembroidery" && onSufEmbroideryOpen) {
      event.preventDefault();
      onSufEmbroideryOpen();
      return;
    }
    if (style.id === "katabapplique" && onKatabAppliqueOpen) {
      event.preventDefault();
      onKatabAppliqueOpen();
      return;
    }
    if (style.id === "baghprint" && onBaghPrintOpen) {
      event.preventDefault();
      onBaghPrintOpen();
      return;
    }
    if (style.id === "bamboocraft" && onBambooCraftOpen) {
      event.preventDefault();
      onBambooCraftOpen();
      return;
    }
    if (style.id === "nagabeadcluster" && onNagaBeadClusterOpen) {
      event.preventDefault();
      onNagaBeadClusterOpen();
      return;
    }
    if (style.id === "bidriware" && onBidriwareOpen) {
      event.preventDefault();
      onBidriwareOpen();
      return;
    }
    if (style.id === "bordersigntextile" && onBorderSignTextileOpen) {
      event.preventDefault();
      onBorderSignTextileOpen();
      return;
    }
    if (style.id === "bundelipainting" && onBundeliPaintingOpen) {
      event.preventDefault();
      onBundeliPaintingOpen();
      return;
    }
    if (style.id === "ceremonialemblem" && onCeremonialEmblemOpen) {
      event.preventDefault();
      onCeremonialEmblemOpen();
      return;
    }
    if (style.id === "channapatnatoys" && onChannapatnaToysOpen) {
      event.preventDefault();
      onChannapatnaToysOpen();
      return;
    }
    if (style.id === "coircraft" && onCoirCraftOpen) {
      event.preventDefault();
      onCoirCraftOpen();
      return;
    }
    if (style.id === "bellmetalrituals" && onBellMetalRitualsOpen) {
      event.preventDefault();
      onBellMetalRitualsOpen();
      return;
    }
    if (style.id === "kasutiembroidery" && onKasutiEmbroideryOpen) {
      event.preventDefault();
      onKasutiEmbroideryOpen();
      return;
    }
    if (style.id === "keralamural" && onKeralaMuralOpen) {
      event.preventDefault();
      onKeralaMuralOpen();
      return;
    }
    if (style.id === "khambhatagate" && onKhambhatAgateOpen) {
      event.preventDefault();
      onKhambhatAgateOpen();
      return;
    }
    if (style.id === "kinhalcraft" && onKinhalCraftOpen) {
      event.preventDefault();
      onKinhalCraftOpen();
      return;
    }
    if (style.id === "kolhapurjewellery" && onKolhapurJewelleryOpen) {
      event.preventDefault();
      onKolhapurJewelleryOpen();
      return;
    }
    if (style.id === "kolhapurichappal" && onKolhapuriChappalOpen) {
      event.preventDefault();
      onKolhapuriChappalOpen();
      return;
    }
    if (style.id === "kolhapurisaaj" && onKolhapuriSaajOpen) {
      event.preventDefault();
      onKolhapuriSaajOpen();
      return;
    }
    if (style.id === "lambaniembroidery" && onLambaniEmbroideryOpen) {
      event.preventDefault();
      onLambaniEmbroideryOpen();
      return;
    }
    if (style.id === "leathertoys" && onLeatherToysOpen) {
      event.preventDefault();
      onLeatherToysOpen();
      return;
    }
    if (style.id === "paithani" && onPaithaniOpen) {
      event.preventDefault();
      onPaithaniOpen();
      return;
    }
    if (style.id === "pawndum" && onPawndumOpen) {
      event.preventDefault();
      onPawndumOpen();
      return;
    }
    if (style.id === "poshinaterracotta" && onPoshinaTerracottaOpen) {
      event.preventDefault();
      onPoshinaTerracottaOpen();
      return;
    }
    if (style.id === "prestigependants" && onPrestigePendantsOpen) {
      event.preventDefault();
      onPrestigePendantsOpen();
      return;
    }
    if (style.id === "puanchei" && onPuancheiOpen) {
      event.preventDefault();
      onPuancheiOpen();
      return;
    }
    if (style.id === "puanlaisen" && onPuanlaisenOpen) {
      event.preventDefault();
      onPuanlaisenOpen();
      return;
    }
    if (style.id === "sandalwoodcarving" && onSandalwoodCarvingOpen) {
      event.preventDefault();
      onSandalwoodCarvingOpen();
      return;
    }
    if (style.id === "sankhedawoodwork" && onSankhedaWoodworkOpen) {
      event.preventDefault();
      onSankhedaWoodworkOpen();
      return;
    }
    if (style.id === "ganjifa-sawantwadi" && onGanjifaSawantwadiOpen) {
      event.preventDefault();
      onGanjifaSawantwadiOpen();
      return;
    }
    if (style.id === "sawantwadiwoodcraft" && onSawantwadiWoodcraftOpen) {
      event.preventDefault();
      onSawantwadiWoodcraftOpen();
      return;
    }
    if (style.id === "shapheelanphee" && onShapheeLanpheeOpen) {
      event.preventDefault();
      onShapheeLanpheeOpen();
      return;
    }
    if (style.id === "sheerfieldcloth" && onSheerFieldClothOpen) {
      event.preventDefault();
      onSheerFieldClothOpen();
      return;
    }
    if (style.id === "bodyaugmentation" && onBodyAugmentationOpen) {
      event.preventDefault();
      onBodyAugmentationOpen();
      return;
    }
    if (style.id === "tawlhlophuan" && onTawlhlophuanMizoramOpen) {
      event.preventDefault();
      onTawlhlophuanMizoramOpen();
      return;
    }
    if (style.id === "templemural" && onTempleMuralOpen) {
      event.preventDefault();
      onTempleMuralOpen();
      return;
    }
    if (style.id === "togalugombeyaata" && onTogaluGombeyaataOpen) {
      event.preventDefault();
      onTogaluGombeyaataOpen();
      return;
    }
    if (style.id === "nagashawl" && onNagaShawlOpen) {
      event.preventDefault();
      onNagaShawlOpen();
      return;
    }
    if (style.id === "wangkheiphee" && onWangkheiPheeOpen) {
      event.preventDefault();
      onWangkheiPheeOpen();
      return;
    }
    if (style.id === "meritshawl" && onMeritShawlOpen) {
      event.preventDefault();
      onMeritShawlOpen();
      return;
    }
    if (style.id === "ganjifa-mysore" && onGanjifaMysoreOpen) {
      event.preventDefault();
      onGanjifaMysoreOpen();
      return;
    }
    if (style.id === "garoweaving" && onGaroWeavingOpen) {
      event.preventDefault();
      onGaroWeavingOpen();
      return;
    }
    if (style.id === "nagabodycloth" && onNagaBodyClothOpen) {
      event.preventDefault();
      onNagaBodyClothOpen();
      return;
    }
    if (style.id === "gondpainting" && onGondPaintingOpen) {
      event.preventDefault();
      onGondPaintingOpen();
      return;
    }
    if (style.id === "hardornament" && onHardOrnamentOpen) {
      event.preventDefault();
      onHardOrnamentOpen();
      return;
    }
    if (style.id === "himroo" && onHimrooOpen) {
      event.preventDefault();
      onHimrooOpen();
      return;
    }
    if (style.id === "hmaram" && onHmaramOpen) {
      event.preventDefault();
      onHmaramOpen();
      return;
    }
    if (style.id === "hoysalarelief" && onHoysalaReliefOpen) {
      event.preventDefault();
      onHoysalaReliefOpen();
      return;
    }
    if (style.id === "jaintiatextile" && onJaintiaTextileOpen) {
      event.preventDefault();
      onJaintiaTextileOpen();
      return;
    }
    if (style.id === "idumishmi" && onIduMishmiOpen) {
      event.preventDefault();
      onIduMishmiOpen();
      return;
    }
    if (style.id === "jhabuadolls" || style.id === "maheshwari" || style.id === "mashruweaving" ||
      style.id === "moirangphee" || style.id === "motibharat" || style.id === "mysorepainting" ||
      style.id === "rosewoodinlay" || style.id === "nagashawlordinary" || style.id === "ngotekherh" ||
      style.id === "nironalacquer" || style.id === "opaquewrap" || style.id === "tawlhlophuan" ||
      style.id === "woodcarving" || style.id === "wroughtiron" ||
      style.id === "yakshagana") {
      event.preventDefault();
    }

    switch (style.id) {
      case "jhabuadolls":
        if (onJhabuaDollsOpen) {
          event.preventDefault();
          onJhabuaDollsOpen();
        }
        break;
      case "maheshwari":
        if (onMaheshwariOpen) {
          event.preventDefault();
          onMaheshwariOpen();
        }
        break;
      case "mashruweaving":
        if (onMashruWeavingOpen) {
          event.preventDefault();
          onMashruWeavingOpen();
        }
        break;
      case "moirangphee":
        if (onMoirangPheeOpen) {
          event.preventDefault();
          onMoirangPheeOpen();
        }
        break;
      case "motibharat":
        if (onMotiBharatOpen) {
          event.preventDefault();
          onMotiBharatOpen();
        }
        break;
      case "mysorepainting":
        if (onMysorePaintingOpen) {
          event.preventDefault();
          onMysorePaintingOpen();
        }
        break;
      case "rosewoodinlay":
        if (onRosewoodInlayOpen) {
          event.preventDefault();
          onRosewoodInlayOpen();
        }
        break;
      case "nagashawlordinary":
        if (onNagaShawlOrdinaryOpen) {
          event.preventDefault();
          onNagaShawlOrdinaryOpen();
        }
        break;
      case "ngotekherh":
        if (onNgotekherhOpen) {
          event.preventDefault();
          onNgotekherhOpen();
        }
        break;
      case "nironalacquer":
        if (onNironaLacquerOpen) {
          event.preventDefault();
          onNironaLacquerOpen();
        }
        break;
      case "opaquewrap":
        if (onOpaqueWrapOpen) {
          event.preventDefault();
          onOpaqueWrapOpen();
        }
        break;
      case "woodcarving":
        if (onWoodCarvingOpen) {
          event.preventDefault();
          onWoodCarvingOpen();
        }
        break;
      case "wroughtiron":
        if (onWroughtIronOpen) {
          event.preventDefault();
          onWroughtIronOpen();
        }
        break;
      case "yakshagana":
        if (onYakshaganaOpen) {
          event.preventDefault();
          onYakshaganaOpen();
        }
        break;
      case "gabba":
        if (onGabbaOpen) {
          event.preventDefault();
          onGabbaOpen();
        }
        break;
      case "garadsaree":
        if (onGaradSareeOpen) {
          event.preventDefault();
          onGaradSareeOpen();
        }
        break;
      case "himalayansacredimage":
        if (onHimalayanSacredImageOpen) {
          event.preventDefault();
          onHimalayanSacredImageOpen();
        }
        break;
      case "khatamband":
        if (onKhatambandOpen) {
          event.preventDefault();
          onKhatambandOpen();
        }
        break;
      case "kushmandimask":
        if (onKushmandiMaskOpen) {
          event.preventDefault();
          onKushmandiMaskOpen();
        }
        break;
      case "likhaiwoodcarving":
        if (onLikhaiWoodCarvingOpen) {
          event.preventDefault();
          onLikhaiWoodCarvingOpen();
        }
        break;
      case "matweaving":
        if (onMatWeavingOpen) {
          event.preventDefault();
          onMatWeavingOpen();
        }
        break;
      case "moradabadmetalcraft":
        if (onMoradabadMetalCraftOpen) {
          event.preventDefault();
          onMoradabadMetalCraftOpen();
        }
        break;
      case "namda":
        if (onNamdaOpen) {
          event.preventDefault();
          onNamdaOpen();
        }
        break;
      case "needlework":
        if (onNeedleWorkOpen) {
          event.preventDefault();
          onNeedleWorkOpen();
        }
        break;
      case "palmmat":
        if (onPalmMatOpen) {
          event.preventDefault();
          onPalmMatOpen();
        }
        break;
      case "papiermachekashmir":
        if (onPapierMacheKashmirOpen) {
          event.preventDefault();
          onPapierMacheKashmirOpen();
        }
        break;
      case "puruliachhaumask":
        if (onPuruliaChhauMaskOpen) {
          event.preventDefault();
          onPuruliaChhauMaskOpen();
        }
        break;
      case "papiermachepuducherry":
        if (onPapierMachePuducherryOpen) {
          event.preventDefault();
          onPapierMachePuducherryOpen();
        }
        break;
      case "rammanmask":
        if (onRammanMaskOpen) {
          event.preventDefault();
          onRammanMaskOpen();
        }
        break;
      case "rockgardenassemblage":
        if (onRockGardenAssemblageOpen) {
          event.preventDefault();
          onRockGardenAssemblageOpen();
        }
        break;
      case "saharanpurwoodcraft":
        if (onSaharanpurWoodCraftOpen) {
          event.preventDefault();
          onSaharanpurWoodCraftOpen();
        }
        break;
      case "shellcraft":
        if (onShellCraftOpen) {
          event.preventDefault();
          onShellCraftOpen();
        }
        break;
      case "sozniembroidery":
        if (onSozniEmbroideryOpen) {
          event.preventDefault();
          onSozniEmbroideryOpen();
        }
        break;
      case "terracottacraft":
        if (onTerracottaCraftOpen) {
          event.preventDefault();
          onTerracottaCraftOpen();
        }
        break;
      case "walnutcarving":
        if (onWalnutCarvingOpen) {
          event.preventDefault();
          onWalnutCarvingOpen();
        }
        break;
      case "woodcraft":
        if (onWoodcraftOpen) {
          event.preventDefault();
          onWoodcraftOpen();
        }
        break;
      case "ladakhtextilesystem":
        if (onLadakhTextileSystemOpen) {
          event.preventDefault();
          onLadakhTextileSystemOpen();
        }
        break;
      case "indoportugueseenvironment":
        if (onIndoPortugueseEnvironmentOpen) {
          event.preventDefault();
          onIndoPortugueseEnvironmentOpen();
        }
        break;
      case "agramarbleinlay":
        if (onAgraMarbleInlayOpen) {
          event.preventDefault();
          onAgraMarbleInlayOpen();
        }
        break;
      case "balucharisaree":
        if (onBaluchariSareeOpen) {
          event.preventDefault();
          onBaluchariSareeOpen();
        }
        break;
      case "bankuraterracotta":
        if (onBankuraTerracottaOpen) {
          event.preventDefault();
          onBankuraTerracottaOpen();
        }
        break;
      case "basohlipainting":
        if (onBasohliPaintingOpen) {
          event.preventDefault();
          onBasohliPaintingOpen();
        }
        break;
      case "canebamboocraftandaman":
        if (onCaneBambooCraftAndamanOpen) {
          event.preventDefault();
          onCaneBambooCraftAndamanOpen();
        }
        break;
      case "chandigarhmodernist":
        if (onChandigarhModernistOpen) {
          event.preventDefault();
          onChandigarhModernistOpen();
        }
        break;
      case "coastalfibercraft":
        if (onCoastalFiberCraftOpen) {
          event.preventDefault();
          onCoastalFiberCraftOpen();
        }
        break;
      case "coconutshellcraft":
        if (onCoconutShellCraftOpen) {
          event.preventDefault();
          onCoconutShellCraftOpen();
        }
        break;
      case "coircraftlakshadweep":
        if (onCoirCraftLakshadweepOpen) {
          event.preventDefault();
          onCoirCraftLakshadweepOpen();
        }
        break;
      case "dhaniakhalisaree":
        if (onDhaniakhaliSareeOpen) {
          event.preventDefault();
          onDhaniakhaliSareeOpen();
        }
        break;
      case "francotamilenvironment":
        if (onFrancoTamilEnvironmentOpen) {
          event.preventDefault();
          onFrancoTamilEnvironmentOpen();
        }
        break;
      default:
        break;
    }
  };

  const scrollRight = () => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: Math.max(260, el.clientWidth * 0.8), behavior: "smooth" });
  };

  const scrollLeft = () => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: -Math.max(260, el.clientWidth * 0.8), behavior: "smooth" });
  };

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    const updateArrows = () => {
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      setShowLeftArrow(el.scrollLeft > 2);
      setShowRightArrow(el.scrollLeft < maxScroll - 2);
    };

    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);

    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  return (
    <section className="bg-[#0E0E12] pb-4 pt-8 sm:pb-8 sm:pt-18 px-4 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-end justify-between ">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#3B82F6]">
            <span className="inline-block h-[1.5px] w-4 bg-[#3B82F6]" />
            Styles
          </p>
          <h2
            className="text-[30px] uppercase leading-none tracking-[0.03em] text-white sm:text-[38px]"
            style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}
          >
            Explore Indian Styles
          </h2>
        </div>

        <button
          type="button"
          onClick={onAllStylesOpen}
          className="hidden items-center gap-1 rounded-full border border-white/10 px-4 py-2 text-[11px] font-semibold text-white/55 transition-colors hover:border-[#3B82F6]/40 hover:text-[#3B82F6] md:inline-flex"
        >
          <span>All styles</span>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 6h7M6 2.5L9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="relative">
        <div
          ref={railRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:gap-4 sm:px-6 lg:px-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {STYLES.slice(0, 12).map((style, index) => (
            <Fragment key={`${style.id}-${index}`}>
              {style.id.toLowerCase() === "maharashtra" ? (
                <WarliStyleCard
                  style={style}
                  onClick={(event) => handleStyleClick(event, style)}
                />
              ) : (
                <Link
                  href={style.href}
                  onClick={(event) => handleStyleClick(event, style)}
                  className="w-full md:w-[340px] shrink-0 snap-start"
                >
                  <div className="mb-2 overflow-hidden rounded-xl border border-white/10 bg-[#18181f] sm:mb-3">
                    <div className="group relative h-[190px] sm:h-[220px]">
                      <img
                        src={style.image}
                        alt={style.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        style={{ filter: style.imageFilter }}
                      />
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,rgba(0,0,0,0.72)_100%)]" />
                      <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-white/80 backdrop-blur-[6px] sm:left-4 sm:top-4 sm:px-3 sm:text-[9px]">
                        {style.tag}
                      </div>
                      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
                        <div
                          className="text-[30px] uppercase leading-none tracking-[0.06em] sm:text-[34px]"
                          style={{
                            color: style.titleColor,
                            fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif",
                            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                          }}
                        >
                          {style.title}
                        </div>
                        <div className="mt-1 text-[11px] font-semibold tracking-wide text-white/85 sm:text-[12px]">
                          {style.name}
                        </div>
                        <div className="mt-1 max-w-[280px] text-[10px] leading-snug text-white/60 line-clamp-2 sm:max-w-[300px]">
                          {style.desc}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="sr-only">
                    <div>{style.name}</div>
                    <p>{style.desc}</p>
                  </div>
                </Link>
              )}
            </Fragment>
          ))}

          <button
            key="explore-more-inline"
            onClick={onAllStylesOpen}
            className="w-full md:w-[340px] shrink-0 snap-start"
          >
            <div className="mb-2 h-[190px] sm:h-[220px] overflow-hidden rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#3B82F6]/30 transition-all group flex flex-col items-center justify-center gap-4">
              <div className="p-4 rounded-full bg-white/5 border border-white/10 group-hover:scale-110 group-hover:bg-[#3B82F6]/10 group-hover:border-[#3B82F6]/20 transition-all">
                <svg width="24" height="24" viewBox="0 0 12 12" fill="none" className="text-white/40 group-hover:text-[#3B82F6]">
                  <path d="M2.5 6h7M6 2.5L9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-[18px] uppercase tracking-wider text-white/80 font-bold" style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}>
                  Explore More
                </div>
                <div className="text-[10px] text-white/40 font-medium uppercase tracking-[0.1em] mt-1">
                  Explore {STYLES.length}+ Regional Styles
                </div>
              </div>
            </div>
          </button>

        </div>

        <button
          type="button"
          onClick={scrollLeft}
          disabled={!showLeftArrow}
          aria-label="Scroll styles left"
          className={`absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/85 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/75 active:scale-95 disabled:cursor-not-allowed md:flex lg:left-8 ${showLeftArrow ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
        >
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M8 2.5L4.5 6L8 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          onClick={scrollRight}
          disabled={!showRightArrow}
          aria-label="Scroll styles right"
          className={`absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/85 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/75 active:scale-95 disabled:cursor-not-allowed md:flex lg:right-8 ${showRightArrow ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
        >
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M4 2.5L7.5 6L4 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}

