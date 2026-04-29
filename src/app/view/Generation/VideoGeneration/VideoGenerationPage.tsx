"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setSidebarExpanded } from "@/store/slices/uiSlice";
import {
  ChevronDown,
  ExternalLink,
  Menu,
  Sparkles,
  SquarePen,
} from "lucide-react";
import { getSignInUrl } from "@/routes/routes";
import InputBox from "./TextToVideo/compo/InputBox";
import AnimateInputBox from "./TextToVideo/compo/AnimateInputBox";
import VideoGenerationGuide from "./TextToVideo/compo/VideoGenerationGuide";
// HistoryControls removed
import { usePathname } from "next/navigation";
import EditVideoInterface from "../../EditVideo/compo/EditVideoInterface";
import HistoryControls from "./TextToVideo/compo/HistoryControls";
import { loadHistory, setFilters } from "@/store/slices/historySlice";
import { setCurrentGenerationType } from "@/store/slices/uiSlice";

type VideoFeature = "Video" | "Lipsync" | "Animate" | "Edit" | "Video editor";

export default function VideoGenerationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [activeFeature, setActiveFeature] = useState<VideoFeature>("Video");
  const [isMobileFeatureMenuOpen, setIsMobileFeatureMenuOpen] = useState(false);
  const mobileFeatureMenuRef = useRef<HTMLDivElement | null>(null);
  const isInlineEditVideoPage = pathname?.startsWith(
    "/text-to-video/edit-video",
  );
  const authUser = useAppSelector((state: any) => state.auth?.user);
  const allHistoryEntries = useAppSelector(
    (state: any) => state.history?.entries || [],
  );
  const historyLoading = useAppSelector((state: any) => state.history?.loading);
  const didAutoFetchVideoHistoryRef = useRef(false);

  // Ensure video history is loaded even when using AnimateInputBox (which doesn't fetch history on mount).
  useEffect(() => {
    if (!authUser) return;
    if (historyLoading) return;
    if (didAutoFetchVideoHistoryRef.current) return;

    // Only auto-fetch for the main video generation surface (Video/Lipsync/Animate).
    if (isInlineEditVideoPage) return;
    if (!["Video", "Lipsync", "Animate"].includes(activeFeature)) return;

    // IMPORTANT: historySlice has a guard that aborts when UI currentGenerationType doesn't match expectedType.
    // Set it to a video type so loadHistory isn't condition-aborted.
    try {
      dispatch(setCurrentGenerationType("text-to-video" as any));
    } catch { }

    // If we already have entries, don't force another fetch.
    if (Array.isArray(allHistoryEntries) && allHistoryEntries.length > 0) {
      didAutoFetchVideoHistoryRef.current = true;
      return;
    }

    didAutoFetchVideoHistoryRef.current = true;
    try {
      dispatch(
        setFilters({
          ...(typeof (window as any) !== "undefined"
            ? ({} as any)
            : ({} as any)),
          mode: "video",
          sortOrder: "desc",
        } as any),
      );
    } catch { }
    (dispatch as any)(
      loadHistory({
        filters: { mode: "video", sortOrder: "desc" } as any,
        backendFilters: { mode: "video", sortOrder: "desc" } as any,
        paginationParams: { limit: 20 },
        requestOrigin: "page",
        expectedType: "video",
        forceRefresh: true,
        debugTag: `VideoGenerationPage:autoHistory:${Date.now()}`,
      } as any),
    ).catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, activeFeature, isInlineEditVideoPage, historyLoading]);

  // If user just logged in and the URL requests opening the external video editor, do it once.
  useEffect(() => {
    try {
      const shouldOpen = searchParams?.get("openVideoEditor") === "1";
      if (!shouldOpen) return;
      if (!authUser) return;

      const hostname = window.location.hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        window.open("http://localhost:3003", "_blank");
      } else {
        window.open("https://editor-video.wildmindai.com/", "_blank");
      }

      // Clean up the query param so refresh doesn't keep opening tabs.
      router.replace("/text-to-video");
    } catch { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  useEffect(() => {
    if (isInlineEditVideoPage) {
      setActiveFeature("Edit");
    }
  }, [isInlineEditVideoPage]);

  useEffect(() => {
    if (!isMobileFeatureMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        mobileFeatureMenuRef.current &&
        !mobileFeatureMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileFeatureMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileFeatureMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileFeatureMenuOpen]);

  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  const openVideoEditor = () => {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      window.open("http://localhost:3003", "_blank");
    } else {
      window.open("https://editor-video.wildmindai.com/", "_blank");
    }
  };

  const navigateToFeature = (feature: VideoFeature) => {
    setIsMobileFeatureMenuOpen(false);

    if (feature === "Video") {
      setActiveFeature("Video");
      router.push("/text-to-video", { scroll: false });
      return;
    }

    if (feature === "Lipsync") {
      setActiveFeature("Lipsync");
      router.push("/text-to-video?feature=lipsync", { scroll: false });
      return;
    }

    if (feature === "Animate") {
      setActiveFeature("Animate");
      router.push("/text-to-video?feature=animation", { scroll: false });
      return;
    }

    if (feature === "Edit") {
      setActiveFeature("Edit");
      router.push("/text-to-video/edit-video?feature=upscale", {
        scroll: false,
      });
      return;
    }

    openVideoEditor();
  };

  const primaryMobileFeatures: VideoFeature[] = ["Video", "Lipsync", "Animate"];
  const isEditFeatureActive = pathname?.startsWith("/text-to-video/edit-video");

  const isFeatureSelected = (feature: VideoFeature) => {
    if (feature === "Edit") return !!isEditFeatureActive;
    return activeFeature === feature;
  };

  // Get history entries to check if we should show the info button
  const historyEntries = useMemo(() => {
    const normalize = (t?: string) =>
      t?.replace(/[_-]/g, "-").toLowerCase() || "";
    const filtered = allHistoryEntries.filter((entry: any) => {
      const normalizedType = normalize(entry.generationType);
      return ["text-to-video", "image-to-video", "video-to-video"].includes(
        normalizedType,
      );
    });
    // Group by date to check if we have sorted dates
    const groupedByDate = filtered.reduce(
      (groups: { [key: string]: any[] }, entry: any) => {
        const date = new Date(entry.timestamp).toDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(entry);
        return groups;
      },
      {},
    );
    const sortedDates = Object.keys(groupedByDate).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
    return { entries: filtered, sortedDates };
  }, [allHistoryEntries]);

  // Initialize from URL parameter
  useEffect(() => {
    const featureParam = searchParams?.get("feature");
    if (featureParam) {
      const normalized = featureParam.toLowerCase();
      if (normalized === "lipsync") {
        setActiveFeature("Lipsync");
      } else if (normalized === "animation" || normalized === "animate") {
        setActiveFeature("Animate");
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#0E0E12]">
      {/* Root layout renders Nav + SidePanel; add spacing here so content aligns */}
      <div className="flex">
        <div className="flex-1 min-w-0 px-2 sm:px-6 md:px-8">
          {/* Sticky header + filters (pinned under navbar) */}
          <div className="sticky top-0 z-40 border-b border-white/5 bg-[#0E0E12]/80 backdrop-blur-xl shadow-xl">
            <div className="mb-0 pt-0 md:mb-1 md:pt-0">
              <div className="mb-0 flex min-h-10 items-center justify-between px-1.5 py-1 md:mb-0 md:min-h-14 md:px-0 md:py-0">
                <div className="flex min-w-0 items-center gap-1.5 pl-10 md:gap-2 md:pl-0 md:pt-2">
                  <button
                    onClick={() => dispatch(setSidebarExpanded(true))}
                    className="md:hidden fixed top-0 left-0 flex h-10 w-10 items-center justify-start pl-0 text-white/70 hover:text-white transition-colors cursor-pointer"
                    aria-label="Open menu"
                  >
                    <Menu size={24} />
                  </button>
                  <h2 className="min-w-0 flex-1 truncate whitespace-nowrap pr-1 text-base font-bold leading-tight tracking-tight text-white md:flex-none md:pr-0 md:text-2xl">
                    Video Generation
                  </h2>

                  {/* Info button - only show when there are generations */}
                  {historyEntries.entries.length > 0 &&
                    historyEntries.sortedDates.length > 0 && (
                      <button
                        onClick={() => setIsGuideModalOpen(true)}
                        className="relative group flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 md:h-6 md:w-6"
                        aria-label="Show guide"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="md:h-4 md:w-4"
                        >
                          <path
                            d="M10.9199 10.4384C10.9199 9.84191 11.4034 9.3584 11.9999 9.3584C12.5963 9.3584 13.0798 9.84191 13.0798 10.4384C13.0798 10.804 12.8988 11.1275 12.6181 11.3241C12.3474 11.5136 12.0203 11.7667 11.757 12.0846C11.4909 12.406 11.2499 12.8431 11.2499 13.3846C11.2499 13.7988 11.5857 14.1346 11.9999 14.1346C12.4141 14.1346 12.7499 13.7988 12.7499 13.3846C12.7499 13.3096 12.7806 13.2004 12.9123 13.0413C13.047 12.8786 13.2441 12.7169 13.4784 12.5528C14.1428 12.0876 14.5798 11.3141 14.5798 10.4384C14.5798 9.01348 13.4247 7.8584 11.9999 7.8584C10.575 7.8584 9.41992 9.01348 9.41992 10.4384C9.41992 10.8526 9.75571 11.1884 10.1699 11.1884C10.5841 11.1884 10.9199 10.8526 10.9199 10.4384Z"
                            fill="#ffffff"
                          />
                          <path
                            d="M11.9991 14.6426C11.5849 14.6426 11.2491 14.9783 11.2491 15.3926C11.2491 15.8068 11.5849 16.1426 11.9991 16.1426C12.4134 16.1426 12.7499 15.8068 12.7499 15.3926C12.7499 14.9783 12.4134 14.6426 11.9991 14.6426Z"
                            fill="#ffffff"
                          />
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M12 4C7.58172 4 4 7.58172 4 12V20H12C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM2.5 12C2.5 6.75329 6.75329 2.5 12 2.5C17.2467 2.5 21.5 6.75329 21.5 12C21.5 17.2467 17.2467 21.5 12 21.5H3.25C2.83579 21.5 2.5 21.1642 2.5 20.75V12Z"
                            fill="#ffffff"
                          />
                        </svg>
                        <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-50">
                          How To Use
                        </div>
                      </button>
                    )}

                  <div className="hidden md:flex items-center gap-2">
                    <button
                      onClick={() => navigateToFeature("Video")}
                      className={`flex items-center gap-1.5 px-3 py-1 md:py-1.5 rounded-lg text-xs border border-white/10 transition-all ${activeFeature === "Video" ? "bg-white text-black font-medium border border-transparent" : "bg-white/0 text-white/100 border border-white/20 hover:bg-white/5"}`}
                      aria-label="Video"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="hidden md:block">Video</span>
                    </button>

                    <button
                      onClick={() => navigateToFeature("Lipsync")}
                      className={`flex items-center gap-1.5 px-3 py-1 md:py-1.5 rounded-lg text-xs border border-white/20 transition-all ${activeFeature === "Lipsync" ? "bg-white text-black font-medium border border-transparent" : "bg-white/0 text-white/100 border border-white/20 hover:bg-white/5"}`}
                      aria-label="Lipsync"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="hidden md:block">Lipsync</span>
                    </button>

                    <button
                      onClick={() => navigateToFeature("Animate")}
                      className={`flex items-center gap-1.5 px-3 py-1 md:py-1.5 rounded-lg text-xs border border-white/10 transition-all ${activeFeature === "Animate" ? "bg-white text-black font-medium border border-transparent" : "bg-white/0 text-white/100 border border-white/20 hover:bg-white/5"}`}
                      aria-label="Animate"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="hidden md:block">Animate</span>
                    </button>

                    <button
                      onClick={() => navigateToFeature("Edit")}
                      className={`flex items-center gap-1.5 px-3 py-1 md:py-1.5 rounded-lg text-xs border border-white/10 transition-all ${pathname?.startsWith("/text-to-video/edit-video") ? "bg-white text-black font-medium border border-transparent" : "bg-white/0 text-white/100 border border-white/20 hover:bg-white/5"}`}
                      aria-label="Edit"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="hidden md:block">Edit</span>
                    </button>

                    <button
                      onClick={() => navigateToFeature("Video editor")}
                      className="flex items-center gap-1.5 px-2 py-1 md:py-1.5 rounded-lg text-xs hover:bg-white/5 border border-white/10 transition-all bg-white/0 text-white/100"
                      aria-label="Video editor"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="hidden md:block">Video editor</span>
                    </button>
                  </div>
                </div>

                {/* Desktop: Search, Sort, and Date controls - positioned at right end of Video Generation text */}
                {activeFeature !== "Edit" && (
                  <div className="hidden md:flex items-center">
                    <HistoryControls mode="video" className="mb-0 pt-0" />
                    {/* HistoryControls removed to avoid duplication */}
                  </div>
                )}
              </div>

              <p className="hidden md:flex px-1.5 pb-0 text-[13px] leading-5 text-white/75 md:px-0 md:text-sm">
                Transform your ideas into stunning videos using advanced AI
                models
              </p>

              {authUser && activeFeature !== "Edit" && (
                <div className="px-1.5 pb-0 md:hidden">
                  <HistoryControls mode="video" className="mb-0 pt-0" />
                </div>
              )}

              <div className="px-1.5 pb-3 md:hidden">
                <div className="flex items-center gap-2">
                  <div className="grid min-w-0 flex-1 grid-cols-3 gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] p-0 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
                    {primaryMobileFeatures.map((feature) => {
                      const isSelected = isFeatureSelected(feature);

                      return (
                        <button
                          key={feature}
                          type="button"
                          onClick={() => navigateToFeature(feature)}
                          className={`flex min-w-0 items-center justify-center rounded-xl px-3 py-1.5 text-[12px] font-medium transition-all ${isSelected ? "bg-white text-black shadow-sm" : "text-white/78 hover:bg-white/[0.08]"}`}
                        >
                          <span className="truncate">{feature}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div ref={mobileFeatureMenuRef} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setIsMobileFeatureMenuOpen((open) => !open)
                      }
                      className={`flex h-[31px] items-center gap-2 rounded-lg border px-3 text-[12px] font-medium transition-all ${isEditFeatureActive ? "border-transparent bg-white text-black shadow-sm" : "border-white/10 bg-white/[0.04] text-white/85 hover:bg-white/[0.08]"}`}
                      aria-label="Open video tools"
                      aria-expanded={isMobileFeatureMenuOpen}
                    >
                      {isEditFeatureActive ? (
                        <SquarePen size={14} />
                      ) : (
                        <Sparkles size={14} />
                      )}
                      <span>{isEditFeatureActive ? "Edit" : "Tools"}</span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${isMobileFeatureMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isMobileFeatureMenuOpen && (
                      <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#16161D]/95 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                        <button
                          type="button"
                          onClick={() => navigateToFeature("Edit")}
                          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors ${isEditFeatureActive ? "bg-white text-black" : "text-white/85 hover:bg-white/10"}`}
                        >
                          <SquarePen size={15} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateToFeature("Video editor")}
                          className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] text-white/85 transition-colors hover:bg-white/10"
                        >
                          <ExternalLink size={15} />
                          <span>Video editor</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input Box Section - Show for all features, in scrollable area */}
          <div className="mb-6">
            {isInlineEditVideoPage ? (
              <EditVideoInterface />
            ) : activeFeature === "Animate" ? (
              <AnimateInputBox placeholder="Type your video prompt..." />
            ) : (
              <InputBox
                placeholder={
                  activeFeature === "Lipsync"
                    ? "What should the character say?"
                    : "Type your video prompt..."
                }
                activeFeature={activeFeature}
              />
            )}
          </div>
        </div>
      </div>

      {/* Guide Modal - shows when info button is clicked */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => setIsGuideModalOpen(false)}
          />
          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-[1500px] max-h-[90vh] overflow-y-auto bg-transparent rounded-xl">
            {/* Close Button */}
            <button
              onClick={() => setIsGuideModalOpen(false)}
              className="absolute md:top-4 -top-0 md:right-4 right-0 z-20 md:w-8 md:h-8 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close guide"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            {/* Guide Content */}
            <VideoGenerationGuide />
          </div>
        </div>
      )}
    </div>
  );
}
